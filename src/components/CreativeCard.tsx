import { Play, Image as ImageIcon, Video as VideoIcon } from "lucide-react";
import type { Creative } from "@/lib/meta/types";
import { formatDecimal, formatEuroDec, formatEuroInt, formatInt } from "@/lib/format";
import type { MetricKey } from "@/lib/creativeMetrics";
import { METRIC_REGISTRY } from "@/lib/creativeMetrics";

function formatDuration(sec: number | null): string | null {
  if (sec === null) return null;
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function CreativeCard({
  creative,
  rank,
  activeMetrics,
}: {
  creative: Creative;
  rank: number;
  activeMetrics: MetricKey[];
}) {
  const duration = formatDuration(creative.videoDurationSec);

  return (
    <div className="rounded-lg border border-border bg-blossom-100 overflow-hidden flex flex-col">
      <div className="relative aspect-[9/13] bg-plum-800">
        {creative.thumbnailUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={creative.thumbnailUrl}
            alt={creative.name}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}

        <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 rounded-pill bg-plum-950/80 text-blossom-100 text-[11px] font-semibold px-2.5 py-1">
          {creative.format === "video" ? <VideoIcon size={11} /> : <ImageIcon size={11} />}
          {creative.format === "video" ? `Vidéo${duration ? ` · ${duration}` : ""}` : "Image"}
        </span>

        <span className="absolute top-2.5 right-2.5 h-6 w-6 rounded-full bg-plum-950/80 text-blossom-100 text-[11px] font-bold flex items-center justify-center">
          {rank}
        </span>

        {creative.format === "video" && (
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="h-11 w-11 rounded-full bg-blossom-100/90 flex items-center justify-center">
              <Play size={18} className="text-plum-900 translate-x-[1px]" fill="currentColor" />
            </span>
          </span>
        )}
      </div>

      <div className="px-4 py-3 flex flex-col gap-2 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-xs font-semibold text-plum-900 truncate">{creative.name}</span>
          <span className="text-[11px] text-subtle whitespace-nowrap">{creative.adCount} ads</span>
        </div>

        <dl className="flex flex-col gap-1 text-xs">
          {activeMetrics.map((key) => (
            <div key={key} className="flex items-center justify-between">
              <dt className="text-muted">{METRIC_REGISTRY[key].label}</dt>
              <dd className={`font-mono font-semibold ${METRIC_REGISTRY[key].emphasize ? "text-positive" : "text-plum-900"}`}>
                {formatMetricValue(key, creative)}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

function formatMetricValue(key: MetricKey, creative: Creative): string {
  const m = creative.metrics;
  switch (key) {
    case "spend":
      return `${formatEuroInt(m.spend)} €`;
    case "linkClicks":
      return formatInt(m.linkClicks);
    case "cpc":
      return `${formatEuroDec(m.cpc)} €`;
    case "ctr":
      return `${formatDecimal(m.ctr, 2)} %`;
    case "leads":
      return formatInt(m.leads);
    case "cpl":
      return `${formatEuroDec(m.cpl)} €`;
    case "hookRate":
      return creative.hookRate !== null ? `${formatDecimal(creative.hookRate, 1)} %` : "—";
    case "holdRate":
      return creative.holdRate !== null ? `${formatDecimal(creative.holdRate, 1)} %` : "—";
  }
}
