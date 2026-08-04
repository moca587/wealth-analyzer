"use client";

// ─────────────────────────────────────────────────────────────────
// The firm: who is in it, what they can see, and how many seats are left.
//
// One deliberate piece of UX here: the invitation LINK is shown exactly
// once, in a panel that says so. There is no email sending (that would
// need the service-role key, which this app does not use), and the token
// is stored only as a hash, so it genuinely cannot be recovered — a lost
// link means sending a fresh invitation. Pretending otherwise would be
// worse than the extra copy-paste.
// ─────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ROLE_LABEL, ROLE_DESCRIPTION, type OrgRole,
  type MemberRow, type InviteRow, type OrgRef,
} from "@/lib/tenancy/org";
import type { HouseholdRef } from "@/lib/tenancy/client";

interface TeamPayload {
  organization: OrgRef;
  you: { userId: string; role: OrgRole; canAdmin: boolean };
  members: MemberRow[];
  invites: InviteRow[];
}

async function readJson(res: Response): Promise<Record<string, unknown>> {
  // A gateway or framework error page is HTML; without this the user sees
  // "Unexpected token '<'" instead of the status that actually happened.
  try { return await res.json(); } catch { return { error: `HTTP ${res.status}` }; }
}

const ROLES: OrgRole[] = ["owner", "admin", "compliance", "advisor"];

export function TeamManager() {
  const [data, setData] = useState<TeamPayload | null>(null);
  const [households, setHouseholds] = useState<HouseholdRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<OrgRole>("advisor");
  const [freshLink, setFreshLink] = useState<{ email: string; link: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [teamRes, hhRes] = await Promise.all([
      fetch("/api/team", { cache: "no-store" }),
      fetch("/api/households", { cache: "no-store" }),
    ]);
    const team = await readJson(teamRes);
    if (!teamRes.ok) {
      setError(String(team.error ?? `HTTP ${teamRes.status}`));
      setData(null);
    } else {
      setError("");
      setData(team as unknown as TeamPayload);
      const hh = await readJson(hhRes);
      setHouseholds((hh.households as HouseholdRef[]) ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(""); setCopied(false);
    const res = await fetch("/api/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role }),
    });
    const body = await readJson(res);
    setBusy(false);
    if (!res.ok) { setError(String(body.error ?? `HTTP ${res.status}`)); return; }
    setFreshLink({ email, link: String(body.link) });
    setEmail("");
    await load();
  }

  async function act(fn: () => Promise<Response>) {
    setBusy(true); setError("");
    const res = await fn();
    if (!res.ok) setError(String((await readJson(res)).error ?? `HTTP ${res.status}`));
    setBusy(false);
    await load();
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading the team…</p>;

  if (!data) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
        {error || "Could not load the team."}
      </div>
    );
  }

  const { organization: org, you, members, invites } = data;
  const pending = invites.filter((i) => i.state === "pending");
  const seatsLeft = org.seats - org.seatsUsed;
  const nameOfHousehold = (id: string) => households.find((h) => h.id === id)?.name ?? "a client";

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* ─── Seats ─── */}
      <Card>
        <CardHeader><CardTitle>{org.name}</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap items-baseline gap-x-8 gap-y-2">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Seats</div>
            <div className="font-display text-3xl">
              {org.seatsUsed} <span className="text-muted-foreground text-xl">/ {org.seats}</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground max-w-md">
            {seatsLeft > 0
              ? `${seatsLeft} seat${seatsLeft === 1 ? "" : "s"} available. A pending invitation holds a seat until it is accepted, expires, or is revoked.`
              : "Every seat is in use. Revoke a pending invitation or remove a member before inviting anyone else."}
          </p>
        </CardContent>
      </Card>

      {/* ─── Invite ─── */}
      {you.canAdmin && (
        <Card>
          <CardHeader><CardTitle>Invite someone</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={invite} className="flex flex-wrap items-end gap-3">
              <div className="space-y-1.5 flex-1 min-w-[240px]">
                <Label htmlFor="inv-email">Email</Label>
                <Input
                  id="inv-email" type="email" required value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="colleague@yourfirm.ch"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="inv-role">Role</Label>
                <Select id="inv-role" value={role} onChange={(e) => setRole(e.target.value as OrgRole)} className="w-48">
                  {ROLES
                    // Only an owner may mint another owner; the database
                    // enforces it, and offering it would just produce an error.
                    .filter((r) => r !== "owner" || you.role === "owner")
                    .map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                </Select>
              </div>
              <Button type="submit" disabled={busy || seatsLeft <= 0}>Create invitation</Button>
            </form>

            <p className="text-xs text-muted-foreground">{ROLE_DESCRIPTION[role]}</p>

            {freshLink && (
              <div className="rounded-lg border border-accent/30 bg-accent/5 p-4 space-y-2">
                <div className="text-sm font-medium">
                  Invitation for {freshLink.email} — send them this link
                </div>
                <div className="flex gap-2">
                  <input
                    readOnly value={freshLink.link}
                    onFocus={(e) => e.currentTarget.select()}
                    className="flex-1 rounded-lg border border-border bg-background px-2 py-1.5 text-xs font-mono"
                  />
                  <Button
                    type="button" variant="outline" size="sm"
                    onClick={async () => {
                      await navigator.clipboard.writeText(freshLink.link);
                      setCopied(true);
                    }}
                  >
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  <strong>Shown once.</strong> Only a hash of this token is stored, so it
                  cannot be shown again — if it is lost, revoke the invitation and send a
                  new one. It only works for <strong>{freshLink.email}</strong>: anyone
                  else who opens it, including a forwarded copy, will be refused.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ─── Roster ─── */}
      <Card>
        <CardHeader><CardTitle>People</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {members.map((m) => {
            const isYou = m.userId === you.userId;
            return (
              <div key={m.userId} className="flex flex-wrap items-center gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
                <div className="flex-1 min-w-[180px]">
                  <div className="font-medium">
                    {m.displayName || "(no name)"}{isYou && <span className="text-muted-foreground font-normal"> — you</span>}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {m.role === "advisor"
                      ? m.households.length
                        ? `${m.households.length} client${m.households.length === 1 ? "" : "s"}: ${m.households.map(nameOfHousehold).join(", ")}`
                        : "No clients assigned yet"
                      : ROLE_DESCRIPTION[m.role]}
                  </div>
                </div>

                {you.canAdmin ? (
                  <Select
                    value={m.role}
                    className="w-44"
                    aria-label={`Role for ${m.displayName || "member"}`}
                    onChange={(e) => act(() => fetch("/api/team", {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ userId: m.userId, role: e.target.value }),
                    }))}
                  >
                    {ROLES
                      .filter((r) => r !== "owner" || you.role === "owner")
                      .map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                  </Select>
                ) : (
                  <span className="text-sm text-muted-foreground">{ROLE_LABEL[m.role]}</span>
                )}

                {you.canAdmin && !isYou && (
                  <Button
                    variant="ghost" size="sm" className="text-destructive" disabled={busy}
                    onClick={() => act(() => fetch(`/api/team?userId=${m.userId}`, { method: "DELETE" }))}
                  >
                    Remove
                  </Button>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* ─── Client assignment ─── */}
      {you.canAdmin && households.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Who sees which client</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Owners, administrators and compliance see every client in the firm. An
              advisor sees only the clients listed here.
            </p>
            {members.filter((m) => m.role === "advisor").map((m) => (
              <div key={m.userId} className="space-y-2 border-b border-border pb-4 last:border-0 last:pb-0">
                <div className="font-medium text-sm">{m.displayName || "(no name)"}</div>
                <div className="flex flex-wrap gap-2">
                  {households.map((h) => {
                    const on = m.households.includes(h.id);
                    return (
                      <button
                        key={h.id}
                        type="button"
                        disabled={busy}
                        onClick={() => act(() => fetch(
                          `/api/households/${h.id}/advisors${on ? `?userId=${m.userId}` : ""}`,
                          on
                            ? { method: "DELETE" }
                            : {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ userId: m.userId }),
                              },
                        ))}
                        className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                          on
                            ? "border-accent bg-accent/10 text-accent"
                            : "border-border text-muted-foreground hover:border-accent/50"
                        }`}
                      >
                        {on ? "✓ " : "+ "}{h.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            {!members.some((m) => m.role === "advisor") && (
              <p className="text-sm text-muted-foreground">No advisors yet — invite one above.</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* ─── Pending invitations ─── */}
      {you.canAdmin && pending.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Pending invitations</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {pending.map((i) => (
              <div key={i.id} className="flex flex-wrap items-center gap-3 text-sm">
                <span className="flex-1 min-w-[200px]">{i.email}</span>
                <span className="text-muted-foreground text-xs">{ROLE_LABEL[i.role]}</span>
                <span className="text-muted-foreground text-xs">
                  expires {new Date(i.expiresAt).toLocaleDateString()}
                </span>
                <Button
                  variant="ghost" size="sm" className="text-destructive" disabled={busy}
                  onClick={() => act(() => fetch(`/api/team?inviteId=${i.id}`, { method: "DELETE" }))}
                >
                  Revoke
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
