import { formatDecimal } from "@/lib/format";
import type { Delta } from "@/lib/format";

interface KpiCardProps {
  label: string;
  bulletColor: string;
  value: string;
  unit?: string;
  delta?: Delta;
  deltaText?: string;
  hero?: boolean;
}

export function KpiCard({ label, bulletColor, value, unit, delta, deltaText, hero }: KpiCardProps) {
  return (
    <div
      className={`rounded-lg border p-5 flex flex-col gap-3 ${
        hero
          ? "bg-plum-900 border-plum-900 text-blossom-100"
          : "bg-blossom-100 border-border text-plum-900"
      }`}
    >
      <div className="flex items-center gap-2 text-[11px] font-semibold tracking-wide uppercase">
        <span className="h-2 w-2 rounded-[3px]" style={{ backgroundColor: bulletColor }} />
        <span className={hero ? "text-blossom-100/85" : "text-muted"}>{label}</span>
      </div>

      <div className="flex items-baseline gap-1.5">
        <span className="font-display font-extrabold text-3xl leading-none">{value}</span>
        {unit && (
          <span className={`text-lg font-display font-semibold ${hero ? "text-blossom-100/70" : "text-subtle"}`}>
            {unit}
          </span>
        )}
      </div>

      {delta && (
        <DeltaPill delta={delta} text={deltaText ?? `${formatDecimal(Math.abs(delta.pctChange), 1)} %`} />
      )}
    </div>
  );
}

function DeltaPill({ delta, text }: { delta: Delta; text: string }) {
  const arrow = delta.direction === "up" ? "▲" : delta.direction === "down" ? "▼" : "▪";
  const toneClasses =
    delta.tone === "positive"
      ? "bg-positive-bg text-positive"
      : delta.tone === "negative"
        ? "bg-negative-bg text-negative"
        : "bg-butter text-muted";

  return (
    <span
      className={`inline-flex w-fit items-center gap-1 rounded-pill px-2.5 py-1 text-xs font-semibold ${toneClasses}`}
    >
      {arrow} {text}
    </span>
  );
}
