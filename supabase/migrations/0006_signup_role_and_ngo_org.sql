-- Lets signup collect a role (Volunteer/NGO) and, for NGO, an organisation
-- name -- while clamping the role server-side so a tampered client-sent
-- signup payload can never grant admin. auth.signUp's options.data ends up
-- in raw_user_meta_data, which is client-controlled, so this trigger is the
-- real enforcement point, not the signup form.

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role text := new.raw_user_meta_data ->> 'role';
  safe_role user_role := case
    when requested_role in ('caregiver', 'ngo') then requested_role::user_role
    else 'caregiver'::user_role
  end;
  org_name text := nullif(trim(new.raw_user_meta_data ->> 'org_name'), '');
  found_org_id uuid;
begin
  insert into profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data ->> 'full_name', safe_role);

  if safe_role = 'ngo' and org_name is not null then
    select id into found_org_id from organisations where lower(name) = lower(org_name) limit 1;

    if found_org_id is null then
      insert into organisations (name, type, created_by)
      values (org_name, 'ngo', new.id)
      returning id into found_org_id;
    end if;

    update profiles set org_id = found_org_id where id = new.id;
  end if;

  return new;
end;
$$;
