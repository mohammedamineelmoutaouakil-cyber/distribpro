import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = { title: "Mot de passe oublié" };

export default function ForgotPasswordPage() {
  return (
    <div className="animate-fade-in">
      <div className="mb-7">
        <h1 className="text-2xl font-semibold tracking-tight text-navy">Mot de passe oublié</h1>
        <p className="mt-2 text-sm text-slate-500">
          Saisissez votre adresse email. Nous vous enverrons un lien sécurisé de réinitialisation.
        </p>
      </div>
      <ForgotPasswordForm />
      <p className="mt-6 text-center text-sm text-slate-500">
        <Link href="/login" className="font-medium text-brand hover:underline">
          Retour à la connexion
        </Link>
      </p>
    </div>
  );
}
