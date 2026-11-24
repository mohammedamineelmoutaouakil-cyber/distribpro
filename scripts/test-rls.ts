import "dotenv/config";

import { createClient as createAnonClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anonKey || !serviceKey) {
  console.error("Variables Supabase requises : NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

async function main() {
  const admin = createAdminClient();
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const password = `RlsTest-${suffix}!`;

  const userAEmail = `rls-a-${suffix}@distribpro.test`;
  const userBEmail = `rls-b-${suffix}@distribpro.test`;

  const { data: userA, error: userAError } = await admin.auth.admin.createUser({
    email: userAEmail,
    password,
    email_confirm: true,
    user_metadata: { full_name: "RLS Test A" },
  });
  if (userAError || !userA.user) throw userAError ?? new Error("Utilisateur A non créé");

  const { data: userB, error: userBError } = await admin.auth.admin.createUser({
    email: userBEmail,
    password,
    email_confirm: true,
    user_metadata: { full_name: "RLS Test B" },
  });
  if (userBError || !userB.user) throw userBError ?? new Error("Utilisateur B non créé");

  const companyAId = crypto.randomUUID();
  const companyBId = crypto.randomUUID();

  try {
    const { error: companyAInsertError } = await admin.from("companies").insert({
      id: companyAId,
      name: `RLS Company A ${suffix}`,
      slug: `rls-a-${suffix}`,
      status: "active",
    });
    if (companyAInsertError) throw companyAInsertError;

    const { error: companyBInsertError } = await admin.from("companies").insert({
      id: companyBId,
      name: `RLS Company B ${suffix}`,
      slug: `rls-b-${suffix}`,
      status: "active",
    });
    if (companyBInsertError) throw companyBInsertError;

    const { error: membershipAError } = await admin.from("company_memberships").insert({
      company_id: companyAId,
      user_id: userA.user.id,
      role: "admin",
    });
    if (membershipAError) throw membershipAError;

    const { error: membershipBError } = await admin.from("company_memberships").insert({
      company_id: companyBId,
      user_id: userB.user.id,
      role: "admin",
    });
    if (membershipBError) throw membershipBError;

    const { data: productA, error: productAError } = await admin
      .from("products")
      .insert({
        company_id: companyAId,
        name: "Produit A",
        sku: `SKU-A-${suffix}`,
        base_price_centimes: 1000,
      })
      .select("id")
      .single();
    if (productAError || !productA) throw productAError ?? new Error("Produit A non créé");

    const { data: productB, error: productBError } = await admin
      .from("products")
      .insert({
        company_id: companyBId,
        name: "Produit B",
        sku: `SKU-B-${suffix}`,
        base_price_centimes: 2000,
      })
      .select("id")
      .single();
    if (productBError || !productB) throw productBError ?? new Error("Produit B non créé");

    const clientA = createAnonClient(url!, anonKey!);
    const clientB = createAnonClient(url!, anonKey!);

    const { error: signInAError } = await clientA.auth.signInWithPassword({
      email: userAEmail,
      password,
    });
    if (signInAError) throw signInAError;

    const { error: signInBError } = await clientB.auth.signInWithPassword({
      email: userBEmail,
      password,
    });
    if (signInBError) throw signInBError;

    // User A must not see Company B's product.
    const { data: leakedProducts, error: selectError } = await clientA
      .from("products")
      .select("id")
      .eq("company_id", companyBId);
    if (selectError) throw selectError;
    assert((leakedProducts ?? []).length === 0, "RLS échoué : l'utilisateur A voit les produits de la société B.");

    // User A must not be able to insert into Company B.
    const { error: insertError } = await clientA.from("products").insert({
      company_id: companyBId,
      name: "Intrusion",
      sku: `SKU-INTRUSION-${suffix}`,
      base_price_centimes: 1,
    });
    assert(insertError, "RLS échoué : l'utilisateur A a pu insérer dans la société B.");

    console.log("✅ Test RLS réussi : isolation inter-entreprises vérifiée.");
  } finally {
    await admin.from("companies").delete().eq("id", companyAId);
    await admin.from("companies").delete().eq("id", companyBId);
    await admin.auth.admin.deleteUser(userA.user!.id);
    await admin.auth.admin.deleteUser(userB.user!.id);
  }
}

main().catch((error) => {
  console.error("Échec du test RLS :", error);
  process.exit(1);
});
