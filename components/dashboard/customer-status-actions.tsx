"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import { setCustomerStatus } from "@/actions/customers";
import { Button } from "@/components/ui/button";

export function CustomerStatusActions({
  customerId,
  status,
  hasUser,
}: {
  customerId: string;
  status: string;
  hasUser: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  async function update(next: "active" | "suspended") {
    setPending(true);
    const result = await setCustomerStatus({ customerId, status: next });
    setPending(false);
    if (result.error) toast.error(result.error);
    else {
      toast.success(result.success);
      router.refresh();
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status !== "active" && hasUser && (
        <Button size="sm" onClick={() => update("active")} disabled={pending}>
          Activer l'accès
        </Button>
      )}
      {status === "active" && (
        <Button size="sm" variant="outline" onClick={() => update("suspended")} disabled={pending}>
          Suspendre
        </Button>
      )}
      {!hasUser && (
        <span className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
          En attente d'acceptation de l'invitation
        </span>
      )}
    </div>
  );
}
