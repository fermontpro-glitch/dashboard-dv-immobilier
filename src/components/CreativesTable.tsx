import { Video as VideoIcon, Image as ImageIcon } from "lucide-react";
import type { Creative } from "@/lib/meta/types";
import { formatDecimal, formatEuroDec, formatEuroInt, formatInt } from "@/lib/format";
import { METRIC_BETTER_WHEN, METRIC_REGISTRY, type MetricKey } from "@/lib/creativeMetrics";

function metricValue(c: Creative, key: MetricKey): number | null {
  switch (key) {
    case "spend":
      return c.metrics.spend;
    case "linkClicks":
      return c.metrics.linkClicks;
    case "cpc":
      return c.metrics.cpc;
    case "ctr":
      return c.metrics.ctr;
    case "leads":
      return c.metrics.leads;
    case "cpl":
      return c.metrics.cpl;
    case "hookRate":
      return c.hookRate;
    case "holdRate":
      return c.holdRate;
  }
}

function formatMetricValue(key: MetricKey, value: number | null): string {
  if (value === null) return "—";
  switch (key) {
    case "spend":
      return `${formatEuroInt(value)} €`;
    case "linkClicks":
      return formatInt(value);
    case "cpc":
      return `${formatEuroDec(value)} €`;
    case "ctr":
      return `${formatDecimal(value, 2)} %`;
    case "leads":
      return formatInt(value);
    case "cpl":
      return `${formatEuroDec(value)} €`;
    case "hookRate":
      return `${formatDecimal(value, 2)} %`;
    case "holdRate":
      return `${formatDecimal(value, 2)} %`;
  }
}

/** Cells within 2 ranks of the column's best value get highlighted (matches the reference dashboard's heatmap). */
function computeHighlights(creatives: Creative[], metrics: MetricKey[]): Map<MetricKey, Set<string>> {
  const highlights = new Map<MetricKey, Set<string>>();

  for (const key of metrics) {
    const better = METRIC_BETTER_WHEN[key];
    const values = creatives
      .map((c) => ({ id: c.id, value: metricValue(c, key) }))
      .filter((v): v is { id: string; value: number } => v.value !== null && v.value > 0);

    values.sort((a, b) => (better === "high" ? b.value - a.value : a.value - b.value));
    highlights.set(key, new Set(values.slice(0, 2).map((v) => v.id)));
  }

  return highlights;
}

export function CreativesTable({
  creatives,
  metrics,
  sortKey,
  onSortChange,
  onPlay,
}: {
  creatives: Creative[];
  metrics: MetricKey[];
  sortKey: MetricKey;
  onSortChange: (key: MetricKey) => void;
  onPlay: (creative: Creative) => void;
}) {
  const highlights = computeHighlights(creatives, metrics);

  if (creatives.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-blossom-100 p-10 text-center text-muted">
        Aucune créa ne correspond à ces filtres sur cette période.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-blossom-100 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-butter text-left text-[11px] font-semibold uppercase tracking-wide text-muted">
            <th className="px-4 py-3">Créa</th>
            {metrics.map((key) => (
              <th key={key} className="px-4 py-3 text-right">
                <button
                  onClick={() => onSortChange(key)}
                  className={`inline-flex items-center gap-1 hover:text-plum-900 transition-colors ${
                    sortKey === key ? "text-plum-900" : ""
                  }`}
                >
                  {METRIC_REGISTRY[key].label}
                  {sortKey === key && <span>↓</span>}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="font-mono">
          {creatives.map((creative, i) => (
            <tr
              key={creative.id}
              className={i !== creatives.length - 1 ? "border-b border-divider" : ""}
            >
              <td className="px-4 py-2.5">
                <div
                  className="flex items-center gap-3 cursor-pointer group"
                  onClick={() => onPlay(creative)}
                  role="button"
                  aria-label={`Voir l'aperçu de ${creative.name}`}
                >
                  <div className="relative h-11 w-11 shrink-0 rounded-md overflow-hidden bg-plum-800">
                    {creative.thumbnailUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={creative.thumbnailUrl}
                        alt={creative.name}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    )}
                    <span className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-sm bg-plum-950/80 flex items-center justify-center text-blossom-100">
                      {creative.format === "video" ? <VideoIcon size={8} /> : <ImageIcon size={8} />}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="font-sans font-semibold text-plum-900 truncate max-w-[260px] group-hover:underline">
                      {creative.name}
                    </div>
                    <div className="text-[11px] text-subtle">{creative.adCount} ads</div>
                  </div>
                </div>
              </td>
              {metrics.map((key) => {
                const value = metricValue(creative, key);
                const isHighlighted = highlights.get(key)?.has(creative.id);
                return (
                  <td
                    key={key}
                    className={`px-4 py-2.5 text-right font-semibold ${
                      isHighlighted ? "bg-positive-bg text-positive" : "text-plum-900"
                    }`}
                  >
                    {formatMetricValue(key, value)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
