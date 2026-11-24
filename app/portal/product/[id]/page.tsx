import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BadgeCheck,
  ChevronLeft,
  ImageIcon,
  MessageCircle,
  Package,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { AddToCartButton } from "@/components/portal/add-to-cart";
import { ProductCard, toPortalProduct, type PortalProduct } from "@/components/portal/product-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireCustomer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getCustomerPriceMap, priceForProduct } from "@/lib/catalog";
import { getSignedUrl, getSignedUrls, PRODUCT_BUCKET } from "@/lib/storage";
import { formatMAD } from "@/lib/money";
import { whatsappLink } from "@/lib/utils";
import type { ProductWithCategory } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireCustomer();
  const supabase = await createClient();

  const { data: product } = await supabase
    .from("products")
    .select("*, categories(id, name)")
    .eq("id", id)
    .eq("company_id", ctx.company.id)
    .eq("is_active", true)
    .maybeSingle();

  if (!product) notFound();

  const typedProduct = product as ProductWithCategory;
  const [priceMap, imageUrl] = await Promise.all([
    getCustomerPriceMap(supabase, ctx.company.id, ctx.customer.id, ctx.customer.group_id),
    getSignedUrl(supabase, PRODUCT_BUCKET, typedProduct.image_path),
  ]);

  const price = priceForProduct(Number(typedProduct.base_price_centimes), priceMap.get(typedProduct.id));

  const { data: related } = await supabase
    .from("products")
    .select("*, categories(id, name)")
    .eq("company_id", ctx.company.id)
    .eq("is_active", true)
    .neq("id", typedProduct.id)
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(4);

  const relatedProducts = (related ?? []) as ProductWithCategory[];
  const relatedSigned = await getSignedUrls(
    supabase,
    PRODUCT_BUCKET,
    relatedProducts.map((item) => item.image_path)
  );
  const relatedCards: PortalProduct[] = relatedProducts.map((item) =>
    toPortalProduct(
      item,
      priceForProduct(Number(item.base_price_centimes), priceMap.get(item.id)),
      item.image_path ? relatedSigned.get(item.image_path) ?? null : null
    )
  );

  const whatsappUrl = ctx.company.whatsapp
    ? whatsappLink(
        ctx.company.whatsapp,
        `Bonjour ${ctx.company.name}, je souhaite des informations sur le produit ${typedProduct.name} (${typedProduct.sku}).`
      )
    : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Link
        href="/portal/catalog"
        className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-brand"
      >
        <ChevronLeft className="h-3.5 w-3.5" /> Retour au catalogue
      </Link>

      <div className="mt-4 grid gap-8 lg:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">
          <div className="relative aspect-[4/3] bg-slate-50">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt={typedProduct.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-300">
                <ImageIcon className="h-12 w-12" />
                <span className="text-xs">Image non disponible</span>
              </div>
            )}
            {typedProduct.is_featured && (
              <Badge className="absolute left-4 top-4 border-0 bg-navy/90 text-white backdrop-blur">
                Sélection du fournisseur
              </Badge>
            )}
          </div>
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            {typedProduct.categories?.name && (
              <Link
                href={`/portal/catalog?category=${typedProduct.category_id}`}
                className="text-[11px] font-medium uppercase tracking-wider text-brand hover:underline"
              >
                {typedProduct.categories.name}
              </Link>
            )}
            <span className="font-mono text-[11px] text-slate-400">{typedProduct.sku}</span>
          </div>

          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-navy sm:text-3xl">
            {typedProduct.name}
          </h1>

          <div className="mt-4 flex flex-wrap items-end gap-3">
            <p className="text-3xl font-semibold tracking-tight text-navy">{formatMAD(price.unitPriceCentimes)}</p>
            <span className="pb-1 text-xs text-slate-400">HT / unité</span>
            {price.source !== "base" && (
              <Badge className="mb-1 border-teal/20 bg-teal-light text-teal-700">
                <BadgeCheck className="h-3 w-3" />
                {price.source === "customer" ? "Votre tarif négocié" : "Tarif groupe"}
              </Badge>
            )}
          </div>

          {typedProduct.description && (
            <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-slate-600">
              {typedProduct.description}
            </p>
          )}

          <div className="mt-5 grid gap-2 rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-500 sm:grid-cols-2">
            <p className="flex items-center gap-2">
              <Package className="h-4 w-4 text-slate-400" />
              Quantité minimum : <span className="font-medium text-navy">{typedProduct.min_order_qty}</span>
            </p>
            <p className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-slate-400" /> Retrait ou livraison selon accord
            </p>
            <p className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-slate-400" /> Prix recalculé et confirmé par le fournisseur
            </p>
            <p className="flex items-center gap-2">
              <BadgeCheck className="h-4 w-4 text-slate-400" /> Aucun paiement en ligne requis
            </p>
          </div>

          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-soft">
            <p className="mb-3 text-sm font-medium text-navy">Ajouter à ma commande</p>
            <AddToCartButton productId={typedProduct.id} minOrderQty={typedProduct.min_order_qty} />
            <p className="mt-2 text-[11px] text-slate-400">
              Le total définitif est calculé par le fournisseur au moment de l'envoi de la commande.
            </p>
          </div>

          {whatsappUrl && (
            <Button asChild variant="outline" className="mt-3 w-full">
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4 text-emerald-600" />
                Poser une question sur WhatsApp
              </a>
            </Button>
          )}
        </div>
      </div>

      {relatedCards.length > 0 && (
        <section className="mt-12">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-navy">Vous aimerez aussi</h2>
              <p className="text-sm text-slate-500">D'autres produits disponibles dans votre catalogue.</p>
            </div>
            <Link href="/portal/catalog" className="text-xs font-medium text-brand hover:underline">
              Voir tout
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {relatedCards.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
