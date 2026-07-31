"use client";

import Link from "next/link";
import { useState, FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { friendlyAuthError } from "@/lib/auth-errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/auth/callback?next=/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    setLoading(false);
    // Always show the confirmation, even on error, so we don't reveal whether an
    // email is registered (account-enumeration safety).
    if (error && /rate limit|too many|network|failed to fetch/i.test(error.message)) {
      setError(friendlyAuthError(error.message));
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="text-center space-y-4">
        <h1 className="font-display text-3xl">Check your inbox</h1>
        <p className="text-muted-foreground">
          If an account exists for <strong>{email}</strong>, we&apos;ve sent a link to reset your password.
        </p>
        <div className="pt-4 text-sm">
          <Link href="/login" className="font-semibold text-accent hover:underline">&larr; Back to sign in</Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-4xl leading-tight mb-2">Reset your password.</h1>
      <p className="text-muted-foreground mb-8">Enter your email and we&apos;ll send you a reset link.</p>

      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" required value={email}
            onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </div>
        {error && (
          <div className="text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2">
            {error}
          </div>
        )}
        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? "Sending…" : "Send reset link"}
        </Button>
      </form>

      <div className="mt-8 pt-6 border-t border-border text-sm text-center">
        Remembered it?{" "}
        <Link href="/login" className="font-semibold text-accent hover:underline">Sign in &rarr;</Link>
      </div>
    </div>
  );
}
