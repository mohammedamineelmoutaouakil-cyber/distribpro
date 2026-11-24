"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { signupAction } from "@/actions/auth";
import { FormAlert, PasswordInput, SubmitButton } from "@/components/auth/form-helpers";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SECTORS } from "@/lib/constants";
import { signupSchema, type SignupInput } from "@/lib/validations";

export function SignupForm() {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  const form = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      companyName: "",
      sector: SECTORS[0],
      phone: "",
      acceptTerms: false as unknown as true,
    },
  });

  async function onSubmit(values: SignupInput) {
    setPending(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await signupAction(values);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.success) setSuccess(result.success);
      toast.success("Compte créé");
      if (result.redirectTo) {
        router.push(result.redirectTo);
        router.refresh();
      }
    } catch {
      setError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setPending(false);
    }
  }

  const errors = form.formState.errors;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <FormAlert error={error} success={success} />

      <div className="space-y-2">
        <Label htmlFor="companyName">Nom de l'entreprise</Label>
        <Input id="companyName" placeholder="Atlas Distribution" {...form.register("companyName")} />
        {errors.companyName && <p className="text-xs text-rose-600">{errors.companyName.message}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="sector">Secteur d'activité</Label>
          <select
            id="sector"
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-navy shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            {...form.register("sector")}
          >
            {SECTORS.map((sector) => (
              <option key={sector} value={sector}>
                {sector}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Téléphone</Label>
          <Input id="phone" placeholder="06 12 34 56 78" {...form.register("phone")} />
          {errors.phone && <p className="text-xs text-rose-600">{errors.phone.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="fullName">Votre nom complet</Label>
        <Input id="fullName" placeholder="Youssef El Amrani" {...form.register("fullName")} />
        {errors.fullName && <p className="text-xs text-rose-600">{errors.fullName.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Adresse email professionnelle</Label>
        <Input id="email" type="email" placeholder="vous@entreprise.ma" {...form.register("email")} />
        {errors.email && <p className="text-xs text-rose-600">{errors.email.message}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="password">Mot de passe</Label>
          <PasswordInput id="password" placeholder="8 caractères minimum" {...form.register("password")} />
          {errors.password && <p className="text-xs text-rose-600">{errors.password.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirmation</Label>
          <PasswordInput id="confirmPassword" placeholder="Répéter le mot de passe" {...form.register("confirmPassword")} />
          {errors.confirmPassword && <p className="text-xs text-rose-600">{errors.confirmPassword.message}</p>}
        </div>
      </div>

      <label className="flex items-start gap-2 text-xs text-slate-500">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand"
          {...form.register("acceptTerms")}
        />
        <span>
          J'accepte les conditions d'utilisation et la politique de confidentialité de DistribPro.
          {errors.acceptTerms && (
            <span className="mt-1 block text-rose-600">{errors.acceptTerms.message}</span>
          )}
        </span>
      </label>

      <SubmitButton pending={pending}>Créer mon espace</SubmitButton>
    </form>
  );
}
