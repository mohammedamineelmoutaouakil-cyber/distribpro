"use client";

import * as React from "react";
import {
  clearCart as clearStoredCart,
  onCartChange,
  readCart,
  writeCart,
  type CartItem,
} from "@/lib/cart";

interface CartContextValue {
  items: CartItem[];
  count: number;
  ready: boolean;
  add: (productId: string, quantity: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
}

const CartContext = React.createContext<CartContextValue | null>(null);

export function CartProvider({
  companyId,
  customerId,
  children,
}: {
  companyId: string;
  customerId: string;
  children: React.ReactNode;
}) {
  const [items, setItems] = React.useState<CartItem[]>([]);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    setItems(readCart(companyId, customerId));
    setReady(true);
    const unsubscribe = onCartChange((next) => {
      if (next.length === 0) {
        setItems(readCart(companyId, customerId));
      } else {
        setItems(next);
      }
    });
    return unsubscribe;
  }, [companyId, customerId]);

  const add = React.useCallback(
    (productId: string, quantity: number) => {
      const current = readCart(companyId, customerId);
      const existing = current.find((item) => item.productId === productId);
      const next = existing
        ? current.map((item) =>
            item.productId === productId
              ? { ...item, quantity: Math.min(100000, item.quantity + quantity) }
              : item
          )
        : [...current, { productId, quantity: Math.min(100000, Math.max(1, quantity)) }];
      writeCart(companyId, customerId, next);
      setItems(next);
    },
    [companyId, customerId]
  );

  const setQuantity = React.useCallback(
    (productId: string, quantity: number) => {
      const current = readCart(companyId, customerId);
      const next = current
        .map((item) => (item.productId === productId ? { ...item, quantity } : item))
        .filter((item) => item.quantity > 0);
      writeCart(companyId, customerId, next);
      setItems(next);
    },
    [companyId, customerId]
  );

  const remove = React.useCallback(
    (productId: string) => {
      const next = readCart(companyId, customerId).filter((item) => item.productId !== productId);
      writeCart(companyId, customerId, next);
      setItems(next);
    },
    [companyId, customerId]
  );

  const clear = React.useCallback(() => {
    clearStoredCart(companyId, customerId);
    setItems([]);
  }, [companyId, customerId]);

  const count = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{ items, count, ready, add, setQuantity, remove, clear }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = React.useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}
