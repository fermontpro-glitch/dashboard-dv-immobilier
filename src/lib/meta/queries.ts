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

/**
 * Resolves, per ad set, which action type counts as "results": an ad set optimizing for a pixel
 * custom conversion (e.g. a "confirmation page" view rather than a native lead form) reports its
 * conversions under `offsite_conversion.custom.<id>`, not the standard "lead" action — so leads/CPL
 * for those ad sets would otherwise read as ~0. Scoped to the ad set IDs actually passed in (no
 * pagination — a handful of ad sets per call), rather than a batched-multiget cache since ad set
 * targeting/optimization can change and each caller already knows exactly which ad sets it needs.
 */
async function getResultActionTypes(adsetIds: string[]): Promise<Map<string, string>> {
  if (adsetIds.length === 0) return new Map();

  const rows = await metaGetByIds<{
    id: string;
    promoted_object?: { custom_conversion_id?: string };
  }>(adsetIds, ["id", "promoted_object"]);

  const map = new Map<string, string>();
  for (const row of Object.values(rows)) {
    const customId = row.promoted_object?.custom_conversion_id;
    map.set(row.id, customId ? `offsite_conversion.custom.${customId}` : "lead");
  }
  return map;
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

  // Spend/impressions/reach/frequency/CTR/CPC come from the account-level row (exact Meta dedup).
  // Leads/CPL are re-derived bottom-up from ad-set rows so ad sets optimizing for a custom
  // conversion count correctly instead of reading 0 under the standard "lead" action.
  const [accountRows, adsetRows] = await Promise.all([
    fetchInsights({ accountId, level: "account", fields: BASE_FIELDS, campaignIds: ids, range }),
    fetchInsights({ accountId, level: "adset", fields: ["spend", "actions", "adset_id"], campaignIds: ids, range }),
  ]);

  const adsetIds = [...new Set(adsetRows.map((r) => r.adset_id).filter((id): id is string => !!id))];
  const resultTypes = await getResultActionTypes(adsetIds);
  const results = sumRows(adsetRows, (row) => (row.adset_id && resultTypes.get(row.adset_id)) || "lead").leads;

  const base = accountRows[0] ? metricsFromRow(accountRows[0]) : EMPTY_METRICS;
  return { ...base, leads: results, cpl: results > 0 ? base.spend / results : 0 };
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
  const [rows, adsetRows] = await Promise.all([
    fetchInsights({ accountId, level: "campaign", fields: [...BASE_FIELDS, "campaign_id"], campaignIds: ids, range }),
    fetchInsights({
      accountId,
      level: "adset",
      fields: ["spend", "actions", "campaign_id", "adset_id"],
      campaignIds: ids,
      range,
    }),
  ]);

  const typeOf = new Map(campaigns.map((c) => [c.id, c.type]));

  // Leads/CPL rebuilt bottom-up from ad sets (custom-conversion aware) so this panel's totals match
  // the headline KPI card above it instead of under-counting Lead Magnet-style custom conversions.
  const adsetIds = [...new Set(adsetRows.map((r) => r.adset_id).filter((id): id is string => !!id))];
  const resultTypes = await getResultActionTypes(adsetIds);
  const resultsByType = new Map<CampaignType, number>();
  for (const row of adsetRows) {
    const type = (row.campaign_id && typeOf.get(row.campaign_id)) || "other";
    const resultType = (row.adset_id && resultTypes.get(row.adset_id)) || "lead";
    resultsByType.set(type, (resultsByType.get(type) ?? 0) + getActionValue(row.actions, resultType));
  }

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
      const leads = resultsByType.get(type) ?? 0;
      return {
        type,
        spend: metrics.spend,
        spendShare: totalSpend > 0 ? (metrics.spend / totalSpend) * 100 : 0,
        leads,
        cpl: leads > 0 ? metrics.spend / leads : 0,
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

  // Same custom-conversion awareness as getCreatives/getKpis: resolve each ad set's real
  // result action, then roll it up to the campaign level (campaign-level rows only carry Meta's
  // own blended "lead" sum, which can't be corrected in place — it has to be rebuilt from ad sets).
  const adsetIds = [...new Set(adSetRows.map((r) => r.adset_id).filter((id): id is string => !!id))];
  const resultTypes = await getResultActionTypes(adsetIds);
  const resultTypeFor = (row: RawInsightsRow) => (row.adset_id && resultTypes.get(row.adset_id)) || "lead";

  const adSetsByCampaign = new Map<string, AdSetRow[]>();
  const resultsByCampaign = new Map<string, number>();
  for (const row of adSetRows) {
    if (!row.campaign_id || !row.adset_id) continue;
    const metrics = metricsFromRow(row, resultTypeFor(row));
    if (!adSetsByCampaign.has(row.campaign_id)) adSetsByCampaign.set(row.campaign_id, []);
    adSetsByCampaign.get(row.campaign_id)!.push({ id: row.adset_id, name: row.adset_name ?? "—", metrics });
    resultsByCampaign.set(row.campaign_id, (resultsByCampaign.get(row.campaign_id) ?? 0) + metrics.leads);
  }
  for (const adSets of adSetsByCampaign.values()) {
    adSets.sort((a, b) => b.metrics.spend - a.metrics.spend);
  }

  const nameOf = new Map(campaigns.map((c) => [c.id, c.name]));
  const rows: CampaignRow[] = rawRows
    .map((row) => {
      const base = metricsFromRow(row);
      const results = row.campaign_id ? resultsByCampaign.get(row.campaign_id) ?? 0 : 0;
      return {
        id: row.campaign_id ?? "",
        name: (row.campaign_id && nameOf.get(row.campaign_id)) || row.campaign_name || "—",
        type,
        metrics: { ...base, leads: results, cpl: results > 0 ? base.spend / results : 0 },
        adSets: (row.campaign_id && adSetsByCampaign.get(row.campaign_id)) || [],
      };
    })
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

/**
 * Fetches creative info for exactly the given ad IDs via the batched multi-get endpoint, instead of
 * paging through `/ads?filtering=campaign.id IN [...]`. An account accumulates ads across its whole
 * history (DV Immobilier alone has 1000+, mostly old paused variants); paging that list with a capped
 * `maxPages` can silently truncate before reaching an older or lower-volume campaign's ads — which is
 * exactly how the "LM - Tableau étude" creatives went missing from the gallery. Scoping to ad IDs that
 * actually have insight rows in the requested period sidesteps the cap entirely and is cheaper besides.
 */
async function getAdCreativeMap(adIds: string[]): Promise<Map<string, AdCreativeInfo>> {
  if (adIds.length === 0) return new Map();

  const rows = await metaGetByIds<{
    id: string;
    name: string;
    campaign_id: string;
    creative?: {
      id: string;
      thumbnail_url?: string;
      video_id?: string;
      effective_object_story_id?: string;
    };
  }>(adIds, [
    "id",
    "name",
    "campaign_id",
    "creative.thumbnail_width(400).thumbnail_height(600){id,thumbnail_url,video_id,effective_object_story_id}",
  ]);

  const map = new Map<string, AdCreativeInfo>();
  for (const row of Object.values(rows)) {
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

  const insightRows = await fetchInsights({
    accountId: opts.accountId,
    level: "ad",
    fields: [
      "ad_id",
      "ad_name",
      "campaign_id",
      "campaign_name",
      "adset_id",
      "spend",
      "impressions",
      "inline_link_clicks",
      "actions",
      "video_thruplay_watched_actions",
    ],
    campaignIds: ids,
    range: opts.range,
  });

  const adIds = [...new Set(insightRows.map((r) => r.ad_id).filter((id): id is string => !!id))];
  const adsetIds = [...new Set(insightRows.map((r) => r.adset_id).filter((id): id is string => !!id))];
  const [adCreativeMap, resultTypes] = await Promise.all([
    getAdCreativeMap(adIds),
    getResultActionTypes(adsetIds),
  ]);
  const resultTypeFor = (row: RawInsightsRow) => (row.adset_id && resultTypes.get(row.adset_id)) || "lead";

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
    const metrics = sumRows(g.rows, resultTypeFor);
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
