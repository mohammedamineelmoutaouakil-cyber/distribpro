"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSuperAdmin } from "@/lib/auth";
import { companyStatusSchema, subscriptionSchema } from "@/lib/validations";

export interface ActionResult {
  success?: string;
  error?: string;
}

export async function updateSubscription(input: unknown): Promise<ActionResult> {
  const parsed = subscriptionSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Données invalides." };

  const expires = new Date(parsed.data.expiresAt);
  if (Number.isNaN(expires.getTime())) return { error: "Date d'expiration invalide." };

  try {
    await requireSuperAdmin();
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("subscriptions")
      .update({
        plan: parsed.data.plan,
        status: parsed.data.status,
        expires_at: expires.toISOString(),
      })
      .eq("company_id", parsed.data.companyId)
      .select("id")
      .maybeSingle();

    if (error) return { error: error.message };
    if (!data) return { error: "Abonnement introuvable." };

    revalidatePath("/superadmin");
    revalidatePath(`/superadmin/companies/${parsed.data.companyId}`);
    return { success: "Abonnement mis à jour." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Erreur inattendue." };
  }
}

export async function setCompanyStatus(input: unknown): Promise<ActionResult> {
  const parsed = companyStatusSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Données invalides." };

  try {
    await requireSuperAdmin();
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("companies")
      .update({ status: parsed.data.status })
      .eq("id", parsed.data.companyId)
      .select("id, status")
      .maybeSingle();

    if (error) return { error: error.message };
    if (!data) return { error: "Entreprise introuvable." };

    revalidatePath("/superadmin");
    revalidatePath(`/superadmin/companies/${parsed.data.companyId}`);
    return {
      success: parsed.data.status === "active" ? "Entreprise activée." : "Entreprise suspendue.",
    };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Erreur inattendue." };
  }
}
