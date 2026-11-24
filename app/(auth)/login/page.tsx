import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Connexion" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">Espace professionnel</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-navy">Connexion à DistribPro</h1>
        <p className="mt-2 text-sm text-slate-500">
          Accédez à votre tableau de bord fournisseur ou à votre portail de commandes.
        </p>
      </div>

      {params.error === "auth_callback" && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          Le lien d'authentification est invalide ou expiré. Réessayez.
        </div>
      )}

      <LoginForm nextPath={params.next} />

      <p className="mt-6 text-center text-sm text-slate-500">
        Pas encore de compte fournisseur ?{" "}
        <Link href="/signup" className="font-medium text-brand hover:underline">
          Créer mon espace
        </Link>
      </p>
      <p className="mt-2 text-center text-xs text-slate-400">
        Vous êtes client d'un fournisseur ? Utilisez le lien d'invitation reçu par email.
      </p>
    </div>
  );
}
