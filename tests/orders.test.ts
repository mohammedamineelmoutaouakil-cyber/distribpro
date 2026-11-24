import { describe, expect, it } from "vitest";
import { orderShareMessage } from "@/lib/orders";
import type { OrderWithRelations } from "@/lib/types";

describe("orders", () => {
  it("builds a WhatsApp-friendly order summary", () => {
    const order: OrderWithRelations = {
      id: "1",
      company_id: "2",
      customer_id: "3",
      reference: "DP-TEST-001",
      status: "pending",
      notes: null,
      item_count: 1,
      total_centimes: 34900,
      created_at: "2026-01-01T10:00:00.000Z",
      updated_at: "2026-01-01T10:00:00.000Z",
      customer_accounts: null,
      order_items: [
        {
          id: "4",
          order_id: "1",
          company_id: "2",
          product_id: "5",
          product_name: "Mitigeur lavabo chromé",
          sku: "MIT-LAV-001",
          quantity: 1,
          unit_price_centimes: 34900,
          line_total_centimes: 34900,
        },
      ],
    };

    const message = orderShareMessage(order, "Atlas Distribution");
    expect(message).toContain("*Commande DP-TEST-001*");
    expect(message).toContain("Atlas Distribution");
    expect(message).toContain("Mitigeur lavabo chromé × 1 = ");
  });
});
