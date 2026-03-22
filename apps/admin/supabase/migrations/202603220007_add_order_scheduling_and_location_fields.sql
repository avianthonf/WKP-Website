alter table public.orders
  add column if not exists fulfillment_type text not null default 'delivery',
  add column if not exists scheduled_for timestamp with time zone,
  add column if not exists delivery_location_url text,
  add column if not exists delivery_location_source text,
  add column if not exists delivery_location_accuracy_meters numeric,
  add column if not exists delivery_latitude numeric,
  add column if not exists delivery_longitude numeric;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'orders_fulfillment_type_check'
  ) then
    alter table public.orders
      add constraint orders_fulfillment_type_check
      check (fulfillment_type = any (array['delivery'::text, 'pickup'::text]));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'orders_delivery_location_source_check'
  ) then
    alter table public.orders
      add constraint orders_delivery_location_source_check
      check (
        delivery_location_source is null
        or delivery_location_source = any (array['geolocation'::text, 'manual'::text, 'mixed'::text])
      );
  end if;
end $$;

update public.orders
set fulfillment_type = case
  when delivery_address is null or btrim(delivery_address) = '' then 'pickup'
  else 'delivery'
end;
