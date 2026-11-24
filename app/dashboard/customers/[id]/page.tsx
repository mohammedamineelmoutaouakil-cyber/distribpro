import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2, Mail, MapPin, Phone, ReceiptText, Wallet } from "lucide-react";
import { Breadcrumbs, PageHeader } from "@/components/dashboard/page-header";
import { CustomerStatusActions } from "@/components/dashboard/customer-status-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireCompanyAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CUSTOMER_STATUS_META, ORDER_STATUS_META, type OrderStatus } from "@/lib/constants";
import { formatMAD } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import type { CustomerAccount, CustomerGroup } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireCompanyAdmin();
  const supabase = await createClient();

  const { data: customer } = await supabase
    .from("customer_accounts")
    .select("*, customer_groups(id, name)")
    .eq("id", id)
    .eq("company_id", ctx.company.id)
    .maybeSingle();

  if (!customer) notFound();

  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .eq("customer_id", id)
    .eq("company_id", ctx.company.id)
    .order("created_at", { ascending: false })
    .limit(100);

  const group = Array.isArray(customer.customer_groups) ? customer.customer_groups[0] : customer.customer_groups;
  const statusMeta = CUSTOMER_STATUS_META[customer.status] ?? CUSTOMER_STATUS_META.invited;
  const totalValue = (orders ?? []).reduce((sum, order) => sum + Number(order.total_centimes), 0);

  return (
    <div className="animate-fade-in">
      <Breadcrumbs items={[{ label: "Clients", href: "/dashboard/customers" }, { label: customer.company_name }]} />
      <PageHeader title={customer.company_name} description="Fiche client, historique et accès au portail.">
        <Button asChild variant="outline" size="sm">
          <Link href={`/dashboard/pricing?customer=${customer.id}`}>Tarifs personnalisés</Link>
        </Button>
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard/customers"><ArrowLeft className="h-4 w-4" /> Retour</Link>
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wide text-slate-400">Commandes</p>
          <p className="mt-2 text-2xl font-semibold text-navy">{orders?.length ?? 0}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wide text-slate-400">Valeur totale</p>
          <p className="mt-2 text-2xl font-semibold text-navy">{formatMAD(totalValue)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wide text-slate-400">Groupe tarifaire</p>
          <p className="mt-2 text-lg font-semibold text-navy">{group?.name ?? "Aucun"}</p>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Statut</span>
              <Badge className={statusMeta.className}>{statusMeta.label}</Badge>
            </div>
            <div className="flex items-start gap-3">
              <Building2 className="mt-0.5 h-4 w-4 text-slate-400" />
              <div>
                <p className="font-medium text-navy">{customer.contact_name ?? "—"}</p>
                <p className="text-xs text-slate-400">Contact principal</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="mt-0.5 h-4 w-4 text-slate-400" />
              <div>
                <p className="text-navy">{customer.email}</p>
                <p className="text-xs text-slate-400">Email</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="mt-0.5 h-4 w-4 text-slate-400" />
              <div>
                <p className="text-navy">{customer.phone ?? "—"}</p>
                <p className="text-xs text-slate-400">Téléphone</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 text-slate-400" />
              <div>
                <p className="text-navy">{customer.city ?? "—"}</p>
                <p className="text-xs text-slate-400">{customer.address ?? "Adresse non renseignée"}</p>
              </div>
            </div>
            {customer.ice && (
              <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
                ICE : <span className="font-mono text-navy">{customer.ice}</span>
              </div>
            )}
            {customer.notes && (
              <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">{customer.notes}</div>
            )}
            <CustomerStatusActions
              customerId={customer.id}
              status={customer.status}
              hasUser={!!customer.user_id}
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Historique des commandes</CardTitle>
            <Link href="/dashboard/orders" className="text-xs font-medium text-brand hover:underline">
              Toutes les commandes
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {orders && orders.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-5">Référence</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead className="pr-5 text-right">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => {
                    const meta = ORDER_STATUS_META[order.status as OrderStatus];
                    return (
                      <TableRow key={order.id}>
                        <TableCell className="pl-5">
                          <Link href={`/dashboard/orders/${order.id}`} className="font-medium text-navy hover:text-brand">
                            {order.reference}
                          </Link>
                        </TableCell>
                        <TableCell><Badge className={meta.className}>{meta.label}</Badge></TableCell>
                        <TableCell className="text-right font-medium text-navy">{formatMAD(order.total_centimes)}</TableCell>
                        <TableCell className="pr-5 text-right text-xs text-slate-400">{formatDate(order.created_at)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center py-12 text-center">
                <ReceiptText className="h-8 w-8 text-slate-300" />
                <p className="mt-3 text-sm text-slate-500">Aucune commande pour ce client.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
