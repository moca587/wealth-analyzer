// ─────────────────────────────────────────────────────────────────
// Next.js middleware — refreshes the Supabase session on every
// request so server components see a fresh user. Also gates the
// /app/* routes behind auth.
// ─────────────────────────────────────────────────────────────────

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { securityHeaders } from "@/lib/csp";

/**
 * Stamp the security headers on whatever response we end up returning.
 * Done here rather than in next.config's headers() because that is
 * evaluated at BUILD time, which froze the CSP's Supabase origin to
 * whatever the build environment happened to have. See lib/csp.ts.
 */
function secured(res: NextResponse): NextResponse {
  for (const [k, v] of Object.entries(securityHeaders())) res.headers.set(k, v);
  return res;
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: "", ...options });
        }
      }
    }
  );

  // This refreshes the session if expired. If Supabase is unreachable, don't
  // 500 the entire site — fail open and let the page's own guard + error
  // boundary handle it, so an auth-provider blip degrades gracefully.
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch (e) {
    console.error("[middleware] supabase.auth.getUser failed:", e);
    return secured(response);
  }

  // Gate the /app/* routes — must be signed in
  const isAppRoute = request.nextUrl.pathname.startsWith("/app");
  const isAuthRoute =
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/signup");

  if (isAppRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", request.nextUrl.pathname);
    return secured(NextResponse.redirect(url));
  }
  if (isAuthRoute && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/app";
    return secured(NextResponse.redirect(url));
  }

  return secured(response);
}

export const config = {
  matcher: [
    // Skip Next.js internals and static assets
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"
  ]
};
