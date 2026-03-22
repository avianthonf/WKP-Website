alter table public.site_config
  drop constraint if exists site_config_type_check;

alter table public.site_config
  add constraint site_config_type_check
  check (type = any (array['text'::text, 'url'::text, 'image'::text, 'boolean'::text, 'number'::text, 'textarea'::text, 'time'::text, 'json'::text]));
