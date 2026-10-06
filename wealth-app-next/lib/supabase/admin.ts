// ─────────────────────────────────────────────────────────────────
// The service-role client. The FIRST legitimate use of the key that was
// deliberately kept out of the app until now.
//
// This bypasses every RLS policy in 006-013, so it exists for exactly one
// caller: the Stripe webhook, which is an unauthenticated server-to-server
// request that must write `organizations.is_paid` — a column no user may
// write, by design. Nothing user-facing may import this.
//
// FAIL CLOSED: with no SUPABASE_SERVICE_ROLE_KEY the factory throws rather
// than falling back to the anon client, so a misconfiguration cannot
// silently downgrade a privileged write into one RLS refuses.
// ─────────────────────────────────────────────────────────────────

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { serverSupabaseUrl } from "./config";

export function serviceRoleAvailable(): boolean {
  return !!(process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim()
    && !!(process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
}

let cached: SupabaseClient | null = null;

export function createAdminClient(): SupabaseClient {
  const url = (serverSupabaseUrl() || "").trim();
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  if (!url || !key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY (and NEXT_PUBLIC_SUPABASE_URL) are required for the " +
      "billing webhook. This key bypasses RLS — set it only in the server environment.",
    );
  }
  if (cached) return cached;
  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
