import { PeriodSelector } from "./PeriodSelector";

export function Header() {
  return (
    <header className="bg-plum-900 text-blossom-100 px-8 py-5 flex items-center justify-between border-b border-white/10">
      <div>
        <div className="font-display font-bold text-base leading-tight">DV Immobilier</div>
        <div className="text-sm text-blossom-100/60">Compte publicitaire Meta</div>
      </div>

      <div className="flex items-center gap-3">
        <PeriodSelector />
        <span className="inline-flex items-center gap-2 rounded-pill bg-white/5 border border-white/10 px-4 py-2 text-sm font-medium">
          <span className="h-2 w-2 rounded-full bg-positive" />
          Live · API Meta
        </span>
      </div>
    </header>
  );
}
