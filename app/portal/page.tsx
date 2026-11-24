import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Boxes,
  ChevronRight,
  Factory,
  Hammer,
  Lightbulb,
  MessageCircle,
  Package,
  Search,
  ShieldCheck,
  ShoppingCart,
  Sun,
  Truck,
  Wrench,
  Zap,
} from "lucide-react";
import { AddToCartButton } from "@/components/portal/add-to-cart";
import { ProductCard, toPortalProduct, type PortalProduct } from "@/components/portal/product-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requireCustomer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getCustomerPriceMap, priceForProduct } from "@/lib/catalog";
import { getSignedUrl, getSignedUrls, BRAND_BUCKET, PRODUCT_BUCKET } from "@/lib/storage";
import { formatMAD } from "@/lib/money";
import { absoluteUrl, whatsappLink } from "@/lib/utils";
import type { Category, ProductWithCategory } from "@/lib/types";

export const dynamic = "force-dynamic";

const CATEGORY_ICONS = [
  { test: /sanitaire|plomb|robinet|bain/i, icon: Wrench },
  { test: /électri|electri|câble|cable/i, icon: Zap },
  { test: /éclairage|eclairage|lampe|luminaire/i, icon: Lightbulb },
  { test: /solaire|solar|panneau/i, icon: Sun },
  { test: /construction|matériau|materiau|ciment/i, icon: Hammer },
  { test: /industriel|industri/i, icon: Factory },
];

function categoryIcon(name: string) {
  return CATEGORY_ICONS.find((item) => item.test.test(name))?.icon ?? Boxes;
}

export default async function PortalHomePage() {
  const ctx = await requireCustomer();
  const supabase = await createClient();

  const [{ data: featured }, { data: latest }, { data: categories }, bannerUrl] = await Promise.all([
    supabase
      .from("products")
      .select("*, categories(id, name)")
      .eq("company_id", ctx.company.id)
      .eq("is_active", true)
      .eq("is_featured", true)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("products")
      .select("*, categories(id, name)")
      .eq("company_id", ctx.company.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("categories")
      .select("id, name, description")
      .eq("company_id", ctx.company.id)
      .eq("is_active", true)
      .order("sort_order")
      .limit(8),
    getSignedUrl(supabase, BRAND_BUCKET, ctx.company.banner_path),
  ]);

  const selected: ProductWithCategory[] = [];
  const seen = new Set<string>();
  for (const product of [...((featured ?? []) as ProductWithCategory[]), ...((latest ?? []) as ProductWithCategory[])]) {
    if (seen.has(product.id)) continue;
    seen.add(product.id);
    selected.push(product);
    if (selected.length >= 8) break;
  }

  const [priceMap, signed] = await Promise.all([
    getCustomerPriceMap(supabase, ctx.company.id, ctx.customer.id, ctx.customer.group_id),
    getSignedUrls(supabase, PRODUCT_BUCKET, selected.map((product) => product.image_path)),
  ]);

  const products: PortalProduct[] = selected.map((product) =>
    toPortalProduct(
      product,
      priceForProduct(Number(product.base_price_centimes), priceMap.get(product.id)),
      product.image_path ? signed.get(product.image_path) ?? null : null
    )
  );

  const whatsappUrl = ctx.company.whatsapp
    ? whatsappLink(
        ctx.company.whatsapp,
        `Bonjour ${ctx.company.name}, je souhaite passer une commande depuis votre portail.`
      )
    : null;
  const catalogShareUrl = `https://wa.me/?text=${encodeURIComponent(
    `Découvrez le catalogue ${ctx.company.name} : ${absoluteUrl("/portal/catalog")}`
  )}`;

  return (
    <div>
      <section className="relative overflow-hidden bg-navy text-white">
        {bannerUrl && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={bannerUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />
            <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/90 to-navy/50" />
          </>
        )}
        <div className="absolute inset-0 surface-grid opacity-[0.12]" />
        <div className="absolute -right-24 top-0 h-80 w-80 rounded-full bg-brand/25 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-white/15 bg-white/10 text-white">
                <BadgeCheck className="h-3 w-3" /> Client {ctx.group?.name ?? "professionnel"}
              </Badge>
              <span className="text-xs text-slate-400">Prix professionnels en MAD</span>
            </div>
            <h1 className="mt-4 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
              Commandez chez {ctx.company.name}, simplement.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-300 sm:text-base">
              {ctx.company.description ??
                "Parcourez le catalogue, consultez vos tarifs personnalisés et envoyez votre commande en quelques clics. Votre fournisseur la reçoit immédiatement."}
            </p>

            <form action="/portal/catalog" method="GET" className="mt-6 flex max-w-xl gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  name="q"
                  placeholder="Rechercher un produit, une référence…"
                  className="h-11 border-0 bg-white pl-9 text-navy shadow-lg"
                />
              </div>
              <Button type="submit" size="lg" className="h-11 bg-white text-navy hover:bg-slate-100">
                Rechercher
              </Button>
            </form>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="bg-brand hover:bg-brand-dark">
                <Link href="/portal/catalog">
                  Voir le catalogue <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              {whatsappUrl && (
                <Button asChild size="lg" variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white">
                  <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="h-4 w-4" /> Contacter le fournisseur
                  </a>
                </Button>
              )}
            </div>
          </div>

          <div className="mt-10 grid max-w-2xl grid-cols-3 gap-3 border-t border-white/10 pt-6 text-xs text-slate-300">
            <div className="flex items-center gap-2"><Package className="h-4 w-4 text-teal" /> Catalogue à jour</div>
            <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-teal" /> Vos tarifs dédiés</div>
            <div className="flex items-center gap-2"><Truck className="h-4 w-4 text-teal" /> Retrait / livraison</div>
          </div>
        </div>
      </section>

      {categories && categories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-navy">Nos catégories</h2>
              <p className="text-sm text-slate-500">Trouvez rapidement les produits dont vous avez besoin.</p>
            </div>
            <Link href="/portal/catalog" className="hidden items-center gap-1 text-xs font-medium text-brand hover:underline sm:flex">
              Tout le catalogue <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {(categories as Pick<Category, "id" | "name" | "description">[]).map((category) => {
              const Icon = categoryIcon(category.name);
              return (
                <Link
                  key={category.id}
                  href={`/portal/catalog?category=${category.id}`}
                  className="group rounded-xl border border-slate-200 bg-white p-4 shadow-soft transition hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-card"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-light text-brand-dark transition group-hover:bg-brand group-hover:text-white">
                    <Icon className="h-5 w-5" />
                  </span>
                  <p className="mt-3 text-sm font-medium text-navy">{category.name}</p>
                  <p className="mt-0.5 line-clamp-2 text-[11px] text-slate-400">
                    {category.description ?? "Voir les produits"}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-navy">Sélection du fournisseur</h2>
            <p className="text-sm text-slate-500">Produits recommandés et dernières nouveautés.</p>
          </div>
          <Link href="/portal/catalog" className="flex items-center gap-1 text-xs font-medium text-brand hover:underline">
            Tout voir <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        {products.length > 0 ? (
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-xl border border-dashed border-slate-200 bg-white py-14 text-center">
            <Package className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-3 text-sm font-medium text-navy">Catalogue en cours de préparation</p>
            <p className="mt-1 text-xs text-slate-400">Votre fournisseur n'a pas encore publié de produits.</p>
          </div>
        )}
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6">
        <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-soft sm:grid-cols-3">
          {[
            { icon: Search, title: "1. Choisissez", text: "Parcourez le catalogue et ajoutez vos produits au panier." },
            { icon: ShoppingCart, title: "2. Vérifiez", text: "Contrôlez les quantités et vos prix personnalisés." },
            { icon: BadgeCheck, title: "3. Commandez", text: "Envoyez la commande, votre fournisseur la traite." },
          ].map((step) => (
            <div key={step.title} className="flex gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-light text-teal-700">
                <step.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-medium text-navy">{step.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{step.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-4 rounded-2xl bg-gradient-to-r from-navy to-[#1e3a8a] p-6 text-white sm:flex-row sm:items-center sm:p-8">
          <div>
            <h2 className="text-lg font-semibold">Besoin d'un produit spécifique ?</h2>
            <p className="mt-1 text-sm text-slate-300">
              Contactez directement {ctx.company.name} sur WhatsApp ou partagez le catalogue avec votre équipe.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {whatsappUrl && (
              <Button asChild className="bg-white text-navy hover:bg-slate-100">
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </a>
              </Button>
            )}
            <Button asChild variant="outline" className="border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white">
              <a href={catalogShareUrl} target="_blank" rel="noopener noreferrer">Partager le catalogue</a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
