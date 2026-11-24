import type { Metadata } from "next";
import Link from "next/link";
import { Boxes, CheckCircle2, MailX } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { InviteAcceptForm } from "@/components/auth/invite-accept-form";
import { InviteLinkButton } from "@/components/auth/invite-link-button";

export const metadata: Metadata = { title: "Invitation client" };
export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface InviteInfo {
  supplier_name: string;
  supplier_logo_path: string | null;
  customer_company: string;
  email: string;
  status: string;
}

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  let info: InviteInfo | null = null;

  if (UUID_RE.test(token)) {
    const supabase = await createClient();
    const { data } = await supabase.rpc("get_invite_info", { p_token: token });
    const rows = (data ?? []) as InviteInfo[];
    info = rows[0] ?? null;
  }

  const user = await getAuthUser();

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <header className="border-b border-slate-200 bg-white">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold text-navy">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy text-white">
              <Boxes className="h-4 w-4" />
            </span>
            DistribPro
          </Link>
          <Link href="/login" className="text-sm text-slate-500 hover:text-navy">Connexion</Link>
        </div>
      </header>

      <main className="container max-w-lg py-12">
        {!info ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-soft">
            <MailX className="mx-auto h-10 w-10 text-slate-300" />
            <h1 className="mt-4 text-xl font-semibold text-navy">Invitation introuvable</h1>
            <p className="mt-2 text-sm text-slate-500">
              Ce lien est invalide, a expiré ou a déjà été utilisé. Contactez votre fournisseur
              pour obtenir une nouvelle invitation.
            </p>
            <Link href="/login" className="mt-6 inline-block text-sm font-medium text-brand hover:underline">
              Aller à la connexion
            </Link>
          </div>
        ) : info.status !== "invited" ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-soft">
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" />
            <h1 className="mt-4 text-xl font-semibold text-navy">Invitation déjà utilisée</h1>
            <p className="mt-2 text-sm text-slate-500">
              Ce compte a déjà été associé. Connectez-vous pour accéder au portail de{" "}
              <span className="font-medium text-navy">{info.supplier_name}</span>.
            </p>
            <Link href="/login" className="mt-6 inline-block text-sm font-medium text-brand hover:underline">
              Se connecter
            </Link>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-soft sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">
              Invitation fournisseur
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-navy">
              Rejoindre le portail de {info.supplier_name}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Votre compte professionnel <span className="font-medium text-navy">{info.customer_company}</span>{" "}
              a été créé par votre fournisseur. Définissez votre mot de passe pour y accéder.
            </p>

            <div className="mt-6">
              {user ? (
                <div className="space-y-4">
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
                    Vous êtes connecté en tant que <span className="font-medium">{user.email}</span>.
                    Associez ce compte à l'invitation si l'adresse correspond à{" "}
                    <span className="font-medium">{info.email}</span>.
                  </div>
                  <InviteLinkButton token={token} />
                  <p className="text-center text-xs text-slate-400">
                    Une autre adresse ?{" "}
                    <Link href="/login" className="text-brand hover:underline">Changer de compte</Link>
                  </p>
                </div>
              ) : (
                <InviteAcceptForm token={token} email={info.email} supplierName={info.supplier_name} />
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
