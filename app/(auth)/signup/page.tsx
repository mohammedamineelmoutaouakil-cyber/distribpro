import type { Metadata } from "next";
import Link from "next/link";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = { title: "Créer un espace fournisseur" };

export default function SignupPage() {
  return (
    <div className="animate-fade-in">
      <div className="mb-7">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">14 jours d'essai</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-navy">Créer votre espace fournisseur</h1>
        <p className="mt-2 text-sm text-slate-500">
          Configurez votre catalogue et invitez vos clients professionnels en quelques minutes.
        </p>
      </div>

      <SignupForm />

      <p className="mt-6 text-center text-sm text-slate-500">
        Vous avez déjà un compte ?{" "}
        <Link href="/login" className="font-medium text-brand hover:underline">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
