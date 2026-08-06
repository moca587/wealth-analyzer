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
  -- Real Supabase leaves this NULL until the address is confirmed, and
  -- 012's accept_invite refuses an unconfirmed one — the email binding is
  -- the whole invite security model, and on a deployment with
  -- confirmations off an unconfirmed address is just a string someone
  -- typed. Defaulted to now() here so the many tests that only need "a
  -- user" stay readable; the unconfirmed path is exercised by inserting
  -- an explicit NULL.
  email_confirmed_at  timestamptz default now(),
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
      "007_fix_entitlement_grants.sql", "008_rekey_to_households.sql",
      "009_household_management.sql", "010_survive_a_departure.sql",
      "011_invites.sql", "012_seats_that_work.sql", "013_billing.sql",
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

describe("008: order idempotency is keyed on the HOUSEHOLD", () => {
  it("re-keys the unique index and drops the user-scoped one", async () => {
    const old = await rows(`select 1 from pg_indexes where indexname='idx_order_tickets_idem'`);
    expect(old, "the user-keyed index must be gone").toEqual([]);
    const idx = await one<{ indexdef: string }>(
      `select indexdef from pg_indexes where indexname='idx_order_tickets_idem_household'`);
    expect(idx!.indexdef).toMatch(/UNIQUE/i);
    expect(idx!.indexdef).toMatch(/household_id/);
    expect(idx!.indexdef).toMatch(/ticket_id/);
  });

  it("STOPS the double order: two advisors, one household, one ticket id", async () => {
    // The whole reason 008 exists. Under the old index each advisor had
    // their own namespace, so both BUYs landed and two live orders reached
    // the OMS.
    const a = await one<{ id: string }>(`insert into auth.users (email) values ('adv-a@x.example') returning id`);
    const b = await one<{ id: string }>(`insert into auth.users (email) values ('adv-b@x.example') returning id`);
    const org = await one<{ org_id: string }>(
      `select org_id from public.org_members where user_id = '${a!.id}'`);
    await db.exec(`insert into public.org_members (org_id, user_id, role)
                   values ('${org!.org_id}', '${b!.id}', 'advisor') on conflict do nothing`);
    const hh = await one<{ id: string }>(
      `select id from public.households where org_id = '${org!.org_id}' limit 1`);
    await db.exec(`insert into public.household_advisors (household_id, user_id, org_id)
                   values ('${hh!.id}', '${b!.id}', '${org!.org_id}') on conflict do nothing`);

    const conn = await one<{ id: string }>(
      `insert into public.order_connections (user_id, household_id, org_id, name, url, account)
       values ('${a!.id}', '${hh!.id}', '${org!.org_id}', 'PM', 'https://pm.example.com/o', 'CH-1')
       returning id`);

    const place = (who: string) => db.exec(
      `insert into public.order_tickets (user_id, household_id, org_id, connection_id, ticket_id,
        fingerprint, account, currency, positions, total_amount, payload)
       values ('${who}', '${hh!.id}', '${org!.org_id}', '${conn!.id}', 'wo_shared_0001',
               'fp', 'CH-1', 'CHF', 7, 2400000, '{}'::jsonb)`);

    await place(a!.id);
    await expect(place(b!.id)).rejects.toThrow(/duplicate key|unique/i);

    const n = await one<{ n: number }>(
      `select count(*)::int as n from public.order_tickets where ticket_id = 'wo_shared_0001'`);
    expect(n!.n, "exactly one order, not two").toBe(1);
  });

  it("still lets DIFFERENT households reuse a ticket id", async () => {
    const u = await one<{ id: string }>(`insert into auth.users (email) values ('two-hh@x.example') returning id`);
    const org = await one<{ org_id: string }>(`select org_id from public.org_members where user_id='${u!.id}'`);
    const h2 = await one<{ id: string }>(
      `insert into public.households (org_id, name, created_by)
       values ('${org!.org_id}', 'Second client', '${u!.id}') returning id`);
    await db.exec(`insert into public.household_advisors (household_id, user_id, org_id)
                   values ('${h2!.id}', '${u!.id}', '${org!.org_id}')`);
    const h1 = await one<{ id: string }>(
      `select id from public.households where org_id='${org!.org_id}' and id <> '${h2!.id}' limit 1`);
    const mk = (hh: string) => db.exec(
      `insert into public.order_tickets (user_id, household_id, org_id, ticket_id, fingerprint,
        account, currency, positions, total_amount, payload)
       values ('${u!.id}', '${hh}', '${org!.org_id}', 'wo_reused_001', 'fp', 'A', 'CHF', 1, 100, '{}'::jsonb)`);
    await mk(h1!.id);
    await mk(h2!.id);          // same ticket id, different client — legitimate
    const n = await one<{ n: number }>(
      `select count(*)::int as n from public.order_tickets where ticket_id='wo_reused_001'`);
    expect(n!.n).toBe(2);
  });
});

describe("008: the household trigger keeps existing routes working", () => {
  it("fills household_id from the actor while they have exactly one", async () => {
    const u = await one<{ id: string }>(`insert into auth.users (email) values ('single@x.example') returning id`);
    // Exactly the insert the CURRENT route performs — no household column.
    await db.exec(`insert into public.feed_connections (user_id, name, url)
                   values ('${u!.id}', 'UBS', 'https://custodian.example.com/f')`);
    const f = await one<{ household_id: string; org_id: string }>(
      `select household_id, org_id from public.feed_connections where user_id='${u!.id}'`);
    expect(f!.household_id).toBeTruthy();
    expect(f!.org_id).toBeTruthy();
  });

  it("REFUSES to guess once the advisor has two clients", async () => {
    const u = await one<{ id: string }>(`insert into auth.users (email) values ('ambig@x.example') returning id`);
    const org = await one<{ org_id: string }>(`select org_id from public.org_members where user_id='${u!.id}'`);
    await db.exec(`insert into public.households (org_id, name, created_by)
                   values ('${org!.org_id}', 'Second', '${u!.id}')`);
    // Silently picking one would point a custodian feed at the wrong client.
    await expect(db.exec(`insert into public.feed_connections (user_id, name, url)
                          values ('${u!.id}', 'UBS', 'https://custodian.example.com/f')`))
      .rejects.toThrow(/explicitly/i);
  });
});

describe("008: firm-level order ceiling", () => {
  it("clamps a connection limit the advisor set above the firm's", async () => {
    const u = await one<{ id: string }>(`insert into auth.users (email) values ('cap@x.example') returning id`);
    const org = await one<{ org_id: string }>(`select org_id from public.org_members where user_id='${u!.id}'`);
    await db.exec(`update public.organizations set max_ticket_amount = 250000 where id='${org!.org_id}'`);
    const hh = await one<{ id: string }>(`select id from public.households where org_id='${org!.org_id}' limit 1`);
    await db.exec(`insert into public.order_connections (user_id, household_id, org_id, name, url, account, max_ticket_amount)
                   values ('${u!.id}', '${hh!.id}', '${org!.org_id}', 'PM', 'https://pm.example.com/o', 'A', 9999999)`);
    const c = await one<{ max_ticket_amount: string }>(
      `select max_ticket_amount from public.order_connections where user_id='${u!.id}'`);
    expect(Number(c!.max_ticket_amount)).toBe(250000);
  });
});

describe("008: audit separates actor from subject", () => {
  it("scopes on the household, so compliance sees another advisor's actions", async () => {
    const cols = (await rows<{ column_name: string }>(
      `select column_name from information_schema.columns
        where table_name='audit_events' and column_name in ('household_id','org_id','user_id')
        order by 1`)).map((r) => r.column_name);
    expect(cols).toEqual(["household_id", "org_id", "user_id"]);
    const pol = await one<{ qual: string }>(
      `select qual from pg_policies where policyname='audit_events_household_select'`);
    expect(pol!.qual).toMatch(/household_id/);
  });

  it("is STILL append-only after the re-key", async () => {
    const u = await one<{ id: string }>(`insert into auth.users (email) values ('ap@x.example') returning id`);
    await db.exec(`insert into public.audit_events (user_id, action, source, summary)
                   values ('${u!.id}', 'plan.updated', 'web', 'after rekey')`);
    await expect(db.exec(`delete from public.audit_events where summary='after rekey'`))
      .rejects.toThrow(/append-only/i);
    await expect(db.exec(`update public.audit_events set household_id = null where summary='after rekey'`))
      .rejects.toThrow(/append-only/i);
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

describe("009: an advisor can hold a SECOND client", () => {
  // The gap 006/008 left: `households_insert` lets a row be created, but
  // `household_advisors` is unwritable by clients (007), so an advisor's new
  // household was invisible to them the moment it existed. Create-then-vanish.
  it("creates the household AND the creator's assignment, atomically", async () => {
    const u = await one<{ id: string }>(
      `insert into auth.users (email) values ('grow@x.example') returning id`);
    const org = await one<{ org_id: string }>(
      `select org_id from public.org_members where user_id = '${u!.id}'`);

    await db.exec(`set role authenticated`);
    await become(u!.id);
    const hh = await one<{ create_household: string }>(
      `select public.create_household('${org!.org_id}', 'Keller, Beatrice', 'CL-0042', 'chf')`);
    // The whole point: it is visible to the advisor who made it.
    const seen = await one<{ n: number }>(
      `select count(*)::int as n from public.households where id = '${hh!.create_household}'`);
    expect(seen!.n, "the creator must be able to see their own new client").toBe(1);
    await db.exec(`reset role`);
    await become(null);

    const row = await one<{ currency: string; reference: string; org_id: string }>(
      `select currency, reference, org_id from public.households where id='${hh!.create_household}'`);
    expect(row!.currency, "currency is normalised, not stored as typed").toBe("CHF");
    expect(row!.reference).toBe("CL-0042");
    const asg = await one<{ n: number }>(
      `select count(*)::int as n from public.household_advisors
        where household_id='${hh!.create_household}' and user_id='${u!.id}'`);
    expect(asg!.n, "the assignment is what makes it visible").toBe(1);
  });

  it("makes the DATABASE stop guessing once there are two", async () => {
    // 008's trigger fills household_id from the actor only while that is
    // unambiguous. Creating a second client is exactly the event that must
    // flip unqualified inserts from working to failing loudly.
    const u = await one<{ id: string }>(
      `insert into auth.users (email) values ('two@x.example') returning id`);
    const org = await one<{ org_id: string }>(
      `select org_id from public.org_members where user_id = '${u!.id}'`);

    // One household (from signup) — the old-style insert still works.
    await db.exec(`insert into public.feed_connections (user_id, name, url)
                   values ('${u!.id}', 'UBS', 'https://custodian.example.com/a')`);

    await db.exec(`set role authenticated`);
    await become(u!.id);
    await db.exec(`select public.create_household('${org!.org_id}', 'Second client')`);
    await db.exec(`reset role`);
    await become(null);

    await expect(db.exec(`insert into public.feed_connections (user_id, name, url)
                          values ('${u!.id}', 'CS', 'https://custodian.example.com/b')`))
      .rejects.toThrow(/explicitly/i);

    // ...and the qualified insert the route now performs still works.
    const h2 = await one<{ id: string }>(
      `select id from public.households where org_id='${org!.org_id}' and name='Second client'`);
    await db.exec(`insert into public.feed_connections (user_id, household_id, org_id, name, url)
                   values ('${u!.id}', '${h2!.id}', '${org!.org_id}', 'CS', 'https://custodian.example.com/b')`);
    const f = await one<{ household_id: string }>(
      `select household_id from public.feed_connections where name='CS'`);
    expect(f!.household_id).toBe(h2!.id);
  });

  it("refuses to create one in an organisation the caller is not in", async () => {
    const outsider = await one<{ id: string }>(
      `insert into auth.users (email) values ('outsider@x.example') returning id`);
    const other = await one<{ id: string }>(
      `insert into public.organizations (name) values ('Someone else AG') returning id`);
    await db.exec(`set role authenticated`);
    await become(outsider!.id);
    await expect(db.query(`select public.create_household('${other!.id}', 'Not mine')`))
      .rejects.toThrow(/not a member/i);
    await db.exec(`reset role`);
    await become(null);
  });

  it("refuses an unauthenticated caller", async () => {
    const org = await one<{ id: string }>(`select id from public.organizations limit 1`);
    await become(null);
    await expect(db.query(`select public.create_household('${org!.id}', 'Anon')`))
      .rejects.toThrow(/not authenticated|not a member/i);
  });

  it("pins search_path on the two new SECURITY DEFINER functions", async () => {
    // These write, so they cannot be STABLE like the auth_* helpers — but
    // they ARE SECURITY DEFINER, and an unpinned search_path there is a
    // privilege-escalation hole: the caller gets to choose which
    // `households` table the function actually writes to.
    const fns = await rows<{ proname: string; prosecdef: boolean; proconfig: string[] | null }>(
      `select proname, prosecdef, proconfig from pg_proc p
         join pg_namespace n on n.oid=p.pronamespace
        where n.nspname='public' and proname in ('create_household','set_advisor')
        order by proname`);
    expect(fns.map((f) => f.proname)).toEqual(["create_household", "set_advisor"]);
    for (const f of fns) {
      expect(f.prosecdef, `${f.proname} must be SECURITY DEFINER`).toBe(true);
      expect((f.proconfig ?? []).join(","), `${f.proname} must pin search_path`).toMatch(/search_path/);
    }
  });
});

describe("009: versioned plans are what fix the lost update", () => {
  let uid = "", org = "", hh = "";
  beforeAll(async () => {
    const u = await one<{ id: string }>(
      `insert into auth.users (email) values ('ver@x.example') returning id`);
    uid = u!.id;
    const o = await one<{ org_id: string }>(
      `select org_id from public.org_members where user_id='${uid}'`);
    org = o!.org_id;
    const h = await one<{ id: string }>(
      `select id from public.households where org_id='${org}' limit 1`);
    hh = h!.id;
  });

  const save = (v: number, nw: number) => db.exec(
    `insert into public.plans (household_id, org_id, version, plan, created_by)
     values ('${hh}', '${org}', ${v}, '{"netWorth": ${nw}}'::jsonb, '${uid}')`);

  it("turns two concurrent saves into a conflict, not a silent overwrite", async () => {
    await save(1, 100);
    await save(2, 200);
    // Two tabs both read version 2 and both compute 3. Under the old single
    // JSONB column both upserts succeeded and one client's edits vanished.
    await expect(save(2, 999)).rejects.toThrow(/duplicate key|unique/i);
    const cur = await one<{ version: number; plan: { netWorth: number } }>(
      `select version, plan from public.plans where household_id='${hh}'
        order by version desc limit 1`);
    expect(cur!.version).toBe(2);
    expect(cur!.plan.netWorth, "the loser must not have overwritten the winner").toBe(200);
  });

  it("keeps every prior version — history is what the audit hashes point at", async () => {
    const n = await one<{ n: number }>(
      `select count(*)::int as n from public.plans where household_id='${hh}'`);
    expect(n!.n).toBeGreaterThanOrEqual(2);
    await db.exec(`set role authenticated`);
    await become(uid);
    await expect(db.exec(`update public.plans set plan='{}'::jsonb where household_id='${hh}'`))
      .rejects.toThrow(/permission denied/i);
    await expect(db.exec(`delete from public.plans where household_id='${hh}'`))
      .rejects.toThrow(/permission denied/i);
    await db.exec(`reset role`);
    await become(null);
  });
});

describe("009: assignment is an ADMIN action, not a self-service one", () => {
  let owner = "", advisor = "", org = "", hidden = "";
  beforeAll(async () => {
    const o = await one<{ id: string }>(
      `insert into auth.users (email) values ('owner@firm.example') returning id`);
    owner = o!.id;
    const om = await one<{ org_id: string }>(
      `select org_id from public.org_members where user_id='${owner}'`);
    org = om!.org_id;
    // Make it a real firm, not the personal org the signup trigger made.
    await db.exec(`update public.organizations set kind='institution' where id='${org}'`);

    const a = await one<{ id: string }>(
      `insert into auth.users (email) values ('advisor@firm.example') returning id`);
    advisor = a!.id;
    await db.exec(`insert into public.org_members (org_id, user_id, role)
                   values ('${org}', '${advisor}', 'advisor')`);

    // A client of the firm the advisor is NOT on.
    const h = await one<{ id: string }>(
      `insert into public.households (org_id, name, created_by)
       values ('${org}', 'Not the advisor''s client', '${owner}') returning id`);
    hidden = h!.id;
  });

  it("keeps an unassigned household out of the advisor's book", async () => {
    await become(advisor);
    const ids = await one<{ hit: boolean }>(
      `select '${hidden}'::uuid = any(public.auth_household_ids()) as hit`);
    expect(ids!.hit, "an advisor must not see the firm's whole book").toBe(false);
    await become(null);
  });

  it("REFUSES to let an advisor assign themselves", async () => {
    // The reason this is a function and not a `household_advisors_insert`
    // policy: any policy wide enough to let an advisor create their own
    // client is also wide enough to let them claim someone else's.
    await db.exec(`set role authenticated`);
    await become(advisor);
    await expect(db.query(`select public.set_advisor('${hidden}', '${advisor}', true)`))
      .rejects.toThrow(/household not found/i);
    await db.exec(`reset role`);
    await become(null);

    await become(advisor);
    const still = await one<{ hit: boolean }>(
      `select '${hidden}'::uuid = any(public.auth_household_ids()) as hit`);
    expect(still!.hit).toBe(false);
    await become(null);
  });

  it("lets the OWNER assign, and the advisor then sees it", async () => {
    await db.exec(`set role authenticated`);
    await become(owner);
    await db.exec(`select public.set_advisor('${hidden}', '${advisor}', true)`);
    await db.exec(`reset role`);
    await become(advisor);
    const hit = await one<{ hit: boolean }>(
      `select '${hidden}'::uuid = any(public.auth_household_ids()) as hit`);
    expect(hit!.hit).toBe(true);
    await become(null);
  });

  it("un-assigns the same way, and access goes with it", async () => {
    await db.exec(`set role authenticated`);
    await become(owner);
    await db.exec(`select public.set_advisor('${hidden}', '${advisor}', false)`);
    await db.exec(`reset role`);
    await become(advisor);
    const hit = await one<{ hit: boolean }>(
      `select '${hidden}'::uuid = any(public.auth_household_ids()) as hit`);
    expect(hit!.hit).toBe(false);
    await become(null);
  });

  it("will not hand a client to someone outside the organisation", async () => {
    const stranger = await one<{ id: string }>(
      `insert into auth.users (email) values ('stranger@else.example') returning id`);
    await db.exec(`set role authenticated`);
    await become(owner);
    await expect(db.query(`select public.set_advisor('${hidden}', '${stranger!.id}', true)`))
      .rejects.toThrow(/not a member of this organisation/i);
    await db.exec(`reset role`);
    await become(null);
  });
});

describe("010: deleting a person must not delete the firm's records", () => {
  // 005 fixed this for audit_events and stopped. Everywhere else `user_id`
  // still cascaded, and since 008 `user_id` means "who did this", not "whose
  // money this is" — so one advisor leaving took the firm's order-of-record,
  // its custodian credentials and its OMS routes with them.
  let uid = "", org = "", hh = "", conn = "";

  beforeAll(async () => {
    const u = await one<{ id: string }>(
      `insert into auth.users (email) values ('leaver@firm.example') returning id`);
    uid = u!.id;
    const o = await one<{ org_id: string }>(
      `select org_id from public.org_members where user_id='${uid}'`);
    org = o!.org_id;
    const h = await one<{ id: string }>(
      `select id from public.households where org_id='${org}' limit 1`);
    hh = h!.id;

    const c = await one<{ id: string }>(
      `insert into public.order_connections (user_id, household_id, org_id, name, url, account)
       values ('${uid}', '${hh}', '${org}', 'PM', 'https://pm.example.com/o', 'CH-77')
       returning id`);
    conn = c!.id;
    await db.exec(`insert into public.order_tickets
        (user_id, household_id, org_id, connection_id, ticket_id, fingerprint,
         account, currency, positions, total_amount, payload, status)
       values ('${uid}', '${hh}', '${org}', '${conn}', 'wo_departure_001', 'fp',
               'CH-77', 'CHF', 7, 2400000, '{}'::jsonb, 'staged')`);
    await db.exec(`insert into public.feed_connections (user_id, household_id, org_id, name, url)
                   values ('${uid}', '${hh}', '${org}', 'UBS', 'https://custodian.example.com/f')`);
    await db.exec(`insert into public.simulations (user_id, household_id, input_hash, result)
                   values ('${uid}', '${hh}', 'h1', '{}'::jsonb)`);
    await db.exec(`insert into public.audit_events (user_id, household_id, org_id, action, source, summary)
                   values ('${uid}', '${hh}', '${org}', 'order.staged', 'order', 'staged 7 lines')`);

    // The advisor leaves and their login is erased (a GDPR request, or
    // simply offboarding). This must SUCCEED — 004 once made it impossible.
    await db.exec(`delete from auth.users where id = '${uid}'`);
  });

  it("keeps the order ticket — it is the instruction of record", async () => {
    const t = await one<{ user_id: string | null; household_id: string; status: string }>(
      `select user_id, household_id, status from public.order_tickets
        where ticket_id = 'wo_departure_001'`);
    expect(t, "the order must outlive the person who sent it").toBeTruthy();
    expect(t!.user_id, "the actor is forgotten").toBeNull();
    expect(t!.household_id, "the client it booked for is not").toBe(hh);
    expect(t!.status).toBe("staged");
  });

  it("leaves no audit event pointing at a client whose tickets are gone", async () => {
    // The specific incoherence the old cascade produced: 005 kept the audit
    // row while the ticket it described was deleted underneath it.
    const orphans = await rows(
      `select a.id from public.audit_events a
        where a.summary = 'staged 7 lines'
          and not exists (select 1 from public.order_tickets t
                           where t.household_id = a.household_id)`);
    expect(orphans).toEqual([]);
  });

  it("keeps the OMS route and the custodian credential", async () => {
    const oc = await one<{ n: number }>(
      `select count(*)::int as n from public.order_connections where household_id='${hh}'`);
    expect(oc!.n, "the client's OMS route survives the advisor").toBe(1);
    const fc = await one<{ n: number }>(
      `select count(*)::int as n from public.feed_connections where household_id='${hh}'`);
    expect(fc!.n, "so does the custodian connection").toBe(1);
  });

  it("still erases the person themselves", async () => {
    // Nulling the actor is forgetting them, not keeping them. profiles.id
    // IS the person and stays ON DELETE CASCADE deliberately.
    const p = await one<{ n: number }>(
      `select count(*)::int as n from public.profiles where id='${uid}'`);
    expect(p!.n, "the identity row is gone").toBe(0);
    const m = await one<{ n: number }>(
      `select count(*)::int as n from public.org_members where user_id='${uid}'`);
    expect(m!.n, "and so is the membership").toBe(0);
  });

  it("leaves no user_id column able to cascade from auth.users", async () => {
    // A guard against the next table: any new `user_id references
    // auth.users(id) on delete cascade` is the same bug returning.
    const cascading = await rows<{ table_name: string }>(
      `select distinct tc.table_name
         from information_schema.table_constraints tc
         join information_schema.key_column_usage k
           on k.constraint_name = tc.constraint_name
         join information_schema.referential_constraints rc
           on rc.constraint_name = tc.constraint_name
        where tc.constraint_type = 'FOREIGN KEY'
          and tc.table_schema = 'public'
          and k.column_name = 'user_id'
          and rc.delete_rule = 'CASCADE'
        order by 1`);
    // org_members and household_advisors are MEMBERSHIPS, not records:
    // a departed advisor should stop being a member.
    expect(cascading.map((r) => r.table_name))
      .toEqual(["household_advisors", "org_members"]);
  });
});

describe("010: the audit trail can describe money-routing changes", () => {
  it("accepts the connection and tenancy actions the routes need", async () => {
    const u = await one<{ id: string }>(
      `insert into auth.users (email) values ('acts@x.example') returning id`);
    const actions = [
      "connection.created", "connection.updated", "connection.deleted",
      "household.created", "household.updated",
      "advisor.assigned", "advisor.unassigned",
      "member.invited", "member.joined", "member.removed", "member.role_changed",
    ];
    for (const action of actions) {
      await db.exec(`insert into public.audit_events (user_id, action, source, summary)
                     values ('${u!.id}', '${action}', 'web', 'test')`);
    }
    const n = await one<{ n: number }>(
      `select count(*)::int as n from public.audit_events where user_id='${u!.id}'`);
    expect(n!.n).toBe(actions.length);
  });

  it("still refuses an action outside the vocabulary", async () => {
    const u = await one<{ id: string }>(
      `insert into auth.users (email) values ('badact@x.example') returning id`);
    await expect(db.exec(`insert into public.audit_events (user_id, action, source, summary)
                          values ('${u!.id}', 'order.executed', 'order', 'nope')`))
      .rejects.toThrow(/check constraint|violates/i);
  });
});

describe("010: operational plumbing", () => {
  it("records which migrations have been applied", async () => {
    const v = (await rows<{ version: string }>(
      `select version from public.schema_migrations order by 1`)).map((r) => r.version);
    expect(v).toContain("001_init");
    expect(v).toContain("010_survive_a_departure");
    expect(v.length).toBe(13);
  });

  it("keeps the ledger away from clients", async () => {
    const g = await rows(
      `select privilege_type from information_schema.table_privileges
        where table_name='schema_migrations' and grantee in ('authenticated','anon')`);
    expect(g, "deploy state is operator data").toEqual([]);
  });

  it("gives credential encryption a rotation handle", async () => {
    for (const t of ["feed_connections", "order_connections"]) {
      const c = await one(
        `select 1 from information_schema.columns
          where table_name='${t}' and column_name='secret_key_id'`);
      expect(c, `${t} must be able to say which key sealed its secret`).toBeTruthy();
    }
  });
});

describe("010: the erasure exemption is a keyhole, not a door", () => {
  // 010 had to widen tg_order_tickets_immutable so `on delete set null`
  // could null the actor. That widening is the risk: if it lets ANY other
  // field move alongside, "erase me" becomes a way to rewrite an order
  // after the fact — which is the exact thing the trigger exists to stop.
  let org = "", hh = "", uid = "";

  beforeAll(async () => {
    const u = await one<{ id: string }>(
      `insert into auth.users (email) values ('keyhole@x.example') returning id`);
    uid = u!.id;
    const o = await one<{ org_id: string }>(
      `select org_id from public.org_members where user_id='${uid}'`);
    org = o!.org_id;
    const h = await one<{ id: string }>(
      `select id from public.households where org_id='${org}' limit 1`);
    hh = h!.id;
  });

  const mk = async (ticket: string, status: string) => {
    await db.exec(`insert into public.order_tickets
        (user_id, household_id, org_id, ticket_id, fingerprint, account, currency,
         positions, total_amount, payload, status)
       values ('${uid}', '${hh}', '${org}', '${ticket}', 'fp', 'CH-1', 'CHF',
               3, 500000, '{}'::jsonb, '${status}')`);
  };

  it("refuses an erasure that also moves the custody account", async () => {
    await mk("wo_keyhole_0001", "staged");
    await expect(db.exec(
      `update public.order_tickets set user_id = null, account = 'CH-OTHER'
        where ticket_id = 'wo_keyhole_0001'`))
      .rejects.toThrow(/immutable/i);
  });

  it("refuses an erasure that also moves the amount", async () => {
    await mk("wo_keyhole_0002", "staged");
    await expect(db.exec(
      `update public.order_tickets set user_id = null, total_amount = 1
        where ticket_id = 'wo_keyhole_0002'`))
      .rejects.toThrow(/immutable/i);
  });

  it("refuses an erasure that reopens a terminal row", async () => {
    await mk("wo_keyhole_0003", "staged");
    await expect(db.exec(
      `update public.order_tickets set user_id = null, status = 'sending'
        where ticket_id = 'wo_keyhole_0003'`))
      .rejects.toThrow(/immutable|terminal/i);
  });

  it("refuses an erasure that re-points the ticket at another client", async () => {
    // The worst version: forget who sent it AND move whose money it was.
    await mk("wo_keyhole_0004", "staged");
    const other = await one<{ id: string }>(
      `insert into public.households (org_id, name) values ('${org}', 'Other') returning id`);
    await expect(db.exec(
      `update public.order_tickets set user_id = null, household_id = '${other!.id}'
        where ticket_id = 'wo_keyhole_0004'`))
      .rejects.toThrow(/immutable/i);
  });

  it("still refuses reopening a terminal row with no erasure involved", async () => {
    await mk("wo_keyhole_0005", "rejected");
    await expect(db.exec(
      `update public.order_tickets set status = 'staged'
        where ticket_id = 'wo_keyhole_0005'`))
      .rejects.toThrow(/terminal/i);
  });

  it("still lets the route finish an in-flight ticket", async () => {
    // The one legitimate update the relay performs: sending → outcome.
    await mk("wo_keyhole_0006", "sending");
    await db.exec(
      `update public.order_tickets set status = 'staged', http_status = 200,
              upstream_ref = 'PM-123'
        where ticket_id = 'wo_keyhole_0006'`);
    const t = await one<{ status: string; upstream_ref: string }>(
      `select status, upstream_ref from public.order_tickets
        where ticket_id = 'wo_keyhole_0006'`);
    expect(t!.status).toBe("staged");
    expect(t!.upstream_ref).toBe("PM-123");
  });

  it("permits the bare erasure, and only that", async () => {
    await mk("wo_keyhole_0007", "staged");
    await db.exec(
      `update public.order_tickets set user_id = null where ticket_id = 'wo_keyhole_0007'`);
    const t = await one<{ user_id: string | null; account: string; total_amount: string }>(
      `select user_id, account, total_amount from public.order_tickets
        where ticket_id = 'wo_keyhole_0007'`);
    expect(t!.user_id).toBeNull();
    expect(t!.account, "the instruction is untouched").toBe("CH-1");
    expect(Number(t!.total_amount)).toBe(500000);
  });
});

describe("011: a firm can take on a second person", () => {
  // Until now a "firm" could only ever have one member: 006 gives
  // org_members no INSERT policy and 007 revokes the grant, deliberately,
  // because any policy wide enough to let someone add themselves is a
  // self-promotion-to-owner primitive.
  let owner = "", org = "", invitee = "";

  const invite = async (email: string, role = "advisor") =>
    one<{ invite_id: string; token: string }>(
      `select * from public.create_invite('${org}', '${email}', '${role}')`);

  beforeAll(async () => {
    const o = await one<{ id: string }>(
      `insert into auth.users (email) values ('boss@eam.example') returning id`);
    owner = o!.id;
    const m = await one<{ org_id: string }>(
      `select org_id from public.org_members where user_id='${owner}'`);
    org = m!.org_id;
    // Room for the whole describe: the seat cap is exercised properly in
    // its own block below, and hitting it here would just mask these tests.
    await db.exec(`update public.organizations set kind='institution', seats=50 where id='${org}'`);
  });

  it("mints an invitation with a token that is NOT stored", async () => {
    await become(owner);
    const inv = await invite("anna@eam.example");
    expect(inv!.token).toMatch(/^[0-9a-f]{64}$/);
    const row = await one<{ token_hash: string; email: string; role: string }>(
      `select token_hash, email, role from public.org_invites where id='${inv!.invite_id}'`);
    expect(row!.token_hash, "a leaked dump must not contain usable invitations")
      .not.toBe(inv!.token);
    expect(row!.token_hash).toMatch(/^[0-9a-f]{64}$/);
    expect(row!.email, "email is normalised for the accept-time comparison").toBe("anna@eam.example");
    await become(null);
  });

  it("REFUSES a forwarded invitation", async () => {
    // The property this whole migration exists for. Invitation mails get
    // forwarded to personal addresses and assistants constantly; without
    // this check, whoever opens the message gets a seat inside a firm
    // holding its clients' entire financial position.
    await become(owner);
    const inv = await invite("intended@eam.example");
    await become(null);

    const stranger = await one<{ id: string }>(
      `insert into auth.users (email) values ('stranger@gmail.example') returning id`);
    await become(stranger!.id);
    await expect(db.query(`select public.accept_invite('${inv!.token}')`))
      .rejects.toThrow(/signed in as/i);
    await become(null);

    const n = await one<{ n: number }>(
      `select count(*)::int as n from public.org_members
        where org_id='${org}' and user_id='${stranger!.id}'`);
    expect(n!.n, "the stranger must not be in the firm").toBe(0);
  });

  it("lets the INTENDED person in, with the invited role", async () => {
    const u = await one<{ id: string }>(
      `insert into auth.users (email) values ('advisor2@eam.example') returning id`);
    invitee = u!.id;
    await become(owner);
    const inv = await invite("advisor2@eam.example", "compliance");
    await become(null);

    await become(invitee);
    const got = await one<{ accept_invite: string }>(
      `select public.accept_invite('${inv!.token}')`);
    expect(got!.accept_invite).toBe(org);
    await become(null);

    const m = await one<{ role: string }>(
      `select role from public.org_members where org_id='${org}' and user_id='${invitee}'`);
    expect(m!.role).toBe("compliance");
  });

  it("is single-use", async () => {
    const u = await one<{ id: string }>(
      `insert into auth.users (email) values ('once@eam.example') returning id`);
    await become(owner);
    const inv = await invite("once@eam.example");
    await become(null);
    await become(u!.id);
    await db.query(`select public.accept_invite('${inv!.token}')`);
    await expect(db.query(`select public.accept_invite('${inv!.token}')`))
      .rejects.toThrow(/not valid/i);
    await become(null);
  });

  it("expires", async () => {
    const u = await one<{ id: string }>(
      `insert into auth.users (email) values ('late@eam.example') returning id`);
    await become(owner);
    const inv = await invite("late@eam.example");
    await become(null);
    await db.exec(`update public.org_invites set expires_at = now() - interval '1 day'
                    where id='${inv!.invite_id}'`);
    await become(u!.id);
    await expect(db.query(`select public.accept_invite('${inv!.token}')`))
      .rejects.toThrow(/not valid/i);
    await become(null);
  });

  it("gives ONE message for every bad token, so it is not an oracle", async () => {
    // "expired" vs "no such invitation" would let someone probe which
    // tokens exist.
    const u = await one<{ id: string }>(
      `insert into auth.users (email) values ('probe@eam.example') returning id`);
    await become(u!.id);
    await expect(db.query(`select public.accept_invite('${"f".repeat(64)}')`))
      .rejects.toThrow(/not valid/i);
    await expect(db.query(`select public.accept_invite('')`))
      .rejects.toThrow(/not valid/i);
    await become(null);
  });

  it("can be revoked before it is used", async () => {
    const u = await one<{ id: string }>(
      `insert into auth.users (email) values ('revoked@eam.example') returning id`);
    await become(owner);
    const inv = await invite("revoked@eam.example");
    await db.query(`select public.revoke_invite('${inv!.invite_id}')`);
    await become(null);
    await become(u!.id);
    await expect(db.query(`select public.accept_invite('${inv!.token}')`))
      .rejects.toThrow(/not valid/i);
    await become(null);
  });

  it("treats a re-send as a re-send, not a second seat", async () => {
    await become(owner);
    const first = await invite("resend@eam.example");
    const second = await invite("resend@eam.example");
    await become(null);
    // The first token stops working; only one live invitation exists.
    const live = await one<{ n: number }>(
      `select count(*)::int as n from public.org_invites
        where org_id='${org}' and email='resend@eam.example'
          and accepted_at is null and revoked_at is null`);
    expect(live!.n).toBe(1);
    expect(second!.token).not.toBe(first!.token);
  });
});

describe("011: roles cannot be escalated through an invitation", () => {
  let owner = "", admin = "", org = "";

  beforeAll(async () => {
    const o = await one<{ id: string }>(
      `insert into auth.users (email) values ('owner2@eam.example') returning id`);
    owner = o!.id;
    const m = await one<{ org_id: string }>(
      `select org_id from public.org_members where user_id='${owner}'`);
    org = m!.org_id;
    await db.exec(`update public.organizations set kind='institution', seats=10 where id='${org}'`);
    const a = await one<{ id: string }>(
      `insert into auth.users (email) values ('admin2@eam.example') returning id`);
    admin = a!.id;
    await db.exec(`insert into public.org_members (org_id, user_id, role)
                   values ('${org}', '${admin}', 'admin')`);
  });

  it("stops an ADMIN minting an owner", async () => {
    // Otherwise "admin" is one invitation away from full control of
    // billing and every household in the firm.
    await become(admin);
    await expect(db.query(
      `select * from public.create_invite('${org}', 'newowner@eam.example', 'owner')`))
      .rejects.toThrow(/only an owner/i);
    await become(null);
  });

  it("lets an OWNER invite an owner", async () => {
    await become(owner);
    const inv = await one<{ token: string }>(
      `select * from public.create_invite('${org}', 'coowner@eam.example', 'owner')`);
    expect(inv!.token).toBeTruthy();
    await become(null);
  });

  it("stops a non-member inviting into the firm at all", async () => {
    const outsider = await one<{ id: string }>(
      `insert into auth.users (email) values ('outsider2@x.example') returning id`);
    await become(outsider!.id);
    await expect(db.query(
      `select * from public.create_invite('${org}', 'x@y.example', 'advisor')`))
      .rejects.toThrow(/organisation not found/i);
    await become(null);
  });

  it("stops an ADVISOR inviting anyone", async () => {
    const adv = await one<{ id: string }>(
      `insert into auth.users (email) values ('adv3@eam.example') returning id`);
    await db.exec(`insert into public.org_members (org_id, user_id, role)
                   values ('${org}', '${adv!.id}', 'advisor')`);
    await become(adv!.id);
    await expect(db.query(
      `select * from public.create_invite('${org}', 'friend@x.example', 'advisor')`))
      .rejects.toThrow(/organisation not found/i);
    await become(null);
  });

  it("refuses an unknown role", async () => {
    await become(owner);
    await expect(db.query(
      `select * from public.create_invite('${org}', 'weird@eam.example', 'superuser')`))
      .rejects.toThrow(/unknown role|check/i);
    await become(null);
  });
});

describe("011: seats are enforced, not merely recorded", () => {
  let owner = "", org = "";

  beforeAll(async () => {
    const o = await one<{ id: string }>(
      `insert into auth.users (email) values ('small@eam.example') returning id`);
    owner = o!.id;
    const m = await one<{ org_id: string }>(
      `select org_id from public.org_members where user_id='${owner}'`);
    org = m!.org_id;
    await db.exec(`update public.organizations set kind='institution', seats=2 where id='${org}'`);
  });

  it("counts a PENDING invite as a seat", async () => {
    // Otherwise a 3-seat firm invites five people, all five accept, and the
    // overage surfaces at renewal instead of at the moment it happens.
    await become(owner);
    const before = await one<{ n: number }>(`select public.org_seats_used('${org}') as n`);
    expect(before!.n).toBe(1);                       // the owner
    await db.query(`select * from public.create_invite('${org}', 'seat2@eam.example')`);
    const after = await one<{ n: number }>(`select public.org_seats_used('${org}') as n`);
    expect(after!.n).toBe(2);
    await become(null);
  });

  it("refuses the invitation that would exceed the cap", async () => {
    await become(owner);
    await expect(db.query(`select * from public.create_invite('${org}', 'seat3@eam.example')`))
      .rejects.toThrow(/seats in use/i);
    await become(null);
  });

  it("frees the seat when an invitation is revoked", async () => {
    const inv = await one<{ id: string }>(
      `select id from public.org_invites where org_id='${org}' and email='seat2@eam.example'`);
    await become(owner);
    await db.query(`select public.revoke_invite('${inv!.id}')`);
    const n = await one<{ n: number }>(`select public.org_seats_used('${org}') as n`);
    expect(n!.n).toBe(1);
    await become(null);
  });

  it("re-checks the cap at ACCEPT, not only at invite", async () => {
    // The firm may have downgraded between sending and accepting.
    const u = await one<{ id: string }>(
      `insert into auth.users (email) values ('downgraded@eam.example') returning id`);
    await become(owner);
    const inv = await one<{ token: string }>(
      `select * from public.create_invite('${org}', 'downgraded@eam.example')`);
    await become(null);
    await db.exec(`update public.organizations set seats = 1 where id='${org}'`);
    await become(u!.id);
    await expect(db.query(`select public.accept_invite('${inv!.token}')`))
      .rejects.toThrow(/no seat available/i);
    await become(null);
  });
});

describe("011: offboarding", () => {
  let owner = "", org = "", leaver = "", hh = "";

  beforeAll(async () => {
    const o = await one<{ id: string }>(
      `insert into auth.users (email) values ('owner3@eam.example') returning id`);
    owner = o!.id;
    const m = await one<{ org_id: string }>(
      `select org_id from public.org_members where user_id='${owner}'`);
    org = m!.org_id;
    await db.exec(`update public.organizations set kind='institution', seats=10 where id='${org}'`);
    const l = await one<{ id: string }>(
      `insert into auth.users (email) values ('leaving@eam.example') returning id`);
    leaver = l!.id;
    await db.exec(`insert into public.org_members (org_id, user_id, role)
                   values ('${org}', '${leaver}', 'advisor')`);
    const h = await one<{ id: string }>(
      `select id from public.households where org_id='${org}' limit 1`);
    hh = h!.id;
    await db.exec(`insert into public.household_advisors (household_id, user_id, org_id)
                   values ('${hh}', '${leaver}', '${org}') on conflict do nothing`);
  });

  it("removes the member and their client assignments", async () => {
    await become(owner);
    await db.query(`select public.remove_member('${org}', '${leaver}')`);
    await become(null);
    const m = await one<{ n: number }>(
      `select count(*)::int as n from public.org_members where org_id='${org}' and user_id='${leaver}'`);
    expect(m!.n).toBe(0);
    // Scoped to THIS firm on purpose: the leaver still has their own
    // personal org from signup, and removing them from an employer must
    // not reach into it.
    const a = await one<{ n: number }>(
      `select count(*)::int as n from public.household_advisors
        where user_id='${leaver}' and org_id='${org}'`);
    expect(a!.n).toBe(0);
    const elsewhere = await one<{ n: number }>(
      `select count(*)::int as n from public.household_advisors
        where user_id='${leaver}' and org_id <> '${org}'`);
    expect(elsewhere!.n, "their own practice is untouched").toBe(1);
  });

  it("leaves the CLIENT untouched", async () => {
    // The household, its plans and its history belong to the firm, not to
    // the advisor who happened to hold it.
    const h = await one<{ n: number }>(
      `select count(*)::int as n from public.households where id='${hh}'`);
    expect(h!.n).toBe(1);
  });

  it("refuses to remove the LAST owner", async () => {
    // Nobody could then invite, assign or manage billing, with no
    // self-service way back.
    await become(owner);
    await expect(db.query(`select public.remove_member('${org}', '${owner}')`))
      .rejects.toThrow(/last owner/i);
    await become(null);
  });

  it("refuses to demote the last owner", async () => {
    await become(owner);
    await expect(db.query(`select public.set_member_role('${org}', '${owner}', 'advisor')`))
      .rejects.toThrow(/last owner/i);
    await become(null);
  });

  it("lets an owner promote someone, then step down", async () => {
    const heir = await one<{ id: string }>(
      `insert into auth.users (email) values ('heir@eam.example') returning id`);
    await db.exec(`insert into public.org_members (org_id, user_id, role)
                   values ('${org}', '${heir!.id}', 'advisor')`);
    await become(owner);
    await db.query(`select public.set_member_role('${org}', '${heir!.id}', 'owner')`);
    await db.query(`select public.set_member_role('${org}', '${owner}', 'admin')`);
    await become(null);
    const r = await one<{ role: string }>(
      `select role from public.org_members where org_id='${org}' and user_id='${owner}'`);
    expect(r!.role).toBe("admin");
  });
});

describe("011: an invited signup joins the firm, not a shell company", () => {
  it("does not mint a personal org when an invitation is pending", async () => {
    // 006's trigger gives EVERY new user a personal org and a household
    // named after their email prefix. For someone signing up because they
    // were invited, that stray household is indistinguishable from a real
    // client in the switcher.
    const o = await one<{ id: string }>(
      `insert into auth.users (email) values ('owner4@eam.example') returning id`);
    const org = await one<{ org_id: string }>(
      `select org_id from public.org_members where user_id='${o!.id}'`);
    await db.exec(`update public.organizations set kind='institution', seats=10 where id='${org!.org_id}'`);

    await become(o!.id);
    const inv = await one<{ token: string }>(
      `select * from public.create_invite('${org!.org_id}', 'joiner@eam.example')`);
    await become(null);

    // NOW they sign up.
    const joiner = await one<{ id: string }>(
      `insert into auth.users (email) values ('joiner@eam.example') returning id`);

    const orgs = await one<{ n: number }>(
      `select count(*)::int as n from public.org_members where user_id='${joiner!.id}'`);
    expect(orgs!.n, "no shell company").toBe(0);
    const hh = await one<{ n: number }>(
      `select count(*)::int as n from public.households where created_by='${joiner!.id}'`);
    expect(hh!.n, "and no phantom household in the client switcher").toBe(0);

    // The profile still exists — they are a real user, just not a firm.
    const p = await one<{ n: number }>(
      `select count(*)::int as n from public.profiles where id='${joiner!.id}'`);
    expect(p!.n).toBe(1);

    await become(joiner!.id);
    await db.query(`select public.accept_invite('${inv!.token}')`);
    await become(null);
    const after = await one<{ role: string }>(
      `select role from public.org_members where user_id='${joiner!.id}'`);
    expect(after!.role).toBe("advisor");
  });

  it("still mints one for an ordinary signup", async () => {
    const solo = await one<{ id: string }>(
      `insert into auth.users (email) values ('solo@practice.example') returning id`);
    const n = await one<{ n: number }>(
      `select count(*)::int as n from public.org_members where user_id='${solo!.id}'`);
    expect(n!.n).toBe(1);
  });
});

describe("011: the new functions are hardened like the rest", () => {
  it("pins search_path on every SECURITY DEFINER function", async () => {
    const fns = await rows<{ proname: string; prosecdef: boolean; proconfig: string[] | null }>(
      `select proname, prosecdef, proconfig from pg_proc p
         join pg_namespace n on n.oid=p.pronamespace
        where n.nspname='public'
          and proname in ('create_invite','accept_invite','revoke_invite',
                          'remove_member','set_member_role','org_seats_used')
        order by proname`);
    expect(fns.length).toBe(6);
    for (const f of fns) {
      expect(f.prosecdef, `${f.proname} must be SECURITY DEFINER`).toBe(true);
      expect((f.proconfig ?? []).join(","), `${f.proname} must pin search_path`).toMatch(/search_path/);
    }
  });

  it("gives clients no direct write path to invitations", async () => {
    const g = await rows(
      `select privilege_type from information_schema.table_privileges
        where table_name='org_invites' and grantee in ('authenticated','anon')
          and privilege_type in ('INSERT','UPDATE','DELETE')`);
    expect(g, "every write must go through the checked functions").toEqual([]);
  });

  it("still gives clients no write path to org_members", async () => {
    // The invariant 007 established and this migration must not undo.
    const g = await rows(
      `select privilege_type from information_schema.table_privileges
        where table_name='org_members' and grantee in ('authenticated','anon')
          and privilege_type in ('INSERT','UPDATE','DELETE')`);
    expect(g).toEqual([]);
  });
});

describe("012: the seats feature is actually reachable", () => {
  // THE TEST WHOSE ABSENCE HID THE BUG. Every 011 describe opened with
  // `update organizations set seats = N` as a superuser — which no real
  // deployment can do, because 007 revokes UPDATE on organizations from
  // `authenticated` and nothing in app/ or lib/ writes the column. So a
  // real firm sat at seats=1 forever and create_invite refused EVERY first
  // invitation, while the UI advised revoking a pending invitation that
  // could not exist.
  //
  // This runs the whole flow on a FRESH signup with the shipped defaults.
  it("lets a brand-new firm invite someone with no hand-editing at all", async () => {
    const boss = await one<{ id: string }>(
      `insert into auth.users (email, email_confirmed_at)
       values ('fresh@eam.example', now()) returning id`);
    const org = await one<{ org_id: string }>(
      `select org_id from public.org_members where user_id='${boss!.id}'`);

    const seats = await one<{ seats: number }>(
      `select seats from public.organizations where id='${org!.org_id}'`);
    expect(seats!.seats, "a new firm must be able to hold more than one person")
      .toBeGreaterThan(1);

    await become(boss!.id);
    const inv = await one<{ token: string }>(
      `select * from public.create_invite('${org!.org_id}', 'colleague@eam.example')`);
    expect(inv!.token, "the first invitation must succeed").toBeTruthy();
    await become(null);

    const joiner = await one<{ id: string }>(
      `insert into auth.users (email, email_confirmed_at)
       values ('colleague@eam.example', now()) returning id`);
    await become(joiner!.id);
    const joined = await one<{ accept_invite: string }>(
      `select public.accept_invite('${inv!.token}')`);
    expect(joined!.accept_invite).toBe(org!.org_id);
    await become(null);

    const n = await one<{ n: number }>(
      `select count(*)::int as n from public.org_members where org_id='${org!.org_id}'`);
    expect(n!.n, "two people, one firm, no superuser SQL anywhere").toBe(2);
  });

  it("keeps raising the cap OFF the client's reach", async () => {
    // Same reasoning that moved entitlement off `profiles` in 006: a user
    // who can UPDATE their own limit has no limit.
    const g = await rows(
      `select routine_name from information_schema.routine_privileges
        where routine_name='set_org_seats' and grantee in ('authenticated','anon')`);
    expect(g, "seats are a commercial act, not a self-service one").toEqual([]);
  });

  it("refuses to set seats below the members already in the firm", async () => {
    const u = await one<{ id: string }>(
      `insert into auth.users (email, email_confirmed_at) values ('cap@eam.example', now()) returning id`);
    const org = await one<{ org_id: string }>(
      `select org_id from public.org_members where user_id='${u!.id}'`);
    await expect(db.query(`select public.set_org_seats('${org!.org_id}', 0)`))
      .rejects.toThrow(/between 1 and/i);
  });
});

describe("012: an admin cannot take the firm", () => {
  let owner = "", admin = "", org = "";

  beforeAll(async () => {
    const o = await one<{ id: string }>(
      `insert into auth.users (email, email_confirmed_at) values ('o5@eam.example', now()) returning id`);
    owner = o!.id;
    const m = await one<{ org_id: string }>(`select org_id from public.org_members where user_id='${owner}'`);
    org = m!.org_id;
    const a = await one<{ id: string }>(
      `insert into auth.users (email, email_confirmed_at) values ('a5@eam.example', now()) returning id`);
    admin = a!.id;
    await db.exec(`insert into public.org_members (org_id, user_id, role)
                   values ('${org}', '${admin}', 'admin')`);
  });

  it("REFUSES an admin removing an owner", async () => {
    // One call — DELETE /api/team?userId=<owner> — was a full takeover.
    // set_member_role already refused the weaker operation of changing an
    // owner's role, which is what made this an obvious oversight.
    await become(admin);
    await expect(db.query(`select public.remove_member('${org}', '${owner}')`))
      .rejects.toThrow(/only an owner may remove/i);
    await become(null);
    const still = await one<{ role: string }>(
      `select role from public.org_members where org_id='${org}' and user_id='${owner}'`);
    expect(still!.role).toBe("owner");
  });

  it("still lets an admin remove an advisor", async () => {
    const adv = await one<{ id: string }>(
      `insert into auth.users (email, email_confirmed_at) values ('adv5@eam.example', now()) returning id`);
    await db.exec(`insert into public.org_members (org_id, user_id, role)
                   values ('${org}', '${adv!.id}', 'advisor')`);
    await become(admin);
    await db.query(`select public.remove_member('${org}', '${adv!.id}')`);
    await become(null);
    const n = await one<{ n: number }>(
      `select count(*)::int as n from public.org_members where org_id='${org}' and user_id='${adv!.id}'`);
    expect(n!.n).toBe(0);
  });

  it("still lets an OWNER remove an owner, when another remains", async () => {
    const co = await one<{ id: string }>(
      `insert into auth.users (email, email_confirmed_at) values ('co5@eam.example', now()) returning id`);
    await db.exec(`insert into public.org_members (org_id, user_id, role)
                   values ('${org}', '${co!.id}', 'owner')`);
    await become(owner);
    await db.query(`select public.remove_member('${org}', '${co!.id}')`);
    await become(null);
    const n = await one<{ n: number }>(
      `select count(*)::int as n from public.org_members where org_id='${org}' and role='owner'`);
    expect(n!.n).toBe(1);
  });
});

describe("012: an invitation does not outlive its author's authority", () => {
  it("dies when the inviter is offboarded", async () => {
    // The attack: an owner mints an owner-invite to a personal address,
    // is offboarded, and redeems it weeks later — back in, as owner.
    const boss = await one<{ id: string }>(
      `insert into auth.users (email, email_confirmed_at) values ('o6@eam.example', now()) returning id`);
    const org = await one<{ org_id: string }>(`select org_id from public.org_members where user_id='${boss!.id}'`);
    const co = await one<{ id: string }>(
      `insert into auth.users (email, email_confirmed_at) values ('co6@eam.example', now()) returning id`);
    await db.exec(`insert into public.org_members (org_id, user_id, role)
                   values ('${org!.org_id}', '${co!.id}', 'owner')`);

    await become(boss!.id);
    const inv = await one<{ token: string }>(
      `select * from public.create_invite('${org!.org_id}', 'backdoor@gmail.example', 'owner')`);
    await become(null);

    // The other owner offboards them.
    await become(co!.id);
    await db.query(`select public.remove_member('${org!.org_id}', '${boss!.id}')`);
    await become(null);

    const backdoor = await one<{ id: string }>(
      `insert into auth.users (email, email_confirmed_at) values ('backdoor@gmail.example', now()) returning id`);
    await become(backdoor!.id);
    await expect(db.query(`select public.accept_invite('${inv!.token}')`))
      .rejects.toThrow(/not valid|no longer administers/i);
    await become(null);

    const n = await one<{ n: number }>(
      `select count(*)::int as n from public.org_members
        where org_id='${org!.org_id}' and user_id='${backdoor!.id}'`);
    expect(n!.n, "the back door must be shut").toBe(0);
  });

  it("dies when the inviter is demoted below the role they granted", async () => {
    const boss = await one<{ id: string }>(
      `insert into auth.users (email, email_confirmed_at) values ('o7@eam.example', now()) returning id`);
    const org = await one<{ org_id: string }>(`select org_id from public.org_members where user_id='${boss!.id}'`);
    const co = await one<{ id: string }>(
      `insert into auth.users (email, email_confirmed_at) values ('co7@eam.example', now()) returning id`);
    await db.exec(`insert into public.org_members (org_id, user_id, role)
                   values ('${org!.org_id}', '${co!.id}', 'owner')`);

    await become(boss!.id);
    const inv = await one<{ token: string }>(
      `select * from public.create_invite('${org!.org_id}', 'later@eam.example', 'owner')`);
    await become(null);

    await become(co!.id);
    await db.query(`select public.set_member_role('${org!.org_id}', '${boss!.id}', 'advisor')`);
    await become(null);

    const later = await one<{ id: string }>(
      `insert into auth.users (email, email_confirmed_at) values ('later@eam.example', now()) returning id`);
    await become(later!.id);
    await expect(db.query(`select public.accept_invite('${inv!.token}')`))
      .rejects.toThrow(/not valid|no longer administers/i);
    await become(null);
  });
});

describe("012: an unconfirmed address is a claim, not an identity", () => {
  it("refuses to redeem before the address is confirmed", async () => {
    // The email binding is the whole security model, and it rests on
    // auth.users.email — which, on a deployment with confirmations off, is
    // just a string someone typed. Nothing in this repo pins that setting,
    // and signup/page.tsx even explains how to turn it off.
    const boss = await one<{ id: string }>(
      `insert into auth.users (email, email_confirmed_at) values ('o8@eam.example', now()) returning id`);
    const org = await one<{ org_id: string }>(`select org_id from public.org_members where user_id='${boss!.id}'`);
    await become(boss!.id);
    const inv = await one<{ token: string }>(
      `select * from public.create_invite('${org!.org_id}', 'unconfirmed@eam.example')`);
    await become(null);

    const u = await one<{ id: string }>(
      `insert into auth.users (email, email_confirmed_at)
       values ('unconfirmed@eam.example', null) returning id`);
    await become(u!.id);
    await expect(db.query(`select public.accept_invite('${inv!.token}')`))
      .rejects.toThrow(/confirm your email/i);
    await become(null);

    // Confirming it makes the same token work.
    await db.exec(`update auth.users set email_confirmed_at = now() where id='${u!.id}'`);
    await become(u!.id);
    await db.query(`select public.accept_invite('${inv!.token}')`);
    await become(null);
    const n = await one<{ n: number }>(
      `select count(*)::int as n from public.org_members
        where org_id='${org!.org_id}' and user_id='${u!.id}'`);
    expect(n!.n).toBe(1);
  });
});

describe("012: org_seats_used is no longer an oracle", () => {
  it("tells a non-member nothing", async () => {
    const insider = await one<{ id: string }>(
      `insert into auth.users (email, email_confirmed_at) values ('in9@eam.example', now()) returning id`);
    const org = await one<{ org_id: string }>(`select org_id from public.org_members where user_id='${insider!.id}'`);
    const outsider = await one<{ id: string }>(
      `insert into auth.users (email, email_confirmed_at) values ('out9@x.example', now()) returning id`);

    await become(insider!.id);
    const mine = await one<{ n: number | null }>(`select public.org_seats_used('${org!.org_id}') as n`);
    expect(mine!.n).toBeGreaterThan(0);
    await become(outsider!.id);
    const theirs = await one<{ n: number | null }>(`select public.org_seats_used('${org!.org_id}') as n`);
    expect(theirs!.n, "a seat count is a fact about someone else's firm").toBeNull();
    await become(null);
  });
});

describe("012: firm-level audit events are recorded AND readable", () => {
  it("records a team event with no household, in a MULTI-client firm", async () => {
    // Before this, recordEvent always sent household_id null, and 008's
    // tg_fill_household then tried to derive one from the actor and RAISED
    // for anyone advising more than one client — i.e. every real firm. So
    // membership changes were recorded nowhere.
    const u = await one<{ id: string }>(
      `insert into auth.users (email, email_confirmed_at) values ('multi@eam.example', now()) returning id`);
    const org = await one<{ org_id: string }>(`select org_id from public.org_members where user_id='${u!.id}'`);
    await db.exec(`insert into public.households (org_id, name, created_by)
                   values ('${org!.org_id}', 'Second client', '${u!.id}')`);

    await db.exec(`insert into public.audit_events (user_id, org_id, action, source, summary)
                   values ('${u!.id}', '${org!.org_id}', 'member.invited', 'web', 'Invited someone')`);

    const e = await one<{ household_id: string | null; org_id: string }>(
      `select household_id, org_id from public.audit_events where summary='Invited someone'`);
    expect(e, "the event must exist").toBeTruthy();
    expect(e!.household_id, "a firm event belongs to no client").toBeNull();
    expect(e!.org_id).toBe(org!.org_id);
  });

  it("does NOT file a firm event onto an unrelated client's trail", async () => {
    // In a single-client firm the old trigger succeeded and attached the
    // team event to that client's regulatory record.
    const u = await one<{ id: string }>(
      `insert into auth.users (email, email_confirmed_at) values ('single9@eam.example', now()) returning id`);
    const org = await one<{ org_id: string }>(`select org_id from public.org_members where user_id='${u!.id}'`);
    await db.exec(`insert into public.audit_events (user_id, org_id, action, source, summary)
                   values ('${u!.id}', '${org!.org_id}', 'member.removed', 'web', 'firm event single')`);
    const e = await one<{ household_id: string | null }>(
      `select household_id from public.audit_events where summary='firm event single'`);
    expect(e!.household_id).toBeNull();
  });

  it("still derives the household for a CLIENT event", async () => {
    // The org-scoped escape hatch must not disable the original behaviour.
    const u = await one<{ id: string }>(
      `insert into auth.users (email, email_confirmed_at) values ('client9@eam.example', now()) returning id`);
    await db.exec(`insert into public.audit_events (user_id, action, source, summary)
                   values ('${u!.id}', 'plan.updated', 'web', 'client event')`);
    const e = await one<{ household_id: string | null }>(
      `select household_id from public.audit_events where summary='client event'`);
    expect(e!.household_id, "a plan edit is about a client").toBeTruthy();
  });

  it("lets a member READ their firm's events", async () => {
    const u = await one<{ id: string }>(
      `insert into auth.users (email, email_confirmed_at) values ('read9@eam.example', now()) returning id`);
    const org = await one<{ org_id: string }>(`select org_id from public.org_members where user_id='${u!.id}'`);
    await db.exec(`insert into public.audit_events (user_id, org_id, action, source, summary)
                   values ('${u!.id}', '${org!.org_id}', 'member.invited', 'web', 'readable firm event')`);
    await db.exec(`set role authenticated`);
    await become(u!.id);
    const seen = await rows(
      `select id from public.audit_events where summary='readable firm event'`);
    expect(seen.length, "written and never readable is the same as not written").toBe(1);
    await db.exec(`reset role`);
    await become(null);
  });
});

describe("013: entitlement can only be written by the service role", () => {
  it("gives the client no way to call the entitlement writer", async () => {
    const g = await rows(
      `select routine_name from information_schema.routine_privileges
        where routine_name = 'apply_stripe_event'
          and grantee in ('authenticated','anon')`);
    expect(g, "the entitlement writer must not be client-callable").toEqual([]);
  });

  it("still refuses a direct UPDATE of is_paid by a client", async () => {
    const u = await one<{ id: string }>(
      `insert into auth.users (email, email_confirmed_at) values ('cheat13@x.example', now()) returning id`);
    await db.exec(`set role authenticated`);
    await become(u!.id);
    await expect(db.exec(`update public.organizations set is_paid = true
                          where id = (select org_id from public.org_members where user_id='${u!.id}')`))
      .rejects.toThrow(/permission denied/i);
    await db.exec(`reset role`);
    await become(null);
  });
});

// A tiny helper mirroring the webhook's rpc call.
const applyEvent = (args: {
  id: string; type: string; created: number; org: string;
  isPaid: boolean | null; status: string; seats: number | null;
  customer?: string | null; subscription?: string | null;
}) => one<{ apply_stripe_event: string }>(
  `select public.apply_stripe_event(
     '${args.id}', '${args.type}', ${args.created}, '${args.org}',
     ${args.isPaid === null ? "null" : args.isPaid},
     ${args.status === null ? "null" : `'${args.status}'`},
     ${args.seats === null ? "null" : args.seats},
     ${args.customer ? `'${args.customer}'` : "null"},
     ${args.subscription ? `'${args.subscription}'` : "null"})`);

describe("013: apply_stripe_event writes entitlement", () => {
  it("applies an active subscription and flips is_paid", async () => {
    const u = await one<{ id: string }>(
      `insert into auth.users (email, email_confirmed_at) values ('pay13@x.example', now()) returning id`);
    const org = await one<{ org_id: string }>(`select org_id from public.org_members where user_id='${u!.id}'`);
    const r = await applyEvent({ id: "evt_a1", type: "customer.subscription.updated", created: 1000,
      org: org!.org_id, isPaid: true, status: "active", seats: 5, customer: "cus_1", subscription: "sub_1" });
    expect(r!.apply_stripe_event).toBe("applied");
    const o = await one<{ is_paid: boolean; subscription_status: string; stripe_customer_id: string; seats: number }>(
      `select is_paid, subscription_status, stripe_customer_id, seats from public.organizations where id='${org!.org_id}'`);
    expect(o!.is_paid).toBe(true);
    expect(o!.subscription_status).toBe("active");
    expect(o!.stripe_customer_id).toBe("cus_1");
    expect(o!.seats).toBe(5);
  });

  it("M1: an UNPAID checkout binds ids but does NOT grant the product", async () => {
    // The delayed-settlement (SEPA/ACH) case: status is 'complete' but the
    // money has not arrived. is_paid=null means "do not change".
    const u = await one<{ id: string }>(
      `insert into auth.users (email, email_confirmed_at) values ('sepa13@x.example', now()) returning id`);
    const org = await one<{ org_id: string }>(`select org_id from public.org_members where user_id='${u!.id}'`);
    const r = await applyEvent({ id: "evt_co1", type: "checkout.session.completed", created: 900,
      org: org!.org_id, isPaid: null, status: "complete", seats: null, customer: "cus_sepa", subscription: "sub_sepa" });
    expect(r!.apply_stripe_event).toBe("bound");
    const o = await one<{ is_paid: boolean; stripe_customer_id: string }>(
      `select is_paid, stripe_customer_id from public.organizations where id='${org!.org_id}'`);
    expect(o!.is_paid, "no product before the money settles").toBe(false);
    expect(o!.stripe_customer_id, "but the customer is bound for future events").toBe("cus_sepa");
  });

  it("M2: a STALE out-of-order event does NOT lock out a paying firm", async () => {
    // active(t2) delivered, then a stale past_due(t1<t2) arrives late. The
    // firm must stay paid — Stripe does not guarantee order.
    const u = await one<{ id: string }>(
      `insert into auth.users (email, email_confirmed_at) values ('order13@x.example', now()) returning id`);
    const org = await one<{ org_id: string }>(`select org_id from public.org_members where user_id='${u!.id}'`);
    await applyEvent({ id: "evt_active", type: "customer.subscription.updated", created: 2000,
      org: org!.org_id, isPaid: true, status: "active", seats: 3, customer: "cus_2", subscription: "sub_2" });
    const r = await applyEvent({ id: "evt_pastdue", type: "customer.subscription.updated", created: 1000,
      org: org!.org_id, isPaid: false, status: "past_due", seats: null, customer: "cus_2", subscription: "sub_2" });
    expect(r!.apply_stripe_event).toBe("stale");
    const o = await one<{ is_paid: boolean; subscription_status: string }>(
      `select is_paid, subscription_status from public.organizations where id='${org!.org_id}'`);
    expect(o!.is_paid, "a stale past_due must not regress a paying firm").toBe(true);
    expect(o!.subscription_status).toBe("active");
  });

  it("M2: a stale event cannot shrink seats below the current ceiling", async () => {
    const u = await one<{ id: string }>(
      `insert into auth.users (email, email_confirmed_at) values ('seats13@x.example', now()) returning id`);
    const org = await one<{ org_id: string }>(`select org_id from public.org_members where user_id='${u!.id}'`);
    await applyEvent({ id: "evt_up", type: "customer.subscription.updated", created: 2000,
      org: org!.org_id, isPaid: true, status: "active", seats: 10, customer: "cus_3", subscription: "sub_3" });
    await applyEvent({ id: "evt_old", type: "customer.subscription.updated", created: 1000,
      org: org!.org_id, isPaid: true, status: "active", seats: 3, customer: "cus_3", subscription: "sub_3" });
    const o = await one<{ seats: number }>(`select seats from public.organizations where id='${org!.org_id}'`);
    expect(o!.seats, "the stale downgrade is ignored").toBe(10);
  });

  it("NEVER drops seats below the members already in the firm", async () => {
    const owner = await one<{ id: string }>(
      `insert into auth.users (email, email_confirmed_at) values ('floor13@x.example', now()) returning id`);
    const org = await one<{ org_id: string }>(`select org_id from public.org_members where user_id='${owner!.id}'`);
    for (const e of ["f1", "f2"]) {
      const m = await one<{ id: string }>(
        `insert into auth.users (email, email_confirmed_at) values ('${e}floor13@x.example', now()) returning id`);
      await db.exec(`insert into public.org_members (org_id, user_id, role) values ('${org!.org_id}', '${m!.id}', 'advisor')`);
    }
    await applyEvent({ id: "evt_floor", type: "customer.subscription.updated", created: 3000,
      org: org!.org_id, isPaid: true, status: "active", seats: 1, customer: null, subscription: null });
    const o = await one<{ seats: number }>(`select seats from public.organizations where id='${org!.org_id}'`);
    expect(o!.seats, "seats floored at the member count").toBe(3);
  });

  it("a lapse to past_due (in order) DOES revoke the product", async () => {
    const u = await one<{ id: string }>(
      `insert into auth.users (email, email_confirmed_at) values ('lapse13@x.example', now()) returning id`);
    const org = await one<{ org_id: string }>(`select org_id from public.org_members where user_id='${u!.id}'`);
    await applyEvent({ id: "evt_l1", type: "customer.subscription.updated", created: 1000,
      org: org!.org_id, isPaid: true, status: "active", seats: 3, customer: "cus_4", subscription: "sub_4" });
    await applyEvent({ id: "evt_l2", type: "customer.subscription.updated", created: 2000,
      org: org!.org_id, isPaid: false, status: "past_due", seats: null, customer: null, subscription: null });
    const o = await one<{ is_paid: boolean; subscription_status: string; stripe_subscription_id: string }>(
      `select is_paid, subscription_status, stripe_subscription_id from public.organizations where id='${org!.org_id}'`);
    expect(o!.is_paid).toBe(false);
    expect(o!.subscription_status).toBe("past_due");
    expect(o!.stripe_subscription_id, "the id survives for reconciliation").toBe("sub_4");
  });
});

describe("013: idempotency and atomicity", () => {
  it("returns 'duplicate' and does not re-apply a seen event", async () => {
    const u = await one<{ id: string }>(
      `insert into auth.users (email, email_confirmed_at) values ('dup13@x.example', now()) returning id`);
    const org = await one<{ org_id: string }>(`select org_id from public.org_members where user_id='${u!.id}'`);
    const a = await applyEvent({ id: "evt_once", type: "customer.subscription.updated", created: 1000,
      org: org!.org_id, isPaid: true, status: "active", seats: 4, customer: "cus_5", subscription: "sub_5" });
    expect(a!.apply_stripe_event).toBe("applied");
    const b = await applyEvent({ id: "evt_once", type: "customer.subscription.updated", created: 1000,
      org: org!.org_id, isPaid: true, status: "active", seats: 4, customer: "cus_5", subscription: "sub_5" });
    expect(b!.apply_stripe_event).toBe("duplicate");
    const n = await one<{ n: number }>(`select count(*)::int as n from public.stripe_events where id='evt_once'`);
    expect(n!.n).toBe(1);
  });

  it("records seen AND applied together — an applied event ledger row is marked applied", async () => {
    const u = await one<{ id: string }>(
      `insert into auth.users (email, email_confirmed_at) values ('led13@x.example', now()) returning id`);
    const org = await one<{ org_id: string }>(`select org_id from public.org_members where user_id='${u!.id}'`);
    await applyEvent({ id: "evt_led", type: "customer.subscription.updated", created: 1000,
      org: org!.org_id, isPaid: true, status: "active", seats: 2, customer: null, subscription: null });
    const row = await one<{ applied: boolean; org_id: string }>(
      `select applied, org_id from public.stripe_events where id='evt_led'`);
    expect(row!.applied).toBe(true);
    expect(row!.org_id).toBe(org!.org_id);
  });

  it("is not client-readable", async () => {
    const g = await rows(
      `select privilege_type from information_schema.table_privileges
        where table_name='stripe_events' and grantee in ('authenticated','anon')`);
    expect(g).toEqual([]);
  });
});

describe("013: one Stripe customer cannot claim two orgs", () => {
  it("refuses to bind a customer already bound elsewhere", async () => {
    const a = await one<{ id: string }>(
      `insert into auth.users (email, email_confirmed_at) values ('binda@x.example', now()) returning id`);
    const orgA = await one<{ org_id: string }>(`select org_id from public.org_members where user_id='${a!.id}'`);
    const b = await one<{ id: string }>(
      `insert into auth.users (email, email_confirmed_at) values ('bindb@x.example', now()) returning id`);
    const orgB = await one<{ org_id: string }>(`select org_id from public.org_members where user_id='${b!.id}'`);

    await applyEvent({ id: "evt_ba", type: "customer.subscription.updated", created: 1000,
      org: orgA!.org_id, isPaid: true, status: "active", seats: null, customer: "cus_shared", subscription: "sub_a" });
    await expect(applyEvent({ id: "evt_bb", type: "customer.subscription.updated", created: 1000,
      org: orgB!.org_id, isPaid: true, status: "active", seats: null, customer: "cus_shared", subscription: "sub_b" }))
      .rejects.toThrow(/already bound/i);
  });
});

describe("013: apply_stripe_event is SECURITY DEFINER with a pinned search_path", () => {
  it("pins search_path", async () => {
    const f = await one<{ prosecdef: boolean; proconfig: string[] | null }>(
      `select prosecdef, proconfig from pg_proc p
         join pg_namespace n on n.oid=p.pronamespace
        where n.nspname='public' and proname = 'apply_stripe_event'`);
    expect(f!.prosecdef).toBe(true);
    expect((f!.proconfig ?? []).join(",")).toMatch(/search_path/);
  });
});
