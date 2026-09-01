-- Additive migration. Do not edit 0001_init.sql / 0002_public_read_for_landing.sql.
-- Adds the register -> NGO -> vaccinate -> municipally register -> collar
-- pipeline: an NGO assignment on dogs, and an independent-milestone table
-- for the two steps with no existing home (vaccination already lives in
-- health_events; that stays the source of truth and is not duplicated here).

-- ============================================================
-- NGO assignment
-- ============================================================
alter table dogs add column assigned_org_id uuid references organisations(id);

-- Trustworthy "is this an NGO org" check: at least one linked profile with
-- role='ngo'. organisations.type is free text any authenticated user can
-- set on insert (organisations_insert_any ... with check (true)), so it
-- must not be trusted as a security gate -- profiles.role is admin-controlled.
create or replace function is_ngo_org(target_org_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles p
    where p.org_id = target_org_id and p.role = 'ngo'
  );
$$;

create or replace function enforce_assigned_org_is_ngo()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.assigned_org_id is not null and not is_ngo_org(new.assigned_org_id) then
    raise exception 'assigned_org_id must reference an organisation with a linked ngo-role profile';
  end if;
  return new;
end;
$$;

create trigger dogs_enforce_assigned_org_is_ngo
  before insert or update of assigned_org_id on dogs
  for each row execute function enforce_assigned_org_is_ngo();

-- RLS FIX: dogs_update_creator_or_caregiver had no WITH CHECK, so any
-- creator/active-caregiver could already update every column on a dog --
-- including, once added, assigned_org_id. Recreate with a self-assignment
-- guard mirroring profiles_update_own's role-escalation guard: non-admins
-- may keep updating dogs as before, just not this column.
drop policy "dogs_update_creator_or_caregiver" on dogs;

create policy "dogs_update_creator_or_caregiver" on dogs for update
  to authenticated using (
    created_by = auth.uid()
    or is_active_caregiver(id)
    or current_role_is(array['admin']::user_role[])
  )
  with check (
    current_role_is(array['admin']::user_role[])
    or assigned_org_id is not distinct from (select d.assigned_org_id from dogs d where d.id = dogs.id)
  );

-- ============================================================
-- Independent milestones: municipal registration + physical collar.
-- "Vaccinated" is deliberately not stored here -- see dog_is_vaccinated()
-- below, derived from health_events so there is one source of truth.
-- ============================================================
create table dog_registration_milestones (
  dog_id uuid primary key references dogs(id) on delete cascade,
  municipally_registered boolean not null default false,
  municipal_reference text,
  municipally_registered_at timestamptz,
  municipally_registered_by uuid references profiles(id),
  collar_attached boolean not null default false,
  collar_serial text,
  collared_at timestamptz,
  collared_by uuid references profiles(id)
);

-- Backfill: this is a live database, every existing dog needs a row.
insert into dog_registration_milestones (dog_id)
select id from dogs
where not exists (
  select 1 from dog_registration_milestones m where m.dog_id = dogs.id
);

-- New dogs get a row automatically.
create or replace function create_dog_registration_milestones()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into dog_registration_milestones (dog_id) values (new.id)
  on conflict (dog_id) do nothing;
  return new;
end;
$$;

create trigger dogs_create_registration_milestones
  after insert on dogs
  for each row execute function create_dog_registration_milestones();

-- Derived "vaccinated" milestone, computed rather than stored.
create or replace function dog_is_vaccinated(target_dog_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from health_events h
    where h.dog_id = target_dog_id
      and h.type = 'vaccination'
      and h.verification_status = 'verified'
  );
$$;

-- Who can write milestones for a dog: admin, or a profile whose org is
-- that dog's currently assigned NGO.
create or replace function is_assigned_ngo_member(target_dog_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from dogs d
    join profiles p on p.org_id = d.assigned_org_id
    where d.id = target_dog_id
      and p.id = auth.uid()
      and p.role = 'ngo'
  );
$$;

alter table dog_registration_milestones enable row level security;

create policy "milestones_select_all" on dog_registration_milestones for select
  to authenticated using (true);

-- Safety-net policy; in practice rows are created by the trigger above,
-- which runs as the table owner and bypasses RLS the same way
-- handle_new_user() does for profiles.
create policy "milestones_insert_admin" on dog_registration_milestones for insert
  to authenticated with check (current_role_is(array['admin']::user_role[]));

create policy "milestones_update_admin_or_assigned_ngo" on dog_registration_milestones for update
  to authenticated using (
    current_role_is(array['admin']::user_role[])
    or is_assigned_ngo_member(dog_id)
  );

-- Public landing page reads dogs anonymously already (0002); let it also
-- see the milestones so a future public passport preview isn't half-blind.
create policy "milestones_select_anon" on dog_registration_milestones for select
  to anon using (true);
