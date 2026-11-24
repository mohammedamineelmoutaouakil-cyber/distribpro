import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = { title: "Nouveau mot de passe" };

export default function ResetPasswordPage() {
  return (
    <div className="animate-fade-in">
      <div className="mb-7">
        <h1 className="text-2xl font-semibold tracking-tight text-navy">Nouveau mot de passe</h1>
        <p className="mt-2 text-sm text-slate-500">
          Choisissez un mot de passe fort. Vous serez reconnecté automatiquement.
        </p>
      </div>
      <ResetPasswordForm />
    </div>
  );
}
