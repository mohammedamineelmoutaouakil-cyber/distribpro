"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import { registerCompanyAction } from "@/actions/auth";
import { FormAlert, SubmitButton } from "@/components/auth/form-helpers";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SECTORS } from "@/lib/constants";

export function OnboardingForm({ email, fullName }: { email: string; fullName: string }) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    const result = await registerCompanyAction({
      companyName: String(formData.get("companyName") ?? ""),
      sector: String(formData.get("sector") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      fullName,
    });
    if (result.error) {
      setError(result.error);
      setPending(false);
      return;
    }
    toast.success("Espace entreprise créé");
    router.push(result.redirectTo ?? "/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <FormAlert error={error} />
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
        Connecté en tant que <span className="font-medium text-navy">{email}</span>
      </div>
      <div className="space-y-2">
        <Label htmlFor="companyName">Nom de l'entreprise</Label>
        <Input id="companyName" name="companyName" required minLength={2} placeholder="Atlas Distribution" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="sector">Secteur d'activité</Label>
        <select
          id="sector"
          name="sector"
          className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-navy shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
        >
          {SECTORS.map((sector) => (
            <option key={sector} value={sector}>
              {sector}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Téléphone professionnel</Label>
        <Input id="phone" name="phone" required minLength={6} placeholder="06 12 34 56 78" />
      </div>
      <SubmitButton pending={pending}>Créer mon espace</SubmitButton>
    </form>
  );
}
