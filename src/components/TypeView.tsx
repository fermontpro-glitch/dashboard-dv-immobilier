import { KpiCard } from "@/components/KpiCard";
import { CampaignsTable } from "@/components/CampaignsTable";
import { buildTypeKpis } from "@/lib/kpiCards";
import { getCampaignsTable, getKpis } from "@/lib/meta/queries";
import { previousPeriod, resolvePeriod, type PeriodParams } from "@/lib/meta/period";
import type { CampaignType } from "@/lib/meta/types";
import { Download } from "lucide-react";

export async function TypeView({
  type,
  label,
  periodParams,
  accountId,
}: {
  type: CampaignType;
  label: string;
  periodParams: PeriodParams;
  accountId: string;
}) {
  const range = resolvePeriod(periodParams);
  const prevRange = previousPeriod(range);

  const [current, previous, { rows, total }] = await Promise.all([
    getKpis(range, accountId, type),
    getKpis(prevRange, accountId, type),
    getCampaignsTable(range, type, accountId),
  ]);

  const cards = buildTypeKpis(current, previous, label);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-plum-900">Vue {label}</h1>
          <p className="text-muted mt-1">
            Campagnes classées « {label} » par nomenclature · {range.label}
          </p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-md bg-plum-900 text-blossom-100 px-4 py-2.5 text-sm font-semibold hover:bg-plum-800 transition-colors">
          <Download size={16} />
          Exporter l&apos;onglet
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {cards.map((card) => (
          <KpiCard key={card.label} {...card} />
        ))}
      </div>

      <CampaignsTable rows={rows} total={total} typeLabel={label} />
    </div>
  );
}
