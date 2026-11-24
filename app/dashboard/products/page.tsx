import { ProductsTable, type ProductRow } from "@/components/dashboard/products-table";
import { PageHeader } from "@/components/dashboard/page-header";
import { requireCompanyAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getSignedUrls, PRODUCT_BUCKET } from "@/lib/storage";
import type { ProductWithCategory } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const ctx = await requireCompanyAdmin();
  const supabase = await createClient();

  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase
      .from("products")
      .select("*, categories(id, name)")
      .eq("company_id", ctx.company.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("categories")
      .select("id, name")
      .eq("company_id", ctx.company.id)
      .order("sort_order", { ascending: true }),
  ]);

  const signed = await getSignedUrls(
    supabase,
    PRODUCT_BUCKET,
    (products ?? []).map((product) => product.image_path)
  );

  const rows: ProductRow[] = ((products ?? []) as ProductWithCategory[]).map((product) => ({
    id: product.id,
    name: product.name,
    sku: product.sku,
    categoryId: product.category_id,
    categoryName: product.categories?.name ?? null,
    description: product.description,
    basePriceCentimes: Number(product.base_price_centimes),
    minOrderQty: product.min_order_qty,
    isActive: product.is_active,
    isFeatured: product.is_featured,
    imageUrl: product.image_path ? signed.get(product.image_path) ?? null : null,
  }));

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Produits"
        description={`Gérez votre catalogue et vos prix de base. ${ctx.plan.maxProducts} produits actifs maximum avec le plan ${ctx.plan.name}.`}
      />
      <ProductsTable products={rows} categories={categories ?? []} />
    </div>
  );
}
