"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  LayoutGrid,
  Video,
  Mic,
  Trophy,
  Magnet,
  Smartphone,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Vue d'ensemble", icon: LayoutGrid },
  { href: "/webinaire", label: "Vue Webinaire", icon: Mic },
  { href: "/challenge", label: "Vue Challenge", icon: Trophy },
  { href: "/lead-magnet", label: "Vue Lead Magnet", icon: Magnet },
  { href: "/autre", label: "Vue Autre", icon: Smartphone },
  { href: "/creas", label: "Créas", icon: Video },
];

export function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();

  return (
    <aside className="w-64 shrink-0 bg-plum-900 text-blossom-100 flex flex-col">
      <div className="px-6 py-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <span className="h-9 w-9 rounded-full bg-gradient-to-br from-peach to-peach-darker" />
          <div className="leading-tight">
            <div className="font-display font-bold text-lg">
              LTV<span className="text-peach">Marketing</span>
            </div>
            <div className="text-[10px] tracking-widest text-blossom-100/60 uppercase">
              Reporting Meta Ads
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-5 flex flex-col gap-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={query ? `${href}?${query}` : href}
              className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-peach text-plum-950"
                  : "text-blossom-100/75 hover:bg-white/5 hover:text-blossom-100"
              }`}
            >
              <Icon size={17} strokeWidth={2} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-6 py-5 border-t border-white/10 text-[11px] text-blossom-100/50">
        LTV Marketing · Reporting Meta Ads
      </div>
    </aside>
  );
}
