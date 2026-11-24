import Link from "next/link";
import { ChevronLeft, ChevronRight, PackageSearch, Search } from "lucide-react";
import { ProductCard, toPortalProduct, type PortalProduct } from "@/components/portal/product-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requireCustomer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getCustomerPriceMap, priceForProduct } from "@/lib/catalog";
import { getSignedUrls, PRODUCT_BUCKET } from "@/lib/storage";
import type { Category, ProductWithCategory } from "@/lib/types";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 24;

function buildQuery(params: Record<string, string | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; sort?: string; page?: string }>;
}) {
  const params = await searchParams;
  const ctx = await requireCustomer();
  const supabase = await createClient();

  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase
      .from("products")
      .select("*, categories(id, name)")
      .eq("company_id", ctx.company.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false }),
    supabase
      .from("categories")
      .select("id, name")
      .eq("company_id", ctx.company.id)
      .eq("is_active", true)
      .order("sort_order"),
  ]);

  const priceMap = await getCustomerPriceMap(
    supabase,
    ctx.company.id,
    ctx.customer.id,
    ctx.customer.group_id
  );

  const query = (params.q ?? "").trim().toLowerCase();
  let filtered = ((products ?? []) as ProductWithCategory[]).filter((product) => {
    const matchesQuery =
      !query ||
      product.name.toLowerCase().includes(query) ||
      product.sku.toLowerCase().includes(query) ||
      (product.description ?? "").toLowerCase().includes(query);
    const matchesCategory = !params.category || product.category_id === params.category;
    return matchesQuery && matchesCategory;
  });

  const sort = params.sort ?? "newest";
  filtered = [...filtered].sort((a, b) => {
    if (sort === "name") return a.name.localeCompare(b.name);
    if (sort === "price_asc") {
      return (
        priceForProduct(Number(a.base_price_centimes), priceMap.get(a.id)).unitPriceCentimes -
        priceForProduct(Number(b.base_price_centimes), priceMap.get(b.id)).unitPriceCentimes
      );
    }
    if (sort === "price_desc") {
      return (
        priceForProduct(Number(b.base_price_centimes), priceMap.get(b.id)).unitPriceCentimes -
        priceForProduct(Number(a.base_price_centimes), priceMap.get(a.id)).unitPriceCentimes
      );
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(Math.max(1, Number(params.page ?? 1) || 1), totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const signed = await getSignedUrls(
    supabase,
    PRODUCT_BUCKET,
    pageItems.map((product) => product.image_path)
  );

  const items: PortalProduct[] = pageItems.map((product) =>
    toPortalProduct(
      product,
      priceForProduct(Number(product.base_price_centimes), priceMap.get(product.id)),
      product.image_path ? signed.get(product.image_path) ?? null : null
    )
  );

  const activeCategory = (categories ?? []).find((category) => category.id === params.category);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-brand">Catalogue</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-navy">
            {activeCategory ? activeCategory.name : "Tous les produits"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {total} produit{total > 1 ? "s" : ""} disponible{total > 1 ? "s" : ""} · vos prix personnalisés
          </p>
        </div>

        <form action="/portal/catalog" method="GET" className="flex w-full gap-2 sm:w-auto">
          {params.category && <input type="hidden" name="category" value={params.category} />}
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input name="q" defaultValue={params.q ?? ""} placeholder="Nom ou référence…" className="pl-9" />
          </div>
          <select
            name="sort"
            defaultValue={sort}
            className="h-10 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-600 shadow-sm focus:border-brand focus:outline-none"
          >
            <option value="newest">Nouveautés</option>
            <option value="name">Nom A–Z</option>
            <option value="price_asc">Prix croissant</option>
            <option value="price_desc">Prix décroissant</option>
          </select>
          <Button type="submit" variant="outline">Filtrer</Button>
        </form>
      </div>

      <div className="mt-5 flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        <Link
          href={`/portal/catalog${buildQuery({ q: params.q, sort })}`}
          className={cn(
            "whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-medium transition",
            !params.category
              ? "border-navy bg-navy text-white"
              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
          )}
        >
          Tous
        </Link>
        {(categories as Pick<Category, "id" | "name">[] ?? []).map((category) => (
          <Link
            key={category.id}
            href={`/portal/catalog${buildQuery({ q: params.q, sort, category: category.id })}`}
            className={cn(
              "whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-medium transition",
              params.category === category.id
                ? "border-navy bg-navy text-white"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
            )}
          >
            {category.name}
          </Link>
        ))}
      </div>

      {items.length > 0 ? (
        <>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <Button
                asChild
                variant="outline"
                size="sm"
                className={cn(currentPage <= 1 && "pointer-events-none opacity-50")}
              >
                <Link href={`/portal/catalog${buildQuery({ ...params, page: String(currentPage - 1) })}`}>
                  <ChevronLeft className="h-4 w-4" /> Précédent
                </Link>
              </Button>
              <span className="px-2 text-xs text-slate-500">Page {currentPage} / {totalPages}</span>
              <Button
                asChild
                variant="outline"
                size="sm"
                className={cn(currentPage >= totalPages && "pointer-events-none opacity-50")}
              >
                <Link href={`/portal/catalog${buildQuery({ ...params, page: String(currentPage + 1) })}`}>
                  Suivant <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="mt-8 rounded-xl border border-dashed border-slate-200 bg-white py-16 text-center">
          <PackageSearch className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm font-medium text-navy">Aucun produit trouvé</p>
          <p className="mt-1 text-xs text-slate-400">
            Essayez une autre recherche ou explorez toutes les catégories.
          </p>
          <Button asChild variant="outline" size="sm" className="mt-4">
            <Link href="/portal/catalog">Réinitialiser les filtres</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
