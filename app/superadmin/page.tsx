import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CalendarClock,
  ShoppingCart,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireSuperAdmin } from "@/lib/auth";
import { getCompaniesAdminRows } from "@/lib/superadmin";
import { PLANS, SUBSCRIPTION_STATUS_META } from "@/lib/constants";
import { formatMAD } from "@/lib/money";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SuperadminOverviewPage() {
  const { supabase } = await requireSuperAdmin();

  const [companies, { count: customerCount }, { count: orderCount }, { data: orderTotals }] =
    await Promise.all([
      getCompaniesAdminRows(supabase),
      supabase
        .from("customer_accounts")
        .select("id", { count: "exact", head: true })
        .neq("status", "suspended"),
      supabase.from("orders").select("id", { count: "exact", head: true }),
      supabase
        .from("orders")
        .select("total_centimes, status")
        .neq("status", "cancelled")
        .limit(20000),
    ]);

  const activeCompanies = companies.filter((company) => company.status === "active").length;
  const activeSubscriptions = companies.filter(
    (company) => company.subscriptionStatus === "active" || company.subscriptionStatus === "trial"
  ).length;
  const grossValue = (orderTotals ?? []).reduce(
    (sum, order) => sum + Number(order.total_centimes),
    0
  );
  const now = Date.now();
  const expiring = companies
    .filter((company) => {
      if (!company.expiresAt) return false;
      const expires = new Date(company.expiresAt).getTime();
      return expires > now && expires - now < 1000 * 60 * 60 * 24 * 14;
    })
    .slice(0, 5);

  const recentCompanies = companies.slice(0, 6);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Vue plateforme"
        description="Pilotez les entreprises, les abonnements et l'activité globale de DistribPro."
      >
        <Button asChild size="sm">
          <Link href="/superadmin/companies">
            Toutes les entreprises <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Entreprises"
          value={companies.length}
          hint={`${activeCompanies} actives`}
          icon={Building2}
          accent="navy"
        />
        <StatCard
          label="Abonnements"
          value={activeSubscriptions}
          hint="actifs ou en essai"
          icon={CalendarClock}
          accent="brand"
        />
        <StatCard
          label="Clients B2B"
          value={customerCount ?? 0}
          hint="toutes entreprises"
          icon={Users}
          accent="teal"
        />
        <StatCard
          label="Valeur commandée"
          value={formatMAD(grossValue)}
          hint={`${orderCount ?? 0} commandes`}
          icon={Wallet}
          accent="amber"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Entreprises récentes</CardTitle>
            <Link href="/superadmin/companies" className="text-xs font-medium text-brand hover:underline">
              Voir tout
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {recentCompanies.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-5">Entreprise</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="pr-5 text-right">Créée le</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentCompanies.map((company) => {
                    const subMeta = SUBSCRIPTION_STATUS_META[company.subscriptionStatus] ?? {
                      label: company.subscriptionStatus,
                      className: "bg-slate-100 text-slate-500 border-slate-200",
                    };
                    return (
                      <TableRow key={company.id}>
                        <TableCell className="pl-5">
                          <Link
                            href={`/superadmin/companies/${company.id}`}
                            className="font-medium text-navy hover:text-brand"
                          >
                            {company.name}
                          </Link>
                          <p className="text-[11px] text-slate-400">{company.sector ?? company.slug}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="brand">{PLANS[company.plan].name}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={subMeta.className}>{subMeta.label}</Badge>
                        </TableCell>
                        <TableCell className="pr-5 text-right text-xs text-slate-400">
                          {formatDate(company.createdAt)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="py-12 text-center text-sm text-slate-400">
                Aucune entreprise enregistrée pour le moment.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-slate-400" /> À surveiller
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs font-medium text-navy">Abonnements expirant sous 14 jours</p>
              {expiring.length > 0 ? (
                <ul className="mt-2 space-y-2">
                  {expiring.map((company) => (
                    <li key={company.id} className="flex items-center justify-between gap-2 text-xs">
                      <Link
                        href={`/superadmin/companies/${company.id}`}
                        className="truncate text-slate-600 hover:text-brand"
                      >
                        {company.name}
                      </Link>
                      <span className="shrink-0 text-slate-400">{formatDate(company.expiresAt)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-xs text-slate-400">Aucune échéance imminente.</p>
              )}
            </div>

            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs font-medium text-navy">Activité commandes</p>
              <p className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                <ShoppingCart className="h-3.5 w-3.5" /> {orderCount ?? 0} commandes cumulées
              </p>
              <p className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                <Wallet className="h-3.5 w-3.5" /> {formatMAD(grossValue)} hors annulations
              </p>
            </div>

            <div className="rounded-lg border border-dashed border-slate-200 p-3 text-xs text-slate-400">
              Les plans sont attribués manuellement. Contactez une entreprise depuis sa fiche pour
              ajuster son abonnement.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
