"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { loginAction } from "@/actions/auth";
import { FormAlert, PasswordInput, SubmitButton } from "@/components/auth/form-helpers";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginSchema, type LoginInput } from "@/lib/validations";

export function LoginForm({ nextPath }: { nextPath?: string }) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginInput) {
    setPending(true);
    setError(null);
    try {
      const result = await loginAction(values);
      if (result.error) {
        setError(result.error);
        return;
      }
      toast.success("Connexion réussie");
      const destination =
        nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//")
          ? nextPath
          : result.redirectTo ?? "/dashboard";
      router.push(destination);
      router.refresh();
    } catch {
      setError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <FormAlert error={error} />
      <div className="space-y-2">
        <Label htmlFor="email">Adresse email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="vous@entreprise.ma"
          {...form.register("email")}
        />
        {form.formState.errors.email && (
          <p className="text-xs text-rose-600">{form.formState.errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Mot de passe</Label>
          <Link href="/forgot-password" className="text-xs font-medium text-brand hover:underline">
            Mot de passe oublié ?
          </Link>
        </div>
        <PasswordInput
          id="password"
          autoComplete="current-password"
          placeholder="••••••••"
          {...form.register("password")}
        />
        {form.formState.errors.password && (
          <p className="text-xs text-rose-600">{form.formState.errors.password.message}</p>
        )}
      </div>

      <SubmitButton pending={pending}>Se connecter</SubmitButton>

      <p className="text-center text-xs text-slate-400">
        En vous connectant, vous acceptez les conditions d'utilisation de DistribPro.
      </p>
    </form>
  );
}
