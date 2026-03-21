create extension if not exists "pgcrypto";

create table if not exists public.staff_members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null,
  initials text not null,
  email text,
  phone text,
  avatar_url text,
  shift_start text,
  shift_end text,
  status text not null default 'active',
  is_on_shift boolean not null default true,
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint staff_members_status_check check (status in ('active', 'off_shift', 'on_call', 'offline')),
  constraint staff_members_initials_key unique (initials)
);

create index if not exists staff_members_order_index_idx on public.staff_members (order_index asc, created_at asc);

insert into public.staff_members (name, role, initials, email, phone, shift_start, shift_end, status, is_on_shift, order_index)
values
  ('Night Manager', 'Front-of-house lead', 'NM', 'night.ops@wekneadpizza.com', '+91 90000 10001', '18:00', '02:00', 'active', true, 1),
  ('Kitchen Lead', 'Station control and prep', 'KL', 'kitchen.lead@wekneadpizza.com', '+91 90000 10002', '16:00', '01:00', 'active', true, 2),
  ('Delivery Desk', 'Dispatch and tracking', 'DD', 'dispatch@wekneadpizza.com', '+91 90000 10003', '17:00', '01:00', 'on_call', true, 3),
  ('Guest Support', 'Customer care', 'GS', 'support@wekneadpizza.com', '+91 90000 10004', '12:00', '20:00', 'off_shift', false, 4)
on conflict (initials) do nothing;

insert into public.site_config (key, value, label, type, description, is_public)
values (
  'dashboard_live_mode',
  'true',
  'Dashboard Live Mode',
  'boolean',
  'Controls the live indicator and dashboard shell sync state.',
  false
)
on conflict (key) do update
set
  value = excluded.value,
  label = excluded.label,
  type = excluded.type,
  description = excluded.description,
  is_public = excluded.is_public;
