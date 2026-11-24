import { PageHeader } from "@/components/dashboard/page-header";
import { OrdersTable, type OrderRow } from "@/components/dashboard/orders-table";
import { requireCompanyAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { OrderStatus } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const ctx = await requireCompanyAdmin();
  const supabase = await createClient();

  const { data: orders } = await supabase
    .from("orders")
    .select("*, customer_accounts(company_name, contact_name)")
    .eq("company_id", ctx.company.id)
    .order("created_at", { ascending: false });

  const rows: OrderRow[] = (orders ?? []).map((order) => {
    const customer = Array.isArray(order.customer_accounts) ? order.customer_accounts[0] : order.customer_accounts;
    return {
      id: order.id,
      reference: order.reference,
      status: order.status as OrderStatus,
      customerName: customer?.company_name ?? "Client",
      contactName: customer?.contact_name ?? null,
      totalCentimes: Number(order.total_centimes),
      itemCount: order.item_count,
      createdAt: order.created_at,
      notes: order.notes,
    };
  });

  const pending = rows.filter((order) => order.status === "pending").length;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Commandes"
        description={
          pending > 0
            ? `${pending} commande(s) en attente de traitement.`
            : "Toutes vos commandes clients, de la réception à la livraison."
        }
      />
      <OrdersTable orders={rows} />
    </div>
  );
}
