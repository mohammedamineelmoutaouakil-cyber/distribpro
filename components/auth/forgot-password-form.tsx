"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import * as React from "react";
import { useForm } from "react-hook-form";
import { forgotPasswordAction } from "@/actions/auth";
import { FormAlert, SubmitButton } from "@/components/auth/form-helpers";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotPasswordSchema } from "@/lib/validations";
import { z } from "zod";

type Input = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  const form = useForm<Input>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: Input) {
    setPending(true);
    setError(null);
    setSuccess(null);
    const result = await forgotPasswordAction(values);
    setError(result.error ?? null);
    setSuccess(result.success ?? null);
    setPending(false);
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <FormAlert error={error} success={success} />
      <div className="space-y-2">
        <Label htmlFor="email">Adresse email</Label>
        <Input id="email" type="email" placeholder="vous@entreprise.ma" {...form.register("email")} />
        {form.formState.errors.email && (
          <p className="text-xs text-rose-600">{form.formState.errors.email.message}</p>
        )}
      </div>
      <SubmitButton pending={pending}>Envoyer le lien</SubmitButton>
    </form>
  );
}
