// Maps raw Supabase auth error messages to friendly, user-facing copy so we
// never leak internal wording (or rate-limit internals) to the sign-in screen.

export function friendlyAuthError(message: string | undefined | null): string {
  const m = (message || "").toLowerCase();
  if (m.includes("invalid login credentials")) return "That email or password doesn't match our records.";
  if (m.includes("email not confirmed")) return "Please confirm your email first — check your inbox for the link.";
  if (m.includes("already registered") || m.includes("already exists")) return "An account with this email already exists — try signing in instead.";
  if (m.includes("password should be at least") || m.includes("password") && m.includes("6")) return "Please choose a longer password (at least 8 characters).";
  if (m.includes("rate limit") || m.includes("too many")) return "Too many attempts. Please wait a moment and try again.";
  if (m.includes("network") || m.includes("failed to fetch")) return "We couldn't reach the server. Check your connection and try again.";
  if (m.includes("user not found")) return "We couldn't find an account for that email.";
  return message || "Something went wrong. Please try again.";
}
