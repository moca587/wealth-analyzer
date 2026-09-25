// ─────────────────────────────────────────────────────────────────
// Browser-side Supabase client.
// Used in Client Components ("use client") and event handlers.
// ─────────────────────────────────────────────────────────────────

import { createBrowserClient } from "@supabase/ssr";
import { authCookieName } from "./config";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookieOptions: { name: authCookieName() } }
  );
}
