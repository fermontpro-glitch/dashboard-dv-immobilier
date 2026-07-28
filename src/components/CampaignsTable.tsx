"use client";

import { Fragment, useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
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
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

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
          {rows.map((row) => {
            const isOpen = expanded.has(row.id);
            const hasAdSets = row.adSets.length > 0;
            return (
              <Fragment key={row.id}>
                <tr
                  className={`border-b border-divider ${hasAdSets ? "cursor-pointer hover:bg-blossom" : ""}`}
                  onClick={hasAdSets ? () => toggle(row.id) : undefined}
                >
                  <Td className="font-sans font-semibold text-plum-900">
                    <span className="inline-flex items-center gap-1.5">
                      {hasAdSets ? (
                        isOpen ? (
                          <ChevronDown size={14} className="text-subtle shrink-0" />
                        ) : (
                          <ChevronRight size={14} className="text-subtle shrink-0" />
                        )
                      ) : (
                        <span className="w-[14px] shrink-0" />
                      )}
                      {row.name}
                      {hasAdSets && (
                        <span className="font-mono text-[11px] font-normal text-subtle">
                          · {row.adSets.length} ad set{row.adSets.length > 1 ? "s" : ""}
                        </span>
                      )}
                    </span>
                  </Td>
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
                {isOpen &&
                  row.adSets.map((adSet) => (
                    <tr key={adSet.id} className="border-b border-divider bg-blossom/60">
                      <Td className="text-muted">
                        <span className="inline-flex items-center gap-1.5 pl-[22px]">{adSet.name}</span>
                      </Td>
                      <Td align="right" className="text-muted">
                        {formatEuroInt(adSet.metrics.spend)} €
                      </Td>
                      <Td align="right" className="text-muted">
                        {formatCompactK(adSet.metrics.impressions)}
                      </Td>
                      <Td align="right" className="text-muted">
                        {formatCompactK(adSet.metrics.reach)}
                      </Td>
                      <Td align="right" className="text-muted">
                        {formatDecimal(adSet.metrics.ctr, 2)} %
                      </Td>
                      <Td align="right" className="text-muted">
                        {formatEuroDec(adSet.metrics.cpc)} €
                      </Td>
                      <Td align="right" className="text-muted">
                        {formatInt(adSet.metrics.leads)}
                      </Td>
                      <Td align="right" className="text-muted">
                        {formatEuroDec(adSet.metrics.cpl)} €
                      </Td>
                    </tr>
                  ))}
              </Fragment>
            );
          })}
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
