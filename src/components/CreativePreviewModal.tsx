"use client";

import { useEffect, useState } from "react";
import { X, Copy, Check, ExternalLink } from "lucide-react";

type PreviewFormat = "MOBILE_FEED_STANDARD" | "DESKTOP_FEED_STANDARD" | "INSTAGRAM_STORY";

const FORMAT_OPTIONS: { value: PreviewFormat; label: string; width: number; height: number }[] = [
  { value: "MOBILE_FEED_STANDARD", label: "📱 Feed mobile", width: 360, height: 640 },
  { value: "DESKTOP_FEED_STANDARD", label: "🖥️ Feed desktop", width: 560, height: 700 },
  { value: "INSTAGRAM_STORY", label: "📲 Story", width: 360, height: 640 },
];

export function CreativePreviewModal({
  adId,
  name,
  destinationUrl,
  onClose,
}: {
  adId: string;
  name: string;
  destinationUrl: string | null;
  onClose: () => void;
}) {
  const [format, setFormat] = useState<PreviewFormat>("MOBILE_FEED_STANDARD");
  const [copied, setCopied] = useState(false);

  async function copyUrl() {
    if (!destinationUrl) return;
    try {
      await navigator.clipboard.writeText(destinationUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard API unavailable — the link is still visible and selectable
    }
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const current = FORMAT_OPTIONS.find((f) => f.value === format) ?? FORMAT_OPTIONS[0];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-plum-950/80 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div className="flex flex-col items-center gap-3 max-h-[92vh]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between w-full gap-3">
          <span className="font-mono text-xs text-blossom-100/80 truncate max-w-[200px]">{name}</span>

          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-pill border border-white/15 bg-white/5 p-1 gap-1">
              {FORMAT_OPTIONS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFormat(f.value)}
                  className={`rounded-pill px-2.5 py-1 text-[11px] font-medium transition-colors whitespace-nowrap ${
                    format === f.value ? "bg-peach text-plum-950" : "text-blossom-100/70 hover:text-blossom-100"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <button
              onClick={onClose}
              className="h-8 w-8 shrink-0 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-blossom-100"
              aria-label="Fermer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {destinationUrl ? (
          <div className="flex items-center gap-2 w-full max-w-[420px] bg-white/5 border border-white/15 rounded-pill pl-3.5 pr-1.5 py-1.5">
            <span className="flex-1 min-w-0 truncate font-mono text-xs text-blossom-100/85">
              {destinationUrl}
            </span>
            <button
              onClick={copyUrl}
              className="shrink-0 inline-flex items-center gap-1 rounded-pill bg-white/10 hover:bg-white/20 px-2.5 py-1 text-[11px] font-semibold text-blossom-100 transition-colors"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? "Copié" : "Copier"}
            </button>
            <a
              href={destinationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 h-6 w-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-blossom-100"
              aria-label="Ouvrir le lien de destination"
            >
              <ExternalLink size={12} />
            </a>
          </div>
        ) : (
          <p className="text-[11px] text-blossom-100/50 w-full max-w-[420px] text-center">
            Aucune URL de destination trouvée pour cette créa.
          </p>
        )}

        <PreviewFrame
          key={format}
          adId={adId}
          format={format}
          width={current.width}
          height={current.height}
          name={name}
        />

        <p className="text-[11px] text-blossom-100/60 max-w-[420px] text-center">
          Premier chargement : accepte ou refuse les cookies Meta dans l&apos;encadré pour accéder à la
          vidéo.
        </p>
      </div>
    </div>
  );
}

function PreviewFrame({
  adId,
  format,
  width,
  height,
  name,
}: {
  adId: string;
  format: PreviewFormat;
  width: number;
  height: number;
  name: string;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/ad-preview?adId=${encodeURIComponent(adId)}&format=${format}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.src) setSrc(data.src);
        else setError(data.error ?? "Aperçu indisponible");
      })
      .catch(() => {
        if (!cancelled) setError("Aperçu indisponible");
      });

    return () => {
      cancelled = true;
    };
  }, [adId, format]);

  return (
    <div
      className="relative rounded-lg overflow-y-auto max-h-[75vh] bg-plum-800 flex items-center justify-center"
      style={{ width }}
    >
      {error && <p className="text-sm text-blossom-100/70 px-6 text-center">{error}</p>}
      {!error && !src && <p className="text-sm text-blossom-100/70">Chargement…</p>}
      {src && (
        <iframe
          src={src}
          width={width}
          height={height}
          scrolling="auto"
          allow="autoplay; encrypted-media"
          className="border-0"
          title={name}
        />
      )}
    </div>
  );
}
