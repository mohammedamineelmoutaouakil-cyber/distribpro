import type { SupabaseClient } from "@supabase/supabase-js";
import { resolvePrice, type PriceSource } from "@/lib/pricing";

export interface EffectivePrice {
  unitPriceCentimes: number;
  source: PriceSource;
}

/**
 * Load the effective prices for a customer: individual overrides take priority
 * over group prices, then the product base price. All values come from the
 * database and are filtered by RLS for the current user.
 */
export async function getCustomerPriceMap(
  supabase: SupabaseClient,
  companyId: string,
  customerId: string,
  groupId: string | null
): Promise<Map<string, EffectivePrice>> {
  const map = new Map<string, EffectivePrice>();

  if (groupId) {
    const { data: groupPrices } = await supabase
      .from("customer_group_prices")
      .select("product_id, price_centimes")
      .eq("company_id", companyId)
      .eq("group_id", groupId);
    for (const row of groupPrices ?? []) {
      map.set(row.product_id, { unitPriceCentimes: row.price_centimes, source: "group" });
    }
  }

  const { data: customerPrices } = await supabase
    .from("customer_specific_prices")
    .select("product_id, price_centimes")
    .eq("company_id", companyId)
    .eq("customer_id", customerId);
  for (const row of customerPrices ?? []) {
    map.set(row.product_id, { unitPriceCentimes: row.price_centimes, source: "customer" });
  }

  return map;
}

export function priceForProduct(
  basePriceCentimes: number,
  override: EffectivePrice | undefined
): EffectivePrice {
  if (!override) return { unitPriceCentimes: basePriceCentimes, source: "base" };
  return resolvePrice({
    basePriceCentimes,
    groupPriceCentimes: override.source === "group" ? override.unitPriceCentimes : null,
    customerPriceCentimes: override.source === "customer" ? override.unitPriceCentimes : null,
  });
}
