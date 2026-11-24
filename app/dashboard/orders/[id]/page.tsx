import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, MessageCircle, Phone, ReceiptText, StickyNote, UserRound } from "lucide-react";
import { Breadcrumbs, PageHeader } from "@/components/dashboard/page-header";
import { OrderShareButton } from "@/components/dashboard/order-share-button";
import { OrderStatusSelect } from "@/components/dashboard/order-status-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireCompanyAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ORDER_STATUSES, ORDER_STATUS_META, type OrderStatus } from "@/lib/constants";
import { formatMAD } from "@/lib/money";
import { orderShareMessage } from "@/lib/orders";
import { formatDate, whatsappLink } from "@/lib/utils";
import type { CustomerAccount, OrderItem } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireCompanyAdmin();
  const supabase = await createClient();

  const { data: order } = await supabase
    .from("orders")
    .select("*, customer_accounts(*)")
    .eq("id", id)
    .eq("company_id", ctx.company.id)
    .maybeSingle();

  if (!order) notFound();

  const { data: items } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", order.id)
    .eq("company_id", ctx.company.id);

  const customer = (Array.isArray(order.customer_accounts)
    ? order.customer_accounts[0]
    : order.customer_accounts) as CustomerAccount | null;
  const meta = ORDER_STATUS_META[order.status as OrderStatus];
  const shareMessage = orderShareMessage(
    { ...order, order_items: (items ?? []) as OrderItem[] },
    ctx.company.name
  );

  return (
    <div className="animate-fade-in">
      <Breadcrumbs items={[{ label: "Commandes", href: "/dashboard/orders" }, { label: order.reference }]} />
      <PageHeader title={`Commande ${order.reference}`} description={`Reçue le ${formatDate(order.created_at, true)}`}>
        <OrderShareButton phone={customer?.phone ?? null} message={shareMessage} />
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard/orders"><ArrowLeft className="h-4 w-4" /> Retour</Link>
        </Button>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Articles commandés</CardTitle>
              <Badge className={meta.className}>{meta.label}</Badge>
            </CardHeader>
            <CardContent className="p-0">
              {items && items.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-5">Produit</TableHead>
                      <TableHead className="text-right">Qté</TableHead>
                      <TableHead className="text-right">Prix unitaire</TableHead>
                      <TableHead className="pr-5 text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(items as OrderItem[]).map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="pl-5">
                          <p className="font-medium text-navy">{item.product_name}</p>
                          <p className="font-mono text-[11px] text-slate-400">{item.sku}</p>
                        </TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right text-slate-500">{formatMAD(item.unit_price_centimes)}</TableCell>
                        <TableCell className="pr-5 text-right font-medium text-navy">{formatMAD(item.line_total_centimes)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={3} className="pl-5">Total de la commande</TableCell>
                      <TableCell className="pr-5 text-right text-base font-semibold text-navy">
                        {formatMAD(order.total_centimes)}
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              ) : (
                <div className="py-10 text-center text-sm text-slate-400">Aucun article.</div>
              )}
            </CardContent>
          </Card>

          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <StickyNote className="h-4 w-4 text-slate-400" /> Note du client
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line rounded-lg bg-slate-50 p-4 text-sm text-slate-600">{order.notes}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Mettre à jour le statut</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-3">
                <OrderStatusSelect orderId={order.id} status={order.status as OrderStatus} />
                <p className="text-xs text-slate-500">{meta.description}</p>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {ORDER_STATUSES.map((status) => (
                  <span
                    key={status}
                    className={`rounded-full border px-2.5 py-1 text-[11px] ${
                      status === order.status
                        ? ORDER_STATUS_META[status].className
                        : "border-slate-200 text-slate-400"
                    }`}
                  >
                    {ORDER_STATUS_META[status].label}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Client</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <UserRound className="mt-0.5 h-4 w-4 text-slate-400" />
                <div>
                  <p className="font-medium text-navy">{customer?.company_name ?? "—"}</p>
                  <p className="text-xs text-slate-400">{customer?.contact_name ?? "Contact non renseigné"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 text-slate-400" />
                <p className="break-all text-navy">{customer?.email ?? "—"}</p>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 text-slate-400" />
                <p className="text-navy">{customer?.phone ?? "—"}</p>
              </div>
              {customer?.phone && (
                <Button asChild variant="outline" size="sm" className="w-full">
                  <a
                    href={whatsappLink(customer.phone, `Bonjour ${customer.contact_name ?? ""}, concernant votre commande ${order.reference} :`)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="h-4 w-4 text-emerald-600" /> Contacter le client
                  </a>
                </Button>
              )}
              {customer?.id && (
                <Button asChild variant="ghost" size="sm" className="w-full">
                  <Link href={`/dashboard/customers/${customer.id}`}>Voir la fiche client</Link>
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Récapitulatif</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Référence</span>
                <span className="font-mono text-xs text-navy">{order.reference}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Date</span>
                <span className="text-navy">{formatDate(order.created_at)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Articles</span>
                <span className="text-navy">{order.item_count}</span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                <span className="text-slate-400">Total</span>
                <span className="font-semibold text-navy">{formatMAD(order.total_centimes)}</span>
              </div>
            </CardContent>
          </Card>

          <div className="rounded-xl border border-dashed border-slate-200 p-4 text-xs text-slate-400">
            <ReceiptText className="mb-2 h-4 w-4" />
            Les prix sont figés au moment de la commande. Toute modification tarifaire ultérieure
            n'affecte pas cet historique.
          </div>
        </div>
      </div>
    </div>
  );
}
