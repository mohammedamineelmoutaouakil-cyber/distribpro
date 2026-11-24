import { CustomersTable, type CustomerRow } from "@/components/dashboard/customers-table";
import { PageHeader } from "@/components/dashboard/page-header";
import { requireCompanyAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { CustomerAccount, CustomerGroup } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const ctx = await requireCompanyAdmin();
  const supabase = await createClient();

  const [{ data: customers }, { data: groups }, { data: orders }] = await Promise.all([
    supabase
      .from("customer_accounts")
      .select("*, customer_groups(id, name)")
      .eq("company_id", ctx.company.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("customer_groups")
      .select("id, name")
      .eq("company_id", ctx.company.id)
      .order("name"),
    supabase
      .from("orders")
      .select("customer_id, total_centimes")
      .eq("company_id", ctx.company.id),
  ]);

  const orderStats = new Map<string, { count: number; value: number }>();
  for (const order of orders ?? []) {
    const current = orderStats.get(order.customer_id) ?? { count: 0, value: 0 };
    orderStats.set(order.customer_id, {
      count: current.count + 1,
      value: current.value + Number(order.total_centimes),
    });
  }

  const rows: CustomerRow[] = ((customers ?? []) as (CustomerAccount & {
    customer_groups: Pick<CustomerGroup, "id" | "name"> | Pick<CustomerGroup, "id" | "name">[] | null;
  })[]).map((customer) => {
    const group = Array.isArray(customer.customer_groups)
      ? customer.customer_groups[0]
      : customer.customer_groups;
    const stats = orderStats.get(customer.id) ?? { count: 0, value: 0 };
    return {
      id: customer.id,
      companyName: customer.company_name,
      contactName: customer.contact_name,
      email: customer.email,
      phone: customer.phone,
      city: customer.city,
      groupId: customer.group_id,
      groupName: group?.name ?? null,
      status: customer.status,
      inviteToken: customer.invite_token,
      hasUser: !!customer.user_id,
      orderCount: stats.count,
      totalValue: stats.value,
      createdAt: customer.created_at,
    };
  });

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Clients professionnels"
        description={`${ctx.plan.maxCustomers} comptes clients maximum avec le plan ${ctx.plan.name}. Activez un client après acceptation de l'invitation.`}
      />
      <CustomersTable customers={rows} groups={(groups ?? []) as CustomerGroup[]} />
    </div>
  );
}
