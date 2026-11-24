import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OnboardingForm } from "@/components/auth/onboarding-form";
import { getAuthUser, getCompanyContext } from "@/lib/auth";
import { Boxes } from "lucide-react";

export const metadata: Metadata = { title: "Configurer mon entreprise" };
export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const user = await getAuthUser();
  if (!user) redirect("/login?next=/onboarding");
  const ctx = await getCompanyContext();
  if (ctx) redirect("/dashboard");

  return (
    <div className="animate-fade-in">
      <div className="mb-7">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy text-white">
          <Boxes className="h-5 w-5" />
        </span>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-navy">Configurer votre entreprise</h1>
        <p className="mt-2 text-sm text-slate-500">
          Dernière étape : créez votre espace fournisseur. Votre essai de 14 jours démarre immédiatement.
        </p>
      </div>
      <OnboardingForm
        email={user.email ?? ""}
        fullName={(user.user_metadata?.full_name as string | undefined) ?? ""}
      />
    </div>
  );
}
