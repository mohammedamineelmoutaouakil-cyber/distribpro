"use client";

import { Minus, Plus, ShoppingCart } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { useCart } from "@/components/portal/cart-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 100000,
  compact = false,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  compact?: boolean;
}) {
  const clamp = (next: number) => Math.min(max, Math.max(min, next));
  return (
    <div className={cn("inline-flex items-center rounded-lg border border-slate-200 bg-white", compact ? "h-8" : "h-10")}>
      <button
        type="button"
        onClick={() => onChange(clamp(value - 1))}
        disabled={value <= min}
        className={cn("flex items-center justify-center text-slate-500 transition hover:text-navy disabled:opacity-30", compact ? "h-8 w-8" : "h-10 w-10")}
        aria-label="Diminuer"
      >
        <Minus className={compact ? "h-3 w-3" : "h-4 w-4"} />
      </button>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(event) => {
          const next = Number(event.target.value);
          onChange(Number.isFinite(next) ? clamp(next) : min);
        }}
        className={cn("w-12 border-x border-slate-200 bg-transparent text-center text-sm font-medium text-navy outline-none", compact ? "h-8" : "h-10")}
      />
      <button
        type="button"
        onClick={() => onChange(clamp(value + 1))}
        disabled={value >= max}
        className={cn("flex items-center justify-center text-slate-500 transition hover:text-navy disabled:opacity-30", compact ? "h-8 w-8" : "h-10 w-10")}
        aria-label="Augmenter"
      >
        <Plus className={compact ? "h-3 w-3" : "h-4 w-4"} />
      </button>
    </div>
  );
}

export function AddToCartButton({
  productId,
  minOrderQty,
  disabled,
  fullWidth = true,
  compact = false,
}: {
  productId: string;
  minOrderQty: number;
  disabled?: boolean;
  fullWidth?: boolean;
  compact?: boolean;
}) {
  const { add } = useCart();
  const [quantity, setQuantity] = React.useState(Math.max(1, minOrderQty));

  return (
    <div className={cn("flex gap-2", fullWidth && "w-full")}>
      <QuantityStepper value={quantity} onChange={setQuantity} min={Math.max(1, minOrderQty)} compact={compact} />
      <Button
        type="button"
        size={compact ? "sm" : "default"}
        className={cn("flex-1", compact && "h-8 px-2 text-xs")}
        disabled={disabled}
        onClick={() => {
          add(productId, quantity);
          toast.success("Produit ajouté au panier", {
            action: { label: "Voir", onClick: () => (window.location.href = "/portal/cart") },
          });
        }}
      >
        <ShoppingCart className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
        Ajouter
      </Button>
    </div>
  );
}
