import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { PRODUCT_IMAGE_MAX_BYTES, PRODUCT_IMAGE_TYPES } from "@/lib/constants";

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function validateImageFile(file: File | null): string | null {
  if (!file || file.size === 0) return "Aucun fichier sélectionné.";
  if (file.size > PRODUCT_IMAGE_MAX_BYTES) return "L'image ne doit pas dépasser 2 Mo.";
  if (!PRODUCT_IMAGE_TYPES.includes(file.type)) return "Format accepté : JPG, PNG ou WebP.";
  return null;
}

export async function uploadImage(
  supabase: SupabaseClient,
  bucket: string,
  companyId: string,
  folder: string,
  file: File
): Promise<{ path?: string; error?: string }> {
  const validation = validateImageFile(file);
  if (validation) return { error: validation };

  const extension = EXTENSIONS[file.type] ?? "bin";
  const path = `${companyId}/${folder}/${randomUUID()}.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage.from(bucket).upload(path, buffer, {
    contentType: file.type,
    cacheControl: "3600",
    upsert: false,
  });

  if (error) return { error: `Échec du téléversement : ${error.message}` };
  return { path };
}

export async function removeStorageFolder(
  supabase: SupabaseClient,
  bucket: string,
  prefix: string
) {
  try {
    const { data } = await supabase.storage.from(bucket).list(prefix, { limit: 1000 });
    if (data && data.length > 0) {
      await supabase.storage
        .from(bucket)
        .remove(data.map((item) => `${prefix}/${item.name}`));
    }
  } catch {
    // Best effort cleanup.
  }
}
