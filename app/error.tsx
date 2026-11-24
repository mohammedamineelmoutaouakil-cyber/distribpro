"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F8FAFC] px-4 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
        <AlertTriangle className="h-6 w-6" />
      </span>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight text-navy">
        Une erreur est survenue
      </h1>
      <p className="mt-2 max-w-md text-sm text-slate-500">
        L'application a rencontré un problème inattendu. Vous pouvez réessayer ou revenir plus tard.
      </p>
      {error.digest && (
        <p className="mt-2 font-mono text-[11px] text-slate-400">Référence : {error.digest}</p>
      )}
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Button onClick={reset}>
          <RotateCcw className="h-4 w-4" /> Réessayer
        </Button>
        <Button asChild variant="outline">
          <a href="/">Accueil</a>
        </Button>
      </div>
    </div>
  );
}
