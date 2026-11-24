import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PLANS, type PlanId } from "@/lib/constants";
import type {
  Company,
  CustomerAccount,
  CustomerGroup,
  Subscription,
} from "@/lib/types";
import { firstRelation } from "@/lib/utils";

export const getAuthUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export interface CompanyContext {
  user: NonNullable<Awaited<ReturnType<typeof getAuthUser>>>;
  membershipId: string;
  role: "admin" | "staff";
  company: Company;
  subscription: Subscription | null;
  plan: (typeof PLANS)[PlanId];
  isOperational: boolean;
  accessIssue: string | null;
}

export const getCompanyContext = cache(async (): Promise<CompanyContext | null> => {
  const user = await getAuthUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data: membership } = await supabase
    .from("company_memberships")
    .select("id, role, company_id, companies(*, subscriptions(*))")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!membership) return null;

  const company = firstRelation<Company>(
    (membership as unknown as { companies: Company | Company[] | null }).companies
  );
  if (!company) return null;

  const subscription = firstRelation<Subscription>(
    (membership as unknown as { companies: { subscriptions: Subscription | Subscription[] | null } | null })
      .companies?.subscriptions ?? null
  );

  const plan = PLANS[(subscription?.plan ?? "starter") as PlanId] ?? PLANS.starter;
  const now = Date.now();
  const subscriptionActive =
    !!subscription &&
    (subscription.status === "trial" || subscription.status === "active") &&
    new Date(subscription.expires_at).getTime() > now;
  const isOperational = company.status === "active" && subscriptionActive;

  let accessIssue: string | null = null;
  if (company.status !== "active") {
    accessIssue = "Ce compte entreprise est suspendu. Contactez le support DistribPro.";
  } else if (!subscription) {
    accessIssue = "Aucun abonnement actif. Contactez le support DistribPro.";
  } else if (subscription.status === "suspended") {
    accessIssue = "L'abonnement de cette entreprise est suspendu.";
  } else if (!subscriptionActive) {
    accessIssue = "L'abonnement a expiré. Renouvelez votre abonnement pour continuer.";
  }

  return {
    user,
    membershipId: membership.id,
    role: membership.role as "admin" | "staff",
    company,
    subscription,
    plan,
    isOperational,
    accessIssue,
  };
});

export async function requireCompanyAdmin(): Promise<CompanyContext> {
  const user = await getAuthUser();
  if (!user) redirect("/login?next=/dashboard");
  const ctx = await getCompanyContext();
  if (!ctx) redirect("/portal");
  if (ctx.role !== "admin") redirect("/login?error=unauthorized");
  return ctx;
}

export async function requireOperationalCompany(): Promise<CompanyContext> {
  const ctx = await requireCompanyAdmin();
  if (!ctx.isOperational) {
    throw new Error(ctx.accessIssue ?? "Abonnement inactif.");
  }
  return ctx;
}

export interface CustomerContext {
  user: NonNullable<Awaited<ReturnType<typeof getAuthUser>>>;
  customer: CustomerAccount;
  company: Company;
  group: CustomerGroup | null;
  subscription: Subscription | null;
  canOrder: boolean;
  accessIssue: string | null;
}

export const getCustomerContext = cache(async (): Promise<CustomerContext | null> => {
  const user = await getAuthUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data: customer } = await supabase
    .from("customer_accounts")
    .select("*, companies(*), customer_groups(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!customer) return null;

  const company = firstRelation<Company>(
    (customer as unknown as { companies: Company | Company[] | null }).companies
  );
  if (!company) return null;

  const group = firstRelation<CustomerGroup>(
    (customer as unknown as { customer_groups: CustomerGroup | CustomerGroup[] | null })
      .customer_groups
  );

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("company_id", company.id)
    .maybeSingle();

  const companyActive = company.status === "active";
  const subActive =
    !!subscription &&
    (subscription.status === "trial" || subscription.status === "active") &&
    new Date(subscription.expires_at).getTime() > Date.now();

  let accessIssue: string | null = null;
  if (customer.status === "invited") accessIssue = "Votre compte n'est pas encore activé.";
  else if (customer.status === "pending")
    accessIssue = "Votre compte est en attente de validation par votre fournisseur.";
  else if (customer.status === "suspended")
    accessIssue = "Votre compte client est suspendu. Contactez votre fournisseur.";
  else if (!companyActive) accessIssue = "La boutique de votre fournisseur est temporairement indisponible.";
  else if (!subActive) accessIssue = "L'abonnement de votre fournisseur est inactif.";

  return {
    user,
    customer: customer as CustomerAccount,
    company,
    group,
    subscription,
    canOrder: !accessIssue,
    accessIssue,
  };
});

export async function requireCustomer(options?: { allowPending?: boolean }): Promise<CustomerContext> {
  const user = await getAuthUser();
  if (!user) redirect("/login?next=/portal");
  const ctx = await getCustomerContext();
  if (!ctx) {
    const companyCtx = await getCompanyContext();
    if (companyCtx) redirect("/dashboard");
    redirect("/login");
  }
  return ctx;
}

export async function requireSuperAdmin() {
  const user = await getAuthUser();
  if (!user) redirect("/login?next=/superadmin");
  const supabase = await createClient();
  const { data: admin } = await supabase
    .from("platform_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!admin) redirect("/dashboard");
  return { user, supabase };
}

export async function isPlatformAdmin(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("platform_admins")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  return !!data;
}
