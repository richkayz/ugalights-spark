import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function buildClient(key: string): SupabaseClient<Database> {
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        // sb_ keys are opaque, not JWTs — send them only as `apikey`.
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
}

/** Publishable-key client for public storefront reads (RLS applies as anon). */
export function publicClient(): SupabaseClient<Database> {
  const key =
    process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["SUPABASE_ANON_KEY"] ?? "";
  return buildClient(key);
}

/** Service-role client. Only for verified privileged work (orders, admin writes). */
export function serviceClient(): SupabaseClient<Database> {
  return buildClient(process.env["SUPABASE_SERVICE_ROLE_KEY"]!);
}
