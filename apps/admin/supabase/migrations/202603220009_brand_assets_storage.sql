insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('brand-assets', 'brand-assets', true, 10485760, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update
set
  name = excluded.name,
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists brand_assets_public_read on storage.objects;
drop policy if exists brand_assets_authenticated_insert on storage.objects;
drop policy if exists brand_assets_authenticated_update on storage.objects;
drop policy if exists brand_assets_authenticated_delete on storage.objects;

create policy brand_assets_public_read
on storage.objects
for select
to public
using (bucket_id = 'brand-assets');

create policy brand_assets_authenticated_insert
on storage.objects
for insert
to authenticated
with check (bucket_id = 'brand-assets');

create policy brand_assets_authenticated_update
on storage.objects
for update
to authenticated
using (bucket_id = 'brand-assets')
with check (bucket_id = 'brand-assets');

create policy brand_assets_authenticated_delete
on storage.objects
for delete
to authenticated
using (bucket_id = 'brand-assets');
