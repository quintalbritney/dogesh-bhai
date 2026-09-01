-- Lets any authenticated user upload a photo when registering or editing a
-- dog, not just admin/ngo. Anyone (any volunteer) can already create a dog
-- row via createDog, so the photo that goes with it needs the same reach --
-- restricting uploads to admin/ngo would silently break registration
-- photos for the exact person the flow is designed for: whoever found the
-- dog. Admin-only delete (from 0007) is unchanged.

drop policy "dog_photos_insert_admin_or_ngo" on storage.objects;

create policy "dog_photos_insert_authenticated" on storage.objects for insert
  to authenticated
  with check (bucket_id = 'dog-photos');
