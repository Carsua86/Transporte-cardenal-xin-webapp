import { createClient } from "@/lib/supabase/server";
import { logout } from "@/lib/actions/auth";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <DashboardShell userEmail={user?.email} logoutAction={logout}>
      {children}
    </DashboardShell>
  );
}
