import type { CampaignRow, Metrics } from "@/lib/meta/types";
import { formatCompactK, formatDecimal, formatEuroDec, formatEuroInt, formatInt } from "@/lib/format";

export function CampaignsTable({
  rows,
  total,
  typeLabel,
}: {
  rows: CampaignRow[];
  total: Metrics;
  typeLabel: string;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-blossom-100 p-10 text-center text-muted">
        Aucune campagne {typeLabel} sur cette période.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-blossom-100 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-butter text-left text-[11px] font-semibold uppercase tracking-wide text-muted">
            <Th>Campagne</Th>
            <Th align="right">Dépense</Th>
            <Th align="right">Impressions</Th>
            <Th align="right">Couv.</Th>
            <Th align="right">CTR</Th>
            <Th align="right">CPC</Th>
            <Th align="right">Leads</Th>
            <Th align="right">CPL</Th>
          </tr>
        </thead>
        <tbody className="font-mono">
          {rows.map((row, i) => (
            <tr key={row.id} className={i !== rows.length - 1 ? "border-b border-divider" : ""}>
              <Td className="font-sans font-semibold text-plum-900">{row.name}</Td>
              <Td align="right">{formatEuroInt(row.metrics.spend)} €</Td>
              <Td align="right">{formatCompactK(row.metrics.impressions)}</Td>
              <Td align="right">{formatCompactK(row.metrics.reach)}</Td>
              <Td align="right">{formatDecimal(row.metrics.ctr, 2)} %</Td>
              <Td align="right">{formatEuroDec(row.metrics.cpc)} €</Td>
              <Td align="right">{formatInt(row.metrics.leads)}</Td>
              <Td align="right" className={row.metrics.cpl > total.cpl ? "text-negative" : undefined}>
                {formatEuroDec(row.metrics.cpl)} €
              </Td>
            </tr>
          ))}
          <tr className="bg-butter font-sans font-bold text-plum-900">
            <Td>Total · {typeLabel}</Td>
            <Td align="right">{formatEuroInt(total.spend)} €</Td>
            <Td align="right">{formatCompactK(total.impressions)}</Td>
            <Td align="right">{formatCompactK(total.reach)}</Td>
            <Td align="right">{formatDecimal(total.ctr, 2)} %</Td>
            <Td align="right">{formatEuroDec(total.cpc)} €</Td>
            <Td align="right">{formatInt(total.leads)}</Td>
            <Td align="right">{formatEuroDec(total.cpl)} €</Td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function Th({ children, align = "left" }: { children: React.ReactNode; align?: "left" | "right" }) {
  return <th className={`px-5 py-3 ${align === "right" ? "text-right" : "text-left"}`}>{children}</th>;
}

function Td({
  children,
  align = "left",
  className,
}: {
  children: React.ReactNode;
  align?: "left" | "right";
  className?: string;
}) {
  return (
    <td className={`px-5 py-3.5 ${align === "right" ? "text-right" : "text-left"} ${className ?? ""}`}>
      {children}
    </td>
  );
}
