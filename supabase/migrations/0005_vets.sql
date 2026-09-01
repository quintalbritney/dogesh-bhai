-- New structured vets/clinics table backing the "nearest vets" feature.
-- No seed rows: per this project's rule to never fabricate contacts/data,
-- it ships empty until a real admin or NGO adds an entry through the app.

create table vets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  phone text,
  lat double precision not null,
  lng double precision not null,
  org_id uuid references organisations(id),
  notes text,
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

alter table vets enable row level security;

create policy "vets_select_all" on vets for select
  to authenticated using (true);

-- Public /learn page reads this too, matching the anon-read pattern in 0002.
create policy "vets_select_anon" on vets for select
  to anon using (true);

create policy "vets_insert_admin_or_ngo" on vets for insert
  to authenticated with check (
    created_by = auth.uid()
    and current_role_is(array['admin', 'ngo']::user_role[])
  );

create policy "vets_update_admin_or_own_ngo_entry" on vets for update
  to authenticated using (
    current_role_is(array['admin']::user_role[])
    or (created_by = auth.uid() and current_role_is(array['ngo']::user_role[]))
  );

create policy "vets_delete_admin" on vets for delete
  to authenticated using (current_role_is(array['admin']::user_role[]));
