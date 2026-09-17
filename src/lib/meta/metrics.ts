import type { ActionValue, Metrics, RawInsightsRow } from "./types";

export function getActionValue(
  actions: ActionValue[] | undefined,
  type: string
): number {
  const found = actions?.find((a) => a.action_type === type);
  return found ? Number(found.value) : 0;
}

interface RawSums {
  spend: number;
  impressions: number;
  reach?: number;
  frequency?: number;
  linkClicks: number;
  leads: number;
}

function deriveRatios(sums: RawSums): Metrics {
  const ctr = sums.impressions > 0 ? (sums.linkClicks / sums.impressions) * 100 : 0;
  const cpc = sums.linkClicks > 0 ? sums.spend / sums.linkClicks : 0;
  const cpl = sums.leads > 0 ? sums.spend / sums.leads : 0;
  return {
    spend: sums.spend,
    impressions: sums.impressions,
    reach: sums.reach ?? 0,
    frequency: sums.frequency ?? 0,
    linkClicks: sums.linkClicks,
    ctr,
    cpc,
    leads: sums.leads,
    cpl,
  };
}

/** Use for a row that already IS the exact aggregation level wanted (reach/frequency are trustworthy here). */
export function metricsFromRow(row: RawInsightsRow): Metrics {
  return deriveRatios({
    spend: Number(row.spend ?? 0),
    impressions: Number(row.impressions ?? 0),
    reach: Number(row.reach ?? 0),
    frequency: Number(row.frequency ?? 0),
    linkClicks: Number(row.inline_link_clicks ?? 0),
    leads: getActionValue(row.actions, "lead"),
  });
}

/** Sums raw counts across rows and re-derives ratios (reach/frequency dropped — not meaningfully summable). */
export function sumRows(rows: RawInsightsRow[]): Metrics {
  const sums = rows.reduce<RawSums>(
    (acc, row) => {
      acc.spend += Number(row.spend ?? 0);
      acc.impressions += Number(row.impressions ?? 0);
      acc.linkClicks += Number(row.inline_link_clicks ?? 0);
      acc.leads += getActionValue(row.actions, "lead");
      return acc;
    },
    { spend: 0, impressions: 0, linkClicks: 0, leads: 0 }
  );
  return deriveRatios(sums);
}

export const EMPTY_METRICS: Metrics = deriveRatios({
  spend: 0,
  impressions: 0,
  linkClicks: 0,
  leads: 0,
});

export function hookRate(videoViews3s: number, impressions: number): number | null {
  return impressions > 0 ? (videoViews3s / impressions) * 100 : null;
}

/** ThruPlay ÷ vues 3 s (jamais p100 ÷ plays, ni ÷ impressions). */
export function holdRate(thruPlays: number, views3s: number): number | null {
  return views3s > 0 ? (thruPlays / views3s) * 100 : null;
}
