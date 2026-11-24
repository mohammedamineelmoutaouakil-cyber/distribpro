"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import { linkExistingInviteAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";

export function InviteLinkButton({ token }: { token: string }) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function link() {
    setPending(true);
    setError(null);
    const result = await linkExistingInviteAction(token);
    if (result.error) {
      setError(result.error);
      setPending(false);
      return;
    }
    toast.success("Invitation acceptée");
    router.push(result.redirectTo ?? "/portal");
    router.refresh();
  }

  return (
    <div>
      <Button onClick={link} disabled={pending} className="w-full">
        {pending ? "Association…" : "Associer mon compte à cette invitation"}
      </Button>
      {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}
    </div>
  );
}
