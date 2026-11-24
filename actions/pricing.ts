"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireOperationalCompany } from "@/lib/auth";
import { customerPriceSchema, groupPriceSchema } from "@/lib/validations";
import { parseMADToCentimes } from "@/lib/money";

export interface ActionResult {
  success?: string;
  error?: string;
}

function revalidatePricing() {
  revalidatePath("/dashboard/pricing");
  revalidatePath("/dashboard/products");
  revalidatePath("/portal");
  revalidatePath("/portal/catalog");
}

export async function saveGroupPrice(input: unknown): Promise<ActionResult> {
  const parsed = groupPriceSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Données invalides." };

  const price = parseMADToCentimes(parsed.data.price);
  if (price === null) return { error: "Prix invalide." };

  try {
    const ctx = await requireOperationalCompany();
    const supabase = await createClient();

    const [{ data: product }, { data: group }] = await Promise.all([
      supabase
        .from("products")
        .select("id")
        .eq("id", parsed.data.productId)
        .eq("company_id", ctx.company.id)
        .maybeSingle(),
      supabase
        .from("customer_groups")
        .select("id")
        .eq("id", parsed.data.groupId)
        .eq("company_id", ctx.company.id)
        .maybeSingle(),
    ]);
    if (!product) return { error: "Produit introuvable." };
    if (!group) return { error: "Groupe client introuvable." };

    const { error } = await supabase.from("customer_group_prices").upsert(
      {
        company_id: ctx.company.id,
        product_id: parsed.data.productId,
        group_id: parsed.data.groupId,
        price_centimes: price,
      },
      { onConflict: "product_id,group_id" }
    );
    if (error) return { error: error.message };

    revalidatePricing();
    return { success: "Tarif de groupe enregistré." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Erreur inattendue." };
  }
}

export async function saveCustomerPrice(input: unknown): Promise<ActionResult> {
  const parsed = customerPriceSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Données invalides." };

  const price = parseMADToCentimes(parsed.data.price);
  if (price === null) return { error: "Prix invalide." };

  try {
    const ctx = await requireOperationalCompany();
    const supabase = await createClient();

    const [{ data: product }, { data: customer }] = await Promise.all([
      supabase
        .from("products")
        .select("id")
        .eq("id", parsed.data.productId)
        .eq("company_id", ctx.company.id)
        .maybeSingle(),
      supabase
        .from("customer_accounts")
        .select("id")
        .eq("id", parsed.data.customerId)
        .eq("company_id", ctx.company.id)
        .maybeSingle(),
    ]);
    if (!product) return { error: "Produit introuvable." };
    if (!customer) return { error: "Client introuvable." };

    const { error } = await supabase.from("customer_specific_prices").upsert(
      {
        company_id: ctx.company.id,
        product_id: parsed.data.productId,
        customer_id: parsed.data.customerId,
        price_centimes: price,
      },
      { onConflict: "product_id,customer_id" }
    );
    if (error) return { error: error.message };

    revalidatePricing();
    return { success: "Tarif client enregistré." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Erreur inattendue." };
  }
}

export async function deletePrice(
  kind: "group" | "customer",
  id: string
): Promise<ActionResult> {
  try {
    const ctx = await requireOperationalCompany();
    const supabase = await createClient();
    const table = kind === "group" ? "customer_group_prices" : "customer_specific_prices";
    const { error } = await supabase
      .from(table)
      .delete()
      .eq("id", id)
      .eq("company_id", ctx.company.id);
    if (error) return { error: error.message };
    revalidatePricing();
    return { success: "Tarif supprimé. Le prix de base s'applique à nouveau." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Erreur inattendue." };
  }
}
