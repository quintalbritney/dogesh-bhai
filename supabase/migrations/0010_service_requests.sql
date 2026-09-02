-- Vaccination / sterilisation requests: anyone can flag that a dog needs
-- one, any NGO can claim it and take it up. Deliberately separate from
-- dogs.assigned_org_id (the admin-only "official NGO for this dog"
-- pipeline from 0003) -- claiming a request does NOT assign the dog to
-- that NGO, so this can't be used to route around the admin-only
-- assignment gate. It's a lighter-weight "who's handling this specific
-- medical need" tracker.

create type service_request_type as enum ('vaccination', 'sterilisation');
create type service_request_status as enum ('open', 'claimed', 'completed', 'cancelled');

create table service_requests (
  id uuid primary key default gen_random_uuid(),
  dog_id uuid not null references dogs(id) on delete cascade,
  type service_request_type not null,
  status service_request_status not null default 'open',
  notes text,
  requested_by uuid not null references profiles(id),
  claimed_by uuid references profiles(id),
  claimed_by_org_id uuid references organisations(id),
  claimed_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table service_requests enable row level security;

create policy "service_requests_select_all" on service_requests for select
  to authenticated using (true);

create policy "service_requests_insert_own" on service_requests for insert
  to authenticated with check (requested_by = auth.uid());

-- Single policy (not several ORed ones) so a loose WITH CHECK on one
-- branch can't be combined with another branch's USING to slip past the
-- intended constraints -- the same pitfall found and fixed on dogs' own
-- update policy in 0003.
create policy "service_requests_update" on service_requests for update
  to authenticated
  using (
    current_role_is(array['admin']::user_role[])
    or (status = 'open' and current_role_is(array['ngo']::user_role[]))
    or (status = 'open' and requested_by = auth.uid())
    or claimed_by = auth.uid()
  )
  with check (
    current_role_is(array['admin']::user_role[])
    or (
      -- an NGO claiming an open request: must claim it for themselves,
      -- for their own org, and only move it to 'claimed'
      current_role_is(array['ngo']::user_role[])
      and status = 'claimed'
      and claimed_by = auth.uid()
      and claimed_by_org_id = (select p.org_id from profiles p where p.id = auth.uid())
      and dog_id is not distinct from (select sr.dog_id from service_requests sr where sr.id = service_requests.id)
      and type is not distinct from (select sr.type from service_requests sr where sr.id = service_requests.id)
    )
    or (
      -- the requester cancelling their own still-open request
      requested_by = auth.uid()
      and status = 'cancelled'
      and claimed_by is null
      and dog_id is not distinct from (select sr.dog_id from service_requests sr where sr.id = service_requests.id)
      and type is not distinct from (select sr.type from service_requests sr where sr.id = service_requests.id)
    )
    or (
      -- the NGO who claimed it marking it done or standing down
      claimed_by = auth.uid()
      and status in ('completed', 'cancelled')
      and claimed_by_org_id is not distinct from (select sr.claimed_by_org_id from service_requests sr where sr.id = service_requests.id)
      and dog_id is not distinct from (select sr.dog_id from service_requests sr where sr.id = service_requests.id)
      and type is not distinct from (select sr.type from service_requests sr where sr.id = service_requests.id)
    )
  );
