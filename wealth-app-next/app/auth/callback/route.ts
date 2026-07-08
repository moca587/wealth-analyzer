// ─────────────────────────────────────────────────────────────────
// Auth callback — the landing route for Supabase PKCE links (email
// confirmation and password-reset). Exchanges the `?code=` for a
// session cookie, then redirects to `next` (default /app).
// Without this route, confirmation/reset links land unauthenticated
// and bounce straight back to /login.
// ─────────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") || "/app";
  const origin = url.origin;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  // No code — nothing to exchange.
  return NextResponse.redirect(`${origin}/login?error=auth`);
}
