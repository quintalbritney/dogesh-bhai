-- Allows the logged-out marketing page (dog grid + community stats) to read
-- real data instead of showing zeros. Scoped narrowly: only the tables the
-- public home page actually queries, and only SELECT — no anonymous writes,
-- and every other page (passport, all-dogs list, console, etc.) still
-- requires login via requireProfile()/requireRole() regardless of this.

create policy "dogs_select_anon" on dogs for select
  to anon using (true);

create policy "care_tasks_select_anon" on care_tasks for select
  to anon using (true);

create policy "health_events_select_anon" on health_events for select
  to anon using (true);

create policy "medical_cases_select_anon" on medical_cases for select
  to anon using (true);

-- The /learn page (hygiene/first-aid/get-help) is also public, and lists
-- verified organisations.
create policy "organisations_select_anon" on organisations for select
  to anon using (true);
