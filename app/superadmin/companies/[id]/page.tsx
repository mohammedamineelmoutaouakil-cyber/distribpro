import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Globe2,
  Mail,
  MapPin,
  Phone,
  Users,
  Wallet,
} from "lucide-react";
import { Breadcrumbs, PageHeader } from "@/components/dashboard/page-header";
import { CompanyStatusToggle } from "@/components/superadmin/company-status-toggle";
import { SubscriptionForm } from "@/components/superadmin/subscription-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireSuperAdmin } from "@/lib/auth";
import { PLANS, SUBSCRIPTION_STATUS_META, type PlanId } from "@/lib/constants";
import { formatMAD } from "@/lib/money";
import type { Company, Subscription } from "@/lib/types";
import { firstRelation, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SuperadminCompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await requireSuperAdmin();

  const { data: company } = await supabase
    .from("companies")
    .select("*, subscriptions(*)")
    .eq("id", id)
    .maybeSingle();

  if (!company) notFound();

  const typedCompany = company as Company & { subscriptions: Subscription | Subscription[] | null };
  const subscription = firstRelation<Subscription>(typedCompany.subscriptions);
  const plan = PLANS[(subscription?.plan ?? "starter") as PlanId] ?? PLANS.starter;
  const subMeta = subscription
    ? SUBSCRIPTION_STATUS_META[subscription.status]
    : { label: "Aucun abonnement", className: "bg-slate-100 text-slate-500 border-slate-200" };

  const [
    { count: productCount },
    { count: customerCount },
    { count: orderCount },
    { data: orderTotals },
  ] = await Promise.all([
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("company_id", id)
      .eq("is_active", true),
    supabase
      .from("customer_accounts")
      .select("id", { count: "exact", head: true })
      .eq("company_id", id)
      .neq("status", "suspended"),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("company_id", id),
    supabase
      .from("orders")
      .select("total_centimes")
      .eq("company_id", id)
      .neq("status", "cancelled")
      .limit(20000),
  ]);

  const grossValue = (orderTotals ?? []).reduce(
    (sum, order) => sum + Number(order.total_centimes),
    0
  );

  return (
    <div className="animate-fade-in">
      <Breadcrumbs
        items={[
          { label: "Entreprises", href: "/superadmin/companies" },
          { label: typedCompany.name },
        ]}
      />

      <PageHeader
        title={typedCompany.name}
        description={`${typedCompany.slug} · inscrite le ${formatDate(typedCompany.created_at)}`}
      >
        <CompanyStatusToggle companyId={typedCompany.id} status={typedCompany.status} size="default" />
        <Button asChild variant="ghost" size="sm">
          <Link href="/superadmin/companies">
            <ArrowLeft className="h-4 w-4" /> Retour
          </Link>
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wide text-slate-400">Produits actifs</p>
          <p className="mt-2 text-2xl font-semibold text-navy">{productCount ?? 0}</p>
          <p className="mt-1 text-xs text-slate-400">sur {plan.maxProducts} du plan</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wide text-slate-400">Clients</p>
          <p className="mt-2 text-2xl font-semibold text-navy">{customerCount ?? 0}</p>
          <p className="mt-1 text-xs text-slate-400">sur {plan.maxCustomers} du plan</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wide text-slate-400">Commandes</p>
          <p className="mt-2 text-2xl font-semibold text-navy">{orderCount ?? 0}</p>
          <p className="mt-1 text-xs text-slate-400">toutes périodes</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wide text-slate-400">Valeur commandée</p>
          <p className="mt-2 text-2xl font-semibold text-navy">{formatMAD(grossValue)}</p>
          <p className="mt-1 text-xs text-slate-400">hors annulations</p>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="h-4 w-4 text-slate-400" /> Abonnement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="brand">{plan.name}</Badge>
              <Badge className={subMeta.className}>{subMeta.label}</Badge>
              <span className="text-xs text-slate-400">
                {plan.priceMAD} MAD / mois · expiration {formatDate(subscription?.expires_at)}
              </span>
            </div>
            <SubscriptionForm
              companyId={typedCompany.id}
              plan={(subscription?.plan ?? "starter") as PlanId}
              status={subscription?.status ?? "expired"}
              expiresAt={subscription?.expires_at ?? new Date().toISOString()}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4 text-slate-400" /> Coordonnées
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <Mail className="mt-0.5 h-4 w-4 text-slate-400" />
              <div>
                <p className="break-all text-navy">{typedCompany.email ?? "—"}</p>
                <p className="text-xs text-slate-400">Email public</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="mt-0.5 h-4 w-4 text-slate-400" />
              <div>
                <p className="text-navy">{typedCompany.phone ?? "—"}</p>
                <p className="text-xs text-slate-400">Téléphone</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 text-slate-400" />
              <div>
                <p className="text-navy">{typedCompany.city ?? "—"}</p>
                <p className="text-xs text-slate-400">{typedCompany.address ?? "Adresse non renseignée"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Globe2 className="mt-0.5 h-4 w-4 text-slate-400" />
              <div>
                <p className="break-all text-navy">{typedCompany.website ?? "—"}</p>
                <p className="text-xs text-slate-400">Site web</p>
              </div>
            </div>
            {typedCompany.ice && (
              <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
                ICE : <span className="font-mono text-navy">{typedCompany.ice}</span>
              </p>
            )}
            <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
              Secteur : <span className="text-navy">{typedCompany.sector ?? "Non renseigné"}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500 shadow-soft">
          <Building2 className="mb-2 h-4 w-4 text-slate-400" />
          {typedCompany.status === "active" ? "Entreprise active sur la plateforme" : "Entreprise suspendue"}
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500 shadow-soft">
          <Users className="mb-2 h-4 w-4 text-slate-400" />
          {customerCount ?? 0} clients autorisés sur {plan.maxCustomers}
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500 shadow-soft">
          <Wallet className="mb-2 h-4 w-4 text-slate-400" />
          Facturation gérée manuellement par l'équipe DistribPro
        </div>
      </div>
    </div>
  );
}
