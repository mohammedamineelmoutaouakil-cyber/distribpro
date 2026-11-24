import Link from "next/link";
import {
  Building2,
  LogOut,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Tag,
  UserRound,
  Wallet,
} from "lucide-react";
import { logoutAction } from "@/actions/auth";
import { PasswordChangeForm } from "@/components/portal/password-change-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireCustomer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CUSTOMER_STATUS_META } from "@/lib/constants";
import { formatMAD } from "@/lib/money";
import { formatDate, whatsappLink } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PortalAccountPage() {
  const ctx = await requireCustomer();
  const supabase = await createClient();

  const { data: orders } = await supabase
    .from("orders")
    .select("total_centimes, status, created_at")
    .eq("company_id", ctx.company.id)
    .eq("customer_id", ctx.customer.id)
    .order("created_at", { ascending: false })
    .limit(200);

  const orderRows = orders ?? [];
  const validOrders = orderRows.filter((order) => order.status !== "cancelled");
  const total = validOrders.reduce((sum, order) => sum + Number(order.total_centimes), 0);
  const statusMeta = CUSTOMER_STATUS_META[ctx.customer.status] ?? CUSTOMER_STATUS_META.pending;
  const whatsappUrl = ctx.company.whatsapp
    ? whatsappLink(
        ctx.company.whatsapp,
        `Bonjour ${ctx.company.name}, je vous contacte au sujet de mon compte client (${ctx.customer.company_name}).`
      )
    : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-brand">Mon espace</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-navy">Mon compte</h1>
        <p className="mt-1 text-sm text-slate-500">
          Vos informations professionnelles et les conditions appliquées par votre fournisseur.
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft">
          <p className="text-xs uppercase tracking-wide text-slate-400">Commandes</p>
          <p className="mt-2 text-2xl font-semibold text-navy">{orderRows.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft">
          <p className="text-xs uppercase tracking-wide text-slate-400">Total commandé</p>
          <p className="mt-2 text-2xl font-semibold text-navy">{formatMAD(total)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft">
          <p className="text-xs uppercase tracking-wide text-slate-400">Groupe tarifaire</p>
          <p className="mt-2 text-lg font-semibold text-navy">{ctx.group?.name ?? "Standard"}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft">
          <h2 className="flex items-center gap-2 text-base font-semibold text-navy">
            <Building2 className="h-4 w-4 text-slate-400" /> Mon entreprise
          </h2>
          <div className="mt-4 space-y-3 text-sm">
            <div>
              <p className="font-medium text-navy">{ctx.customer.company_name}</p>
              <p className="text-xs text-slate-400">Raison sociale</p>
            </div>
            <div className="flex items-start gap-3">
              <UserRound className="mt-0.5 h-4 w-4 text-slate-400" />
              <div>
                <p className="text-navy">{ctx.customer.contact_name ?? "—"}</p>
                <p className="text-xs text-slate-400">Contact</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="mt-0.5 h-4 w-4 text-slate-400" />
              <div>
                <p className="break-all text-navy">{ctx.customer.email}</p>
                <p className="text-xs text-slate-400">Email de connexion</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="mt-0.5 h-4 w-4 text-slate-400" />
              <div>
                <p className="text-navy">{ctx.customer.phone ?? "—"}</p>
                <p className="text-xs text-slate-400">Téléphone</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 text-slate-400" />
              <div>
                <p className="text-navy">{ctx.customer.city ?? "—"}</p>
                <p className="text-xs text-slate-400">{ctx.customer.address ?? "Adresse non renseignée"}</p>
              </div>
            </div>
            {ctx.customer.ice && (
              <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
                ICE : <span className="font-mono text-navy">{ctx.customer.ice}</span>
              </p>
            )}
            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
              <span className="text-xs text-slate-500">Statut du compte</span>
              <Badge className={statusMeta.className}>{statusMeta.label}</Badge>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft">
            <h2 className="flex items-center gap-2 text-base font-semibold text-navy">
              <Tag className="h-4 w-4 text-slate-400" /> Conditions commerciales
            </h2>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Fournisseur</span>
                <span className="font-medium text-navy">{ctx.company.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Groupe tarifaire</span>
                <Badge variant="outline">{ctx.group?.name ?? "Standard"}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Devise</span>
                <span className="font-medium text-navy">MAD (HT)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Client depuis</span>
                <span className="font-medium text-navy">{formatDate(ctx.customer.created_at)}</span>
              </div>
            </div>
            <div className="mt-4 flex items-start gap-2 rounded-lg bg-brand-light p-3 text-xs text-brand-dark">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
              Vos tarifs personnalisés sont appliqués automatiquement dans le catalogue et recalculés
              côté serveur à chaque commande.
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft">
            <h2 className="flex items-center gap-2 text-base font-semibold text-navy">
              <Wallet className="h-4 w-4 text-slate-400" /> Contact fournisseur
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Pour modifier vos informations, une adresse ou vos conditions, contactez directement{" "}
              {ctx.company.name}.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              {whatsappUrl && (
                <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
                  <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="h-4 w-4" /> Contacter sur WhatsApp
                  </a>
                </Button>
              )}
              <Button asChild variant="outline">
                <Link href="/portal/orders">Voir mes commandes</Link>
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft">
            <h2 className="text-base font-semibold text-navy">Sécurité</h2>
            <p className="mt-1 text-xs text-slate-400">
              Modifiez le mot de passe de votre compte client.
            </p>
            <div className="mt-4">
              <PasswordChangeForm />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft">
            <h2 className="text-base font-semibold text-navy">Session</h2>
            <p className="mt-1 text-xs text-slate-400">{ctx.user.email}</p>
            <form action={logoutAction} className="mt-3">
              <Button type="submit" variant="outline" size="sm" className="w-full">
                <LogOut className="h-4 w-4" /> Se déconnecter
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
