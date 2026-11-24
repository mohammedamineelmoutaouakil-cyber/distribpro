import Link from "next/link";
import { ArrowRight, PackageCheck, ReceiptText, ShoppingBag, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireCustomer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ORDER_STATUSES, ORDER_STATUS_META, type OrderStatus } from "@/lib/constants";
import { formatMAD } from "@/lib/money";
import { formatDate, cn } from "@/lib/utils";
import type { Order } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PortalOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const ctx = await requireCustomer();
  const supabase = await createClient();

  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .eq("company_id", ctx.company.id)
    .eq("customer_id", ctx.customer.id)
    .order("created_at", { ascending: false })
    .limit(200);

  const allOrders = (orders ?? []) as Order[];
  const statusFilter = params.status && ORDER_STATUSES.includes(params.status as OrderStatus)
    ? (params.status as OrderStatus)
    : null;
  const filtered = statusFilter ? allOrders.filter((order) => order.status === statusFilter) : allOrders;

  const totalSpent = allOrders
    .filter((order) => order.status !== "cancelled")
    .reduce((sum, order) => sum + Number(order.total_centimes), 0);
  const activeOrders = allOrders.filter((order) =>
    ["pending", "confirmed", "preparing", "ready"].includes(order.status)
  ).length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-brand">Historique</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-navy">Mes commandes</h1>
          <p className="mt-1 text-sm text-slate-500">
            Suivez l'état de vos commandes et retrouvez vos montants confirmés.
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/portal/catalog">
            Nouvelle commande <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wide text-slate-400">Commandes</p>
            <ReceiptText className="h-4 w-4 text-slate-300" />
          </div>
          <p className="mt-2 text-2xl font-semibold text-navy">{allOrders.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wide text-slate-400">En cours</p>
            <PackageCheck className="h-4 w-4 text-slate-300" />
          </div>
          <p className="mt-2 text-2xl font-semibold text-navy">{activeOrders}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wide text-slate-400">Total commandé</p>
            <Wallet className="h-4 w-4 text-slate-300" />
          </div>
          <p className="mt-2 text-2xl font-semibold text-navy">{formatMAD(totalSpent)}</p>
        </div>
      </div>

      <div className="mt-6 flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        <Link
          href="/portal/orders"
          className={cn(
            "whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-medium transition",
            !statusFilter
              ? "border-navy bg-navy text-white"
              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
          )}
        >
          Toutes
        </Link>
        {ORDER_STATUSES.map((status) => (
          <Link
            key={status}
            href={`/portal/orders?status=${status}`}
            className={cn(
              "whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-medium transition",
              statusFilter === status
                ? "border-navy bg-navy text-white"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
            )}
          >
            {ORDER_STATUS_META[status].label}
          </Link>
        ))}
      </div>

      {filtered.length > 0 ? (
        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-soft">
          {filtered.map((order) => {
            const meta = ORDER_STATUS_META[order.status];
            return (
              <Link
                key={order.id}
                href={`/portal/orders/${order.id}`}
                className="flex flex-col gap-3 border-b border-slate-100 p-4 transition last:border-b-0 hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                    <ShoppingBag className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="font-medium text-navy">{order.reference}</p>
                    <p className="text-[11px] text-slate-400">
                      {formatDate(order.created_at, true)} · {order.item_count} article(s)
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-4 sm:justify-end">
                  <Badge className={meta.className}>{meta.label}</Badge>
                  <div className="text-right">
                    <p className="font-semibold text-navy">{formatMAD(order.total_centimes)}</p>
                    <p className="text-[11px] text-slate-400">Total confirmé</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-300" />
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-white py-16 text-center">
          <ShoppingBag className="mx-auto h-9 w-9 text-slate-300" />
          <p className="mt-3 text-sm font-medium text-navy">
            {statusFilter ? "Aucune commande avec ce statut" : "Vous n'avez pas encore commandé"}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {statusFilter
              ? "Essayez un autre filtre ou consultez toutes vos commandes."
              : "Parcourez le catalogue et envoyez votre première commande."}
          </p>
          <Button asChild size="sm" className="mt-4">
            <Link href="/portal/catalog">Voir le catalogue</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
