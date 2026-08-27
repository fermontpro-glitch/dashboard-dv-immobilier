import { PeriodSelector } from "./PeriodSelector";
import { AccountSelector } from "./AccountSelector";
import type { AdAccount } from "@/lib/meta/accounts";

export function Header({ accounts }: { accounts: AdAccount[] }) {
  return (
    <header className="bg-plum-900 text-blossom-100 px-8 py-5 flex items-center justify-between border-b border-white/10">
      <AccountSelector accounts={accounts} />

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
