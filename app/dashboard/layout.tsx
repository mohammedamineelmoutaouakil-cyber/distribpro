import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { requireCompanyAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getSignedUrl, BRAND_BUCKET } from "@/lib/storage";
import { DEMO_COMPANY_SLUG } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireCompanyAdmin();
  const supabase = await createClient();

  const [{ count: productCount }, { count: customerCount }, logoUrl] = await Promise.all([
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("company_id", ctx.company.id)
      .eq("is_active", true),
    supabase
      .from("customer_accounts")
      .select("id", { count: "exact", head: true })
      .eq("company_id", ctx.company.id)
      .neq("status", "suspended"),
    getSignedUrl(supabase, BRAND_BUCKET, ctx.company.logo_path),
  ]);

  const userName =
    (ctx.user.user_metadata?.full_name as string | undefined) ?? ctx.user.email ?? "Administrateur";

  return (
    <DashboardShell
      companyName={ctx.company.name}
      companySlug={ctx.company.slug}
      logoUrl={logoUrl}
      userName={userName}
      userEmail={ctx.user.email ?? ""}
      planName={ctx.plan.name}
      productCount={productCount ?? 0}
      customerCount={customerCount ?? 0}
      maxProducts={ctx.plan.maxProducts}
      maxCustomers={ctx.plan.maxCustomers}
      isDemo={ctx.company.slug === DEMO_COMPANY_SLUG}
      accessIssue={ctx.isOperational ? null : ctx.accessIssue}
    >
      {children}
    </DashboardShell>
  );
}
