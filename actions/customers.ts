"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireOperationalCompany } from "@/lib/auth";
import { customerSchema, customerStatusSchema } from "@/lib/validations";
import { assertPlanCapacity, PlanLimitError } from "@/lib/plan";
import { absoluteUrl } from "@/lib/utils";

export interface ActionResult {
  success?: string;
  error?: string;
  inviteUrl?: string;
}

export async function saveCustomer(input: unknown): Promise<ActionResult> {
  const parsed = customerSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Données invalides." };

  try {
    const ctx = await requireOperationalCompany();
    const supabase = await createClient();

    if (parsed.data.groupId) {
      const { data: group } = await supabase
        .from("customer_groups")
        .select("id")
        .eq("id", parsed.data.groupId)
        .eq("company_id", ctx.company.id)
        .maybeSingle();
      if (!group) return { error: "Groupe client invalide." };
    }

    if (parsed.data.id) {
      const { data: existing } = await supabase
        .from("customer_accounts")
        .select("id, user_id, email, invite_token")
        .eq("id", parsed.data.id)
        .eq("company_id", ctx.company.id)
        .maybeSingle();
      if (!existing) return { error: "Client introuvable." };

      if (existing.user_id && existing.email.toLowerCase() !== parsed.data.email.toLowerCase()) {
        return {
          error:
            "Impossible de modifier l'email d'un compte déjà activé. Créez un nouveau compte client.",
        };
      }

      const { error } = await supabase
        .from("customer_accounts")
        .update({
          company_name: parsed.data.companyName,
          contact_name: parsed.data.contactName,
          email: parsed.data.email,
          phone: parsed.data.phone,
          city: parsed.data.city,
          address: parsed.data.address,
          ice: parsed.data.ice,
          group_id: parsed.data.groupId ?? null,
          notes: parsed.data.notes,
        })
        .eq("id", parsed.data.id)
        .eq("company_id", ctx.company.id);

      if (error) {
        if (error.code === "23505") return { error: "Un client avec cet email existe déjà." };
        return { error: error.message };
      }

      revalidatePath("/dashboard/customers");
      revalidatePath(`/dashboard/customers/${parsed.data.id}`);
      return { success: "Client mis à jour." };
    }

    await assertPlanCapacity(supabase, ctx, "customers", 1);

    const { data: created, error } = await supabase
      .from("customer_accounts")
      .insert({
        company_id: ctx.company.id,
        company_name: parsed.data.companyName,
        contact_name: parsed.data.contactName,
        email: parsed.data.email,
        phone: parsed.data.phone,
        city: parsed.data.city,
        address: parsed.data.address,
        ice: parsed.data.ice,
        group_id: parsed.data.groupId ?? null,
        notes: parsed.data.notes,
        status: "invited",
      })
      .select("id, invite_token")
      .single();

    if (error || !created) {
      if (error?.code === "23505") return { error: "Un client avec cet email existe déjà." };
      return { error: error?.message ?? "Création impossible." };
    }

    revalidatePath("/dashboard/customers");
    revalidatePath("/dashboard");
    return {
      success: "Client créé. Partagez le lien d'invitation pour qu'il active son compte.",
      inviteUrl: created.invite_token ? absoluteUrl(`/invite/${created.invite_token}`) : undefined,
    };
  } catch (error) {
    if (error instanceof PlanLimitError) return { error: error.message };
    return { error: error instanceof Error ? error.message : "Erreur inattendue." };
  }
}

export async function setCustomerStatus(input: unknown): Promise<ActionResult> {
  const parsed = customerStatusSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Données invalides." };

  try {
    const ctx = await requireOperationalCompany();
    const supabase = await createClient();

    const { data: customer } = await supabase
      .from("customer_accounts")
      .select("id, user_id, status")
      .eq("id", parsed.data.customerId)
      .eq("company_id", ctx.company.id)
      .maybeSingle();
    if (!customer) return { error: "Client introuvable." };

    if (parsed.data.status === "active" && !customer.user_id) {
      return { error: "Le client doit d'abord accepter l'invitation avant d'être activé." };
    }

    if (parsed.data.status === "active" && customer.status !== "active") {
      await assertPlanCapacity(supabase, ctx, "customers", 1);
    }

    const { error } = await supabase
      .from("customer_accounts")
      .update({ status: parsed.data.status })
      .eq("id", parsed.data.customerId)
      .eq("company_id", ctx.company.id);

    if (error) return { error: error.message };

    revalidatePath("/dashboard/customers");
    revalidatePath(`/dashboard/customers/${parsed.data.customerId}`);
    revalidatePath("/dashboard");
    revalidatePath("/portal");
    return { success: "Statut du client mis à jour." };
  } catch (error) {
    if (error instanceof PlanLimitError) return { error: error.message };
    return { error: error instanceof Error ? error.message : "Erreur inattendue." };
  }
}

export async function regenerateInvite(customerId: string): Promise<ActionResult> {
  try {
    const ctx = await requireOperationalCompany();
    const supabase = await createClient();
    const { data: customer } = await supabase
      .from("customer_accounts")
      .select("id, user_id, status")
      .eq("id", customerId)
      .eq("company_id", ctx.company.id)
      .maybeSingle();
    if (!customer) return { error: "Client introuvable." };
    if (customer.user_id) return { error: "Ce client a déjà activé son compte." };

    const { data, error } = await supabase
      .from("customer_accounts")
      .update({ status: "invited", invite_token: crypto.randomUUID() })
      .eq("id", customerId)
      .eq("company_id", ctx.company.id)
      .select("invite_token")
      .single();
    if (error || !data?.invite_token) return { error: error?.message ?? "Impossible de régénérer le lien." };

    revalidatePath("/dashboard/customers");
    return {
      success: "Nouveau lien d'invitation généré.",
      inviteUrl: absoluteUrl(`/invite/${data.invite_token}`),
    };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Erreur inattendue." };
  }
}

export async function deleteCustomer(customerId: string): Promise<ActionResult> {
  try {
    const ctx = await requireOperationalCompany();
    const supabase = await createClient();
    const { error } = await supabase
      .from("customer_accounts")
      .delete()
      .eq("id", customerId)
      .eq("company_id", ctx.company.id);
    if (error) {
      if (error.code === "23503") {
        return { error: "Ce client possède des commandes et ne peut pas être supprimé. Suspendez-le." };
      }
      return { error: error.message };
    }
    revalidatePath("/dashboard/customers");
    revalidatePath("/dashboard");
    return { success: "Client supprimé." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Erreur inattendue." };
  }
}
