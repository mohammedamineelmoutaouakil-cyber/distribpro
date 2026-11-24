"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { resetPasswordAction } from "@/actions/auth";
import { FormAlert, PasswordInput, SubmitButton } from "@/components/auth/form-helpers";
import { Label } from "@/components/ui/label";
import { resetPasswordSchema } from "@/lib/validations";
import { z } from "zod";

type Input = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordForm() {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  const form = useForm<Input>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  async function onSubmit(values: Input) {
    setPending(true);
    setError(null);
    setSuccess(null);
    const result = await resetPasswordAction(values);
    if (result.error) setError(result.error);
    if (result.success) {
      setSuccess(result.success);
      toast.success("Mot de passe mis à jour");
      router.push(result.redirectTo ?? "/login");
      router.refresh();
    }
    setPending(false);
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <FormAlert error={error} success={success} />
      <div className="space-y-2">
        <Label htmlFor="password">Nouveau mot de passe</Label>
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
      <SubmitButton pending={pending}>Mettre à jour</SubmitButton>
    </form>
  );
}
