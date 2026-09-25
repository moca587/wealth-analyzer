-- ─────────────────────────────────────────────────────────────
-- Saved investment proposals
--
-- One current working proposal per household.
-- Unlike plans, proposals are editable drafts, so UPDATE is allowed.
-- ─────────────────────────────────────────────────────────────

create table if not exists public.proposals (
  id uuid primary key default gen_random_uuid(),

  household_id uuid not null
    references public.households(id)
    on delete cascade,

  org_id uuid not null
    references public.organizations(id)
    on delete cascade,

  created_by uuid
    references auth.users(id)
    on delete set null,

  proposal jsonb not null
    check (jsonb_typeof(proposal) = 'object'),

  created_at timestamptz not null
    default now(),

  updated_at timestamptz not null
    default now(),

  unique (household_id)
);

-- Fast lookup of a household's proposal
create index if not exists idx_proposals_household
  on public.proposals(household_id);

-- Automatically maintain updated_at
drop trigger if exists trg_proposals_updated_at
  on public.proposals;

create trigger trg_proposals_updated_at
  before update on public.proposals
  for each row
  execute function public.tg_set_updated_at();


-- ─────────────────────────────────────────────────────────────
-- Row-level security
-- ─────────────────────────────────────────────────────────────

alter table public.proposals
  enable row level security;


-- Anyone allowed to READ this household may read its proposal.
drop policy if exists "proposals_select"
  on public.proposals;

create policy "proposals_select"
  on public.proposals
  for select
  using (
    household_id = any(
      public.auth_household_ids()
    )
  );


-- Anyone allowed to WRITE this household may create a proposal.
drop policy if exists "proposals_insert"
  on public.proposals;

create policy "proposals_insert"
  on public.proposals
  for insert
  with check (
    household_id = any(
      public.auth_write_household_ids()
    )
  );


-- Anyone allowed to WRITE this household may edit its proposal.
drop policy if exists "proposals_update"
  on public.proposals;

create policy "proposals_update"
  on public.proposals
  for update
  using (
    household_id = any(
      public.auth_write_household_ids()
    )
  )
  with check (
    household_id = any(
      public.auth_write_household_ids()
    )
  );

-- No DELETE policy for now.
insert into public.schema_migrations (version) values ('014_proposals')
on conflict (version) do nothing;
