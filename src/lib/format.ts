export function formatEuroInt(n: number): string {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n);
}

export function formatEuroDec(n: number): string {
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export function formatInt(n: number): string {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n);
}

export function formatDecimal(n: number, digits = 2): string {
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(n);
}

/** "1 842 K" style compact thousands, matching the dashboard's design system. */
export function formatCompactK(n: number): string {
  if (Math.abs(n) < 1000) return formatInt(n);
  return `${formatInt(Math.round(n / 1000))} K`;
}

export type DeltaTone = "positive" | "negative" | "neutral";

export interface Delta {
  direction: "up" | "down" | "flat";
  pctChange: number;
  absChange: number;
  tone: DeltaTone;
}

/** Period-over-period delta. `betterWhen` says whether a rise in this metric is good or bad. */
export function computeDelta(
  current: number,
  previous: number,
  betterWhen: "up" | "down" = "up"
): Delta {
  const absChange = current - previous;

  if (previous === 0) {
    if (current === 0) return { direction: "flat", pctChange: 0, absChange: 0, tone: "neutral" };
    return {
      direction: "up",
      pctChange: 100,
      absChange,
      tone: betterWhen === "up" ? "positive" : "negative",
    };
  }

  const pctChange = (absChange / Math.abs(previous)) * 100;
  const direction = pctChange > 0.05 ? "up" : pctChange < -0.05 ? "down" : "flat";
  const tone: DeltaTone =
    direction === "flat"
      ? "neutral"
      : (direction === "up") === (betterWhen === "up")
        ? "positive"
        : "negative";

  return { direction, pctChange, absChange, tone };
}
