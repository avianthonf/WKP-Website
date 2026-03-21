insert into storage.buckets (id, name, public)
values ('menu', 'menu', true)
on conflict (id) do update
set
  name = excluded.name,
  public = excluded.public;

drop policy if exists menu_images_public_read on storage.objects;
drop policy if exists menu_images_authenticated_insert on storage.objects;
drop policy if exists menu_images_authenticated_update on storage.objects;
drop policy if exists menu_images_authenticated_delete on storage.objects;

create policy menu_images_public_read
on storage.objects
for select
using (bucket_id = 'menu');

create policy menu_images_authenticated_insert
on storage.objects
for insert
to authenticated
with check (bucket_id = 'menu');

create policy menu_images_authenticated_update
on storage.objects
for update
to authenticated
using (bucket_id = 'menu')
with check (bucket_id = 'menu');

create policy menu_images_authenticated_delete
on storage.objects
for delete
to authenticated
using (bucket_id = 'menu');
