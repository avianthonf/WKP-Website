alter table public.site_config
  add column if not exists is_public boolean not null default true;

update public.site_config
set is_public = true
where is_public is null;
