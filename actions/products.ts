"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireCompanyAdmin, requireOperationalCompany } from "@/lib/auth";
import { productSchema } from "@/lib/validations";
import { parseMADToCentimes } from "@/lib/money";
import { parseProductCsv, type ParsedCsvRow } from "@/lib/csv";
import { slugify } from "@/lib/utils";
import { assertPlanCapacity, PlanLimitError } from "@/lib/plan";
import { PRODUCT_BUCKET } from "@/lib/storage";
import { removeStorageFolder, uploadImage, validateImageFile } from "@/lib/upload";
import { CSV_MAX_BYTES } from "@/lib/constants";

export interface ActionResult {
  success?: string;
  error?: string;
}

export interface CsvPreviewResult {
  rows?: ParsedCsvRow[];
  fileErrors?: string[];
  summary?: { total: number; valid: number; invalid: number };
  error?: string;
}

export interface ImportResult {
  imported?: number;
  skipped?: number;
  categoriesCreated?: number;
  errors?: string[];
  error?: string;
}

function nullIfEmpty(value: FormDataEntryValue | null) {
  const text = typeof value === "string" ? value.trim() : "";
  return text.length > 0 ? text : null;
}

function revalidateCatalog() {
  revalidatePath("/dashboard/products");
  revalidatePath("/dashboard/categories");
  revalidatePath("/dashboard");
  revalidatePath("/portal");
  revalidatePath("/portal/catalog");
}

export async function saveProduct(formData: FormData): Promise<ActionResult> {
  const raw = {
    id: nullIfEmpty(formData.get("id")) ?? undefined,
    name: String(formData.get("name") ?? ""),
    sku: String(formData.get("sku") ?? ""),
    categoryId: nullIfEmpty(formData.get("categoryId")),
    description: String(formData.get("description") ?? ""),
    basePrice: String(formData.get("basePrice") ?? ""),
    minOrderQty: String(formData.get("minOrderQty") ?? "1"),
    isActive: formData.get("isActive") === "true" || formData.get("isActive") === "on",
    isFeatured: formData.get("isFeatured") === "true" || formData.get("isFeatured") === "on",
  };

  const parsed = productSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Données invalides." };

  const basePriceCentimes = parseMADToCentimes(parsed.data.basePrice);
  if (basePriceCentimes === null) return { error: "Prix invalide." };

  const imageFile = formData.get("image");
  const removeImage = formData.get("removeImage") === "true";
  if (imageFile instanceof File && imageFile.size > 0) {
    const validation = validateImageFile(imageFile);
    if (validation) return { error: validation };
  }

  try {
    const ctx = await requireOperationalCompany();
    const supabase = await createClient();

    if (parsed.data.categoryId) {
      const { data: category } = await supabase
        .from("categories")
        .select("id")
        .eq("id", parsed.data.categoryId)
        .eq("company_id", ctx.company.id)
        .maybeSingle();
      if (!category) return { error: "Catégorie invalide." };
    }

    let productId = parsed.data.id;
    let previousImage: string | null = null;

    if (productId) {
      const { data: existing } = await supabase
        .from("products")
        .select("id, image_path, is_active")
        .eq("id", productId)
        .eq("company_id", ctx.company.id)
        .maybeSingle();
      if (!existing) return { error: "Produit introuvable." };
      previousImage = existing.image_path;
      if (!existing.is_active && parsed.data.isActive) {
        await assertPlanCapacity(supabase, ctx, "products", 1);
      }
    } else {
      productId = crypto.randomUUID();
      if (parsed.data.isActive) {
        await assertPlanCapacity(supabase, ctx, "products", 1);
      }
    }

    let imagePath: string | null | undefined;
    let uploadedPath: string | null = null;

    if (imageFile instanceof File && imageFile.size > 0) {
      const uploaded = await uploadImage(supabase, PRODUCT_BUCKET, ctx.company.id, productId, imageFile);
      if (uploaded.error) return { error: uploaded.error };
      uploadedPath = uploaded.path ?? null;
      imagePath = uploadedPath;
    } else if (removeImage) {
      imagePath = null;
    }

    const payload = {
      name: parsed.data.name,
      sku: parsed.data.sku,
      category_id: parsed.data.categoryId ?? null,
      description: parsed.data.description,
      base_price_centimes: basePriceCentimes,
      min_order_qty: parsed.data.minOrderQty,
      is_active: parsed.data.isActive,
      is_featured: parsed.data.isFeatured,
      ...(imagePath !== undefined ? { image_path: imagePath } : {}),
    };

    if (parsed.data.id) {
      const { error } = await supabase
        .from("products")
        .update(payload)
        .eq("id", productId)
        .eq("company_id", ctx.company.id);
      if (error) {
        if (uploadedPath) await supabase.storage.from(PRODUCT_BUCKET).remove([uploadedPath]);
        if (error.code === "23505") return { error: "Cette référence (SKU) existe déjà." };
        return { error: error.message };
      }
      if ((uploadedPath || removeImage) && previousImage) {
        await supabase.storage.from(PRODUCT_BUCKET).remove([previousImage]);
      }
    } else {
      const { error } = await supabase.from("products").insert({
        id: productId,
        company_id: ctx.company.id,
        ...payload,
        ...(uploadedPath ? { image_path: uploadedPath } : {}),
      });
      if (error) {
        if (uploadedPath) await supabase.storage.from(PRODUCT_BUCKET).remove([uploadedPath]);
        if (error.code === "23505") return { error: "Cette référence (SKU) existe déjà." };
        return { error: error.message };
      }
    }

    revalidateCatalog();
    return { success: parsed.data.id ? "Produit mis à jour." : "Produit créé." };
  } catch (error) {
    if (error instanceof PlanLimitError) return { error: error.message };
    return { error: error instanceof Error ? error.message : "Erreur inattendue." };
  }
}

export async function setProductActive(id: string, isActive: boolean): Promise<ActionResult> {
  try {
    const ctx = await requireOperationalCompany();
    const supabase = await createClient();

    if (isActive) {
      const { data: existing } = await supabase
        .from("products")
        .select("is_active")
        .eq("id", id)
        .eq("company_id", ctx.company.id)
        .maybeSingle();
      if (!existing) return { error: "Produit introuvable." };
      if (!existing.is_active) await assertPlanCapacity(supabase, ctx, "products", 1);
    }

    const { error } = await supabase
      .from("products")
      .update({ is_active: isActive })
      .eq("id", id)
      .eq("company_id", ctx.company.id);
    if (error) return { error: error.message };

    revalidateCatalog();
    return { success: isActive ? "Produit activé." : "Produit archivé." };
  } catch (error) {
    if (error instanceof PlanLimitError) return { error: error.message };
    return { error: error instanceof Error ? error.message : "Erreur inattendue." };
  }
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  try {
    const ctx = await requireOperationalCompany();
    const supabase = await createClient();
    const { data: product } = await supabase
      .from("products")
      .select("id, image_path")
      .eq("id", id)
      .eq("company_id", ctx.company.id)
      .maybeSingle();
    if (!product) return { error: "Produit introuvable." };

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", id)
      .eq("company_id", ctx.company.id);
    if (error) {
      if (error.code === "23503") {
        return { error: "Ce produit est utilisé dans des commandes. Archivez-le plutôt." };
      }
      return { error: error.message };
    }

    if (product.image_path) {
      await supabase.storage.from(PRODUCT_BUCKET).remove([product.image_path]);
    }
    await removeStorageFolder(supabase, PRODUCT_BUCKET, `${ctx.company.id}/${id}`);

    revalidateCatalog();
    return { success: "Produit supprimé." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Erreur inattendue." };
  }
}

export async function previewCsv(formData: FormData): Promise<CsvPreviewResult> {
  try {
    await requireCompanyAdmin();
    const file = formData.get("file");
    if (!(file instanceof File)) return { error: "Fichier CSV requis." };
    if (file.size === 0) return { error: "Le fichier est vide." };
    if (file.size > CSV_MAX_BYTES) return { error: "Le fichier ne doit pas dépasser 2 Mo." };
    if (!file.name.toLowerCase().endsWith(".csv") && file.type !== "text/csv") {
      return { error: "Format non supporté. Utilisez un fichier .csv." };
    }

    const text = await file.text();
    const parsed = parseProductCsv(text);
    if (parsed.fileErrors.length > 0) return { fileErrors: parsed.fileErrors };

    const supabase = await createClient();
    const ctx = await requireCompanyAdmin();
    const { data: existing } = await supabase
      .from("products")
      .select("sku")
      .eq("company_id", ctx.company.id);
    const existingSkus = new Set((existing ?? []).map((p) => p.sku.toLowerCase()));

    const rows = parsed.rows.map((row) => {
      const errors = [...row.errors];
      if (existingSkus.has(row.sku.toLowerCase())) {
        errors.push("Cette référence existe déjà dans votre catalogue");
      }
      return { ...row, errors };
    });

    const valid = rows.filter((row) => row.errors.length === 0).length;
    return { rows, summary: { total: rows.length, valid, invalid: rows.length - valid } };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Erreur inattendue." };
  }
}

export async function importProducts(rows: ParsedCsvRow[]): Promise<ImportResult> {
  try {
    const ctx = await requireOperationalCompany();
    if (!Array.isArray(rows) || rows.length === 0) return { error: "Aucune ligne à importer." };
    if (rows.length > 5000) return { error: "Maximum 5 000 lignes par import." };

    const supabase = await createClient();
    const errors: string[] = [];

    // Re-validate every row server-side. Never trust preview data from the browser.
    const seen = new Set<string>();
    const validRows: {
      name: string;
      sku: string;
      category: string | null;
      description: string | null;
      basePriceCentimes: number;
      minOrderQty: number;
      isActive: boolean;
    }[] = [];

    for (const row of rows) {
      const sku = String(row.sku ?? "").trim();
      const name = String(row.name ?? "").trim();
      const price = parseMADToCentimes(String(row.basePriceRaw ?? ""));
      const qty = Number(row.minOrderQty ?? 1);

      if (name.length < 2 || name.length > 180) {
        errors.push(`Ligne ${row.line} : nom invalide.`);
        continue;
      }
      if (!/^[A-Za-z0-9._\-/]{1,64}$/.test(sku)) {
        errors.push(`Ligne ${row.line} : référence invalide.`);
        continue;
      }
      if (seen.has(sku.toLowerCase())) {
        errors.push(`Ligne ${row.line} : référence ${sku} dupliquée.`);
        continue;
      }
      if (price === null) {
        errors.push(`Ligne ${row.line} : prix invalide.`);
        continue;
      }
      if (!Number.isInteger(qty) || qty < 1 || qty > 100000) {
        errors.push(`Ligne ${row.line} : quantité minimum invalide.`);
        continue;
      }
      seen.add(sku.toLowerCase());
      validRows.push({
        name,
        sku,
        category: row.category?.trim() || null,
        description: row.description?.trim() || null,
        basePriceCentimes: price,
        minOrderQty: qty,
        isActive: row.isActive !== false,
      });
    }

    if (validRows.length === 0) {
      return { imported: 0, skipped: 0, errors: errors.slice(0, 50) };
    }

    const { data: existingProducts } = await supabase
      .from("products")
      .select("sku")
      .eq("company_id", ctx.company.id);
    const existingSkus = new Set((existingProducts ?? []).map((p) => p.sku.toLowerCase()));

    const newRows = validRows.filter((row) => !existingSkus.has(row.sku.toLowerCase()));
    const skipped = validRows.length - newRows.length;

    const activeNew = newRows.filter((row) => row.isActive).length;
    if (activeNew > 0) await assertPlanCapacity(supabase, ctx, "products", activeNew);

    // Resolve or create categories (case-insensitive).
    const { data: existingCategories } = await supabase
      .from("categories")
      .select("id, name, slug")
      .eq("company_id", ctx.company.id);
    const categoryMap = new Map<string, string>();
    const usedSlugs = new Set<string>();
    for (const cat of existingCategories ?? []) {
      categoryMap.set(cat.name.toLowerCase(), cat.id);
      usedSlugs.add(cat.slug);
    }

    let categoriesCreated = 0;
    for (const row of newRows) {
      if (!row.category) continue;
      const key = row.category.toLowerCase();
      if (categoryMap.has(key)) continue;
      let slug = slugify(row.category) || "categorie";
      let suffix = 0;
      while (usedSlugs.has(slug)) {
        suffix += 1;
        slug = `${slugify(row.category) || "categorie"}-${suffix}`;
      }
      const { data: created, error } = await supabase
        .from("categories")
        .insert({ company_id: ctx.company.id, name: row.category, slug })
        .select("id")
        .single();
      if (error || !created) {
        errors.push(`Catégorie "${row.category}" : ${error?.message ?? "création impossible"}`);
        continue;
      }
      categoryMap.set(key, created.id);
      usedSlugs.add(slug);
      categoriesCreated += 1;
    }

    let imported = 0;
    const batchSize = 100;
    for (let i = 0; i < newRows.length; i += batchSize) {
      const batch = newRows.slice(i, i + batchSize).map((row) => ({
        company_id: ctx.company.id,
        name: row.name,
        sku: row.sku,
        category_id: row.category ? categoryMap.get(row.category.toLowerCase()) ?? null : null,
        description: row.description,
        base_price_centimes: row.basePriceCentimes,
        min_order_qty: row.minOrderQty,
        is_active: row.isActive,
      }));

      const { error } = await supabase.from("products").insert(batch);
      if (!error) {
        imported += batch.length;
        continue;
      }

      // Fall back to individual inserts to report precise failures.
      for (const product of batch) {
        const { error: rowError } = await supabase.from("products").insert(product);
        if (rowError) {
          if (rowError.code === "23505") {
            errors.push(`${product.sku} : référence déjà existante.`);
          } else {
            errors.push(`${product.sku} : ${rowError.message}`);
          }
        } else {
          imported += 1;
        }
      }
    }

    revalidateCatalog();
    return {
      imported,
      skipped,
      categoriesCreated,
      errors: errors.slice(0, 50),
    };
  } catch (error) {
    if (error instanceof PlanLimitError) return { error: error.message };
    return { error: error instanceof Error ? error.message : "Erreur inattendue." };
  }
}
