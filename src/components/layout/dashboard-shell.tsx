"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { PhotoBackground } from "@/components/illustrations/photo-background";

export function DashboardShell({
  userEmail,
  logoutAction,
  children,
}: {
  userEmail?: string;
  logoutAction: () => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <PhotoBackground className="fixed h-full w-full opacity-[0.14]" overlayClassName="bg-neutral-50/70" />

      {open && (
        <button
          type="button"
          aria-label="Cerrar menú"
          className="fixed inset-0 z-40 bg-neutral-900/50 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 transition-transform duration-200 lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar onNavigate={() => setOpen(false)} />
      </div>

      <div className="relative flex flex-1 flex-col overflow-x-hidden">
        <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-3 shadow-[0_1px_0_0_var(--gold-400)] lg:px-6">
          <button
            type="button"
            aria-label="Abrir menú"
            onClick={() => setOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-lg text-neutral-600 hover:bg-neutral-100 lg:hidden"
          >
            ☰
          </button>
          <span className="hidden lg:block" />
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="flex items-center gap-2 rounded-full bg-neutral-100 py-1 pl-1 pr-3 text-xs text-neutral-600 sm:text-sm">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-xs">👤</span>
              <span className="max-w-[9rem] truncate sm:max-w-none">{userEmail}</span>
            </span>
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-full px-3 py-1.5 text-sm font-medium text-neutral-500 transition hover:bg-brand-50 hover:text-brand-700"
              >
                Salir
              </button>
            </form>
          </div>
        </header>
        <main className="relative flex-1 px-4 py-6 lg:px-6">{children}</main>
      </div>
    </div>
  );
}
