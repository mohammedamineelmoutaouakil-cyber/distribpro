"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireOperationalCompany } from "@/lib/auth";
import { categorySchema } from "@/lib/validations";
import { slugify } from "@/lib/utils";

export interface ActionResult {
  success?: string;
  error?: string;
}

export async function saveCategory(input: unknown): Promise<ActionResult> {
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Données invalides." };

  try {
    const ctx = await requireOperationalCompany();
    const supabase = await createClient();
    const slug = slugify(parsed.data.name) || "categorie";

    if (parsed.data.id) {
      const { data: existing } = await supabase
        .from("categories")
        .select("id")
        .eq("id", parsed.data.id)
        .eq("company_id", ctx.company.id)
        .maybeSingle();
      if (!existing) return { error: "Catégorie introuvable." };

      const { error } = await supabase
        .from("categories")
        .update({
          name: parsed.data.name,
          slug,
          description: parsed.data.description,
          is_active: parsed.data.isActive,
          sort_order: parsed.data.sortOrder,
        })
        .eq("id", parsed.data.id)
        .eq("company_id", ctx.company.id);
      if (error) {
        if (error.code === "23505") return { error: "Une catégorie avec ce nom existe déjà." };
        return { error: error.message };
      }
    } else {
      const { error } = await supabase.from("categories").insert({
        company_id: ctx.company.id,
        name: parsed.data.name,
        slug,
        description: parsed.data.description,
        is_active: parsed.data.isActive,
        sort_order: parsed.data.sortOrder,
      });
      if (error) {
        if (error.code === "23505") return { error: "Une catégorie avec ce nom existe déjà." };
        return { error: error.message };
      }
    }

    revalidatePath("/dashboard/categories");
    revalidatePath("/dashboard/products");
    revalidatePath("/portal");
    return { success: parsed.data.id ? "Catégorie mise à jour." : "Catégorie créée." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Erreur inattendue." };
  }
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  try {
    const ctx = await requireOperationalCompany();
    const supabase = await createClient();
    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", id)
      .eq("company_id", ctx.company.id);
    if (error) return { error: error.message };
    revalidatePath("/dashboard/categories");
    revalidatePath("/dashboard/products");
    revalidatePath("/portal");
    return { success: "Catégorie supprimée. Les produits associés sont désormais sans catégorie." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Erreur inattendue." };
  }
}
