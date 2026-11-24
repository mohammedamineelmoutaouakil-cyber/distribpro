"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { updateCompanySettings } from "@/actions/company";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SECTORS } from "@/lib/constants";

const schema = z.object({
  name: z.string().trim().min(2, "Le nom est requis").max(160),
  sector: z.string().max(80).optional(),
  description: z.string().max(1000).optional(),
  phone: z.string().max(30).optional(),
  whatsapp: z.string().max(30).optional(),
  email: z.union([z.string().email("Email invalide"), z.literal("")]).optional(),
  address: z.string().max(300).optional(),
  city: z.string().max(80).optional(),
  ice: z.string().max(30).optional(),
  website: z.string().max(200).optional(),
});

type FormValues = z.infer<typeof schema>;

export function CompanySettingsForm({
  company,
}: {
  company: {
    name: string;
    sector: string | null;
    description: string | null;
    phone: string | null;
    whatsapp: string | null;
    email: string | null;
    address: string | null;
    city: string | null;
    ice: string | null;
    website: string | null;
  };
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: company.name,
      sector: company.sector ?? SECTORS[0],
      description: company.description ?? "",
      phone: company.phone ?? "",
      whatsapp: company.whatsapp ?? "",
      email: company.email ?? "",
      address: company.address ?? "",
      city: company.city ?? "",
      ice: company.ice ?? "",
      website: company.website ?? "",
    },
  });

  async function onSubmit(values: FormValues) {
    setPending(true);
    const result = await updateCompanySettings(values);
    setPending(false);
    if (result.error) toast.error(result.error);
    else {
      toast.success(result.success);
      router.refresh();
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="company-name">Nom de l'entreprise *</Label>
          <Input id="company-name" {...form.register("name")} />
          {form.formState.errors.name && <p className="text-xs text-rose-600">{form.formState.errors.name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="company-sector">Secteur</Label>
          <select
            id="company-sector"
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-navy shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            {...form.register("sector")}
          >
            {SECTORS.map((sector) => <option key={sector} value={sector}>{sector}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="company-phone">Téléphone</Label>
          <Input id="company-phone" placeholder="05 22 00 00 00" {...form.register("phone")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="company-whatsapp">WhatsApp commandes</Label>
          <Input id="company-whatsapp" placeholder="06 12 34 56 78" {...form.register("whatsapp")} />
          <p className="text-[11px] text-slate-400">Utilisé pour le bouton "Contacter le fournisseur" côté client.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="company-email">Email public</Label>
          <Input id="company-email" type="email" placeholder="contact@entreprise.ma" {...form.register("email")} />
          {form.formState.errors.email && <p className="text-xs text-rose-600">{form.formState.errors.email.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="company-city">Ville</Label>
          <Input id="company-city" placeholder="Casablanca" {...form.register("city")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="company-ice">ICE</Label>
          <Input id="company-ice" placeholder="001234567000012" {...form.register("ice")} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="company-address">Adresse</Label>
          <Input id="company-address" placeholder="Zone industrielle, rue 12" {...form.register("address")} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="company-website">Site web</Label>
          <Input id="company-website" placeholder="https://www.entreprise.ma" {...form.register("website")} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="company-description">Description de l'entreprise</Label>
          <Textarea
            id="company-description"
            placeholder="Présentation affichée sur votre portail client…"
            {...form.register("description")}
          />
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Enregistrer les modifications
        </Button>
      </div>
    </form>
  );
}
