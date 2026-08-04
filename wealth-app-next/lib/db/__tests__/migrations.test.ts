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
      "007_fix_entitlement_grants.sql", "008_rekey_to_households.sql",
      "009_household_management.sql", "010_survive_a_departure.sql",
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
      "member.invited", "member.joined", "member.removed",
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
    expect(v.length).toBe(10);
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
