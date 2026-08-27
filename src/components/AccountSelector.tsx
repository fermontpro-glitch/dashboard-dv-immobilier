"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";
import type { AdAccount } from "@/lib/meta/accounts";

export function AccountSelector({ accounts }: { accounts: AdAccount[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentId = searchParams.get("account") ?? accounts[0]?.id;
  const current = accounts.find((a) => a.id === currentId) ?? accounts[0];

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function select(accountId: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("account", accountId);
    router.push(`${pathname}?${params.toString()}`);
    setOpen(false);
  }

  if (accounts.length <= 1) {
    return (
      <div className="leading-tight">
        <div className="font-display font-bold text-base text-blossom-100">{current?.label ?? "—"}</div>
        <div className="text-sm text-blossom-100/60">Compte publicitaire Meta</div>
      </div>
    );
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 text-left group"
      >
        <div className="leading-tight">
          <div className="font-display font-bold text-base text-blossom-100 flex items-center gap-1.5">
            {current?.label ?? "Choisir un compte"}
            <ChevronDown size={14} className="text-blossom-100/50 group-hover:text-blossom-100/80" />
          </div>
          <div className="text-sm text-blossom-100/60">Compte publicitaire Meta</div>
        </div>
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-2 w-64 rounded-lg border border-border bg-blossom-100 shadow-lg z-20 p-1.5">
          {accounts.map((a) => (
            <button
              key={a.id}
              onClick={() => select(a.id)}
              className={`w-full text-left rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                a.id === current?.id ? "bg-peach-light text-plum-950" : "text-plum-900 hover:bg-butter"
              }`}
            >
              {a.label}
              <span className="block text-[11px] text-subtle font-mono font-normal">act_{a.id}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
