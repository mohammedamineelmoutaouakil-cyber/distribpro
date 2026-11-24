"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireCompanyAdmin, requireOperationalCompany } from "@/lib/auth";
import { companySettingsSchema } from "@/lib/validations";
import { BRAND_BUCKET } from "@/lib/storage";
import { removeStorageFolder, uploadImage, validateImageFile } from "@/lib/upload";

export interface ActionResult {
  success?: string;
  error?: string;
}

export async function updateCompanySettings(input: unknown): Promise<ActionResult> {
  const parsed = companySettingsSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  try {
    const ctx = await requireOperationalCompany();
    const supabase = await createClient();
    const { error } = await supabase
      .from("companies")
      .update({
        name: parsed.data.name,
        sector: parsed.data.sector,
        description: parsed.data.description,
        phone: parsed.data.phone,
        whatsapp: parsed.data.whatsapp,
        email: parsed.data.email,
        address: parsed.data.address,
        city: parsed.data.city,
        ice: parsed.data.ice,
        website: parsed.data.website,
      })
      .eq("id", ctx.company.id);

    if (error) return { error: error.message };

    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard");
    revalidatePath("/portal");
    return { success: "Paramètres enregistrés." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Erreur inattendue." };
  }
}

export async function uploadBrandAsset(formData: FormData): Promise<ActionResult> {
  const file = formData.get("file");
  const kind = String(formData.get("kind") ?? "logo");

  if (!(file instanceof File)) return { error: "Fichier requis." };
  const validation = validateImageFile(file);
  if (validation) return { error: validation };
  if (kind !== "logo" && kind !== "banner") return { error: "Type d'image invalide." };

  try {
    const ctx = await requireOperationalCompany();
    const supabase = await createClient();

    const uploaded = await uploadImage(supabase, BRAND_BUCKET, ctx.company.id, kind, file);
    if (uploaded.error || !uploaded.path) return { error: uploaded.error ?? "Échec du téléversement." };

    const previous = kind === "logo" ? ctx.company.logo_path : ctx.company.banner_path;
    const { error } = await supabase
      .from("companies")
      .update(kind === "logo" ? { logo_path: uploaded.path } : { banner_path: uploaded.path })
      .eq("id", ctx.company.id);

    if (error) return { error: error.message };

    if (previous) {
      await supabase.storage.from(BRAND_BUCKET).remove([previous]);
    }

    revalidatePath("/dashboard/settings");
    revalidatePath("/portal");
    return { success: kind === "logo" ? "Logo mis à jour." : "Bannière mise à jour." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Erreur inattendue." };
  }
}

export async function removeBrandAsset(kind: "logo" | "banner"): Promise<ActionResult> {
  try {
    const ctx = await requireOperationalCompany();
    const supabase = await createClient();
    const previous = kind === "logo" ? ctx.company.logo_path : ctx.company.banner_path;
    const { error } = await supabase
      .from("companies")
      .update(kind === "logo" ? { logo_path: null } : { banner_path: null })
      .eq("id", ctx.company.id);
    if (error) return { error: error.message };
    if (previous) await removeStorageFolder(supabase, BRAND_BUCKET, previous.split("/").slice(0, -1).join("/"));
    revalidatePath("/dashboard/settings");
    revalidatePath("/portal");
    return { success: "Image supprimée." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Erreur inattendue." };
  }
}

export async function updateProfile(fullName: string): Promise<ActionResult> {
  try {
    const ctx = await requireCompanyAdmin();
    const supabase = await createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName.trim().slice(0, 120) })
      .eq("id", ctx.user.id);
    if (error) return { error: error.message };
    revalidatePath("/dashboard/settings");
    return { success: "Profil mis à jour." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Erreur inattendue." };
  }
}
