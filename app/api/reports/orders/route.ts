import { requireCompanyAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ORDER_STATUS_META, type OrderStatus } from "@/lib/constants";

function csvCell(value: unknown) {
  const text = String(value ?? "");
  return /[",;\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export async function GET() {
  const ctx = await requireCompanyAdmin();
  const supabase = await createClient();

  const { data: orders } = await supabase
    .from("orders")
    .select("reference, created_at, status, item_count, total_centimes, notes, customer_accounts(company_name, email)")
    .eq("company_id", ctx.company.id)
    .order("created_at", { ascending: false });

  const header = ["reference", "date", "client", "email", "statut", "articles", "total_mad", "notes"];
  const lines = [header.join(",")];

  for (const order of orders ?? []) {
    const customer = Array.isArray(order.customer_accounts)
      ? order.customer_accounts[0]
      : order.customer_accounts;
    lines.push(
      [
        order.reference,
        new Date(order.created_at).toISOString(),
        customer?.company_name ?? "",
        customer?.email ?? "",
        ORDER_STATUS_META[order.status as OrderStatus]?.label ?? order.status,
        order.item_count,
        (Number(order.total_centimes) / 100).toFixed(2),
        order.notes ?? "",
      ]
        .map(csvCell)
        .join(",")
    );
  }

  return new Response(`\uFEFF${lines.join("\r\n")}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="distribpro-commandes-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
