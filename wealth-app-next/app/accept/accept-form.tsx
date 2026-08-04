"use client";

// ─────────────────────────────────────────────────────────────────
// Redeeming an invitation.
//
// This is the first screen a new colleague ever sees, and it is reached
// from an emailed link — so the three states it must handle well are
// "not signed in yet", "signed in as the wrong account", and "this link
// is no longer good". Each gets a specific next action, because a dead
// end here means the person emails the person who invited them and the
// firm concludes the product is broken.
//
// The wrong-account case is the interesting one: it happens whenever the
// invitation was forwarded, or when someone is already signed in as a
// different client of ours on the same browser. The server refuses it —
// that refusal is the whole security model — so this screen has to make
// the refusal legible rather than look like a bug.
// ─────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { setHouseholdId } from "@/lib/tenancy/client";

type State =
  | { phase: "checking" }
  | { phase: "no_token" }
  | { phase: "sign_in"; token: string }
  | { phase: "ready"; token: string; email: string }
  | { phase: "joining" }
  | { phase: "joined"; org: string | null }
  | { phase: "wrong_account"; message: string; email: string }
  | { phase: "invalid"; message: string };

export function AcceptForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [state, setState] = useState<State>({ phase: "checking" });

  useEffect(() => {
    if (!token) { setState({ phase: "no_token" }); return; }
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) setState({ phase: "sign_in", token });
      else setState({ phase: "ready", token, email: user.email ?? "" });
    })();
  }, [token]);

  const accept = useCallback(async () => {
    setState({ phase: "joining" });
    const res = await fetch("/api/team/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const body = await res.json().catch(() => ({}));

    if (res.ok) {
      // The new member's client list just changed completely. A stale
      // selection from a previous session on this browser would resolve to
      // a household they can no longer see, so clear it and let the
      // switcher pick again.
      setHouseholdId(null);
      setState({ phase: "joined", org: body.organization?.name ?? null });
      router.refresh();
      return;
    }
    if (body.code === "wrong_account") {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setState({ phase: "wrong_account", message: String(body.error), email: user?.email ?? "" });
      return;
    }
    setState({ phase: "invalid", message: String(body.error ?? "This invitation could not be used.") });
  }, [token, router]);

  async function signOutAndRetry() {
    const supabase = createClient();
    await supabase.auth.signOut();
    // Keep the token in the URL so they land back here after signing in.
    router.push(`/login?next=${encodeURIComponent(`/accept?token=${token}`)}`);
  }

  const Shell = ({ children }: { children: React.ReactNode }) => (
    <div className="container max-w-lg py-16">
      <Card><CardContent className="py-10 text-center space-y-4">{children}</CardContent></Card>
    </div>
  );

  switch (state.phase) {
    case "checking":
      return <Shell><p className="text-muted-foreground">Checking your invitation…</p></Shell>;

    case "no_token":
      return (
        <Shell>
          <h1 className="font-display text-3xl">No invitation here</h1>
          <p className="text-muted-foreground">
            This link is missing its invitation code. Ask whoever invited you to send it again.
          </p>
          <Button asChild variant="outline"><Link href="/login">Sign in</Link></Button>
        </Shell>
      );

    case "sign_in":
      return (
        <Shell>
          <h1 className="font-display text-3xl">You&apos;ve been invited</h1>
          <p className="text-muted-foreground">
            Sign in — or create an account — using <strong>the address this invitation
            was sent to</strong>. It will not work from any other account.
          </p>
          <div className="flex gap-3 justify-center">
            <Button asChild>
              <Link href={`/signup?next=${encodeURIComponent(`/accept?token=${token}`)}`}>Create account</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/login?next=${encodeURIComponent(`/accept?token=${token}`)}`}>Sign in</Link>
            </Button>
          </div>
        </Shell>
      );

    case "ready":
      return (
        <Shell>
          <h1 className="font-display text-3xl">Join your firm</h1>
          <p className="text-muted-foreground">
            You are signed in as <strong>{state.email}</strong>. Accepting will add this
            account to the firm that invited you.
          </p>
          <Button onClick={accept} size="lg">Accept invitation</Button>
          <p className="text-xs text-muted-foreground">
            Not you? <button onClick={signOutAndRetry} className="underline">Sign in as someone else</button>
          </p>
        </Shell>
      );

    case "joining":
      return <Shell><p className="text-muted-foreground">Joining…</p></Shell>;

    case "joined":
      return (
        <Shell>
          <h1 className="font-display text-3xl">You&apos;re in</h1>
          <p className="text-muted-foreground">
            {state.org ? <>You have joined <strong>{state.org}</strong>.</> : "You have joined the firm."}{" "}
            An administrator decides which clients you can see, so your list may be
            empty until they assign you.
          </p>
          <Button asChild size="lg"><Link href="/app">Go to the app</Link></Button>
        </Shell>
      );

    case "wrong_account":
      return (
        <Shell>
          <h1 className="font-display text-3xl">Wrong account</h1>
          <p className="text-muted-foreground">{state.message}</p>
          <p className="text-xs text-muted-foreground">
            An invitation only works for the address it was sent to — that is what stops
            a forwarded email letting someone else into your firm.
          </p>
          <Button onClick={signOutAndRetry}>Sign in as the invited address</Button>
        </Shell>
      );

    case "invalid":
      return (
        <Shell>
          <h1 className="font-display text-3xl">This invitation can&apos;t be used</h1>
          <p className="text-muted-foreground">{state.message}</p>
          <p className="text-xs text-muted-foreground">
            Invitations expire, and can be revoked or already used. Ask whoever invited
            you to send a new one.
          </p>
          <Button asChild variant="outline"><Link href="/login">Sign in</Link></Button>
        </Shell>
      );
  }
}
