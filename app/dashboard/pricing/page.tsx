import { Info } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { PricingManager } from "@/components/dashboard/pricing-manager";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { requireCompanyAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { CustomerAccount, CustomerGroup, Product } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ customer?: string }>;
}) {
  const params = await searchParams;
  const ctx = await requireCompanyAdmin();
  const supabase = await createClient();

  const [{ data: products }, { data: groups }, { data: customers }, { data: groupPrices }, { data: customerPrices }] =
    await Promise.all([
      supabase
        .from("products")
        .select("id, name, sku, base_price_centimes")
        .eq("company_id", ctx.company.id)
        .order("name"),
      supabase
        .from("customer_groups")
        .select("id, name")
        .eq("company_id", ctx.company.id)
        .order("name"),
      supabase
        .from("customer_accounts")
        .select("id, company_name, group_id, customer_groups(name)")
        .eq("company_id", ctx.company.id)
        .order("company_name"),
      supabase
        .from("customer_group_prices")
        .select("*, products(name, sku, base_price_centimes), customer_groups(name)")
        .eq("company_id", ctx.company.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("customer_specific_prices")
        .select("*, products(name, sku, base_price_centimes), customer_accounts(company_name)")
        .eq("company_id", ctx.company.id)
        .order("created_at", { ascending: false }),
    ]);

  const productOptions = ((products ?? []) as Pick<Product, "id" | "name" | "sku" | "base_price_centimes">[]).map(
    (product) => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      basePriceCentimes: Number(product.base_price_centimes),
    })
  );

  const groupRows = (groupPrices ?? []).map((row) => {
    const product = Array.isArray(row.products) ? row.products[0] : row.products;
    const group = Array.isArray(row.customer_groups) ? row.customer_groups[0] : row.customer_groups;
    return {
      id: row.id,
      productId: row.product_id,
      productName: product?.name ?? "Produit",
      sku: product?.sku ?? "",
      groupId: row.group_id,
      groupName: group?.name ?? "Groupe",
      basePriceCentimes: Number(product?.base_price_centimes ?? 0),
      priceCentimes: Number(row.price_centimes),
    };
  });

  const customerRows = (customerPrices ?? []).map((row) => {
    const product = Array.isArray(row.products) ? row.products[0] : row.products;
    const customer = Array.isArray(row.customer_accounts) ? row.customer_accounts[0] : row.customer_accounts;
    return {
      id: row.id,
      productId: row.product_id,
      productName: product?.name ?? "Produit",
      sku: product?.sku ?? "",
      customerId: row.customer_id,
      customerName: customer?.company_name ?? "Client",
      basePriceCentimes: Number(product?.base_price_centimes ?? 0),
      priceCentimes: Number(row.price_centimes),
    };
  });

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Tarifs personnalisés"
        description="Définissez des prix professionnels par groupe de clients ou par client individuel."
      />

      <Alert variant="info" className="mb-6">
        <Info />
        <AlertTitle>Ordre de priorité des prix</AlertTitle>
        <AlertDescription>
          Tarif client individuel → tarif du groupe client → prix de base du produit. Les prix sont
          recalculés côté serveur au moment de la commande.
        </AlertDescription>
      </Alert>

      <PricingManager
        products={productOptions}
        groups={(groups ?? []) as CustomerGroup[]}
        customers={((customers ?? []) as (Pick<CustomerAccount, "id" | "company_name" | "group_id"> & {
          customer_groups: { name: string } | { name: string }[] | null;
        })[]).map((customer) => {
          const group = Array.isArray(customer.customer_groups)
            ? customer.customer_groups[0]
            : customer.customer_groups;
          return {
            id: customer.id,
            companyName: customer.company_name,
            groupName: group?.name ?? null,
          };
        })}
        groupPrices={groupRows}
        customerPrices={customerRows}
        initialCustomerId={params.customer}
      />
    </div>
  );
}
