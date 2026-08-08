"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV } from "@/lib/modules";

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex h-full w-64 shrink-0 flex-col gap-6 overflow-y-auto border-r border-navy-800 bg-navy-900 px-3 py-5 lg:w-60">
      <div className="flex items-center gap-2.5 px-2">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 text-lg shadow-sm ring-1 ring-gold-400/50">
          🐦
        </span>
        <div>
          <p className="text-sm font-semibold tracking-tight text-white">
            CARDENAL <span className="text-gold-400">XIN</span>
          </p>
          <p className="text-xs text-navy-300">Transporte y logística</p>
        </div>
      </div>
      {NAV.map((section) => (
        <div key={section.section} className="flex flex-col gap-0.5">
          <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-navy-400">
            {section.section}
          </p>
          {section.items.map(([slug, icon, label]) => {
            const href = `/${slug}`;
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={onNavigate}
                className={`flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-brand-600 text-white shadow-sm"
                    : "text-navy-200 hover:bg-navy-800 hover:text-gold-400"
                }`}
              >
                <span className="text-base">{icon}</span>
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
