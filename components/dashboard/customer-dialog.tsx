"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { saveCustomer } from "@/actions/customers";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const schema = z.object({
  companyName: z.string().trim().min(2, "Le nom de l'entreprise est requis").max(160),
  contactName: z.string().max(120).optional(),
  email: z.string().trim().email("Email invalide").max(255),
  phone: z.string().max(30).optional(),
  city: z.string().max(80).optional(),
  address: z.string().max(300).optional(),
  ice: z.string().max(30).optional(),
  groupId: z.string().optional(),
  notes: z.string().max(1000).optional(),
});

type FormValues = z.infer<typeof schema>;

export interface EditableCustomer {
  id: string;
  companyName: string;
  contactName: string | null;
  email: string;
  phone: string | null;
  city: string | null;
  address: string | null;
  ice: string | null;
  groupId: string | null;
  notes: string | null;
}

export function CustomerDialog({
  open,
  onOpenChange,
  customer,
  groups,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: EditableCustomer | null;
  groups: { id: string; name: string }[];
  onSaved: (inviteUrl?: string) => void;
}) {
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      companyName: "",
      contactName: "",
      email: "",
      phone: "",
      city: "",
      address: "",
      ice: "",
      groupId: "",
      notes: "",
    },
  });

  React.useEffect(() => {
    if (!open) return;
    setError(null);
    form.reset(
      customer
        ? {
            companyName: customer.companyName,
            contactName: customer.contactName ?? "",
            email: customer.email,
            phone: customer.phone ?? "",
            city: customer.city ?? "",
            address: customer.address ?? "",
            ice: customer.ice ?? "",
            groupId: customer.groupId ?? "",
            notes: customer.notes ?? "",
          }
        : {
            companyName: "",
            contactName: "",
            email: "",
            phone: "",
            city: "",
            address: "",
            ice: "",
            groupId: groups[0]?.id ?? "",
            notes: "",
          }
    );
  }, [open, customer, form, groups]);

  async function onSubmit(values: FormValues) {
    setPending(true);
    setError(null);
    const result = await saveCustomer({
      id: customer?.id,
      companyName: values.companyName,
      contactName: values.contactName ?? "",
      email: values.email,
      phone: values.phone ?? "",
      city: values.city ?? "",
      address: values.address ?? "",
      ice: values.ice ?? "",
      groupId: values.groupId || null,
      notes: values.notes ?? "",
    });
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    toast.success(result.success ?? "Client enregistré");
    onOpenChange(false);
    onSaved(result.inviteUrl);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{customer ? "Modifier le client" : "Nouveau client professionnel"}</DialogTitle>
          <DialogDescription>
            Le client devra accepter l'invitation puis être activé avant de pouvoir commander.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="customer-company">Entreprise *</Label>
              <Input id="customer-company" placeholder="Sanitaire Plus SARL" {...form.register("companyName")} />
              {form.formState.errors.companyName && (
                <p className="text-xs text-rose-600">{form.formState.errors.companyName.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-contact">Contact</Label>
              <Input id="customer-contact" placeholder="Mohammed Alaoui" {...form.register("contactName")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-email">Email *</Label>
              <Input id="customer-email" type="email" placeholder="contact@client.ma" {...form.register("email")} />
              {form.formState.errors.email && (
                <p className="text-xs text-rose-600">{form.formState.errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-phone">Téléphone</Label>
              <Input id="customer-phone" placeholder="06 12 34 56 78" {...form.register("phone")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-city">Ville</Label>
              <Input id="customer-city" placeholder="Casablanca" {...form.register("city")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-ice">ICE (optionnel)</Label>
              <Input id="customer-ice" placeholder="001234567000012" {...form.register("ice")} />
            </div>
            <div className="space-y-2">
              <Label>Groupe tarifaire</Label>
              <Select
                value={form.watch("groupId") || "none"}
                onValueChange={(value) => form.setValue("groupId", value === "none" ? "" : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Standard" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun groupe</SelectItem>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="customer-address">Adresse</Label>
              <Input id="customer-address" placeholder="12 rue des Artisans, Zone industrielle" {...form.register("address")} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="customer-notes">Notes internes</Label>
              <Textarea id="customer-notes" placeholder="Conditions de paiement, remarques…" {...form.register("notes")} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              {customer ? "Enregistrer" : "Créer et inviter"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
