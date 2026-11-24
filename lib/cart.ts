"use client";

export interface CartItem {
  productId: string;
  quantity: number;
}

const EVENT = "distribpro-cart-change";

export function cartStorageKey(companyId: string, customerId: string) {
  return `distribpro:cart:${companyId}:${customerId}`;
}

export function readCart(companyId: string, customerId: string): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(cartStorageKey(companyId, customerId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is CartItem =>
          item &&
          typeof item.productId === "string" &&
          Number.isInteger(item.quantity) &&
          item.quantity > 0 &&
          item.quantity <= 100000
      )
      .slice(0, 100);
  } catch {
    return [];
  }
}

export function writeCart(companyId: string, customerId: string, items: CartItem[]) {
  if (typeof window === "undefined") return;
  const clean = items
    .filter((item) => Number.isInteger(item.quantity) && item.quantity > 0)
    .slice(0, 100);
  window.localStorage.setItem(cartStorageKey(companyId, customerId), JSON.stringify(clean));
  window.dispatchEvent(new CustomEvent(EVENT, { detail: clean }));
}

export function clearCart(companyId: string, customerId: string) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(cartStorageKey(companyId, customerId));
  window.dispatchEvent(new CustomEvent(EVENT, { detail: [] }));
}

export function onCartChange(handler: (items: CartItem[]) => void) {
  if (typeof window === "undefined") return () => {};
  const listener = (event: Event) => {
    const detail = (event as CustomEvent<CartItem[]>).detail;
    if (Array.isArray(detail)) handler(detail);
  };
  const storageListener = (event: StorageEvent) => {
    if (event.key?.startsWith("distribpro:cart:")) {
      handler([]);
    }
  };
  window.addEventListener(EVENT, listener);
  window.addEventListener("storage", storageListener);
  return () => {
    window.removeEventListener(EVENT, listener);
    window.removeEventListener("storage", storageListener);
  };
}
