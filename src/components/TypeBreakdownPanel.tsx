import { CAMPAIGN_TYPE_LABELS } from "@/lib/meta/types";
import type { TypeBreakdown } from "@/lib/meta/types";
import { formatDecimal, formatEuroDec, formatEuroInt, formatInt } from "@/lib/format";

const TYPE_COLOR: Record<TypeBreakdown["type"], string> = {
  webex: "#486D83",
  challenge: "#DC8C6F",
  leadmagnet: "#5E3D52",
  other: "#9E8492",
};

export function TypeBreakdownPanel({ breakdown }: { breakdown: TypeBreakdown[] }) {
  const totalLeads = breakdown.reduce((s, b) => s + b.leads, 0);
  const totalSpend = breakdown.reduce((s, b) => s + b.spend, 0);
  const cplMoyen = totalLeads > 0 ? totalSpend / totalLeads : 0;

  return (
    <div className="rounded-lg border border-border bg-blossom-100 p-6 flex flex-col h-full">
      <h3 className="font-display font-bold text-lg text-plum-900 mb-4">
        Répartition par type de campagne
      </h3>

      <div className="flex-1 flex flex-col gap-5">
        {breakdown.map((b) => (
          <div key={b.type}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2 font-semibold text-plum-900">
                <span
                  className="h-2.5 w-2.5 rounded-[3px]"
                  style={{ backgroundColor: TYPE_COLOR[b.type] }}
                />
                {CAMPAIGN_TYPE_LABELS[b.type]}
              </div>
              <div className="text-sm">
                <span className="font-semibold text-plum-900">{formatEuroInt(b.spend)} €</span>
                <span className="text-subtle"> · {formatDecimal(b.spendShare, 1)}%</span>
              </div>
            </div>

            <div className="h-2 rounded-pill bg-butter overflow-hidden">
              <div
                className="h-full rounded-pill"
                style={{ width: `${Math.min(100, b.spendShare)}%`, backgroundColor: TYPE_COLOR[b.type] }}
              />
            </div>

            <div className="flex items-center gap-4 mt-1.5 text-xs text-muted">
              <span>
                Leads <strong className="text-plum-900">{formatInt(b.leads)}</strong>
              </span>
              <span>
                CPL <strong className="text-plum-900">{formatEuroDec(b.cpl)} €</strong>
              </span>
              <span>
                CTR <strong className="text-plum-900">{formatDecimal(b.ctr, 2)}%</strong>
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 pt-4 border-t border-divider flex items-center justify-between text-sm">
        <span className="text-muted">
          Total leads <strong className="text-plum-900">{formatInt(totalLeads)}</strong>
        </span>
        <span className="text-muted">
          CPL moyen <strong className="text-plum-900">{formatEuroDec(cplMoyen)} €</strong>
        </span>
        <span className="text-muted">
          Part investie <strong className="text-plum-900">100%</strong>
        </span>
      </div>
    </div>
  );
}
