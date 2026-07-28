"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

export function CreativePreviewModal({
  adId,
  name,
  onClose,
}: {
  adId: string;
  name: string;
  onClose: () => void;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/ad-preview?adId=${encodeURIComponent(adId)}`)
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
  }, [adId]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-plum-950/80 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div className="flex flex-col items-center gap-3" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between w-full">
          <span className="font-mono text-xs text-blossom-100/80 truncate max-w-[280px]">{name}</span>
          <button
            onClick={onClose}
            className="ml-4 h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-blossom-100"
            aria-label="Fermer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="relative w-[320px] h-[567px] rounded-lg overflow-hidden bg-plum-800 flex items-center justify-center">
          {error && <p className="text-sm text-blossom-100/70 px-6 text-center">{error}</p>}
          {!error && !src && <p className="text-sm text-blossom-100/70">Chargement…</p>}
          {src && (
            <iframe
              src={src}
              width={320}
              height={567}
              scrolling="no"
              allow="autoplay"
              className="border-0"
              title={name}
            />
          )}
        </div>
      </div>
    </div>
  );
}
