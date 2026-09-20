// ─────────────────────────────────────────────────────────────────
// Where the Supabase clients point.
//
// NEXT_PUBLIC_SUPABASE_URL is what the BROWSER reaches, and is inlined into
// the client bundle. SUPABASE_INTERNAL_URL is optional and overrides it for
// SERVER-side code only (middleware, server components, route handlers), for
// setups where the server reaches Supabase at a different address than the
// browser does — e.g. docker compose, where the app container calls
// http://kong:8000 while the browser calls http://localhost:54321.
// Unset, behaviour is unchanged.
//
// COOKIE NAME: @supabase/ssr names the auth cookie after the URL's first
// hostname label ("sb-<label>-auth-token"). With two URLs the browser would
// write sb-localhost-auth-token while the server looked for sb-kong-auth-token
// and nobody would ever appear signed in. So every client, browser and server,
// pins the name derived from the PUBLIC url — identical to the library's own
// default when no override is set, so existing sessions survive.
// ─────────────────────────────────────────────────────────────────

export function publicSupabaseUrl(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_URL!;
}

/** URL for server-side calls: the internal override when set, else public. */
export function serverSupabaseUrl(): string {
  return (process.env.SUPABASE_INTERNAL_URL || "").trim() || publicSupabaseUrl();
}

export function authCookieName(): string {
  try {
    return `sb-${new URL(publicSupabaseUrl()).hostname.split(".")[0]}-auth-token`;
  } catch {
    return "sb-auth-token";
  }
}
