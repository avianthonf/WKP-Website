insert into public.site_config (key, value, label, type, description, is_public)
values
  (
    'home_hero_background_media_type',
    'image',
    'Homepage hero background type',
    'text',
    'Controls whether the homepage hero uses an image or a looping video background.',
    true
  ),
  (
    'home_hero_background_video_url',
    '',
    'Homepage hero video',
    'url',
    'Looping video background behind the immersive homepage hero card.',
    true
  )
on conflict (key) do update set
  value = excluded.value,
  label = excluded.label,
  type = excluded.type,
  description = excluded.description,
  is_public = excluded.is_public;
