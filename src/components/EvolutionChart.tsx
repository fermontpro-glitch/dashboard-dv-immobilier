"use client";

import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import type { DailyPoint } from "@/lib/meta/types";
import { formatEuroInt, formatInt } from "@/lib/format";

function formatDayLabel(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.getUTCDate().toString().padStart(2, "0");
}

export function EvolutionChart({ data }: { data: DailyPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="spendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F4A384" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#F4A384" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="#EFE3DA" />
        <XAxis
          dataKey="date"
          tickFormatter={formatDayLabel}
          tick={{ fontSize: 12, fill: "#9E8492" }}
          axisLine={{ stroke: "#E8DAD0" }}
          tickLine={false}
        />
        <YAxis
          yAxisId="spend"
          tick={{ fontSize: 12, fill: "#9E8492" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => formatEuroInt(v)}
          width={56}
        />
        <YAxis yAxisId="leads" orientation="right" hide />
        <Tooltip
          formatter={(value, name) =>
            name === "Dépense (€)"
              ? [`${formatEuroInt(Number(value))} €`, name]
              : [formatInt(Number(value)), name]
          }
          labelFormatter={(iso) => `Jour ${formatDayLabel(String(iso))}`}
          contentStyle={{
            background: "#FFFAF6",
            border: "1px solid #E8DAD0",
            borderRadius: 10,
            fontSize: 13,
          }}
        />
        <Area
          yAxisId="spend"
          type="monotone"
          dataKey="spend"
          name="Dépense (€)"
          stroke="#DC8C6F"
          strokeWidth={2}
          fill="url(#spendFill)"
        />
        <Line
          yAxisId="leads"
          type="monotone"
          dataKey="leads"
          name="Leads"
          stroke="#486D83"
          strokeWidth={2}
          dot={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
