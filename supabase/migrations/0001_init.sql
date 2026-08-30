-- PawPass MVP schema, triggers, and Row Level Security policies.
-- Run once in Supabase SQL Editor (New snippet -> paste -> Run).

-- ============================================================
-- Enums
-- ============================================================
create type user_role as enum ('caregiver', 'vet', 'ngo', 'admin');
create type org_verification_status as enum ('unverified', 'verified');
create type dog_sex as enum ('male', 'female', 'unknown');
create type dog_status as enum ('well_cared_for', 'attention_needed', 'care_gap');
create type ping_source as enum ('manual', 'qr_scan', 'care_task', 'sighting');
create type caregiver_role as enum ('primary', 'backup');
create type caregiver_status as enum ('active', 'left');
create type care_task_status as enum ('scheduled', 'completed', 'missed');
create type health_event_type as enum ('vaccination', 'sterilisation', 'treatment', 'injury', 'vet_visit');
create type verification_status as enum ('unverified', 'community', 'verified', 'disputed');
create type case_severity as enum ('low', 'medium', 'high', 'critical');
create type case_status as enum ('reported', 'claimed', 'responding', 'at_vet', 'treatment', 'resolved');
create type duplicate_flag_status as enum ('pending', 'same', 'different');

-- ============================================================
-- Tables
-- ============================================================

create table organisations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text,
  verification_status org_verification_status not null default 'unverified',
  created_by uuid,
  created_at timestamptz not null default now()
);

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role user_role not null default 'caregiver',
  org_id uuid references organisations(id),
  created_at timestamptz not null default now()
);

alter table organisations
  add constraint organisations_created_by_fkey foreign key (created_by) references profiles(id);

create sequence dog_pawpass_seq start 1;

create table dogs (
  id uuid primary key default gen_random_uuid(),
  pawpass_id text not null unique,
  name text not null,
  sex dog_sex not null default 'unknown',
  age_estimate text,
  coat_notes text,
  markers text,
  photo_url text,
  current_lat double precision,
  current_lng double precision,
  location_label text,
  status dog_status not null default 'attention_needed',
  created_by uuid not null references profiles(id),
  archived boolean not null default false,
  merged_into uuid references dogs(id),
  created_at timestamptz not null default now()
);

create table location_pings (
  id uuid primary key default gen_random_uuid(),
  dog_id uuid not null references dogs(id) on delete cascade,
  lat double precision not null,
  lng double precision not null,
  source ping_source not null default 'manual',
  logged_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

create table caregiver_assignments (
  id uuid primary key default gen_random_uuid(),
  dog_id uuid not null references dogs(id) on delete cascade,
  user_id uuid not null references profiles(id),
  role caregiver_role not null default 'primary',
  status caregiver_status not null default 'active',
  created_at timestamptz not null default now(),
  unique (dog_id, user_id)
);

create table care_schedules (
  id uuid primary key default gen_random_uuid(),
  dog_id uuid not null references dogs(id) on delete cascade,
  task_type text not null default 'feeding',
  frequency text not null default 'daily',
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

create table care_tasks (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid not null references care_schedules(id) on delete cascade,
  dog_id uuid not null references dogs(id) on delete cascade,
  due_date date not null,
  status care_task_status not null default 'scheduled',
  completed_by uuid references profiles(id),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (schedule_id, due_date)
);

create table health_events (
  id uuid primary key default gen_random_uuid(),
  dog_id uuid not null references dogs(id) on delete cascade,
  type health_event_type not null,
  event_date date not null default current_date,
  provider text,
  notes text,
  evidence_url text,
  verification_status verification_status not null default 'community',
  submitted_by uuid not null references profiles(id),
  verified_by uuid references profiles(id),
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create table medical_cases (
  id uuid primary key default gen_random_uuid(),
  dog_id uuid not null references dogs(id) on delete cascade,
  severity case_severity not null default 'medium',
  location_label text,
  evidence_url text,
  status case_status not null default 'reported',
  reported_by uuid not null references profiles(id),
  claimed_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table timeline_events (
  id uuid primary key default gen_random_uuid(),
  dog_id uuid not null references dogs(id) on delete cascade,
  event_type text not null,
  ref_table text,
  ref_id uuid,
  description text not null,
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

create table duplicate_flags (
  id uuid primary key default gen_random_uuid(),
  dog_a uuid not null references dogs(id) on delete cascade,
  dog_b uuid not null references dogs(id) on delete cascade,
  note text,
  status duplicate_flag_status not null default 'pending',
  resolved_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  type text not null,
  message text not null,
  read_status boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Helper functions
-- ============================================================

create or replace function current_role_is(roles user_role[])
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles p
    where p.id = auth.uid() and p.role = any(roles)
  );
$$;

create or replace function is_active_caregiver(target_dog_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from caregiver_assignments ca
    where ca.dog_id = target_dog_id
      and ca.user_id = auth.uid()
      and ca.status = 'active'
  );
$$;

-- ============================================================
-- Triggers
-- ============================================================

-- Auto-create a profile row when a new auth user signs up.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data ->> 'full_name', 'caregiver');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Assign a PawPass ID before insert if not already set.
-- City code is hardcoded for the single-neighbourhood pilot; change per market.
create or replace function assign_pawpass_id()
returns trigger
language plpgsql
as $$
begin
  if new.pawpass_id is null then
    new.pawpass_id := 'PP-PIL-' || lpad(nextval('dog_pawpass_seq')::text, 6, '0');
  end if;
  return new;
end;
$$;

create trigger dogs_assign_pawpass_id
  before insert on dogs
  for each row execute function assign_pawpass_id();

-- ============================================================
-- Row Level Security
-- ============================================================

alter table organisations enable row level security;
alter table profiles enable row level security;
alter table dogs enable row level security;
alter table location_pings enable row level security;
alter table caregiver_assignments enable row level security;
alter table care_schedules enable row level security;
alter table care_tasks enable row level security;
alter table health_events enable row level security;
alter table medical_cases enable row level security;
alter table timeline_events enable row level security;
alter table duplicate_flags enable row level security;
alter table notifications enable row level security;

-- profiles
create policy "profiles_select_all" on profiles for select
  to authenticated using (true);

create policy "profiles_update_own" on profiles for update
  to authenticated using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from profiles where id = auth.uid()));

create policy "profiles_admin_update_any" on profiles for update
  to authenticated using (current_role_is(array['admin']::user_role[]));

-- organisations
create policy "organisations_select_all" on organisations for select
  to authenticated using (true);

create policy "organisations_insert_any" on organisations for insert
  to authenticated with check (true);

create policy "organisations_admin_update" on organisations for update
  to authenticated using (current_role_is(array['admin']::user_role[]));

-- dogs
create policy "dogs_select_all" on dogs for select
  to authenticated using (true);

create policy "dogs_insert_any" on dogs for insert
  to authenticated with check (created_by = auth.uid());

create policy "dogs_update_creator_or_caregiver" on dogs for update
  to authenticated using (
    created_by = auth.uid()
    or is_active_caregiver(id)
    or current_role_is(array['admin']::user_role[])
  );

-- location_pings
create policy "pings_select_all" on location_pings for select
  to authenticated using (true);

create policy "pings_insert_own" on location_pings for insert
  to authenticated with check (logged_by = auth.uid());

-- caregiver_assignments
create policy "assignments_select_all" on caregiver_assignments for select
  to authenticated using (true);

create policy "assignments_insert_self_or_admin" on caregiver_assignments for insert
  to authenticated with check (user_id = auth.uid() or current_role_is(array['admin']::user_role[]));

create policy "assignments_update_self_or_admin" on caregiver_assignments for update
  to authenticated using (user_id = auth.uid() or current_role_is(array['admin']::user_role[]));

create policy "assignments_delete_self_or_admin" on caregiver_assignments for delete
  to authenticated using (user_id = auth.uid() or current_role_is(array['admin']::user_role[]));

-- care_schedules
create policy "schedules_select_all" on care_schedules for select
  to authenticated using (true);

create policy "schedules_write_caregiver_or_admin" on care_schedules for insert
  to authenticated with check (is_active_caregiver(dog_id) or current_role_is(array['admin']::user_role[]));

create policy "schedules_update_caregiver_or_admin" on care_schedules for update
  to authenticated using (is_active_caregiver(dog_id) or current_role_is(array['admin']::user_role[]));

-- care_tasks
create policy "tasks_select_all" on care_tasks for select
  to authenticated using (true);

create policy "tasks_insert_caregiver_or_admin" on care_tasks for insert
  to authenticated with check (is_active_caregiver(dog_id) or current_role_is(array['admin']::user_role[]));

create policy "tasks_update_caregiver_or_admin" on care_tasks for update
  to authenticated using (is_active_caregiver(dog_id) or current_role_is(array['admin']::user_role[]));

-- health_events
create policy "health_select_all" on health_events for select
  to authenticated using (true);

create policy "health_insert_any" on health_events for insert
  to authenticated with check (submitted_by = auth.uid());

-- Anyone can update their own submission's non-verification fields;
-- verification_status/verified_by/verified_at should only change via the vet/admin app action.
create policy "health_update_own_or_verifier" on health_events for update
  to authenticated using (
    submitted_by = auth.uid()
    or current_role_is(array['vet', 'admin']::user_role[])
  );

-- medical_cases
create policy "cases_select_all" on medical_cases for select
  to authenticated using (true);

create policy "cases_insert_any" on medical_cases for insert
  to authenticated with check (reported_by = auth.uid());

create policy "cases_update_claimant_or_admin" on medical_cases for update
  to authenticated using (
    claimed_by is null
    or claimed_by = auth.uid()
    or current_role_is(array['vet', 'admin']::user_role[])
  );

-- timeline_events
create policy "timeline_select_all" on timeline_events for select
  to authenticated using (true);

create policy "timeline_insert_own" on timeline_events for insert
  to authenticated with check (created_by = auth.uid());

-- duplicate_flags
create policy "duplicates_select_all" on duplicate_flags for select
  to authenticated using (true);

create policy "duplicates_insert_any" on duplicate_flags for insert
  to authenticated with check (true);

create policy "duplicates_update_admin" on duplicate_flags for update
  to authenticated using (current_role_is(array['admin']::user_role[]));

-- notifications
create policy "notifications_select_own" on notifications for select
  to authenticated using (user_id = auth.uid());

create policy "notifications_update_own" on notifications for update
  to authenticated using (user_id = auth.uid());

create policy "notifications_insert_system" on notifications for insert
  to authenticated with check (true);
