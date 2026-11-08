-- CloseGuard — initial schema (Phase 1)
-- Apply in the Supabase SQL editor, or with `supabase db push` if you use the CLI.
-- Re-running is safe: objects are created only if missing.

create extension if not exists pgcrypto;

-- Families -------------------------------------------------------------------
create table if not exists public.families (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (length(trim(name)) > 0),
  created_at  timestamptz not null default now()
);

-- Family members ---------------------------------------------------------------
-- phone_label is a display label such as "Ending in 0142". Never store real
-- phone numbers for the demo.
create table if not exists public.family_members (
  id            uuid primary key default gen_random_uuid(),
  family_id     uuid not null references public.families (id) on delete cascade,
  display_name  text not null check (length(trim(display_name)) > 0),
  relationship  text,
  phone_label   text,
  created_at    timestamptz not null default now()
);
create index if not exists family_members_family_id_idx on public.family_members (family_id);

-- Profiles: links a Supabase auth user to their family ------------------------
create table if not exists public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  family_id     uuid not null references public.families (id) on delete restrict,
  display_name  text,
  created_at    timestamptz not null default now()
);
create index if not exists profiles_family_id_idx on public.profiles (family_id);

-- Scam events -----------------------------------------------------------------
-- One row per real-world activity (see README "Event model"):
--   blocked_call       call stopped at the network        → interaction 'blocked'
--   scam_likely_call   call reached the device             → answered / not_answered / unknown,
--                      or a member calling back (outbound) → 'returned' (metadata.direction = 'outbound')
--   reported_number    member reported the number          → 'reported'
--   suspicious_message suspicious text                      → 'replied' / 'unknown'
-- metadata may carry: direction, related_event_id, external_ref.
create table if not exists public.scam_events (
  id                 uuid primary key default gen_random_uuid(),
  family_member_id   uuid not null references public.family_members (id) on delete cascade,
  event_type         text not null,
  "timestamp"        timestamptz not null,
  source             text not null,
  interaction_type   text,
  scam_category      text,
  protection_status  text,
  metadata           jsonb not null default '{}'::jsonb,
  created_at         timestamptz not null default now(),

  constraint scam_events_event_type_chk check (
    event_type in ('scam_likely_call', 'blocked_call', 'suspicious_message', 'reported_number')
  ),
  constraint scam_events_interaction_type_chk check (
    interaction_type is null or interaction_type in
      ('blocked', 'answered', 'not_answered', 'returned', 'reported', 'replied', 'unknown')
  ),
  constraint scam_events_source_chk check (
    source in ('synthetic_demo', 'authorized_external_integration', 'user_submitted')
  ),
  -- A blocked call is represented one way only.
  constraint scam_events_blocked_consistency_chk check (
    (event_type = 'blocked_call') = (interaction_type is not distinct from 'blocked')
  ),
  constraint scam_events_reported_consistency_chk check (
    event_type <> 'reported_number' or interaction_type = 'reported'
  ),
  constraint scam_events_metadata_object_chk check (jsonb_typeof(metadata) = 'object')
);

create index if not exists scam_events_member_time_idx
  on public.scam_events (family_member_id, "timestamp" desc);
create index if not exists scam_events_time_idx
  on public.scam_events ("timestamp" desc);
-- Prevents ingesting the same upstream event twice.
create unique index if not exists scam_events_source_external_ref_uidx
  on public.scam_events (source, (metadata ->> 'external_ref'))
  where metadata ? 'external_ref';

-- Row level security ----------------------------------------------------------
-- RLS is enabled with NO policies for anon/authenticated roles: browsers cannot
-- read or write these tables directly. The CloseGuard backend uses the
-- service-role key and enforces family ownership itself.
alter table public.families       enable row level security;
alter table public.family_members enable row level security;
alter table public.profiles       enable row level security;
alter table public.scam_events    enable row level security;
