import "server-only";
import { toActId, metaFetchAll, metaGetByIds } from "./client";
import { classifyCampaign, isExcludedCampaign } from "./classify";
import { getActionValue, hookRate, holdRate, metricsFromRow, sumRows, EMPTY_METRICS } from "./metrics";
import type { DateRange } from "./period";
import type {
  AdSetRow,
  CampaignRow,
  CampaignType,
  Creative,
  DailyPoint,
  Metrics,
  RawInsightsRow,
  TypeBreakdown,
} from "./types";

interface ClassifiedCampaign {
  id: string;
  name: string;
  type: CampaignType;
}

const campaignsCache = new Map<string, Promise<ClassifiedCampaign[]>>();

/** All non-excluded campaigns for an account, classified. Cached per account for the server-process lifetime. */
async function getClassifiedCampaigns(accountId: string): Promise<ClassifiedCampaign[]> {
  if (!campaignsCache.has(accountId)) {
    campaignsCache.set(
      accountId,
      metaFetchAll<{ id: string; name: string }>(`/${toActId(accountId)}/campaigns`, {
        fields: "id,name",
        limit: "200",
      }).then((rows) =>
        rows
          .filter((c) => !isExcludedCampaign(c.name))
          .map((c) => ({ id: c.id, name: c.name, type: classifyCampaign(c.name) }))
      )
    );
  }
  return campaignsCache.get(accountId)!;
}

function idsForType(campaigns: ClassifiedCampaign[], type?: CampaignType): string[] {
  return campaigns
    .filter((c) => !type || c.type === type)
    .map((c) => c.id);
}

function filteringParam(campaignIds: string[]): string {
  return JSON.stringify([
    { field: "campaign.id", operator: "IN", value: campaignIds },
  ]);
}

async function fetchInsights(opts: {
  accountId: string;
  level: "account" | "campaign" | "adset" | "ad";
  fields: string[];
  campaignIds: string[];
  range: DateRange;
  timeIncrement?: string;
}): Promise<RawInsightsRow[]> {
  if (opts.campaignIds.length === 0) return [];

  const params: Record<string, string> = {
    fields: opts.fields.join(","),
    level: opts.level,
    filtering: filteringParam(opts.campaignIds),
    time_range: JSON.stringify({ since: opts.range.since, until: opts.range.until }),
    limit: "300",
  };
  if (opts.timeIncrement) params.time_increment = opts.timeIncrement;

  return metaFetchAll<RawInsightsRow>(`/${toActId(opts.accountId)}/insights`, params);
}

const BASE_FIELDS = ["spend", "impressions", "reach", "frequency", "inline_link_clicks", "actions"];

/** The 8 headline KPIs, optionally scoped to a single campaign type. */
export async function getKpis(range: DateRange, accountId: string, type?: CampaignType): Promise<Metrics> {
  const campaigns = await getClassifiedCampaigns(accountId);
  const ids = idsForType(campaigns, type);
  const rows = await fetchInsights({ accountId, level: "account", fields: BASE_FIELDS, campaignIds: ids, range });
  return rows[0] ? metricsFromRow(rows[0]) : EMPTY_METRICS;
}

/** Daily spend + leads series for the evolution chart (account-wide, excluded campaigns already filtered out). */
export async function getDailySeries(range: DateRange, accountId: string): Promise<DailyPoint[]> {
  const campaigns = await getClassifiedCampaigns(accountId);
  const ids = idsForType(campaigns);
  const rows = await fetchInsights({
    accountId,
    level: "account",
    fields: ["spend", "actions"],
    campaignIds: ids,
    range,
    timeIncrement: "1",
  });
  return rows
    .map((row) => ({
      date: row.date_start ?? "",
      spend: Number(row.spend ?? 0),
      leads: getActionValue(row.actions, "lead"),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** Spend/leads/CPL/CTR split across the three campaign types (account-wide). */
export async function getTypeBreakdown(range: DateRange, accountId: string): Promise<TypeBreakdown[]> {
  const campaigns = await getClassifiedCampaigns(accountId);
  const ids = idsForType(campaigns);
  const rows = await fetchInsights({
    accountId,
    level: "campaign",
    fields: [...BASE_FIELDS, "campaign_id"],
    campaignIds: ids,
    range,
  });

  const typeOf = new Map(campaigns.map((c) => [c.id, c.type]));
  const byType = new Map<CampaignType, RawInsightsRow[]>();
  for (const row of rows) {
    const type = (row.campaign_id && typeOf.get(row.campaign_id)) || "other";
    if (!byType.has(type)) byType.set(type, []);
    byType.get(type)!.push(row);
  }

  const totalSpend = rows.reduce((sum, r) => sum + Number(r.spend ?? 0), 0);

  const types: CampaignType[] = ["webinaire", "challenge", "leadmagnet", "other"];
  return types
    .filter((t) => byType.has(t))
    .map((type) => {
      const metrics = sumRows(byType.get(type)!);
      return {
        type,
        spend: metrics.spend,
        spendShare: totalSpend > 0 ? (metrics.spend / totalSpend) * 100 : 0,
        leads: metrics.leads,
        cpl: metrics.cpl,
        ctr: metrics.ctr,
      };
    });
}

/** Per-campaign rows for a single type's table, plus a pre-computed total (the type-level KPI call, not a naive sum). */
export async function getCampaignsTable(
  range: DateRange,
  type: CampaignType,
  accountId: string
): Promise<{ rows: CampaignRow[]; total: Metrics }> {
  const campaigns = await getClassifiedCampaigns(accountId);
  const ids = idsForType(campaigns, type);
  const [rawRows, adSetRows, total] = await Promise.all([
    fetchInsights({ accountId, level: "campaign", fields: [...BASE_FIELDS, "campaign_id"], campaignIds: ids, range }),
    fetchInsights({
      accountId,
      level: "adset",
      fields: [...BASE_FIELDS, "campaign_id", "adset_id", "adset_name"],
      campaignIds: ids,
      range,
    }),
    getKpis(range, accountId, type),
  ]);

  const adSetsByCampaign = new Map<string, AdSetRow[]>();
  for (const row of adSetRows) {
    if (!row.campaign_id || !row.adset_id) continue;
    if (!adSetsByCampaign.has(row.campaign_id)) adSetsByCampaign.set(row.campaign_id, []);
    adSetsByCampaign.get(row.campaign_id)!.push({
      id: row.adset_id,
      name: row.adset_name ?? "—",
      metrics: metricsFromRow(row),
    });
  }
  for (const adSets of adSetsByCampaign.values()) {
    adSets.sort((a, b) => b.metrics.spend - a.metrics.spend);
  }

  const nameOf = new Map(campaigns.map((c) => [c.id, c.name]));
  const rows: CampaignRow[] = rawRows
    .map((row) => ({
      id: row.campaign_id ?? "",
      name: (row.campaign_id && nameOf.get(row.campaign_id)) || row.campaign_name || "—",
      type,
      metrics: metricsFromRow(row),
      adSets: (row.campaign_id && adSetsByCampaign.get(row.campaign_id)) || [],
    }))
    .sort((a, b) => b.metrics.spend - a.metrics.spend);

  return { rows, total };
}

interface AdCreativeInfo {
  adId: string;
  adName: string;
  campaignId: string;
  creativeId: string;
  thumbnailUrl: string | null;
  videoId: string | null;
  adPermalink: string | null;
}

/** effective_object_story_id is "{page_id}_{post_id}" — the universal Facebook permalink shape. */
function permalinkFromStoryId(storyId?: string): string | null {
  if (!storyId) return null;
  const sep = storyId.indexOf("_");
  if (sep === -1) return null;
  const pageId = storyId.slice(0, sep);
  const postId = storyId.slice(sep + 1);
  return `https://www.facebook.com/${pageId}/posts/${postId}`;
}

async function getAdCreativeMap(campaignIds: string[], accountId: string): Promise<Map<string, AdCreativeInfo>> {
  if (campaignIds.length === 0) return new Map();

  const rows = await metaFetchAll<{
    id: string;
    name: string;
    campaign_id: string;
    creative?: {
      id: string;
      thumbnail_url?: string;
      video_id?: string;
      effective_object_story_id?: string;
    };
  }>(`/${toActId(accountId)}/ads`, {
    fields:
      "id,name,campaign_id,creative.thumbnail_width(400).thumbnail_height(600){id,thumbnail_url,video_id,effective_object_story_id}",
    filtering: filteringParam(campaignIds),
    limit: "25",
  });

  const map = new Map<string, AdCreativeInfo>();
  for (const row of rows) {
    if (!row.creative) continue;
    map.set(row.id, {
      adId: row.id,
      adName: row.name,
      campaignId: row.campaign_id,
      creativeId: row.creative.id,
      thumbnailUrl: row.creative.thumbnail_url ?? null,
      videoId: row.creative.video_id ?? null,
      adPermalink: permalinkFromStoryId(row.creative.effective_object_story_id),
    });
  }
  return map;
}

export type CreativeFormatFilter = "all" | "image" | "video";
export type CreativeSortKey = "leads" | "spend" | "cpl" | "ctr" | "cpc" | "linkClicks";

export async function getCreatives(opts: {
  range: DateRange;
  accountId: string;
  type?: CampaignType;
  format?: CreativeFormatFilter;
  sort?: CreativeSortKey;
}): Promise<Creative[]> {
  const campaigns = await getClassifiedCampaigns(opts.accountId);
  const ids = idsForType(campaigns, opts.type);
  const typeOf = new Map(campaigns.map((c) => [c.id, c.type]));

  const [adCreativeMap, insightRows] = await Promise.all([
    getAdCreativeMap(ids, opts.accountId),
    fetchInsights({
      accountId: opts.accountId,
      level: "ad",
      fields: [
        "ad_id",
        "ad_name",
        "campaign_id",
        "campaign_name",
        "spend",
        "impressions",
        "inline_link_clicks",
        "actions",
        "video_thruplay_watched_actions",
      ],
      campaignIds: ids,
      range: opts.range,
    }),
  ]);

  interface Group {
    creativeId: string;
    name: string;
    campaignName: string;
    campaignType: CampaignType;
    thumbnailUrl: string | null;
    videoId: string | null;
    sampleAdId: string;
    adPermalink: string | null;
    adIds: Set<string>;
    rows: RawInsightsRow[];
    videoThruplays: number;
  }

  const groups = new Map<string, Group>();
  for (const row of insightRows) {
    const info = row.ad_id ? adCreativeMap.get(row.ad_id) : undefined;
    if (!info) continue;

    const key = info.creativeId;
    if (!groups.has(key)) {
      groups.set(key, {
        creativeId: key,
        name: info.adName,
        campaignName: row.campaign_name ?? "",
        campaignType: typeOf.get(info.campaignId) ?? "other",
        thumbnailUrl: info.thumbnailUrl,
        videoId: info.videoId,
        sampleAdId: info.adId,
        adPermalink: info.adPermalink,
        adIds: new Set(),
        rows: [],
        videoThruplays: 0,
      });
    }
    const group = groups.get(key)!;
    group.adIds.add(info.adId);
    group.rows.push(row);
    group.videoThruplays += getActionValue(row.video_thruplay_watched_actions, "video_view");
  }

  const videoIds = [...groups.values()].map((g) => g.videoId).filter((id): id is string => !!id);
  // Video length requires permissions this token may not have; duration badge is cosmetic, so degrade quietly.
  const durations: Record<string, { length?: number }> =
    videoIds.length > 0
      ? await metaGetByIds<{ length?: number }>(videoIds, ["length"]).catch(() => ({}))
      : {};

  let creatives: Creative[] = [...groups.values()].map((g) => {
    const metrics = sumRows(g.rows);
    const videoViews3s = g.rows.reduce(
      (sum, r) => sum + getActionValue(r.actions, "video_view"),
      0
    );
    const isVideo = !!g.videoId;
    return {
      id: g.creativeId,
      name: g.name,
      campaignName: g.campaignName,
      campaignType: g.campaignType,
      format: isVideo ? "video" : "image",
      thumbnailUrl: g.thumbnailUrl,
      videoDurationSec: g.videoId ? durations[g.videoId]?.length ?? null : null,
      adCount: g.adIds.size,
      sampleAdId: g.sampleAdId,
      adPermalink: g.adPermalink,
      metrics,
      hookRate: isVideo ? hookRate(videoViews3s, metrics.impressions) : null,
      holdRate: isVideo ? holdRate(g.videoThruplays, videoViews3s) : null,
    };
  });

  if (opts.format && opts.format !== "all") {
    creatives = creatives.filter((c) => c.format === opts.format);
  }

  const sortKey = opts.sort ?? "leads";
  creatives.sort((a, b) => {
    const av = sortKey === "linkClicks" ? a.metrics.linkClicks : a.metrics[sortKey];
    const bv = sortKey === "linkClicks" ? b.metrics.linkClicks : b.metrics[sortKey];
    return bv - av;
  });

  return creatives;
}
