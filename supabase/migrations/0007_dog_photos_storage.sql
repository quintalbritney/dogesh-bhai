-- A public Supabase Storage bucket for dog photos. Replaces hardcoding
-- specific image files in source code: the app now lists whatever is in
-- this bucket at request time and applies photos from it (hero image,
-- login page grid, gallery fallback, seeded profiles). Drop new photos in
-- via the Supabase dashboard's Storage UI (that uses your project-owner
-- session, not the app's RLS) and they show up automatically, no code or
-- migration change needed.

insert into storage.buckets (id, name, public)
values ('dog-photos', 'dog-photos', true)
on conflict (id) do nothing;

-- Public read (needed both for the public image URLs and for the app's
-- own .list() calls, including from logged-out visitors on the homepage).
create policy "dog_photos_select_all" on storage.objects for select
  to public
  using (bucket_id = 'dog-photos');

-- Room for a real in-app "upload a photo" feature later (dog registration,
-- health evidence, etc.), restricted the same way the vets table is.
create policy "dog_photos_insert_admin_or_ngo" on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'dog-photos'
    and current_role_is(array['admin', 'ngo']::user_role[])
  );

create policy "dog_photos_delete_admin" on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'dog-photos'
    and current_role_is(array['admin']::user_role[])
  );
