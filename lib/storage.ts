import type { SupabaseClient } from "@supabase/supabase-js";

export const PRODUCT_BUCKET = "product-images";
export const BRAND_BUCKET = "company-assets";

export async function getSignedUrl(
  supabase: SupabaseClient,
  bucket: string,
  path: string | null | undefined,
  expiresIn = 3600
): Promise<string | null> {
  if (!path) return null;
  const { data } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  return data?.signedUrl ?? null;
}

export async function getSignedUrls(
  supabase: SupabaseClient,
  bucket: string,
  paths: (string | null | undefined)[],
  expiresIn = 3600
): Promise<Map<string, string>> {
  const unique = Array.from(new Set(paths.filter((p): p is string => !!p)));
  const map = new Map<string, string>();
  if (unique.length === 0) return map;

  const { data } = await supabase.storage.from(bucket).createSignedUrls(unique, expiresIn);
  for (const item of data ?? []) {
    if (item.path && item.signedUrl) map.set(item.path, item.signedUrl);
  }
  return map;
}

export function storagePath(companyId: string, productId: string, fileName: string) {
  return `${companyId}/${productId}/${fileName}`;
}
