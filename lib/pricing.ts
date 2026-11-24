/**
 * Pricing resolution — pure and deterministic.
 * Priority: individual customer price > customer group price > base price.
 * The database function `public.create_order` implements the same priority
 * authoritatively; this module is used for display and unit tests.
 */
export interface PriceSources {
  basePriceCentimes: number;
  groupPriceCentimes?: number | null;
  customerPriceCentimes?: number | null;
}

export type PriceSource = "customer" | "group" | "base";

export function resolvePrice(sources: PriceSources): {
  unitPriceCentimes: number;
  source: PriceSource;
} {
  if (
    typeof sources.customerPriceCentimes === "number" &&
    Number.isSafeInteger(sources.customerPriceCentimes) &&
    sources.customerPriceCentimes >= 0
  ) {
    return { unitPriceCentimes: sources.customerPriceCentimes, source: "customer" };
  }
  if (
    typeof sources.groupPriceCentimes === "number" &&
    Number.isSafeInteger(sources.groupPriceCentimes) &&
    sources.groupPriceCentimes >= 0
  ) {
    return { unitPriceCentimes: sources.groupPriceCentimes, source: "group" };
  }
  return { unitPriceCentimes: sources.basePriceCentimes, source: "base" };
}

export function calculateLine(unitPriceCentimes: number, quantity: number) {
  if (!Number.isSafeInteger(unitPriceCentimes) || unitPriceCentimes < 0) {
    throw new Error("Prix unitaire invalide");
  }
  if (!Number.isSafeInteger(quantity) || quantity < 1) {
    throw new Error("Quantité invalide");
  }
  return unitPriceCentimes * quantity;
}

export function calculateCartTotal(
  lines: Array<{ unitPriceCentimes: number; quantity: number }>
) {
  return lines.reduce(
    (total, line) => total + calculateLine(line.unitPriceCentimes, line.quantity),
    0
  );
}

/** Validate a quantity against the product's minimum order quantity. */
export function isValidQuantity(quantity: number, minOrderQty: number) {
  return (
    Number.isSafeInteger(quantity) &&
    quantity >= Math.max(1, minOrderQty) &&
    quantity <= 100000
  );
}
