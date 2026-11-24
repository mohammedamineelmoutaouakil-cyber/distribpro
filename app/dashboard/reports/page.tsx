import Link from "next/link";
import { Download, Package, ShoppingCart, TrendingUp, Users, Wallet } from "lucide-react";
import { format, startOfMonth, subMonths } from "date-fns";
import { fr } from "date-fns/locale";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { MonthlyOrdersChart, StatusPieChart } from "@/components/dashboard/overview-charts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireCompanyAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/constants";
import { formatMAD } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const ctx = await requireCompanyAdmin();
  const supabase = await createClient();

  const [{ data: orders }, { data: items }, { count: customerCount }] = await Promise.all([
    supabase
      .from("orders")
      .select("id, status, total_centimes, created_at, customer_id")
      .eq("company_id", ctx.company.id)
      .order("created_at", { ascending: false })
      .limit(5000),
    supabase
      .from("order_items")
      .select("product_name, quantity, line_total_centimes")
      .eq("company_id", ctx.company.id)
      .limit(10000),
    supabase
      .from("customer_accounts")
      .select("id", { count: "exact", head: true })
      .eq("company_id", ctx.company.id)
      .eq("status", "active"),
  ]);

  const allOrders = orders ?? [];
  const validOrders = allOrders.filter((order) => order.status !== "cancelled");
  const revenue = validOrders.reduce((sum, order) => sum + Number(order.total_centimes), 0);
  const averageBasket = validOrders.length > 0 ? Math.round(revenue / validOrders.length) : 0;
  const uniqueCustomers = new Set(allOrders.map((order) => order.customer_id)).size;

  const months = Array.from({ length: 6 }, (_, index) => {
    const date = startOfMonth(subMonths(new Date(), 5 - index));
    const key = format(date, "yyyy-MM");
    const monthOrders = allOrders.filter((order) => format(new Date(order.created_at), "yyyy-MM") === key);
    return {
      month: format(date, "MMM", { locale: fr }),
      value: monthOrders
        .filter((order) => order.status !== "cancelled")
        .reduce((sum, order) => sum + Number(order.total_centimes), 0),
      count: monthOrders.length,
    };
  });

  const statusData = ORDER_STATUSES.map((status) => ({
    status,
    count: allOrders.filter((order) => order.status === status).length,
  })).filter((item) => item.count > 0);

  const topMap = new Map<string, { quantity: number; value: number }>();
  for (const item of items ?? []) {
    const current = topMap.get(item.product_name) ?? { quantity: 0, value: 0 };
    topMap.set(item.product_name, {
      quantity: current.quantity + item.quantity,
      value: current.value + Number(item.line_total_centimes),
    });
  }
  const topProducts = Array.from(topMap.entries())
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  return (
    <div className="animate-fade-in">
      <PageHeader title="Rapports" description="Analysez les ventes, les produits et le comportement de vos clients.">
        <Button asChild variant="outline" size="sm">
          <a href="/api/reports/orders.csv" download>
            <Download className="h-4 w-4" /> Exporter les commandes
          </a>
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Chiffre d'affaires" value={formatMAD(revenue)} hint="hors commandes annulées" icon={Wallet} accent="teal" />
        <StatCard label="Panier moyen" value={formatMAD(averageBasket)} hint={`${validOrders.length} commandes`} icon={TrendingUp} accent="brand" />
        <StatCard label="Clients actifs" value={customerCount ?? 0} hint="comptes validés" icon={Users} accent="navy" />
        <StatCard label="Clients acheteurs" value={uniqueCustomers} hint="ayant commandé" icon={ShoppingCart} accent="amber" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Évolution du chiffre d'affaires</CardTitle>
          </CardHeader>
          <CardContent>
            <MonthlyOrdersChart data={months} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Statuts des commandes</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusPieChart data={statusData} />
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top produits par chiffre d'affaires</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {topProducts.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-5">Produit</TableHead>
                    <TableHead className="text-right">Quantité</TableHead>
                    <TableHead className="pr-5 text-right">Valeur</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topProducts.map((product, index) => (
                    <TableRow key={product.name}>
                      <TableCell className="pl-5">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-400">{index + 1}</span>
                          <span className="max-w-[260px] truncate font-medium text-navy">{product.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-sm">{product.quantity}</TableCell>
                      <TableCell className="pr-5 text-right font-medium text-navy">{formatMAD(product.value)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-12 text-center">
                <Package className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-2 text-sm text-slate-400">Pas encore de données de commandes.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Performance mensuelle</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {months.map((month) => {
                const max = Math.max(...months.map((m) => m.value), 1);
                return (
                  <div key={month.month}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="capitalize text-slate-500">{month.month}</span>
                      <span className="font-medium text-navy">{formatMAD(month.value)}</span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-brand"
                        style={{ width: `${Math.round((month.value / max) * 100)}%` }}
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400">{month.count} commande(s)</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <p className="mt-6 text-xs text-slate-400">
        Les rapports sont calculés à partir de vos commandes réelles. Les commandes annulées sont exclues
        du chiffre d'affaires.{" "}
        <Link href="/dashboard/orders" className="text-brand hover:underline">Voir les commandes</Link>
      </p>
    </div>
  );
}
