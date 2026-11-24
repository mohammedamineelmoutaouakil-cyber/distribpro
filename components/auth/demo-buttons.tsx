"use client";

import { ArrowRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { demoLoginAction } from "@/actions/auth";

export function DemoButtons({
  kind,
  disabled,
}: {
  kind: "admin" | "customer";
  disabled?: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function login() {
    setPending(true);
    setError(null);
    const result = await demoLoginAction(kind);
    if (result.error) {
      setError(result.error);
      setPending(false);
      return;
    }
    router.push(result.redirectTo ?? "/");
    router.refresh();
  }

  return (
    <div>
      <button
        type="button"
        onClick={login}
        disabled={disabled || pending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-navy px-4 py-2.5 text-sm font-medium text-white transition hover:bg-navy-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {kind === "admin" ? "Ouvrir la démo fournisseur" : "Ouvrir la démo client"}
        {!pending && <ArrowRight className="h-4 w-4" />}
      </button>
      {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}
    </div>
  );
}
