"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import { updateProfile } from "@/actions/company";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ProfileForm({ fullName, email }: { fullName: string; email: string }) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [name, setName] = React.useState(fullName);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    const result = await updateProfile(name);
    setPending(false);
    if (result.error) toast.error(result.error);
    else {
      toast.success(result.success);
      router.refresh();
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="profile-name">Nom complet</Label>
        <Input id="profile-name" value={name} onChange={(event) => setName(event.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Email de connexion</Label>
        <Input value={email} disabled className="bg-slate-50" />
        <p className="text-[11px] text-slate-400">
          L'adresse email de connexion ne peut pas être modifiée ici.
        </p>
      </div>
      <Button type="submit" variant="outline" disabled={pending}>
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        Mettre à jour mon profil
      </Button>
    </form>
  );
}
