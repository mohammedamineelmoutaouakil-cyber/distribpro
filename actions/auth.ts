"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request";
import {
  loginSchema,
  signupSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  inviteAcceptSchema,
} from "@/lib/validations";
import { absoluteUrl } from "@/lib/utils";
import { slugify } from "@/lib/utils";

export interface AuthActionResult {
  error?: string;
  success?: string;
  redirectTo?: string;
}

function firstIssue(error: { issues: { message: string }[] }) {
  return error.issues[0]?.message ?? "Données invalides.";
}

function mapRpcError(message: string): string {
  if (message.includes("ALREADY_MEMBER"))
    return "Vous avez déjà créé une entreprise avec ce compte.";
  if (message.includes("INVITE_NOT_FOUND")) return "Cette invitation est invalide ou a expiré.";
  if (message.includes("INVITE_ALREADY_USED")) return "Cette invitation a déjà été utilisée.";
  if (message.includes("EMAIL_MISMATCH"))
    return "Cette invitation a été envoyée à une autre adresse email.";
  if (message.includes("AUTH_REQUIRED")) return "Vous devez être connecté.";
  return message;
}

async function resolveDestination(userId: string): Promise<string> {
  const supabase = await createClient();

  const { data: admin } = await supabase
    .from("platform_admins")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (admin) return "/superadmin";

  const { data: membership } = await supabase
    .from("company_memberships")
    .select("company_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();
  if (membership) return "/dashboard";

  const { data: customer } = await supabase
    .from("customer_accounts")
    .select("id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();
  if (customer) return "/portal";

  return "/onboarding";
}

export async function loginAction(input: unknown): Promise<AuthActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const ip = await getClientIp();
  const limit = rateLimit(rateLimitKey("login", `${ip}:${parsed.data.email}`), 8, 5 * 60_000);
  if (!limit.success) {
    return {
      error: `Trop de tentatives. Réessayez dans ${limit.retryAfterSeconds} secondes.`,
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error || !data.user) {
    return { error: "Email ou mot de passe incorrect." };
  }

  return { redirectTo: await resolveDestination(data.user.id) };
}

export async function signupAction(input: unknown): Promise<AuthActionResult> {
  const parsed = signupSchema.safeParse(input);
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const ip = await getClientIp();
  const limit = rateLimit(rateLimitKey("signup", ip), 5, 60 * 60_000);
  if (!limit.success) {
    return { error: "Trop de créations de compte. Réessayez plus tard." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName, phone: parsed.data.phone },
      emailRedirectTo: absoluteUrl("/auth/callback?next=/dashboard"),
    },
  });

  if (error) return { error: error.message };
  if (!data.user) return { error: "Impossible de créer le compte." };

  // With email confirmation disabled, a session is immediately available.
  if (!data.session) {
    return {
      success:
        "Compte créé. Vérifiez votre boîte email pour confirmer votre adresse, puis connectez-vous pour finaliser la configuration de votre entreprise.",
      redirectTo: "/login",
    };
  }

  const { error: rpcError } = await supabase.rpc("register_company", {
    p_company_name: parsed.data.companyName,
    p_slug: slugify(parsed.data.companyName) || "entreprise",
    p_sector: parsed.data.sector,
    p_phone: parsed.data.phone,
    p_email: parsed.data.email,
    p_full_name: parsed.data.fullName,
  });

  if (rpcError && !rpcError.message.includes("ALREADY_MEMBER")) {
    return {
      success: "Compte créé. Finalisez la configuration de votre entreprise.",
      redirectTo: "/onboarding",
    };
  }

  return { redirectTo: "/dashboard" };
}

export async function registerCompanyAction(input: {
  companyName: string;
  sector: string;
  phone: string;
  fullName?: string;
}): Promise<AuthActionResult> {
  const companyName = input.companyName?.trim() ?? "";
  const sector = input.sector?.trim() ?? "";
  const phone = input.phone?.trim() ?? "";
  if (companyName.length < 2) return { error: "Le nom de l'entreprise est requis." };
  if (sector.length < 2) return { error: "Le secteur est requis." };
  if (phone.length < 6) return { error: "Le téléphone est requis." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Vous devez être connecté." };

  const { error } = await supabase.rpc("register_company", {
    p_company_name: companyName,
    p_slug: slugify(companyName) || "entreprise",
    p_sector: sector,
    p_phone: phone,
    p_email: user.email,
    p_full_name: input.fullName ?? null,
  });

  if (error) return { error: mapRpcError(error.message) };
  return { redirectTo: "/dashboard" };
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function forgotPasswordAction(input: unknown): Promise<AuthActionResult> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const ip = await getClientIp();
  const limit = rateLimit(rateLimitKey("forgot", `${ip}:${parsed.data.email}`), 5, 15 * 60_000);
  if (!limit.success) return { error: "Trop de demandes. Réessayez plus tard." };

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: absoluteUrl("/auth/callback?next=/reset-password"),
  });

  return {
    success:
      "Si un compte existe avec cet email, un lien de réinitialisation vient d'être envoyé.",
  };
}

export async function resetPasswordAction(input: unknown): Promise<AuthActionResult> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Lien invalide ou expiré. Demandez un nouveau lien." };

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: error.message };

  return { success: "Mot de passe mis à jour.", redirectTo: "/login" };
}

export async function acceptInviteAction(input: unknown): Promise<AuthActionResult> {
  const parsed = inviteAcceptSchema.safeParse(input);
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const ip = await getClientIp();
  const limit = rateLimit(rateLimitKey("invite", ip), 10, 30 * 60_000);
  if (!limit.success) return { error: "Trop de tentatives. Réessayez plus tard." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        data: { full_name: parsed.data.fullName },
        emailRedirectTo: absoluteUrl(`/invite/${parsed.data.token}`),
      },
    });
    if (error) return { error: error.message };
    if (!data.session) {
      return {
        success:
          "Compte créé. Confirmez votre adresse email, puis rouvrez ce lien d'invitation pour associer votre compte.",
        redirectTo: "/login",
      };
    }
  }

  const { error: rpcError } = await supabase.rpc("accept_customer_invite", {
    p_token: parsed.data.token,
  });

  if (rpcError) return { error: mapRpcError(rpcError.message) };

  return {
    success:
      "Invitation acceptée. Votre compte est en attente de validation par votre fournisseur.",
    redirectTo: "/portal",
  };
}

export async function linkExistingInviteAction(token: string): Promise<AuthActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("accept_customer_invite", { p_token: token });
  if (error) return { error: mapRpcError(error.message) };
  return {
    success: "Invitation acceptée. Votre compte est en attente de validation.",
    redirectTo: "/portal",
  };
}

export async function demoLoginAction(kind: "admin" | "customer" | "superadmin"): Promise<AuthActionResult> {
  const email =
    kind === "admin"
      ? process.env.DEMO_ADMIN_EMAIL
      : kind === "customer"
        ? process.env.DEMO_CUSTOMER_EMAIL
        : process.env.DEMO_SUPERADMIN_EMAIL;
  const password =
    kind === "admin"
      ? process.env.DEMO_ADMIN_PASSWORD
      : kind === "customer"
        ? process.env.DEMO_CUSTOMER_PASSWORD
        : process.env.DEMO_SUPERADMIN_PASSWORD;

  if (!email || !password) {
    return {
      error:
        "Les comptes de démonstration ne sont pas configurés. Lancez `npm run seed:demo` et renseignez les variables DEMO_*.",
    };
  }

  const ip = await getClientIp();
  const limit = rateLimit(rateLimitKey("demo", ip), 20, 10 * 60_000);
  if (!limit.success) return { error: "Trop de connexions de démonstration." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return {
      error:
        "Connexion de démonstration impossible. Vérifiez que la base a été initialisée avec `npm run seed:demo`.",
    };
  }

  return {
    redirectTo: kind === "admin" ? "/dashboard" : kind === "customer" ? "/portal" : "/superadmin",
  };
}
