"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { PERIOD_LABELS, PERIOD_PRESET_OPTIONS, DEFAULT_PERIOD, type PeriodPreset } from "@/lib/meta/period";

export function PeriodSelector() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentPeriod = (searchParams.get("period") as PeriodPreset) || DEFAULT_PERIOD;
  const urlSince = searchParams.get("since") ?? "";
  const urlUntil = searchParams.get("until") ?? "";

  const [since, setSince] = useState(urlSince);
  const [until, setUntil] = useState(urlUntil);
  const [syncedFrom, setSyncedFrom] = useState({ since: urlSince, until: urlUntil });

  // Keep the editable inputs in sync when the URL changes from elsewhere (nav, back/forward).
  if (syncedFrom.since !== urlSince || syncedFrom.until !== urlUntil) {
    setSyncedFrom({ since: urlSince, until: urlUntil });
    setSince(urlSince);
    setUntil(urlUntil);
  }

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function selectPreset(value: PeriodPreset) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", value);
    params.delete("since");
    params.delete("until");
    router.push(`${pathname}?${params.toString()}`);
    setOpen(false);
  }

  function applyCustom() {
    if (!since || !until) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", "custom");
    params.set("since", since);
    params.set("until", until);
    router.push(`${pathname}?${params.toString()}`);
    setOpen(false);
  }

  const triggerLabel =
    currentPeriod === "custom" && urlSince && urlUntil
      ? `${formatShort(urlSince)} – ${formatShort(urlUntil)}`
      : PERIOD_LABELS[currentPeriod];

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 bg-blossom-100 border border-border rounded-pill pl-4 pr-3.5 py-2 text-sm font-medium text-plum-900 cursor-pointer hover:border-subtle transition-colors"
      >
        {triggerLabel}
        <ChevronDown size={14} className="text-subtle" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 rounded-lg border border-border bg-blossom-100 shadow-lg z-20 p-2">
          <div className="flex flex-col">
            {PERIOD_PRESET_OPTIONS.map((value) => (
              <button
                key={value}
                onClick={() => selectPreset(value)}
                className={`text-left rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  currentPeriod === value ? "bg-peach-light text-plum-950" : "text-plum-900 hover:bg-butter"
                }`}
              >
                {PERIOD_LABELS[value]}
              </button>
            ))}
          </div>

          <div className="mt-2 pt-3 border-t border-divider px-1 pb-1">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted mb-2">
              Période personnalisée
            </div>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={since}
                max={until || undefined}
                onChange={(e) => setSince(e.target.value)}
                className="flex-1 min-w-0 rounded-md border border-border bg-blossom-100 px-2 py-1.5 text-xs text-plum-900 focus:outline-none focus:ring-2 focus:ring-peach"
              />
              <span className="text-subtle text-xs">→</span>
              <input
                type="date"
                value={until}
                min={since || undefined}
                onChange={(e) => setUntil(e.target.value)}
                className="flex-1 min-w-0 rounded-md border border-border bg-blossom-100 px-2 py-1.5 text-xs text-plum-900 focus:outline-none focus:ring-2 focus:ring-peach"
              />
            </div>
            <button
              onClick={applyCustom}
              disabled={!since || !until}
              className="mt-2 w-full rounded-md bg-plum-900 text-blossom-100 text-sm font-semibold py-2 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-plum-800 transition-colors"
            >
              Appliquer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function formatShort(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getUTCDate().toString().padStart(2, "0")}/${(d.getUTCMonth() + 1).toString().padStart(2, "0")}`;
}
