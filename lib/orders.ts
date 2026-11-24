import type { OrderWithRelations } from "@/lib/types";
import { formatMAD } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { ORDER_STATUS_META } from "@/lib/constants";

export function orderShareMessage(order: OrderWithRelations, companyName: string) {
  const lines = [
    `*Commande ${order.reference}*`,
    `Fournisseur : ${companyName}`,
    `Date : ${formatDate(order.created_at)}`,
    `Montant : ${formatMAD(order.total_centimes)}`,
    "",
    ...(order.order_items ?? []).map(
      (item) =>
        `• ${item.product_name} × ${item.quantity} = ${formatMAD(item.line_total_centimes)}`
    ),
    "",
    `Statut : ${ORDER_STATUS_META[order.status]?.label ?? order.status}`,
  ];
  return lines.join("\n");
}

export function orderReferencePreview() {
  return "DP-260101-ABC123";
}
