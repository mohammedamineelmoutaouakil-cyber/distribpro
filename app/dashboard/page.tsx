import Link from "next/link";
import {
  ArrowRight,
  Clock3,
  Package,
  Plus,
  ShoppingCart,
  Users,
  Wallet,
} from "lucide-react";
import { format, startOfMonth, subMonths } from "date-fns";
import { fr } from "date-fns/locale";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { MonthlyOrdersChart, StatusPieChart } from "@/components/dashboard/overview-charts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireCompanyAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatMAD } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { ORDER_STATUSES, ORDER_STATUS_META, type OrderStatus } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function DashboardOverviewPage() {
  const ctx = await requireCompanyAdmin();
  const supabase = await createClient();

  const [
    { count: productCount },
    { count: customerCount },
    { data: orders },
    { data: recentOrders },
    { data: orderItems },
  ] = await Promise.all([
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("company_id", ctx.company.id)
      .eq("is_active", true),
    supabase
      .from("customer_accounts")
      .select("id", { count: "exact", head: true })
      .eq("company_id", ctx.company.id)
      .eq("status", "active"),
    supabase
      .from("orders")
      .select("id, total_centimes, status, created_at")
      .eq("company_id", ctx.company.id)
      .order("created_at", { ascending: false })
      .limit(5000),
    supabase
      .from("orders")
      .select("id, reference, status, total_centimes, created_at, item_count, customer_accounts(company_name, contact_name)")
      .eq("company_id", ctx.company.id)
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("order_items")
      .select("product_name, quantity, line_total_centimes")
      .eq("company_id", ctx.company.id)
      .limit(5000),
  ]);

  const allOrders = orders ?? [];
  const orderCount = allOrders.length;
  const pendingCount = allOrders.filter((o) => o.status === "pending").length;
  const confirmedValue = allOrders
    .filter((o) => ["confirmed", "preparing", "ready", "completed"].includes(o.status))
    .reduce((sum, o) => sum + Number(o.total_centimes), 0);

  const months = Array.from({ length: 6 }, (_, index) => {
    const date = startOfMonth(subMonths(new Date(), 5 - index));
    const key = format(date, "yyyy-MM");
    const monthOrders = allOrders.filter((o) => format(new Date(o.created_at), "yyyy-MM") === key);
    return {
      month: format(date, "MMM", { locale: fr }),
      value: monthOrders
        .filter((o) => o.status !== "cancelled")
        .reduce((sum, o) => sum + Number(o.total_centimes), 0),
      count: monthOrders.length,
    };
  });

  const statusData = ORDER_STATUSES.map((status) => ({
    status,
    count: allOrders.filter((o) => o.status === status).length,
  })).filter((item) => item.count > 0);

  const topMap = new Map<string, { quantity: number; value: number }>();
  for (const item of orderItems ?? []) {
    const current = topMap.get(item.product_name) ?? { quantity: 0, value: 0 };
    topMap.set(item.product_name, {
      quantity: current.quantity + item.quantity,
      value: current.value + Number(item.line_total_centimes),
    });
  }
  const topProducts = Array.from(topMap.entries())
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={`Bonjour, ${(ctx.user.user_metadata?.full_name as string | undefined)?.split(" ")[0] ?? "bienvenue"}`}
        description="Voici l'activité de votre entreprise aujourd'hui."
      >
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard/customers"><Users className="h-4 w-4" /> Ajouter un client</Link>
        </Button>
        <Button asChild size="sm">
          <Link href="/dashboard/products"><Plus className="h-4 w-4" /> Nouveau produit</Link>
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Produits actifs" value={productCount ?? 0} hint={`sur ${ctx.plan.maxProducts} du plan`} icon={Package} accent="brand" />
        <StatCard label="Clients B2B actifs" value={customerCount ?? 0} hint={`sur ${ctx.plan.maxCustomers} du plan`} icon={Users} accent="teal" />
        <StatCard label="Commandes reçues" value={orderCount} hint="toutes périodes" icon={ShoppingCart} accent="navy" />
        <StatCard label="En attente" value={pendingCount} hint="à traiter" icon={Clock3} accent="amber" />
        <StatCard label="Valeur confirmée" value={formatMAD(confirmedValue)} hint="commandes validées" icon={Wallet} accent="teal" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">Valeur des commandes</CardTitle>
              <p className="mt-1 text-xs text-slate-400">6 derniers mois, hors commandes annulées</p>
            </div>
            <Link href="/dashboard/reports" className="text-xs font-medium text-brand hover:underline">
              Voir les rapports
            </Link>
          </CardHeader>
          <CardContent>
            <MonthlyOrdersChart data={months} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Répartition des statuts</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusPieChart data={statusData} />
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Commandes récentes</CardTitle>
            <Link href="/dashboard/orders" className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline">
              Toutes les commandes <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {recentOrders && recentOrders.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-5">Référence</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead className="pr-5 text-right">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentOrders.map((order) => {
                    const meta = ORDER_STATUS_META[order.status as OrderStatus];
                    const customer = Array.isArray(order.customer_accounts)
                      ? order.customer_accounts[0]
                      : order.customer_accounts;
                    return (
                      <TableRow key={order.id}>
                        <TableCell className="pl-5">
                          <Link href={`/dashboard/orders/${order.id}`} className="font-medium text-navy hover:text-brand">
                            {order.reference}
                          </Link>
                          <p className="text-[11px] text-slate-400">{order.item_count} article{order.item_count > 1 ? "s" : ""}</p>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium text-navy">{customer?.company_name ?? "—"}</p>
                          <p className="text-[11px] text-slate-400">{customer?.contact_name ?? ""}</p>
                        </TableCell>
                        <TableCell>
                          <Badge className={meta.className}>{meta.label}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium text-navy">{formatMAD(order.total_centimes)}</TableCell>
                        <TableCell className="pr-5 text-right text-xs text-slate-400">{formatDate(order.created_at)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
                <ShoppingCart className="h-8 w-8 text-slate-300" />
                <p className="mt-3 text-sm font-medium text-navy">Aucune commande reçue</p>
                <p className="mt-1 text-xs text-slate-400">
                  Invitez vos clients professionnels pour recevoir vos premières commandes.
                </p>
                <Button asChild size="sm" className="mt-4">
                  <Link href="/dashboard/customers">Inviter un client</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Produits les plus commandés</CardTitle>
          </CardHeader>
          <CardContent>
            {topProducts.length > 0 ? (
              <ol className="space-y-3">
                {topProducts.map((product, index) => (
                  <li key={product.name} className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-100 text-[11px] font-semibold text-slate-500">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-navy">{product.name}</p>
                      <p className="text-[11px] text-slate-400">
                        {product.quantity} unités · {formatMAD(product.value)}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                Les produits commandés apparaîtront ici.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
