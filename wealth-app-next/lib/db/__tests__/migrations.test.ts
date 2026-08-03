// ─────────────────────────────────────────────────────────────────
// Run every migration against a REAL Postgres.
//
// Until now 003–006 had never executed anywhere: `.env.local` points at
// a placeholder Supabase project, so the SQL was only ever read. That is
// a poor place to keep the append-only audit guarantee, the order
// idempotency index and the tenancy model.
//
// PGlite is Postgres 18 compiled to WASM, so this is not a simulation —
// the triggers, the RLS policies, the plpgsql and the constraints are
// the real thing. Only the Supabase-managed pieces are stubbed: the
// `auth` schema, `auth.uid()`, and the three roles.
// ─────────────────────────────────────────────────────────────────

import { describe, it, expect, beforeAll } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const MIGRATIONS = join(process.cwd(), "supabase", "migrations");

/** The Supabase surface our SQL assumes but does not create itself. */
const SUPABASE_STUB = `
create schema if not exists auth;

create table if not exists auth.users (
  id                  uuid primary key default gen_random_uuid(),
  email               text,
  raw_user_meta_data  jsonb not null default '{}'::jsonb,
  created_at          timestamptz not null default now()
);

-- Supabase reads the subject from the request JWT. A session GUC is the
-- faithful local equivalent, and lets a test "become" a user.
create or replace function auth.uid() returns uuid
language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;

do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role; end if;
end $$;

grant usage on schema public to anon, authenticated, service_role;
-- Supabase's default: new tables in public are granted to the client
-- roles as they are created, which is why a later column-level REVOKE is
-- the only way to protect a single column.
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public
  grant select on tables to anon;
`;

let db: PGlite;
const applied: string[] = [];

async function become(userId: string | null) {
  await db.exec(`select set_config('request.jwt.claim.sub', ${userId ? `'${userId}'` : "''"}, false)`);
}

beforeAll(async () => {
  db = await new PGlite();
  await db.exec(SUPABASE_STUB);

  for (const f of readdirSync(MIGRATIONS).filter((f) => f.endsWith(".sql")).sort()) {
    const sql = readFileSync(join(MIGRATIONS, f), "utf8");
    try {
      await db.exec(sql);
      applied.push(f);
    } catch (e) {
      throw new Error(`migration ${f} failed: ${e instanceof Error ? e.message : String(e)}`);
    }
    // NOTE: no blanket re-grant here. Supabase applies default privileges
    // once; re-granting table-level UPDATE after each migration would
    // silently undo 005's column-level revoke and hide a real regression.
  }
}, 120_000);

const one = async <T = Record<string, unknown>>(sql: string): Promise<T | undefined> =>
  ((await db.query(sql)).rows[0] as T | undefined);
const rows = async <T = Record<string, unknown>>(sql: string): Promise<T[]> =>
  ((await db.query(sql)).rows as T[]);

describe("every migration applies to a real Postgres", () => {
  it("applies all of them in order", () => {
    expect(applied).toEqual([
      "001_init.sql", "002_feeds.sql", "003_orders.sql",
      "004_audit.sql", "005_fix_erasure_and_entitlement.sql", "006_tenancy.sql",
      "007_fix_entitlement_grants.sql",
    ]);
  });

  it("creates every table the app expects", async () => {
    const t = (await rows<{ tablename: string }>(
      `select tablename from pg_tables where schemaname='public' order by 1`
    )).map((r) => r.tablename);
    expect(t).toEqual(expect.arrayContaining([
      "audit_events", "feed_connections", "household_advisors", "households",
      "org_members", "organizations", "order_connections", "order_tickets",
      "plans", "profiles", "simulations",
    ]));
  });

  it("has RLS enabled on every one of them", async () => {
    const off = await rows<{ relname: string }>(
      `select c.relname from pg_class c join pg_namespace n on n.oid=c.relnamespace
        where n.nspname='public' and c.relkind='r' and not c.relrowsecurity order by 1`
    );
    expect(off.map((r) => r.relname)).toEqual([]);
  });
});

describe("004/005: the audit trail is append-only AND erasable", () => {
  let uid: string;
  beforeAll(async () => {
    const u = await one<{ id: string }>(
      `insert into auth.users (email) values ('audit@example.com') returning id`);
    uid = u!.id;
    await db.exec(`insert into public.audit_events (user_id, action, source, summary)
                   values ('${uid}', 'plan.updated', 'web', 'first save')`);
  });

  it("refuses DELETE outright", async () => {
    await expect(db.exec(`delete from public.audit_events where user_id = '${uid}'`))
      .rejects.toThrow(/append-only/i);
  });

  it("refuses an UPDATE that rewrites what happened", async () => {
    await expect(db.exec(`update public.audit_events set summary = 'tampered' where user_id = '${uid}'`))
      .rejects.toThrow(/append-only/i);
    await expect(db.exec(`update public.audit_events set net_worth_after = 1 where user_id = '${uid}'`))
      .rejects.toThrow(/append-only/i);
  });

  it("PERMITS deleting the user — the 005 fix", async () => {
    // Before 005 this aborted: the ON DELETE CASCADE tripped the
    // unconditional delete trigger, so any user who had saved a plan was
    // undeletable, which blocked GDPR erasure.
    await db.exec(`delete from auth.users where id = '${uid}'`);
    const gone = await one<{ n: number }>(`select count(*)::int as n from auth.users where id = '${uid}'`);
    expect(gone!.n).toBe(0);
  });

  it("keeps the event after erasure, with the actor nulled", async () => {
    const e = await one<{ n: number; user_id: string | null; summary: string }>(
      `select count(*) over ()::int as n, user_id, summary
         from public.audit_events where summary = 'first save'`);
    expect(e!.n).toBe(1);
    expect(e!.user_id).toBeNull();
    expect(e!.summary).toBe("first save");   // the record of what happened survives
  });
});

describe("007: entitlement is not self-writable", () => {
  // 005 tried a column-level REVOKE against a table-level GRANT, which in
  // Postgres is a no-op — the statement succeeds and changes nothing. This
  // pins the behaviour so the ineffective form cannot come back.
  it("leaves the client able to write ONLY its own name and plan", async () => {
    const cols = (await rows<{ column_name: string }>(
      `select column_name from information_schema.column_privileges
        where table_name='profiles' and grantee='authenticated'
          and privilege_type='UPDATE' order by 1`)).map((r) => r.column_name);
    expect(cols).toEqual(["display_name", "plan"]);
  });

  it("removes every billing column from the client's reach", async () => {
    for (const role of ["authenticated", "anon"]) {
      const g = await rows(
        `select 1 from information_schema.column_privileges
          where table_name='profiles' and grantee='${role}'
            and privilege_type in ('UPDATE','INSERT') and column_name in
            ('is_paid','stripe_customer_id','stripe_subscription_id','subscription_status')`);
      expect(g, `${role} must not reach the billing columns`).toEqual([]);
    }
  });

  it("actually REFUSES the self-grant, not just on paper", async () => {
    const u = await one<{ id: string }>(
      `insert into auth.users (email) values ('cheat@example.com') returning id`);
    await db.exec(`set role authenticated`);
    await become(u!.id);
    await expect(db.exec(`update public.profiles set is_paid = true where id = '${u!.id}'`))
      .rejects.toThrow(/permission denied|not permitted/i);
    // ...while the legitimate write still works.
    await db.exec(`update public.profiles set display_name = 'Renamed' where id = '${u!.id}'`);
    await db.exec(`reset role`);
    await become(null);
    const p = await one<{ is_paid: boolean; display_name: string }>(
      `select is_paid, display_name from public.profiles where id = '${u!.id}'`);
    expect(p!.is_paid).toBe(false);
    expect(p!.display_name).toBe("Renamed");
  });

  it("gives the client no write path to the tenancy tables", async () => {
    for (const t of ["organizations", "org_members", "household_advisors"]) {
      const g = await rows(
        `select privilege_type from information_schema.table_privileges
          where table_name='${t}' and grantee='authenticated'
            and privilege_type in ('INSERT','UPDATE','DELETE')`);
      expect(g, `${t} must be read-only to clients`).toEqual([]);
    }
    const plans = await rows(
      `select privilege_type from information_schema.table_privileges
        where table_name='plans' and grantee='authenticated'
          and privilege_type in ('UPDATE','DELETE')`);
    expect(plans, "a plan version must be immutable").toEqual([]);
  });
});

describe("003: order idempotency", () => {
  it("is enforced by a unique index, not by convention", async () => {
    const idx = await one<{ indexdef: string }>(
      `select indexdef from pg_indexes where indexname='idx_order_tickets_idem'`);
    expect(idx!.indexdef).toMatch(/UNIQUE/i);
    // Documents the shape 007 must change: keyed on the USER, so two
    // advisors sharing a household would get separate namespaces.
    expect(idx!.indexdef).toMatch(/user_id/);
    expect(idx!.indexdef).toMatch(/ticket_id/);
  });

  it("actually rejects a duplicate ticket for the same user", async () => {
    const u = await one<{ id: string }>(`insert into auth.users (email) values ('ord@example.com') returning id`);
    const c = await one<{ id: string }>(
      `insert into public.order_connections (user_id, name, url, account)
       values ('${u!.id}', 'PM', 'https://pm.example.com/o', 'CH-1') returning id`);
    const ins = (n: number) => db.exec(
      `insert into public.order_tickets (user_id, connection_id, ticket_id, fingerprint, account,
        currency, positions, total_amount, payload)
       values ('${u!.id}', '${c!.id}', 'wo_dup_00001', 'fp', 'CH-1', 'CHF', ${n}, 1000, '{}'::jsonb)`);
    await ins(1);
    await expect(ins(2)).rejects.toThrow(/duplicate key|unique/i);
  });
});

describe("006: tenancy", () => {
  let uid: string, orgId: string, hhId: string;

  beforeAll(async () => {
    const u = await one<{ id: string }>(
      `insert into auth.users (email, raw_user_meta_data)
       values ('advisor@example.com', '{"display_name":"Keller Advisors"}'::jsonb) returning id`);
    uid = u!.id;
    const o = await one<{ id: string }>(
      `select o.id from public.organizations o
         join public.org_members m on m.org_id = o.id where m.user_id = '${uid}'`);
    orgId = o!.id;
    const h = await one<{ id: string }>(
      `select id from public.households where org_id = '${orgId}'`);
    hhId = h!.id;
  });

  it("gives a new signup an org, an owner membership and a household", async () => {
    expect(orgId).toBeTruthy();
    expect(hhId).toBeTruthy();
    const m = await one<{ role: string }>(
      `select role from public.org_members where user_id='${uid}' and org_id='${orgId}'`);
    expect(m!.role).toBe("owner");
    const o = await one<{ name: string; kind: string; is_paid: boolean }>(
      `select name, kind, is_paid from public.organizations where id='${orgId}'`);
    expect(o!.name).toBe("Keller Advisors");
    expect(o!.kind).toBe("personal");
    expect(o!.is_paid).toBe(false);          // entitlement starts off
  });

  it("lets ONE advisor hold MANY households — the whole point", async () => {
    for (const n of ["Müller", "Schmid", "Rossi"]) {
      const h = await one<{ id: string }>(
        `insert into public.households (org_id, name, created_by)
         values ('${orgId}', '${n}', '${uid}') returning id`);
      await db.exec(`insert into public.household_advisors (household_id, user_id, org_id)
                     values ('${h!.id}', '${uid}', '${orgId}')`);
    }
    const c = await one<{ n: number }>(
      `select count(*)::int as n from public.households where org_id='${orgId}'`);
    expect(c!.n).toBe(4);                    // the signup one plus three
  });

  it("versions plans, so a concurrent save collides instead of overwriting", async () => {
    await db.exec(`insert into public.plans (household_id, org_id, version, plan, created_by)
                   values ('${hhId}', '${orgId}', 1, '{"currency":"CHF"}'::jsonb, '${uid}')`);
    // Two tabs both editing version 1 both try to write version 2.
    await db.exec(`insert into public.plans (household_id, org_id, version, plan, created_by)
                   values ('${hhId}', '${orgId}', 2, '{"currency":"CHF"}'::jsonb, '${uid}')`);
    await expect(db.exec(
      `insert into public.plans (household_id, org_id, version, plan, created_by)
       values ('${hhId}', '${orgId}', 2, '{"currency":"EUR"}'::jsonb, '${uid}')`))
      .rejects.toThrow(/duplicate key|unique/i);
  });

  it("makes a plan version immutable — no UPDATE or DELETE policy exists", async () => {
    const pol = await rows<{ cmd: string }>(
      `select cmd from pg_policies where tablename='plans'`);
    const cmds = pol.map((p) => p.cmd);
    expect(cmds).toContain("SELECT");
    expect(cmds).toContain("INSERT");
    expect(cmds).not.toContain("UPDATE");
    expect(cmds).not.toContain("DELETE");
  });

  it("backfills an existing profile rather than stranding its plan", async () => {
    // Simulate a user who existed BEFORE tenancy: profile with a plan,
    // no org. Then re-run just the backfill block from 006.
    const u = await one<{ id: string }>(
      `insert into auth.users (email) values ('legacy@example.com') returning id`);
    await db.exec(`delete from public.household_advisors where user_id='${u!.id}'`);
    await db.exec(`delete from public.households where created_by='${u!.id}'`);
    await db.exec(`delete from public.org_members where user_id='${u!.id}'`);
    await db.exec(`update public.profiles
                      set plan = '{"currency":"CHF","assets":[{"id":"a1","value":1000000}]}'::jsonb,
                          display_name = 'Legacy Firm'
                    where id = '${u!.id}'`);

    const backfill = readFileSync(join(MIGRATIONS, "006_tenancy.sql"), "utf8");
    const block = backfill.slice(backfill.indexOf("do $$"), backfill.indexOf("end $$;") + 7);
    await db.exec(block);

    const p = await one<{ version: number; cur: string }>(
      `select pl.version, pl.plan->>'currency' as cur
         from public.plans pl
         join public.households h on h.id = pl.household_id
         join public.org_members m on m.org_id = h.org_id
        where m.user_id = '${u!.id}'`);
    expect(p!.version).toBe(1);
    expect(p!.cur).toBe("CHF");
  });

  it("does not create an empty version-1 for a fresh signup with no plan", async () => {
    const c = await one<{ n: number }>(
      `select count(*)::int as n from public.plans where household_id = '${hhId}' and version = 1
         and plan = '{}'::jsonb`);
    expect(c!.n).toBe(0);
  });
});

describe("006: the access helpers keep RLS predicates indexable", () => {
  it("are STABLE and SECURITY DEFINER with a pinned search_path", async () => {
    const fns = await rows<{ proname: string; provolatile: string; prosecdef: boolean; proconfig: string[] | null }>(
      `select proname, provolatile, prosecdef, proconfig
         from pg_proc p join pg_namespace n on n.oid=p.pronamespace
        where n.nspname='public' and proname like 'auth\\_%' order by proname`);
    expect(fns.length).toBeGreaterThanOrEqual(5);
    for (const f of fns) {
      // STABLE lets Postgres evaluate once per statement, not per row.
      expect(f.provolatile, `${f.proname} must be STABLE`).toBe("s");
      expect(f.prosecdef, `${f.proname} must be SECURITY DEFINER`).toBe(true);
      // An unpinned search_path on a SECURITY DEFINER function is a
      // privilege-escalation hole.
      expect((f.proconfig ?? []).join(","), `${f.proname} must pin search_path`).toMatch(/search_path/);
    }
  });

  it("returns only the caller's orgs", async () => {
    const a = await one<{ id: string }>(`insert into auth.users (email) values ('a@x.example') returning id`);
    const b = await one<{ id: string }>(`insert into auth.users (email) values ('b@x.example') returning id`);
    await become(a!.id);
    const aOrgs = await one<{ n: number }>(`select array_length(public.auth_org_ids(),1) as n`);
    expect(aOrgs!.n).toBe(1);
    await become(b!.id);
    const seenByB = await one<{ n: number }>(
      `select coalesce(cardinality(array(select unnest(public.auth_org_ids())
         intersect select unnest(array['${'00000000-0000-0000-0000-000000000000'}']::uuid[]))),0)::int as n`);
    expect(seenByB!.n).toBe(0);
    await become(null);
  });
});
