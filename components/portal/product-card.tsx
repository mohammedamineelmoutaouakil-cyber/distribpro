import Link from "next/link";
import { ImageIcon } from "lucide-react";
import { AddToCartButton } from "@/components/portal/add-to-cart";
import { Badge } from "@/components/ui/badge";
import { formatMAD } from "@/lib/money";
import type { PriceSource } from "@/lib/pricing";
import type { ProductWithCategory } from "@/lib/types";

export interface PortalProduct {
  id: string;
  name: string;
  sku: string;
  minOrderQty: number;
  categoryName: string | null;
  isFeatured: boolean;
  imageUrl: string | null;
  priceCentimes: number;
  priceSource: PriceSource;
}

export function toPortalProduct(
  product: ProductWithCategory,
  price: { unitPriceCentimes: number; source: PriceSource },
  imageUrl: string | null
): PortalProduct {
  return {
    id: product.id,
    name: product.name,
    sku: product.sku,
    minOrderQty: product.min_order_qty,
    categoryName: product.categories?.name ?? null,
    isFeatured: product.is_featured,
    imageUrl,
    priceCentimes: price.unitPriceCentimes,
    priceSource: price.source,
  };
}

export function ProductCard({ product }: { product: PortalProduct }) {
  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft transition hover:-translate-y-0.5 hover:shadow-card">
      <Link href={`/portal/product/${product.id}`} className="relative block aspect-[4/3] overflow-hidden bg-slate-50">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <ImageIcon className="h-8 w-8 text-slate-200" />
          </div>
        )}
        {product.isFeatured && (
          <Badge className="absolute left-3 top-3 border-0 bg-navy/90 text-white backdrop-blur">Sélection</Badge>
        )}
        {product.priceSource !== "base" && (
          <Badge className="absolute right-3 top-3 border-0 bg-teal text-white">Votre tarif</Badge>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
          {product.categoryName ?? "Catalogue"}
        </p>
        <Link href={`/portal/product/${product.id}`} className="mt-1 line-clamp-2 min-h-[2.5rem] text-sm font-medium text-navy hover:text-brand">
          {product.name}
        </Link>
        <p className="mt-0.5 font-mono text-[11px] text-slate-400">{product.sku}</p>

        <div className="mt-3 flex items-end justify-between">
          <div>
            <p className="text-lg font-semibold tracking-tight text-navy">{formatMAD(product.priceCentimes)}</p>
            <p className="text-[11px] text-slate-400">Min. {product.minOrderQty} unités</p>
          </div>
          <span className="text-[10px] text-slate-400">HT</span>
        </div>

        <div className="mt-4">
          <AddToCartButton productId={product.id} minOrderQty={product.minOrderQty} compact />
        </div>
      </div>
    </div>
  );
}
