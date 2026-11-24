import "dotenv/config";

import { createAdminClient } from "@/lib/supabase/admin";

const DEMO_SLUG = "atlas-distribution";
const DEMO_COMPANY_NAME = "Atlas Distribution";
const DEMO_SECTOR = "Sanitaire et plomberie";
const ADMIN_EMAIL = process.env.DEMO_ADMIN_EMAIL ?? "admin@atlas-demo.ma";
const ADMIN_PASSWORD = process.env.DEMO_ADMIN_PASSWORD ?? "Demo1234!";
const CUSTOMER_EMAIL = process.env.DEMO_CUSTOMER_EMAIL ?? "client@atlas-demo.ma";
const CUSTOMER_PASSWORD = process.env.DEMO_CUSTOMER_PASSWORD ?? "Demo1234!";
const SUPERADMIN_EMAIL = process.env.DEMO_SUPERADMIN_EMAIL ?? "superadmin@distribpro.ma";
const SUPERADMIN_PASSWORD = process.env.DEMO_SUPERADMIN_PASSWORD ?? "Demo1234!";

type CategorySeed = { name: string; slug: string; description: string; sortOrder: number };
type ProductSeed = { name: string; sku: string; categorySlug: string; description: string; price: number; moq: number; featured?: boolean };

const categories: CategorySeed[] = [
  { name: "Robinetterie", slug: "robinetterie", description: "Mitigeurs, robinets et accessoires sanitaires", sortOrder: 0 },
  { name: "Plomberie", slug: "plomberie", description: "Tubes, raccords et évacuation", sortOrder: 1 },
  { name: "Électricité", slug: "electricite", description: "Câbles, protections et appareillage", sortOrder: 2 },
  { name: "Éclairage", slug: "eclairage", description: "Lampes, luminaires et LED", sortOrder: 3 },
  { name: "Solaire", slug: "solaire", description: "Panneaux et équipements photovoltaïques", sortOrder: 4 },
];

const products: ProductSeed[] = [
  { name: "Mitigeur lavabo chromé", sku: "MIT-LAV-001", categorySlug: "robinetterie", description: "Mitigeur monocommande en laiton chromé, cartouche céramique.", price: 34900, moq: 6, featured: true },
  { name: "Mitigeur douche thermostatique", sku: "MIT-DCH-002", categorySlug: "robinetterie", description: "Mitigeur thermostatique avec inverseur bain/douche.", price: 69900, moq: 3 },
  { name: "Robinet d'arrêt 1/2\"", sku: "ROB-ARR-003", categorySlug: "robinetterie", description: "Robinet d'arrêt laiton nickelé, poignée papillon.", price: 4900, moq: 20 },
  { name: "Siphon lavabo chromé", sku: "SIP-LAV-004", categorySlug: "robinetterie", description: "Siphon tubulaire chromé avec bonde.", price: 8900, moq: 10 },
  { name: "Tube PVC Ø32 (4 m)", sku: "TUB-PVC-32", categorySlug: "plomberie", description: "Tube PVC pression Ø32, longueur 4 mètres.", price: 7500, moq: 10 },
  { name: "Coude PVC Ø32 90°", sku: "COU-PVC-32", categorySlug: "plomberie", description: "Coude PVC 90° pour évacuation.", price: 1200, moq: 50 },
  { name: "Raccord union 1/2\"", sku: "RAC-UNI-12", categorySlug: "plomberie", description: "Raccord union laiton pour raccordement rapide.", price: 2500, moq: 25 },
  { name: "Collier de fixation Ø32", sku: "COL-FIX-32", categorySlug: "plomberie", description: "Collier de fixation pour tube PVC.", price: 800, moq: 100 },
  { name: "Câble électrique 2,5 mm² (100 m)", sku: "CAB-25-100", categorySlug: "electricite", description: "Câble souple H07V-U, couronne de 100 mètres.", price: 18900, moq: 5, featured: true },
  { name: "Câble électrique 1,5 mm² (100 m)", sku: "CAB-15-100", categorySlug: "electricite", description: "Câble souple H07V-U, couronne de 100 mètres.", price: 12900, moq: 5 },
  { name: "Disjoncteur 16A", sku: "DISJ-16A", categorySlug: "electricite", description: "Disjoncteur modulaire 16A, courbe C.", price: 5900, moq: 10 },
  { name: "Prise électrique 2P+T", sku: "PRI-2PT", categorySlug: "electricite", description: "Prise murale 16A avec terre.", price: 2900, moq: 20 },
  { name: "Lampe LED 12W E27", sku: "LED-12W-E27", categorySlug: "eclairage", description: "Ampoule LED 12W, culot E27, blanc neutre.", price: 2500, moq: 20, featured: true },
  { name: "Spot LED encastrable 6W", sku: "SPOT-LED-6W", categorySlug: "eclairage", description: "Spot LED encastrable, diamètre 85 mm.", price: 3900, moq: 10 },
  { name: "Luminaire LED 60 cm", sku: "LUM-LED-60", categorySlug: "eclairage", description: "Réglette LED 60 cm pour bureau et atelier.", price: 14900, moq: 5 },
  { name: "Projecteur LED 50W", sku: "PROJ-LED-50", categorySlug: "eclairage", description: "Projecteur LED étanche 50W, extérieur.", price: 24900, moq: 4 },
  { name: "Panneau solaire 450W", sku: "PAN-SOL-450", categorySlug: "solaire", description: "Panneau monocristallin 450W.", price: 159000, moq: 2, featured: true },
  { name: "Onduleur solaire 3kW", sku: "OND-SOL-3K", categorySlug: "solaire", description: "Onduleur hybride 3 kW pour installation résidentielle.", price: 399000, moq: 1 },
  { name: "Câble solaire 4 mm² (100 m)", sku: "CAB-SOL-4", categorySlug: "solaire", description: "Câble solaire rouge/noir 4 mm², 100 mètres.", price: 24900, moq: 2 },
  { name: "Batterie lithium 48V 100Ah", sku: "BAT-LI-48", categorySlug: "solaire", description: "Batterie lithium pour stockage solaire.", price: 899000, moq: 1 },
];

async function ensureUser(email: string, password: string, metadata: Record<string, string>) {
  const admin = createAdminClient();
  const { data: list, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listError) throw listError;
  const existing = (list.users ?? []).find((user) => user.email?.toLowerCase() === email.toLowerCase());
  if (existing) return existing;

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: metadata,
  });
  if (error || !data.user) throw error ?? new Error(`Impossible de créer l'utilisateur ${email}`);
  return data.user;
}

async function main() {
  const admin = createAdminClient();
  const now = new Date();

  // Clean previous demo tenant if it exists.
  const { data: existingCompany } = await admin
    .from("companies")
    .select("id")
    .eq("slug", DEMO_SLUG)
    .maybeSingle();

  if (existingCompany?.id) {
    const { error } = await admin.from("companies").delete().eq("id", existingCompany.id);
    if (error) throw error;
  }

  const adminUser = await ensureUser(ADMIN_EMAIL, ADMIN_PASSWORD, { full_name: "Administrateur Atlas" });
  const customerUser = await ensureUser(CUSTOMER_EMAIL, CUSTOMER_PASSWORD, { full_name: "Mohammed Alaoui" });
  const superadminUser = await ensureUser(SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD, { full_name: "Super Administrateur" });

  const { data: company, error: companyError } = await admin
    .from("companies")
    .insert({
      name: DEMO_COMPANY_NAME,
      slug: DEMO_SLUG,
      sector: DEMO_SECTOR,
      description: "Distributeur sanitaire, électrique et solaire basé à Casablanca. Données de démonstration.",
      phone: "05 22 45 67 89",
      whatsapp: "06 61 23 45 67",
      email: "contact@atlas-distribution.ma",
      address: "Zone industrielle, 12 rue des Artisans",
      city: "Casablanca",
      ice: "001234567000089",
      website: "https://atlas-distribution.ma",
      status: "active",
    })
    .select("*")
    .single();
  if (companyError || !company) throw companyError ?? new Error("Entreprise non créée");

  const { error: subscriptionError } = await admin.from("subscriptions").insert({
    company_id: company.id,
    plan: "pro",
    status: "active",
    starts_at: now.toISOString(),
    expires_at: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  });
  if (subscriptionError) throw subscriptionError;

  const { error: membershipError } = await admin.from("company_memberships").insert({
    company_id: company.id,
    user_id: adminUser.id,
    role: "admin",
  });
  if (membershipError) throw membershipError;

  const { error: platformAdminError } = await admin
    .from("platform_admins")
    .upsert({ user_id: superadminUser.id }, { onConflict: "user_id" });
  if (platformAdminError) throw platformAdminError;

  const groupRows = [
    { company_id: company.id, name: "Standard", slug: "standard", description: "Client professionnel standard" },
    { company_id: company.id, name: "Professionnel", slug: "professionnel", description: "Client professionnel régulier" },
    { company_id: company.id, name: "VIP", slug: "vip", description: "Grand compte, tarifs privilégiés" },
  ];
  const { data: groups, error: groupsError } = await admin
    .from("customer_groups")
    .insert(groupRows)
    .select("*");
  if (groupsError || !groups) throw groupsError ?? new Error("Groupes non créés");

  const groupBySlug = new Map(groups.map((group) => [group.slug, group]));

  const { data: categoryRows, error: categoriesError } = await admin
    .from("categories")
    .insert(categories.map((category) => ({ company_id: company.id, ...category })))
    .select("*");
  if (categoriesError || !categoryRows) throw categoriesError ?? new Error("Catégories non créées");

  const categoryBySlug = new Map(categoryRows.map((category) => [category.slug, category]));

  const { data: productRows, error: productsError } = await admin
    .from("products")
    .insert(
      products.map((product) => ({
        company_id: company.id,
        category_id: categoryBySlug.get(product.categorySlug)?.id ?? null,
        name: product.name,
        sku: product.sku,
        description: product.description,
        base_price_centimes: product.price,
        min_order_qty: product.moq,
        is_active: true,
        is_featured: Boolean(product.featured),
      }))
    )
    .select("*");
  if (productsError || !productRows) throw productsError ?? new Error("Produits non créés");

  const productBySku = new Map(productRows.map((product) => [product.sku, product]));

  // Personalized pricing demonstration.
  const groupPrices: Array<{ company_id: string; product_id: string; group_id: string; price_centimes: number }> = [];
  const customerPrices: Array<{ company_id: string; product_id: string; customer_id: string; price_centimes: number }> = [];

  for (const product of productRows) {
    const professional = groupBySlug.get("professionnel");
    const vip = groupBySlug.get("vip");
    if (professional) {
      groupPrices.push({
        company_id: company.id,
        product_id: product.id,
        group_id: professional.id,
        price_centimes: Math.round(Number(product.base_price_centimes) * 0.95),
      });
    }
    if (vip) {
      groupPrices.push({
        company_id: company.id,
        product_id: product.id,
        group_id: vip.id,
        price_centimes: Math.round(Number(product.base_price_centimes) * 0.9),
      });
    }
  }

  const customersSeed = [
    {
      company_name: "Sanitaire Plus SARL",
      contact_name: "Mohammed Alaoui",
      email: CUSTOMER_EMAIL,
      phone: "06 61 23 45 67",
      city: "Casablanca",
      address: "18 rue des Plombiers, Sidi Bernoussi",
      ice: "001987654000045",
      groupSlug: "vip",
      status: "active",
      userId: customerUser.id,
      notes: "Client historique, commande mensuelle.",
    },
    {
      company_name: "Electro Maroc SARL",
      contact_name: "Fatima Zahra Benani",
      email: "fatima@atlas-demo.ma",
      phone: "06 72 11 22 33",
      city: "Rabat",
      address: "45 avenue Hassan II",
      ice: "001122334000012",
      groupSlug: "professionnel",
      status: "active",
      notes: "Commandes électriques récurrentes.",
    },
    {
      company_name: "Lumière Atlas",
      contact_name: "Youssef Idrissi",
      email: "youssef@atlas-demo.ma",
      phone: "06 65 44 55 66",
      city: "Marrakech",
      address: "12 boulevard Mohammed V",
      ice: null,
      groupSlug: "standard",
      status: "pending",
      notes: "En attente de validation après acceptation de l'invitation.",
    },
    {
      company_name: "Bati Pro Maroc",
      contact_name: "Karim Tazi",
      email: "karim@atlas-demo.ma",
      phone: "06 68 77 88 99",
      city: "Tanger",
      address: "Zone franche, lot 7",
      ice: "001555666000009",
      groupSlug: "professionnel",
      status: "invited",
      notes: "Invitation envoyée, compte non activé.",
    },
    {
      company_name: "Industriel Sud",
      contact_name: "Amina El Fassi",
      email: "amina@atlas-demo.ma",
      phone: "06 63 99 00 11",
      city: "Agadir",
      address: "Parc industriel, zone B",
      ice: "001777888000034",
      groupSlug: "vip",
      status: "suspended",
      notes: "Compte suspendu pour démonstration.",
    },
  ];

  const { data: customerRows, error: customersError } = await admin
    .from("customer_accounts")
    .insert(
      customersSeed.map((customer) => ({
        company_id: company.id,
        user_id: customer.userId ?? null,
        group_id: groupBySlug.get(customer.groupSlug)?.id ?? null,
        company_name: customer.company_name,
        contact_name: customer.contact_name,
        email: customer.email,
        phone: customer.phone,
        city: customer.city,
        address: customer.address,
        ice: customer.ice,
        status: customer.status,
        notes: customer.notes,
      }))
    )
    .select("*");
  if (customersError || !customerRows) throw customersError ?? new Error("Clients non créés");

  const customerByName = new Map(customerRows.map((customer) => [customer.company_name, customer]));

  // Individual prices for the first active VIP customer.
  const vipCustomer = customerByName.get("Sanitaire Plus SARL");
  if (vipCustomer) {
    for (const product of productRows.slice(0, 4)) {
      customerPrices.push({
        company_id: company.id,
        product_id: product.id,
        customer_id: vipCustomer.id,
        price_centimes: Math.round(Number(product.base_price_centimes) * 0.85),
      });
    }
  }

  if (groupPrices.length > 0) {
    const { error } = await admin.from("customer_group_prices").insert(groupPrices);
    if (error) throw error;
  }
  if (customerPrices.length > 0) {
    const { error } = await admin.from("customer_specific_prices").insert(customerPrices);
    if (error) throw error;
  }

  const priceMaps = new Map<string, Map<string, number>>();
  for (const customer of customerRows) {
    const map = new Map<string, number>();
    for (const product of productRows) map.set(product.id, Number(product.base_price_centimes));
    for (const groupPrice of groupPrices.filter((row) => row.group_id === customer.group_id)) {
      map.set(groupPrice.product_id, groupPrice.price_centimes);
    }
    for (const customerPrice of customerPrices.filter((row) => row.customer_id === customer.id)) {
      map.set(customerPrice.product_id, customerPrice.price_centimes);
    }
    priceMaps.set(customer.id, map);
  }

  const orderSeeds = [
    {
      customer: "Sanitaire Plus SARL",
      status: "completed",
      daysAgo: 45,
      notes: "Livraison atelier Casablanca.",
      items: [
        { sku: "MIT-LAV-001", quantity: 12 },
        { sku: "TUB-PVC-32", quantity: 20 },
        { sku: "LED-12W-E27", quantity: 40 },
      ],
    },
    {
      customer: "Sanitaire Plus SARL",
      status: "ready",
      daysAgo: 3,
      notes: "Retrait en agence.",
      items: [
        { sku: "CAB-25-100", quantity: 6 },
        { sku: "DISJ-16A", quantity: 15 },
      ],
    },
    {
      customer: "Electro Maroc SARL",
      status: "confirmed",
      daysAgo: 10,
      notes: "Facture pro forma demandée.",
      items: [
        { sku: "CAB-25-100", quantity: 10 },
        { sku: "CAB-15-100", quantity: 8 },
        { sku: "PRI-2PT", quantity: 30 },
      ],
    },
    {
      customer: "Electro Maroc SARL",
      status: "preparing",
      daysAgo: 1,
      notes: "Commande urgente.",
      items: [
        { sku: "DISJ-16A", quantity: 20 },
        { sku: "SPOT-LED-6W", quantity: 25 },
      ],
    },
    {
      customer: "Sanitaire Plus SARL",
      status: "pending",
      daysAgo: 0,
      notes: "Merci de confirmer le délai de livraison.",
      items: [
        { sku: "PAN-SOL-450", quantity: 4 },
        { sku: "CAB-SOL-4", quantity: 3 },
      ],
    },
    {
      customer: "Electro Maroc SARL",
      status: "completed",
      daysAgo: 28,
      notes: null,
      items: [
        { sku: "LUM-LED-60", quantity: 12 },
        { sku: "PROJ-LED-50", quantity: 6 },
      ],
    },
    {
      customer: "Sanitaire Plus SARL",
      status: "cancelled",
      daysAgo: 18,
      notes: "Annulée à la demande du client.",
      items: [{ sku: "OND-SOL-3K", quantity: 1 }],
    },
    {
      customer: "Electro Maroc SARL",
      status: "ready",
      daysAgo: 6,
      notes: "Prête pour enlèvement.",
      items: [
        { sku: "BAT-LI-48", quantity: 1 },
        { sku: "CAB-SOL-4", quantity: 2 },
      ],
    },
  ];

  for (let index = 0; index < orderSeeds.length; index += 1) {
    const seed = orderSeeds[index];
    const customer = customerByName.get(seed.customer);
    if (!customer) throw new Error(`Client introuvable : ${seed.customer}`);

    const priceMap = priceMaps.get(customer.id);
    if (!priceMap) throw new Error(`Prix introuvables pour ${customer.company_name}`);

    const createdAt = new Date(now.getTime() - seed.daysAgo * 24 * 60 * 60 * 1000).toISOString();
    const itemSnapshots = seed.items.map((item) => {
      const product = productBySku.get(item.sku);
      if (!product) throw new Error(`Produit introuvable : ${item.sku}`);
      const unitPrice = priceMap.get(product.id) ?? Number(product.base_price_centimes);
      return {
        product_id: product.id,
        product_name: product.name,
        sku: product.sku,
        quantity: item.quantity,
        unit_price_centimes: unitPrice,
        line_total_centimes: unitPrice * item.quantity,
      };
    });

    const total = itemSnapshots.reduce((sum, item) => sum + item.line_total_centimes, 0);

    const { data: order, error: orderError } = await admin
      .from("orders")
      .insert({
        company_id: company.id,
        customer_id: customer.id,
        reference: `DP-DEMO-${String(index + 1).padStart(3, "0")}`,
        status: seed.status,
        notes: seed.notes,
        item_count: itemSnapshots.length,
        total_centimes: total,
        created_at: createdAt,
        updated_at: createdAt,
      })
      .select("*")
      .single();
    if (orderError || !order) throw orderError ?? new Error("Commande non créée");

    const { error: itemsError } = await admin.from("order_items").insert(
      itemSnapshots.map((item) => ({
        order_id: order.id,
        company_id: company.id,
        ...item,
        created_at: createdAt,
      }))
    );
    if (itemsError) throw itemsError;
  }

  console.log("Seed démo terminé.");
  console.log(`Entreprise : ${DEMO_COMPANY_NAME} (${DEMO_SLUG})`);
  console.log(`Admin : ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  console.log(`Client : ${CUSTOMER_EMAIL} / ${CUSTOMER_PASSWORD}`);
  console.log(`Super admin : ${SUPERADMIN_EMAIL} / ${SUPERADMIN_PASSWORD}`);
}

main().catch((error) => {
  console.error("Échec du seed démo :", error);
  process.exit(1);
});
