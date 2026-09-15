"use client";

import { useMemo, useState } from "react";
import { Download, LayoutGrid, Table2 } from "lucide-react";
import { CreativeCard } from "./CreativeCard";
import { CreativesTable } from "./CreativesTable";
import { CreativePreviewModal } from "./CreativePreviewModal";
import type { Creative, CampaignType } from "@/lib/meta/types";
import { CAMPAIGN_TYPE_LABELS } from "@/lib/meta/types";
import {
  IMAGE_DEFAULT_ACTIVE,
  IMAGE_METRIC_OPTIONS,
  METRIC_REGISTRY,
  VIDEO_DEFAULT_ACTIVE,
  VIDEO_METRIC_OPTIONS,
  type MetricKey,
} from "@/lib/creativeMetrics";

type FormatFilter = "all" | "image" | "video";
type TypeFilter = "all" | CampaignType;
type ViewMode = "table" | "grid";

const FORMAT_OPTIONS: { value: FormatFilter; label: string }[] = [
  { value: "image", label: "Image" },
  { value: "video", label: "Vidéo" },
  { value: "all", label: "Tous" },
];

const TYPE_OPTIONS: { value: TypeFilter; label: string }[] = [
  { value: "all", label: "Tous types" },
  { value: "webinaire", label: CAMPAIGN_TYPE_LABELS.webinaire },
  { value: "challenge", label: CAMPAIGN_TYPE_LABELS.challenge },
  { value: "leadmagnet", label: CAMPAIGN_TYPE_LABELS.leadmagnet },
  { value: "other", label: CAMPAIGN_TYPE_LABELS.other },
];

function metricValue(c: Creative, key: MetricKey): number {
  switch (key) {
    case "spend":
      return c.metrics.spend;
    case "linkClicks":
      return c.metrics.linkClicks;
    case "cpc":
      return c.metrics.cpc;
    case "ctr":
      return c.metrics.ctr;
    case "leads":
      return c.metrics.leads;
    case "cpl":
      return c.metrics.cpl;
    case "hookRate":
      return c.hookRate ?? -1;
    case "holdRate":
      return c.holdRate ?? -1;
  }
}

export function CreasGallery({ creatives }: { creatives: Creative[] }) {
  const [view, setView] = useState<ViewMode>("table");
  const [format, setFormat] = useState<FormatFilter>("image");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [sortKey, setSortKey] = useState<MetricKey>("leads");
  const [activeMetrics, setActiveMetrics] = useState<Set<MetricKey>>(
    new Set(IMAGE_DEFAULT_ACTIVE)
  );
  const [preview, setPreview] = useState<{ adId: string; name: string; destinationUrl: string | null } | null>(null);

  const metricOptions = format === "video" ? VIDEO_METRIC_OPTIONS : IMAGE_METRIC_OPTIONS;
  const sortOptions = format === "video"
    ? (["leads", "spend", "cpl", "hookRate", "holdRate"] as MetricKey[])
    : (["leads", "spend", "cpl", "ctr", "cpc", "linkClicks"] as MetricKey[]);

  function changeFormat(next: FormatFilter) {
    setFormat(next);
    setActiveMetrics(new Set(next === "video" ? VIDEO_DEFAULT_ACTIVE : IMAGE_DEFAULT_ACTIVE));
    const nextSortOptions = next === "video"
      ? (["leads", "spend", "cpl", "hookRate", "holdRate"] as MetricKey[])
      : (["leads", "spend", "cpl", "ctr", "cpc", "linkClicks"] as MetricKey[]);
    if (!nextSortOptions.includes(sortKey)) setSortKey("leads");
  }

  function toggleMetric(key: MetricKey) {
    setActiveMetrics((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const filtered = useMemo(() => {
    return creatives
      .filter((c) => format === "all" || c.format === format)
      .filter((c) => typeFilter === "all" || c.campaignType === typeFilter)
      .sort((a, b) => metricValue(b, sortKey) - metricValue(a, sortKey));
  }, [creatives, format, typeFilter, sortKey]);

  const activeMetricsOrdered = metricOptions.filter((k) => activeMetrics.has(k));

  function openPreview(creative: Creative) {
    setPreview({ adId: creative.sampleAdId, name: creative.name, destinationUrl: creative.destinationUrl });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-plum-900">Bibliothèque de créas</h1>
          <p className="text-muted mt-1">Aperçu visuel · groupé par créa, trié par {METRIC_REGISTRY[sortKey].label.toLowerCase()}</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-md bg-plum-900 text-blossom-100 px-4 py-2.5 text-sm font-semibold hover:bg-plum-800 transition-colors">
          <Download size={16} />
          Exporter
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <PillGroup value={format} onChange={changeFormat} options={FORMAT_OPTIONS} />
        <PillGroup value={typeFilter} onChange={setTypeFilter} options={TYPE_OPTIONS} />

        <div className="ml-auto flex items-center gap-3">
          <div className="inline-flex rounded-pill border border-border bg-blossom-100 p-1 gap-1">
            <button
              onClick={() => setView("table")}
              aria-label="Vue tableau"
              className={`rounded-pill p-1.5 transition-colors ${
                view === "table" ? "bg-plum-900 text-blossom-100" : "text-muted hover:text-plum-900"
              }`}
            >
              <Table2 size={16} />
            </button>
            <button
              onClick={() => setView("grid")}
              aria-label="Vue grille"
              className={`rounded-pill p-1.5 transition-colors ${
                view === "grid" ? "bg-plum-900 text-blossom-100" : "text-muted hover:text-plum-900"
              }`}
            >
              <LayoutGrid size={16} />
            </button>
          </div>

          <div className="relative">
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as MetricKey)}
              className="appearance-none bg-blossom-100 border border-border rounded-pill pl-4 pr-9 py-2 text-sm font-medium text-plum-900 cursor-pointer focus:outline-none focus:ring-2 focus:ring-peach"
            >
              {sortOptions.map((key) => (
                <option key={key} value={key}>
                  Trier : {METRIC_REGISTRY[key].label}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-subtle text-xs">▾</span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {metricOptions.map((key) => {
          const active = activeMetrics.has(key);
          return (
            <button
              key={key}
              onClick={() => toggleMetric(key)}
              className={`inline-flex items-center gap-1.5 rounded-pill border px-3 py-1.5 text-xs font-semibold transition-colors ${
                active
                  ? "border-plum-900 bg-plum-900 text-blossom-100"
                  : "border-border bg-blossom-100 text-muted hover:border-subtle"
              }`}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: active ? METRIC_REGISTRY[key].bulletColor : "#9E8492" }}
              />
              {METRIC_REGISTRY[key].label}
            </button>
          );
        })}
      </div>

      {view === "table" ? (
        <CreativesTable
          creatives={filtered}
          metrics={activeMetricsOrdered}
          sortKey={sortKey}
          onSortChange={setSortKey}
          onPlay={openPreview}
        />
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-border bg-blossom-100 p-10 text-center text-muted">
          Aucune créa ne correspond à ces filtres sur cette période.
        </div>
      ) : (
        <div className="grid grid-cols-6 gap-4">
          {filtered.map((creative, i) => (
            <CreativeCard
              key={creative.id}
              creative={creative}
              rank={i + 1}
              activeMetrics={activeMetricsOrdered}
              onPlay={() => openPreview(creative)}
            />
          ))}
        </div>
      )}

      {preview && (
        <CreativePreviewModal
          adId={preview.adId}
          name={preview.name}
          destinationUrl={preview.destinationUrl}
          onClose={() => setPreview(null)}
        />
      )}
    </div>
  );
}

function PillGroup<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="inline-flex rounded-pill border border-border bg-blossom-100 p-1 gap-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`rounded-pill px-3.5 py-1.5 text-sm font-medium transition-colors ${
            value === opt.value ? "bg-plum-900 text-blossom-100" : "text-muted hover:text-plum-900"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
