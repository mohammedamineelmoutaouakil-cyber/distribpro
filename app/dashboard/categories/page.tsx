import { CategoriesManager, type CategoryRow } from "@/components/dashboard/categories-manager";
import { PageHeader } from "@/components/dashboard/page-header";
import { requireCompanyAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Category, Product } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const ctx = await requireCompanyAdmin();
  const supabase = await createClient();

  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase
      .from("categories")
      .select("*")
      .eq("company_id", ctx.company.id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("products")
      .select("category_id")
      .eq("company_id", ctx.company.id),
  ]);

  const counts = new Map<string, number>();
  for (const product of (products ?? []) as Pick<Product, "category_id">[]) {
    if (!product.category_id) continue;
    counts.set(product.category_id, (counts.get(product.category_id) ?? 0) + 1);
  }

  const rows: CategoryRow[] = ((categories ?? []) as Category[]).map((category) => ({
    id: category.id,
    name: category.name,
    description: category.description,
    sortOrder: category.sort_order,
    isActive: category.is_active,
    productCount: counts.get(category.id) ?? 0,
  }));

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Catégories"
        description="Structurez votre catalogue pour que vos clients trouvent rapidement leurs produits."
      />
      <CategoriesManager categories={rows} />
    </div>
  );
}
