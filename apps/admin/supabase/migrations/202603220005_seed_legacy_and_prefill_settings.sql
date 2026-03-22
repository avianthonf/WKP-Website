insert into public.site_config (key, value, label, type, description, is_public)
values
  ('hero_bg_url', '', 'Home hero background image', 'image', 'Legacy-compatible background image for the immersive home hero. Falls back behind the home showcase.', true),
  ('delivery_radius_km', '0', 'Delivery radius (km)', 'number', 'Optional delivery radius shown on the delivery information page.', true),
  ('contact_order_prefill_message', 'Hi, I would like to place an order or ask a question.', 'Contact order prefill', 'textarea', 'Prefilled message used when opening the contact chat action.', true),
  ('delivery_radius_title', 'Radius', 'Delivery radius title', 'text', 'Delivery radius card title.', true),
  ('delivery_radius_copy', 'Approximate delivery coverage from the store.', 'Delivery radius copy', 'textarea', 'Delivery radius card copy.', true),
  ('delivery_order_prefill_message', 'Hi, I would like to check delivery details for my order.', 'Delivery order prefill', 'textarea', 'Prefilled message used when opening the delivery chat action.', true)
on conflict (key) do update
set
  label = excluded.label,
  type = excluded.type,
  description = excluded.description,
  is_public = excluded.is_public;
