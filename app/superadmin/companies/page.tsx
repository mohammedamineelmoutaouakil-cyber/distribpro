import { PageHeader } from "@/components/dashboard/page-header";
import { CompaniesTable } from "@/components/superadmin/companies-table";
import { requireSuperAdmin } from "@/lib/auth";
import { getCompaniesAdminRows } from "@/lib/superadmin";

export const dynamic = "force-dynamic";

export default async function SuperadminCompaniesPage() {
  const { supabase } = await requireSuperAdmin();
  const companies = await getCompaniesAdminRows(supabase);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Entreprises"
        description="Activez, suspendez et gérez les abonnements des distributeurs présents sur la plateforme."
      />
      <CompaniesTable companies={companies} />
    </div>
  );
}
