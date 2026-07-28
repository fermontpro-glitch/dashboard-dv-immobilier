import "server-only";
import { getAdAccountId, metaFetchAll, metaGetByIds } from "./client";
import { classifyCampaign, isExcludedCampaign } from "./classify";
import { getActionValue, hookRate, holdRate, metricsFromRow, sumRows, EMPTY_METRICS } from "./metrics";
import type { DateRange } from "./period";
import type {
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

let campaignsCache: Promise<ClassifiedCampaign[]> | null = null;

/** All non-excluded campaigns, classified. Cached per server-process lifetime (campaign names/ids rarely change mid-session). */
async function getClassifiedCampaigns(): Promise<ClassifiedCampaign[]> {
  if (!campaignsCache) {
    campaignsCache = metaFetchAll<{ id: string; name: string }>(
      `/${getAdAccountId()}/campaigns`,
      { fields: "id,name", limit: "200" }
    ).then((rows) =>
      rows
        .filter((c) => !isExcludedCampaign(c.name))
        .map((c) => ({ id: c.id, name: c.name, type: classifyCampaign(c.name) }))
    );
  }
  return campaignsCache;
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
  level: "account" | "campaign" | "ad";
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

  return metaFetchAll<RawInsightsRow>(`/${getAdAccountId()}/insights`, params);
}

const BASE_FIELDS = ["spend", "impressions", "reach", "frequency", "inline_link_clicks", "actions"];

/** The 8 headline KPIs, optionally scoped to a single campaign type. */
export async function getKpis(range: DateRange, type?: CampaignType): Promise<Metrics> {
  const campaigns = await getClassifiedCampaigns();
  const ids = idsForType(campaigns, type);
  const rows = await fetchInsights({ level: "account", fields: BASE_FIELDS, campaignIds: ids, range });
  return rows[0] ? metricsFromRow(rows[0]) : EMPTY_METRICS;
}

/** Daily spend + leads series for the evolution chart (account-wide, excluded campaigns already filtered out). */
export async function getDailySeries(range: DateRange): Promise<DailyPoint[]> {
  const campaigns = await getClassifiedCampaigns();
  const ids = idsForType(campaigns);
  const rows = await fetchInsights({
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
export async function getTypeBreakdown(range: DateRange): Promise<TypeBreakdown[]> {
  const campaigns = await getClassifiedCampaigns();
  const ids = idsForType(campaigns);
  const rows = await fetchInsights({
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

  const types: CampaignType[] = ["webex", "challenge", "leadmagnet", "other"];
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
  type: CampaignType
): Promise<{ rows: CampaignRow[]; total: Metrics }> {
  const campaigns = await getClassifiedCampaigns();
  const ids = idsForType(campaigns, type);
  const [rawRows, total] = await Promise.all([
    fetchInsights({ level: "campaign", fields: [...BASE_FIELDS, "campaign_id"], campaignIds: ids, range }),
    getKpis(range, type),
  ]);

  const nameOf = new Map(campaigns.map((c) => [c.id, c.name]));
  const rows: CampaignRow[] = rawRows
    .map((row) => ({
      id: row.campaign_id ?? "",
      name: (row.campaign_id && nameOf.get(row.campaign_id)) || row.campaign_name || "—",
      type,
      metrics: metricsFromRow(row),
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
}

async function getAdCreativeMap(campaignIds: string[]): Promise<Map<string, AdCreativeInfo>> {
  if (campaignIds.length === 0) return new Map();

  const rows = await metaFetchAll<{
    id: string;
    name: string;
    campaign_id: string;
    creative?: { id: string; thumbnail_url?: string; video_id?: string };
  }>(`/${getAdAccountId()}/ads`, {
    fields:
      "id,name,campaign_id,creative.thumbnail_width(400).thumbnail_height(600){id,thumbnail_url,video_id}",
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
    });
  }
  return map;
}

export type CreativeFormatFilter = "all" | "image" | "video";
export type CreativeSortKey = "leads" | "spend" | "cpl" | "ctr" | "cpc" | "linkClicks";

export async function getCreatives(opts: {
  range: DateRange;
  type?: CampaignType;
  format?: CreativeFormatFilter;
  sort?: CreativeSortKey;
}): Promise<Creative[]> {
  const campaigns = await getClassifiedCampaigns();
  const ids = idsForType(campaigns, opts.type);
  const typeOf = new Map(campaigns.map((c) => [c.id, c.type]));

  const [adCreativeMap, insightRows] = await Promise.all([
    getAdCreativeMap(ids),
    fetchInsights({
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
        "video_play_actions",
        "video_p100_watched_actions",
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
    adIds: Set<string>;
    rows: RawInsightsRow[];
    videoPlays: number;
    videoP100: number;
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
        adIds: new Set(),
        rows: [],
        videoPlays: 0,
        videoP100: 0,
      });
    }
    const group = groups.get(key)!;
    group.adIds.add(info.adId);
    group.rows.push(row);
    group.videoPlays += getActionValue(row.video_play_actions, "video_view");
    group.videoP100 += getActionValue(row.video_p100_watched_actions, "video_view");
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
      metrics,
      hookRate: isVideo ? hookRate(videoViews3s, metrics.impressions) : null,
      holdRate: isVideo ? holdRate(g.videoP100, g.videoPlays) : null,
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
