"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireOperationalCompany } from "@/lib/auth";
import { orderStatusSchema } from "@/lib/validations";

export interface ActionResult {
  success?: string;
  error?: string;
}

export async function updateOrderStatus(input: unknown): Promise<ActionResult> {
  const parsed = orderStatusSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Données invalides." };

  try {
    const ctx = await requireOperationalCompany();
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("orders")
      .update({ status: parsed.data.status })
      .eq("id", parsed.data.orderId)
      .eq("company_id", ctx.company.id)
      .select("id, reference, status")
      .maybeSingle();

    if (error) return { error: error.message };
    if (!data) return { error: "Commande introuvable." };

    revalidatePath("/dashboard/orders");
    revalidatePath(`/dashboard/orders/${parsed.data.orderId}`);
    revalidatePath("/dashboard");
    revalidatePath("/portal/orders");
    revalidatePath(`/portal/orders/${parsed.data.orderId}`);
    return { success: `Statut de la commande ${data.reference} mis à jour.` };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Erreur inattendue." };
  }
}
