import { unstable_noStore as noStore } from 'next/cache';
import { createSupabaseServer, createSupabaseService } from './supabase';
import { env } from './env';
import type {
  Addon,
  Category,
  Dessert,
  Extra,
  Notification,
  Pizza,
  SiteConfigItem,
  StorefrontBundle,
  Topping,
} from './types';

const fallbackBundle: StorefrontBundle = {
  categories: [],
  pizzas: [],
  toppings: [],
  extras: [],
  addons: [],
  desserts: [],
  notifications: [],
  config: {
    hero_title: 'We Knead Pizza',
    hero_subtitle: 'Hand-tossed pizza, warm sides, and a guided order flow.',
    announcement_bar: 'Freshly made daily.',
    whatsapp_number: '918484802540',
    site_theme_color: '#F5F0E8',
    dashboard_live_mode: 'true',
    store_timezone: 'Asia/Kolkata',
    opening_time: '11:00',
    closing_time: '23:00',
    min_order_amount: '0',
    is_open: 'true',
    site_maintenance_mode: 'false',
    address_line1: 'Carona, Goa',
    site_meta_title: 'We Knead Pizza | Crafted Pizza Ordering',
    site_meta_description: 'An editorial pizza storefront with live menu data, guided ordering, and a premium customer experience.',
    nav_links: JSON.stringify([
      { href: '/home', label: 'Home' },
      { href: '/menu', label: 'Menu' },
      { href: '/build', label: 'Build' },
      { href: '/cart', label: 'Cart' },
      { href: '/about', label: 'About' },
      { href: '/contact', label: 'Contact' },
    ]),
  },
  isOpen: true,
  maintenanceMode: false,
};

function toConfigMap(rows: SiteConfigItem[]) {
  return rows.reduce<Record<string, string>>((acc, item) => {
    acc[item.key] = item.value;
    return acc;
  }, {});
}

export async function fetchStorefrontBundle(): Promise<StorefrontBundle> {
  noStore();

  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return fallbackBundle;
  }

  const supabase = env.SUPABASE_SERVICE_ROLE_KEY ? createSupabaseService() : await createSupabaseServer();
  const [categoriesRes, pizzasRes, toppingsRes, extrasRes, addonsRes, dessertsRes, configRes, notificationsRes] =
    await Promise.all([
      supabase.from('categories').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
      supabase
        .from('pizzas')
        .select('*, categories(id,label,slug), pizza_toppings(topping_id, toppings(*))')
        .eq('is_active', true)
        .order('sort_order', { ascending: true }),
      supabase.from('toppings').select('*').eq('is_active', true).order('category', { ascending: true }).order('name', { ascending: true }),
      supabase.from('extras').select('*').eq('is_active', true).order('sort_order', { ascending: true }).order('name', { ascending: true }),
      supabase.from('addons').select('*').eq('is_active', true).order('sort_order', { ascending: true }).order('name', { ascending: true }),
      supabase.from('desserts').select('*').eq('is_active', true).order('sort_order', { ascending: true }).order('name', { ascending: true }),
      supabase.from('site_config').select('*').order('key', { ascending: true }),
      supabase
        .from('notifications')
        .select('*')
        .eq('is_active', true)
        .order('pinned', { ascending: false })
        .order('created_at', { ascending: false }),
    ]);

  const config = toConfigMap((configRes.data || []) as SiteConfigItem[]);
  const maintenanceMode = config.site_maintenance_mode === 'true';
  const isOpen = config.is_open !== 'false' && !maintenanceMode;
  const notifications = ((notificationsRes.data || []) as Notification[]).filter((note) => {
    if (!note.expires_at) return true;
    return new Date(note.expires_at).getTime() > Date.now();
  });

  return {
    categories: (categoriesRes.data || []) as Category[],
    pizzas: (pizzasRes.data || []) as Pizza[],
    toppings: (toppingsRes.data || []) as Topping[],
    extras: (extrasRes.data || []) as Extra[],
    addons: (addonsRes.data || []) as Addon[],
    desserts: (dessertsRes.data || []) as Dessert[],
    notifications,
    config,
    isOpen,
    maintenanceMode,
  };
}

export async function fetchStorefrontConfig(): Promise<Record<string, string>> {
  noStore();

  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return fallbackBundle.config;
  }

  const supabase = env.SUPABASE_SERVICE_ROLE_KEY ? createSupabaseService() : await createSupabaseServer();
  const { data } = await supabase.from('site_config').select('*').order('key', { ascending: true });

  return toConfigMap((data || []) as SiteConfigItem[]);
}

export function getConfigValue(config: Record<string, string>, key: string, fallback = '') {
  return config[key] || fallback;
}

export function money(value: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export function slugify(value: string) {
  return value.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
}
