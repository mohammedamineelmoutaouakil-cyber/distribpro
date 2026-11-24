import { SuperadminShell } from "@/components/superadmin/superadmin-shell";
import { requireSuperAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function SuperadminLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireSuperAdmin();
  const userName =
    (user.user_metadata?.full_name as string | undefined) ?? user.email ?? "Super administrateur";

  return (
    <SuperadminShell userName={userName} userEmail={user.email ?? ""}>
      {children}
    </SuperadminShell>
  );
}
