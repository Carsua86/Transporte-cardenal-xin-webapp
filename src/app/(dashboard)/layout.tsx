import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/sidebar";
import { logout } from "@/lib/actions/auth";
import { HighwayScene } from "@/components/illustrations/highway-scene";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="relative flex min-h-screen bg-neutral-50">
      <HighwayScene className="pointer-events-none fixed inset-0 h-full w-full opacity-[0.07]" />
      <Sidebar />
      <div className="relative flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-6 py-3 shadow-[0_1px_0_0_var(--gold-400)]">
          <span />
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 rounded-full bg-neutral-100 py-1 pl-1 pr-3 text-sm text-neutral-600">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-xs">👤</span>
              {user?.email}
            </span>
            <form action={logout}>
              <button
                type="submit"
                className="rounded-full px-3 py-1.5 text-sm font-medium text-neutral-500 transition hover:bg-brand-50 hover:text-brand-700"
              >
                Salir
              </button>
            </form>
          </div>
        </header>
        <main className="relative flex-1 px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
