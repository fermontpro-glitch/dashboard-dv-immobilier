import { Download } from "lucide-react";
import { KpiCard } from "@/components/KpiCard";
import { EvolutionChart } from "@/components/EvolutionChart";
import { TypeBreakdownPanel } from "@/components/TypeBreakdownPanel";
import { buildOverviewKpis } from "@/lib/kpiCards";
import { getDailySeries, getKpis, getTypeBreakdown } from "@/lib/meta/queries";
import { previousPeriod, resolvePeriod } from "@/lib/meta/period";

export const dynamic = "force-dynamic";

export default async function OverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period } = await searchParams;
  const range = resolvePeriod(period);
  const prevRange = previousPeriod(range);

  const [current, previous, daily, breakdown] = await Promise.all([
    getKpis(range),
    getKpis(prevRange),
    getDailySeries(range),
    getTypeBreakdown(range),
  ]);

  const cards = buildOverviewKpis(current, previous);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-plum-900">Vue globale du compte</h1>
          <p className="text-muted mt-1">
            Tous types de campagne confondus · dépense &amp; acquisition · {range.label}
          </p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-md bg-plum-900 text-blossom-100 px-4 py-2.5 text-sm font-semibold hover:bg-plum-800 transition-colors">
          <Download size={16} />
          Exporter
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {cards.map((card) => (
          <KpiCard key={card.label} {...card} />
        ))}
      </div>

      <div className="grid grid-cols-[1fr_420px] gap-4 items-stretch">
        <div className="rounded-lg border border-border bg-blossom-100 p-6">
          <h3 className="font-display font-bold text-lg text-plum-900 mb-2">
            Évolution — Dépense &amp; Leads
          </h3>
          <EvolutionChart data={daily} />
        </div>
        <TypeBreakdownPanel breakdown={breakdown} />
      </div>
    </div>
  );
}
