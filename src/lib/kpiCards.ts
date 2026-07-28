import { computeDelta, formatCompactK, formatDecimal, formatEuroDec, formatEuroInt } from "./format";
import type { Metrics } from "./meta/types";

export interface KpiCardConfig {
  label: string;
  bulletColor: string;
  value: string;
  unit?: string;
  delta: ReturnType<typeof computeDelta>;
  deltaText?: string;
  hero?: boolean;
}

const COLORS = {
  peach: "#DC8C6F",
  blue: "#486D83",
  mauve: "#5E3D52",
  positive: "#4A8A6E",
  negative: "#B85C5C",
};

export function buildOverviewKpis(current: Metrics, previous: Metrics): KpiCardConfig[] {
  return [
    {
      label: "Montant dépensé",
      bulletColor: COLORS.peach,
      value: formatEuroInt(current.spend),
      unit: "€",
      delta: computeDelta(current.spend, previous.spend, "up"),
      hero: true,
    },
    {
      label: "Impressions",
      bulletColor: COLORS.blue,
      value: formatCompactK(current.impressions),
      delta: computeDelta(current.impressions, previous.impressions, "up"),
    },
    {
      label: "Couverture (Reach)",
      bulletColor: COLORS.mauve,
      value: formatCompactK(current.reach),
      delta: computeDelta(current.reach, previous.reach, "up"),
    },
    {
      label: "Fréquence",
      bulletColor: COLORS.peach,
      value: formatDecimal(current.frequency, 2),
      delta: computeDelta(current.frequency, previous.frequency, "down"),
      deltaText: `${formatDecimal(Math.abs(current.frequency - previous.frequency), 1)} pt`,
    },
    {
      label: "CTR (lien)",
      bulletColor: COLORS.positive,
      value: formatDecimal(current.ctr, 2),
      unit: "%",
      delta: computeDelta(current.ctr, previous.ctr, "up"),
      deltaText: `${formatDecimal(Math.abs(current.ctr - previous.ctr), 2)} pt`,
    },
    {
      label: "CPC (lien)",
      bulletColor: COLORS.peach,
      value: formatEuroDec(current.cpc),
      unit: "€",
      delta: computeDelta(current.cpc, previous.cpc, "down"),
      deltaText: `${formatEuroDec(Math.abs(current.cpc - previous.cpc))} €`,
    },
    {
      label: "Leads",
      bulletColor: COLORS.peach,
      value: formatCompactK(current.leads),
      delta: computeDelta(current.leads, previous.leads, "up"),
    },
    {
      label: "Coût par lead",
      bulletColor: COLORS.negative,
      value: formatEuroDec(current.cpl),
      unit: "€",
      delta: computeDelta(current.cpl, previous.cpl, "down"),
      deltaText: `${formatEuroDec(Math.abs(current.cpl - previous.cpl))} €`,
    },
  ];
}

export function buildTypeKpis(current: Metrics, previous: Metrics, typeLabel: string): KpiCardConfig[] {
  return [
    {
      label: `Dépense · ${typeLabel}`,
      bulletColor: COLORS.peach,
      value: formatEuroInt(current.spend),
      unit: "€",
      delta: computeDelta(current.spend, previous.spend, "up"),
      hero: true,
    },
    {
      label: "Impressions",
      bulletColor: COLORS.blue,
      value: formatCompactK(current.impressions),
      delta: computeDelta(current.impressions, previous.impressions, "up"),
    },
    {
      label: "Couverture",
      bulletColor: COLORS.mauve,
      value: formatCompactK(current.reach),
      delta: computeDelta(current.reach, previous.reach, "up"),
    },
    {
      label: "CTR (lien)",
      bulletColor: COLORS.positive,
      value: formatDecimal(current.ctr, 2),
      unit: "%",
      delta: computeDelta(current.ctr, previous.ctr, "up"),
      deltaText: `${formatDecimal(Math.abs(current.ctr - previous.ctr), 2)} pt`,
    },
    {
      label: "CPC (lien)",
      bulletColor: COLORS.peach,
      value: formatEuroDec(current.cpc),
      unit: "€",
      delta: computeDelta(current.cpc, previous.cpc, "down"),
      deltaText: `${formatEuroDec(Math.abs(current.cpc - previous.cpc))} €`,
    },
    {
      label: "Leads",
      bulletColor: COLORS.peach,
      value: formatCompactK(current.leads),
      delta: computeDelta(current.leads, previous.leads, "up"),
    },
    {
      label: "Coût par lead",
      bulletColor: COLORS.negative,
      value: formatEuroDec(current.cpl),
      unit: "€",
      delta: computeDelta(current.cpl, previous.cpl, "down"),
      deltaText: `${formatEuroDec(Math.abs(current.cpl - previous.cpl))} €`,
    },
    {
      label: "Clics sur lien",
      bulletColor: COLORS.blue,
      value: formatCompactK(current.linkClicks),
      delta: computeDelta(current.linkClicks, previous.linkClicks, "up"),
    },
  ];
}
