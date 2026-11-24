"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCustomerContext } from "@/lib/auth";
import { checkoutSchema } from "@/lib/validations";
import { getCustomerPriceMap, priceForProduct } from "@/lib/catalog";
import { getSignedUrls, PRODUCT_BUCKET } from "@/lib/storage";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";
import type { ProductWithCategory } from "@/lib/types";
import type { PriceSource } from "@/lib/pricing";

export interface CartDetailLine {
  productId: string;
  name: string;
  sku: string;
  quantity: number;
  minOrderQty: number;
  unitPriceCentimes: number;
  lineTotalCentimes: number;
  priceSource: PriceSource;
  imageUrl: string | null;
  isActive: boolean;
}

export interface CartDetailsResult {
  lines?: CartDetailLine[];
  subtotalCentimes?: number;
  error?: string;
}

export async function getCartDetails(
  items: { productId: string; quantity: number }[]
): Promise<CartDetailsResult> {
  const ctx = await getCustomerContext();
  if (!ctx) return { error: "Session expirée. Reconnectez-vous." };
  if (!ctx.canOrder) return { error: ctx.accessIssue ?? "Compte non actif." };

  const clean = (Array.isArray(items) ? items : [])
    .filter(
      (item) =>
        item &&
        typeof item.productId === "string" &&
        Number.isInteger(item.quantity) &&
        item.quantity > 0 &&
        item.quantity <= 100000
    )
    .slice(0, 100);

  if (clean.length === 0) return { lines: [], subtotalCentimes: 0 };

  const supabase = await createClient();
  const ids = clean.map((item) => item.productId);
  const { data: products } = await supabase
    .from("products")
    .select("*, categories(id, name)")
    .eq("company_id", ctx.company.id)
    .in("id", ids);

  const priceMap = await getCustomerPriceMap(
    supabase,
    ctx.company.id,
    ctx.customer.id,
    ctx.customer.group_id
  );
  const signed = await getSignedUrls(
    supabase,
    PRODUCT_BUCKET,
    (products ?? []).map((product) => product.image_path)
  );

  const productMap = new Map<string, ProductWithCategory>(
    ((products ?? []) as ProductWithCategory[]).map((product) => [product.id, product])
  );

  const lines: CartDetailLine[] = [];
  for (const item of clean) {
    const product = productMap.get(item.productId);
    if (!product || !product.is_active) continue;
    const price = priceForProduct(Number(product.base_price_centimes), priceMap.get(product.id));
    lines.push({
      productId: product.id,
      name: product.name,
      sku: product.sku,
      quantity: item.quantity,
      minOrderQty: product.min_order_qty,
      unitPriceCentimes: price.unitPriceCentimes,
      lineTotalCentimes: price.unitPriceCentimes * item.quantity,
      priceSource: price.source,
      imageUrl: product.image_path ? signed.get(product.image_path) ?? null : null,
      isActive: product.is_active,
    });
  }

  return {
    lines,
    subtotalCentimes: lines.reduce((sum, line) => sum + line.lineTotalCentimes, 0),
  };
}

function mapOrderError(message: string) {
  if (message.includes("CUSTOMER_NOT_ACTIVE"))
    return "Votre compte n'est pas encore activé par votre fournisseur.";
  if (message.includes("COMPANY_NOT_OPERATIONAL"))
    return "La boutique de votre fournisseur est temporairement indisponible.";
  if (message.includes("PRODUCT_NOT_FOUND")) return "Un produit de votre panier n'est plus disponible.";
  if (message.includes("PRODUCT_INACTIVE")) {
    const name = message.split(":")[1];
    return `Le produit ${name ?? ""} n'est plus disponible. Retirez-le de votre panier.`;
  }
  if (message.includes("MIN_ORDER_QTY")) {
    const [, name, qty] = message.split(":");
    return `Quantité minimum non atteinte pour ${name ?? "un produit"} (${qty ?? "?"} unités).`;
  }
  if (message.includes("EMPTY_ORDER")) return "Votre panier est vide.";
  if (message.includes("INVALID_QUANTITY")) return "Une quantité est invalide.";
  if (message.includes("TOO_MANY_ITEMS")) return "Trop d'articles dans la commande.";
  return "Impossible de créer la commande. Réessayez.";
}

export async function submitOrder(input: {
  items: { productId: string; quantity: number }[];
  notes?: string;
}): Promise<{ error?: string; orderId?: string; reference?: string }> {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Panier invalide." };

  const ctx = await getCustomerContext();
  if (!ctx) return { error: "Session expirée. Reconnectez-vous." };
  if (!ctx.canOrder) return { error: ctx.accessIssue ?? "Compte non actif." };

  const limit = rateLimit(rateLimitKey("order", ctx.customer.id), 20, 60 * 60_000);
  if (!limit.success) {
    return { error: "Trop de commandes envoyées. Réessayez dans quelques minutes." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_order", {
    p_company_id: ctx.company.id,
    p_items: parsed.data.items.map((item) => ({
      product_id: item.productId,
      quantity: item.quantity,
    })),
    p_notes: parsed.data.notes ?? null,
  });

  if (error) return { error: mapOrderError(error.message) };

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return { error: "Commande non confirmée par le serveur." };

  revalidatePath("/portal/orders");
  revalidatePath("/portal");
  revalidatePath("/dashboard/orders");
  revalidatePath("/dashboard");

  return {
    orderId: row.created_order_id as string,
    reference: row.order_reference as string,
  };
}
