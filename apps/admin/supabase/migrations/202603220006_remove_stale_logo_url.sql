delete from public.site_config
where key = 'logo_url'
  and coalesce(value, '') = '';
