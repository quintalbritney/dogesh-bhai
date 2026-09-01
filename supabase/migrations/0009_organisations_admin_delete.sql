-- organisations had select/insert/update policies but no delete policy,
-- so any delete silently affected 0 rows under RLS. Needed so
-- seedDemoNgos can clean up organisations seeded under old demo names.
create policy "organisations_admin_delete" on organisations for delete
  to authenticated using (current_role_is(array['admin']::user_role[]));
