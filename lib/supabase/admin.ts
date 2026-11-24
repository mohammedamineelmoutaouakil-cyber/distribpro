import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * SERVER-ONLY service-role client.
 * Used exclusively by seed / maintenance scripts. Never import this module
 * from a client component or expose the key through NEXT_PUBLIC_* variables.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY et NEXT_PUBLIC_SUPABASE_URL sont requis pour les scripts d'administration."
    );
  }
  return createSupabaseClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
