import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock3,
  MessageCircle,
  PackageCheck,
  ReceiptText,
  StickyNote,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OrderShareButton } from "@/components/dashboard/order-share-button";
import { requireCustomer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ORDER_STATUS_META, type OrderStatus } from "@/lib/constants";
import { formatMAD } from "@/lib/money";
import { orderShareMessage } from "@/lib/orders";
import { formatDate, whatsappLink } from "@/lib/utils";
import type { Order, OrderItem } from "@/lib/types";

export const dynamic = "force-dynamic";

const FLOW: OrderStatus[] = ["pending", "confirmed", "preparing", "ready", "completed"];

export default async function PortalOrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const ctx = await requireCustomer();
  const supabase = await createClient();

  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .eq("company_id", ctx.company.id)
    .eq("customer_id", ctx.customer.id)
    .maybeSingle();

  if (!order) notFound();

  const typedOrder = order as Order;
  const { data: items } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", typedOrder.id)
    .eq("company_id", ctx.company.id)
    .order("created_at", { ascending: true });

  const orderItems = (items ?? []) as OrderItem[];
  const meta = ORDER_STATUS_META[typedOrder.status];
  const currentIndex = FLOW.indexOf(typedOrder.status);
  const shareMessage = orderShareMessage({ ...typedOrder, order_items: orderItems }, ctx.company.name);
  const whatsappUrl = ctx.company.whatsapp
    ? whatsappLink(ctx.company.whatsapp, shareMessage)
    : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Link
        href="/portal/orders"
        className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-brand"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Mes commandes
      </Link>

      {query.created === "1" && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Votre commande a bien été envoyée à {ctx.company.name}. Vous recevrez une confirmation
            prochainement.
          </span>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-navy">{typedOrder.reference}</h1>
            <Badge className={meta.className}>{meta.label}</Badge>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Commandée le {formatDate(typedOrder.created_at, true)} · {typedOrder.item_count} article(s)
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <OrderShareButton phone={ctx.company.whatsapp} message={shareMessage} label="Partager" />
          {whatsappUrl && (
            <Button asChild variant="ghost" size="sm">
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4 text-emerald-600" /> Contacter
              </a>
            </Button>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft">
            <h2 className="text-base font-semibold text-navy">Articles</h2>
            <div className="mt-4 divide-y divide-slate-100">
              {orderItems.map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-navy">{item.product_name}</p>
                    <p className="font-mono text-[11px] text-slate-400">{item.sku ?? "—"}</p>
                    <p className="mt-1 text-[11px] text-slate-400">
                      {item.quantity} × {formatMAD(item.unit_price_centimes)}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-navy">
                    {formatMAD(item.line_total_centimes)}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
              <span className="text-sm font-medium text-navy">Total de la commande</span>
              <span className="text-xl font-semibold text-navy">{formatMAD(typedOrder.total_centimes)}</span>
            </div>
            <p className="mt-2 text-[11px] text-slate-400">
              Montant HT confirmé par le fournisseur au moment de la commande. Les prix sont figés dans
              cet historique.
            </p>
          </div>

          {typedOrder.notes && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft">
              <h2 className="flex items-center gap-2 text-base font-semibold text-navy">
                <StickyNote className="h-4 w-4 text-slate-400" /> Votre note
              </h2>
              <p className="mt-2 whitespace-pre-line rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                {typedOrder.notes}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft">
            <h2 className="flex items-center gap-2 text-base font-semibold text-navy">
              <Clock3 className="h-4 w-4 text-slate-400" /> Suivi
            </h2>

            {typedOrder.status === "cancelled" ? (
              <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                Cette commande a été annulée. Contactez votre fournisseur pour plus d'informations.
              </div>
            ) : (
              <ol className="mt-4 space-y-3">
                {FLOW.map((status, index) => {
                  const done = index <= currentIndex;
                  const active = index === currentIndex;
                  return (
                    <li key={status} className="flex gap-3">
                      <span className="mt-0.5">
                        {done ? (
                          <CheckCircle2 className={active ? "h-4 w-4 text-brand" : "h-4 w-4 text-emerald-500"} />
                        ) : (
                          <Circle className="h-4 w-4 text-slate-300" />
                        )}
                      </span>
                      <div>
                        <p className={active ? "text-sm font-medium text-navy" : "text-sm text-slate-500"}>
                          {ORDER_STATUS_META[status].label}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {ORDER_STATUS_META[status].description}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft">
            <h2 className="text-base font-semibold text-navy">Fournisseur</h2>
            <p className="mt-2 text-sm font-medium text-navy">{ctx.company.name}</p>
            {ctx.company.city && <p className="text-xs text-slate-500">{ctx.company.city}</p>}
            {ctx.company.phone && <p className="mt-1 text-xs text-slate-500">{ctx.company.phone}</p>}
            {whatsappUrl && (
              <Button asChild variant="outline" size="sm" className="mt-3 w-full">
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="h-4 w-4 text-emerald-600" /> WhatsApp
                </a>
              </Button>
            )}
          </div>

          <div className="rounded-xl border border-dashed border-slate-200 p-4 text-xs text-slate-400">
            <ReceiptText className="mb-2 h-4 w-4" />
            Besoin d'ajuster cette commande ? Contactez votre fournisseur en indiquant la référence{" "}
            <span className="font-mono text-slate-500">{typedOrder.reference}</span>.
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Button asChild variant="outline">
          <Link href="/portal/orders"><ArrowLeft className="h-4 w-4" /> Toutes mes commandes</Link>
        </Button>
        <Button asChild>
          <Link href="/portal/catalog"><PackageCheck className="h-4 w-4" /> Commander à nouveau</Link>
        </Button>
      </div>
    </div>
  );
}
