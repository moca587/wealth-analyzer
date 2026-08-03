-- ════════════════════════════════════════════════════════════════════
-- 005's entitlement fix did not work. This is the one that does.
--
-- 005 wrote:
--     revoke update (is_paid, ...) on public.profiles from authenticated;
--
-- against a role that already held a TABLE-level UPDATE grant (which is
-- what Supabase's default privileges give). In PostgreSQL a table-level
-- grant subsumes every column, and a column-level REVOKE does not carve
-- a hole in it — the statement succeeds and changes nothing. Verified
-- against a real Postgres:
--
--     grant update on t to authenticated;
--     revoke update (is_paid) on t from authenticated;
--     -- is_paid is STILL updatable
--
-- So `update profiles set is_paid = true` remained a valid statement for
-- any authenticated user, exactly as before 005.
--
-- The documented way to restrict columns is to drop the table-level
-- privilege and grant back only the columns the client may write.
-- ════════════════════════════════════════════════════════════════════

-- Clients may write their own display name and their own plan; nothing
-- else on this row. Billing is written by the Stripe webhook through the
-- service role, which is not subject to these grants.
revoke update on public.profiles from authenticated;
grant  update (display_name, plan) on public.profiles to authenticated;

revoke update on public.profiles from anon;

-- INSERT is likewise column-scoped. The signup trigger creates the row,
-- so a client insert only ever happens via the plan upsert's ON CONFLICT
-- path — but an unrestricted table-level INSERT would let a user create
-- their own row with is_paid = true if it were ever missing.
revoke insert on public.profiles from authenticated;
grant  insert (id, display_name, plan) on public.profiles to authenticated;

revoke insert on public.profiles from anon;

-- ─── Same hazard, same fix, for the tenancy tables ──────────────────
-- 006 relies on there being NO client-writable path to organizations.
-- Default privileges granted the whole table, and RLS having no INSERT
-- or UPDATE policy is what actually blocks writes — but privileges and
-- policies are independent controls, and leaving a grant in place that
-- only a missing policy defeats is the same shape of mistake as above.
revoke insert, update, delete on public.organizations      from authenticated, anon;
revoke insert, update, delete on public.org_members        from authenticated, anon;
revoke insert, update, delete on public.household_advisors from authenticated, anon;
revoke update, delete          on public.plans             from authenticated, anon;
revoke delete                  on public.households        from authenticated, anon;

-- audit_events: append-only means exactly INSERT and SELECT.
revoke update, delete on public.audit_events from authenticated, anon;

-- order_tickets: the route updates a row only while it is in flight, and
-- a trigger already refuses to reopen a terminal one. DELETE is never
-- legitimate — that row is the order of record.
revoke delete on public.order_tickets from authenticated, anon;
