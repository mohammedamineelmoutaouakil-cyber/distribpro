"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { acceptInviteAction } from "@/actions/auth";
import { FormAlert, PasswordInput, SubmitButton } from "@/components/auth/form-helpers";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { passwordSchema } from "@/lib/validations";

const schema = z
  .object({
    fullName: z.string().trim().min(2, "Votre nom est requis").max(120),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Les mots de passe ne correspondent pas",
  });

type Input = z.infer<typeof schema>;

export function InviteAcceptForm({
  token,
  email,
  supplierName,
}: {
  token: string;
  email: string;
  supplierName: string;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  const form = useForm<Input>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: "", password: "", confirmPassword: "" },
  });

  async function onSubmit(values: Input) {
    setPending(true);
    setError(null);
    setSuccess(null);
    const result = await acceptInviteAction({
      token,
      fullName: values.fullName,
      email,
      password: values.password,
      confirmPassword: values.confirmPassword,
    });
    if (result.error) setError(result.error);
    if (result.success) {
      setSuccess(result.success);
      toast.success("Invitation acceptée");
    }
    if (result.redirectTo) {
      router.push(result.redirectTo);
      router.refresh();
    }
    setPending(false);
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <FormAlert error={error} success={success} />
      <div className="space-y-2">
        <Label>Adresse email</Label>
        <Input value={email} readOnly disabled className="bg-slate-50" />
        <p className="text-xs text-slate-400">
          L'invitation est liée à cette adresse. Contactez {supplierName} pour la modifier.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="fullName">Votre nom complet</Label>
        <Input id="fullName" placeholder="Nom et prénom" {...form.register("fullName")} />
        {form.formState.errors.fullName && (
          <p className="text-xs text-rose-600">{form.formState.errors.fullName.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Mot de passe</Label>
        <PasswordInput id="password" autoComplete="new-password" {...form.register("password")} />
        {form.formState.errors.password && (
          <p className="text-xs text-rose-600">{form.formState.errors.password.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
        <PasswordInput id="confirmPassword" autoComplete="new-password" {...form.register("confirmPassword")} />
        {form.formState.errors.confirmPassword && (
          <p className="text-xs text-rose-600">{form.formState.errors.confirmPassword.message}</p>
        )}
      </div>
      <SubmitButton pending={pending}>Créer mon accès client</SubmitButton>
      <p className="text-center text-xs text-slate-400">
        Votre compte restera en attente jusqu'à validation par votre fournisseur.
      </p>
    </form>
  );
}
