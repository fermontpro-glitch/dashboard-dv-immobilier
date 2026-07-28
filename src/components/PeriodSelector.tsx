"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PERIOD_LABELS, DEFAULT_PERIOD, type PeriodPreset } from "@/lib/meta/period";

export function PeriodSelector() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = (searchParams.get("period") as PeriodPreset) || DEFAULT_PERIOD;

  function onChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", value);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="relative">
      <select
        value={current}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none bg-blossom-100 border border-border rounded-pill pl-4 pr-9 py-2 text-sm font-medium text-plum-900 cursor-pointer focus:outline-none focus:ring-2 focus:ring-peach"
      >
        {Object.entries(PERIOD_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-subtle text-xs">
        ▾
      </span>
    </div>
  );
}
