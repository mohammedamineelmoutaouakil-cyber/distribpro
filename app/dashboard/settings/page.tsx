import { BadgeCheck, CalendarDays, CreditCard, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { BrandingUploader } from "@/components/dashboard/branding-uploader";
import { CompanySettingsForm } from "@/components/dashboard/company-settings-form";
import { ProfileForm } from "@/components/dashboard/profile-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireCompanyAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getSignedUrl, BRAND_BUCKET } from "@/lib/storage";
import { SUBSCRIPTION_STATUS_META } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const ctx = await requireCompanyAdmin();
  const supabase = await createClient();

  const [{ count: productCount }, { count: customerCount }, logoUrl, bannerUrl] = await Promise.all([
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
    getSignedUrl(supabase, BRAND_BUCKET, ctx.company.banner_path),
  ]);

  const subMeta = ctx.subscription
    ? SUBSCRIPTION_STATUS_META[ctx.subscription.status]
    : { label: "Aucun", className: "bg-slate-100 text-slate-500 border-slate-200" };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Paramètres de l'entreprise"
        description="Gérez votre identité de marque, vos coordonnées et votre abonnement."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Identité de marque</CardTitle>
            </CardHeader>
            <CardContent>
              <BrandingUploader logoUrl={logoUrl} bannerUrl={bannerUrl} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informations de l'entreprise</CardTitle>
            </CardHeader>
            <CardContent>
              <CompanySettingsForm company={ctx.company} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Abonnement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Plan</span>
                <Badge variant="brand">{ctx.plan.name}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Statut</span>
                <Badge className={subMeta.className}>{subMeta.label}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Expiration</span>
                <span className="text-sm text-navy">{formatDate(ctx.subscription?.expires_at)}</span>
              </div>
              <div className="space-y-2 border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Produits actifs</span>
                  <span className="font-medium text-navy">{formatNumber(productCount ?? 0)} / {ctx.plan.maxProducts}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-brand"
                    style={{ width: `${Math.min(100, ((productCount ?? 0) / ctx.plan.maxProducts) * 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Comptes clients</span>
                  <span className="font-medium text-navy">{formatNumber(customerCount ?? 0)} / {ctx.plan.maxCustomers}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-teal"
                    style={{ width: `${Math.min(100, ((customerCount ?? 0) / ctx.plan.maxCustomers) * 100)}%` }}
                  />
                </div>
              </div>
              <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
                <p className="font-medium text-navy">{ctx.plan.priceMAD} MAD / mois</p>
                <p className="mt-1">
                  La gestion des abonnements est assurée par l'équipe DistribPro. Contactez le support
                  pour changer de plan ou renouveler.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Mon compte</CardTitle>
            </CardHeader>
            <CardContent>
              <ProfileForm
                fullName={(ctx.user.user_metadata?.full_name as string | undefined) ?? ""}
                email={ctx.user.email ?? ""}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sécurité</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-500">
              <p className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-teal" /> Données isolées par entreprise (RLS)
              </p>
              <p className="flex items-center gap-2">
                <BadgeCheck className="h-4 w-4 text-teal" /> Rôles vérifiés côté serveur
              </p>
              <p className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-teal" /> Prix recalculés à chaque commande
              </p>
              <p className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-teal" /> Aucun paiement en ligne stocké
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
