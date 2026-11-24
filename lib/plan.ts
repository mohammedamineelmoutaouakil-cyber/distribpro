import type { CompanyContext } from "@/lib/auth";
import type { SupabaseClient } from "@supabase/supabase-js";

export class PlanLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PlanLimitError";
  }
}

/** Server-side plan limit enforcement. Never trust the client for this check. */
export async function assertPlanCapacity(
  supabase: SupabaseClient,
  ctx: Pick<CompanyContext, "company" | "plan">,
  kind: "products" | "customers",
  additional = 1
) {
  if (kind === "products") {
    const { count } = await supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("company_id", ctx.company.id)
      .eq("is_active", true);
    if ((count ?? 0) + additional > ctx.plan.maxProducts) {
      throw new PlanLimitError(
        `Limite du plan ${ctx.plan.name} atteinte : ${ctx.plan.maxProducts} produits actifs maximum. Passez au plan Pro.`
      );
    }
  } else {
    const { count } = await supabase
      .from("customer_accounts")
      .select("id", { count: "exact", head: true })
      .eq("company_id", ctx.company.id)
      .neq("status", "suspended");
    if ((count ?? 0) + additional > ctx.plan.maxCustomers) {
      throw new PlanLimitError(
        `Limite du plan ${ctx.plan.name} atteinte : ${ctx.plan.maxCustomers} comptes clients maximum. Passez au plan Pro.`
      );
    }
  }
}

export function planUsageLabel(used: number, max: number) {
  return `${used} / ${max}`;
}
