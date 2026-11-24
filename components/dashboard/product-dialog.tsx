"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { saveProduct } from "@/actions/products";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { centimesToInput } from "@/lib/money";

const formSchema = z.object({
  name: z.string().trim().min(2, "Le nom est requis").max(180),
  sku: z
    .string()
    .trim()
    .min(1, "La référence est requise")
    .max(64)
    .regex(/^[A-Za-z0-9._\-/]+$/, "Lettres, chiffres, . _ - / uniquement"),
  categoryId: z.string().optional(),
  description: z.string().max(2000, "Maximum 2000 caractères").optional(),
  basePrice: z
    .string()
    .trim()
    .min(1, "Le prix est requis")
    .refine((v) => /^\d+([.,]\d{1,2})?$/.test(v.replace(/\s/g, "")), "Prix invalide (ex: 1250.00)"),
  minOrderQty: z.number().int().min(1, "Minimum 1").max(100000),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

export interface EditableProduct {
  id: string;
  name: string;
  sku: string;
  categoryId: string | null;
  description: string | null;
  basePriceCentimes: number;
  minOrderQty: number;
  isActive: boolean;
  isFeatured: boolean;
  imageUrl: string | null;
}

export function ProductDialog({
  open,
  onOpenChange,
  product,
  categories,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: EditableProduct | null;
  categories: { id: string; name: string }[];
  onSaved: () => void;
}) {
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<string | null>(null);
  const [removeImage, setRemoveImage] = React.useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      sku: "",
      categoryId: "",
      description: "",
      basePrice: "",
      minOrderQty: 1,
      isActive: true,
      isFeatured: false,
    },
  });

  React.useEffect(() => {
    if (!open) return;
    setError(null);
    setImageFile(null);
    setPreview(null);
    setRemoveImage(false);
    if (product) {
      form.reset({
        name: product.name,
        sku: product.sku,
        categoryId: product.categoryId ?? "",
        description: product.description ?? "",
        basePrice: centimesToInput(product.basePriceCentimes),
        minOrderQty: product.minOrderQty,
        isActive: product.isActive,
        isFeatured: product.isFeatured,
      });
    } else {
      form.reset({
        name: "",
        sku: "",
        categoryId: "",
        description: "",
        basePrice: "",
        minOrderQty: 1,
        isActive: true,
        isFeatured: false,
      });
    }
  }, [open, product, form]);

  React.useEffect(() => {
    if (!imageFile) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  async function onSubmit(values: FormValues) {
    setPending(true);
    setError(null);
    const formData = new FormData();
    if (product) formData.set("id", product.id);
    formData.set("name", values.name);
    formData.set("sku", values.sku);
    formData.set("categoryId", values.categoryId ?? "");
    formData.set("description", values.description ?? "");
    formData.set("basePrice", values.basePrice);
    formData.set("minOrderQty", String(values.minOrderQty));
    formData.set("isActive", String(values.isActive));
    formData.set("isFeatured", String(values.isFeatured));
    if (imageFile) formData.set("image", imageFile);
    if (removeImage) formData.set("removeImage", "true");

    const result = await saveProduct(formData);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    toast.success(result.success ?? "Produit enregistré");
    onOpenChange(false);
    onSaved();
  }

  const currentImage = preview ?? (removeImage ? null : product?.imageUrl ?? null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{product ? "Modifier le produit" : "Nouveau produit"}</DialogTitle>
          <DialogDescription>
            Les prix sont en dirhams marocains (MAD). La quantité minimum s'applique à chaque commande.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="product-name">Nom du produit *</Label>
              <Input id="product-name" placeholder="Mitigeur lavabo chromé" {...form.register("name")} />
              {form.formState.errors.name && <p className="text-xs text-rose-600">{form.formState.errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-sku">Référence / SKU *</Label>
              <Input id="product-sku" placeholder="MIT-LAV-001" className="font-mono uppercase" {...form.register("sku")} />
              {form.formState.errors.sku && <p className="text-xs text-rose-600">{form.formState.errors.sku.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Catégorie</Label>
              <Controller
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <Select value={field.value || "none"} onValueChange={(value) => field.onChange(value === "none" ? "" : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sans catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sans catégorie</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-price">Prix de base (MAD) *</Label>
              <Input id="product-price" inputMode="decimal" placeholder="349.00" {...form.register("basePrice")} />
              {form.formState.errors.basePrice && <p className="text-xs text-rose-600">{form.formState.errors.basePrice.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-moq">Quantité minimum *</Label>
              <Input
                id="product-moq"
                type="number"
                min={1}
                {...form.register("minOrderQty", { valueAsNumber: true })}
              />
              {form.formState.errors.minOrderQty && <p className="text-xs text-rose-600">{form.formState.errors.minOrderQty.message}</p>}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="product-description">Description</Label>
              <Textarea id="product-description" placeholder="Caractéristiques, matériau, conditionnement…" {...form.register("description")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Image du produit</Label>
            <div className="flex items-center gap-3 rounded-lg border border-dashed border-slate-200 p-3">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-50">
                {currentImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={currentImage} alt="Aperçu" className="h-full w-full object-cover" />
                ) : (
                  <ImagePlus className="h-6 w-6 text-slate-300" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <Input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="cursor-pointer text-xs"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    setImageFile(file);
                    if (file) setRemoveImage(false);
                  }}
                />
                <p className="mt-1 text-[11px] text-slate-400">JPG, PNG ou WebP · 2 Mo maximum.</p>
                {(product?.imageUrl || imageFile) && (
                  <button
                    type="button"
                    onClick={() => {
                      setImageFile(null);
                      setRemoveImage(true);
                    }}
                    className="mt-1 inline-flex items-center gap-1 text-[11px] text-rose-600 hover:underline"
                  >
                    <Trash2 className="h-3 w-3" /> Supprimer l'image
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-4 rounded-lg border border-slate-200 bg-slate-50/60 p-4 sm:grid-cols-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-navy">Produit disponible</p>
                <p className="text-[11px] text-slate-400">Visible et commandable par vos clients.</p>
              </div>
              <Controller
                control={form.control}
                name="isActive"
                render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-navy">Produit mis en avant</p>
                <p className="text-[11px] text-slate-400">Affiché en priorité sur la page d'accueil client.</p>
              </div>
              <Controller
                control={form.control}
                name="isFeatured"
                render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              {product ? "Enregistrer" : "Créer le produit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
