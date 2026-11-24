"use client";

import { Ban, Loader2, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import { setCompanyStatus } from "@/actions/admin";
import { Button } from "@/components/ui/button";

export function CompanyStatusToggle({
  companyId,
  status,
  size = "sm",
}: {
  companyId: string;
  status: "active" | "suspended";
  size?: "sm" | "default";
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  async function toggle() {
    setPending(true);
    const next = status === "active" ? "suspended" : "active";
    const result = await setCompanyStatus({ companyId, status: next });
    setPending(false);
    if (result.error) toast.error(result.error);
    else {
      toast.success(result.success);
      router.refresh();
    }
  }

  return (
    <Button
      type="button"
      size={size}
      variant={status === "active" ? "outline" : "brand"}
      onClick={toggle}
      disabled={pending}
      className={status === "active" ? "text-rose-600 hover:text-rose-700" : undefined}
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : status === "active" ? (
        <Ban className="h-4 w-4" />
      ) : (
        <ShieldCheck className="h-4 w-4" />
      )}
      {status === "active" ? "Suspendre" : "Activer"}
    </Button>
  );
}
