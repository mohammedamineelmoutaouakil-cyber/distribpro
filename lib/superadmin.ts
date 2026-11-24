import type { SupabaseClient } from "@supabase/supabase-js";
import type { PlanId } from "@/lib/constants";
import type { Company, Subscription } from "@/lib/types";
import { firstRelation } from "@/lib/utils";

export interface CompanyAdminRow {
  id: string;
  name: string;
  slug: string;
  sector: string | null;
  status: "active" | "suspended";
  plan: PlanId;
  subscriptionStatus: string;
  expiresAt: string | null;
  productCount: number;
  customerCount: number;
  orderCount: number;
  createdAt: string;
}

export async function getCompaniesAdminRows(supabase: SupabaseClient): Promise<CompanyAdminRow[]> {
  const [{ data: companies }, { data: products }, { data: customers }, { data: orders }] =
    await Promise.all([
      supabase
        .from("companies")
        .select("*, subscriptions(*)")
        .order("created_at", { ascending: false }),
      supabase.from("products").select("company_id").limit(20000),
      supabase.from("customer_accounts").select("company_id, status").limit(20000),
      supabase.from("orders").select("company_id").limit(20000),
    ]);

  const productCounts = new Map<string, number>();
  for (const product of products ?? []) {
    productCounts.set(product.company_id, (productCounts.get(product.company_id) ?? 0) + 1);
  }

  const customerCounts = new Map<string, number>();
  for (const customer of customers ?? []) {
    if (customer.status === "suspended") continue;
    customerCounts.set(customer.company_id, (customerCounts.get(customer.company_id) ?? 0) + 1);
  }

  const orderCounts = new Map<string, number>();
  for (const order of orders ?? []) {
    orderCounts.set(order.company_id, (orderCounts.get(order.company_id) ?? 0) + 1);
  }

  return ((companies ?? []) as (Company & {
    subscriptions: Subscription | Subscription[] | null;
  })[]).map((company) => {
    const subscription = firstRelation<Subscription>(company.subscriptions);
    return {
      id: company.id,
      name: company.name,
      slug: company.slug,
      sector: company.sector,
      status: company.status,
      plan: (subscription?.plan ?? "starter") as PlanId,
      subscriptionStatus: subscription?.status ?? "expired",
      expiresAt: subscription?.expires_at ?? null,
      productCount: productCounts.get(company.id) ?? 0,
      customerCount: customerCounts.get(company.id) ?? 0,
      orderCount: orderCounts.get(company.id) ?? 0,
      createdAt: company.created_at,
    };
  });
}
