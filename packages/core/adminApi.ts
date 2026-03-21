// =============================================================
// src/lib/adminApi.ts
// Client-side admin API layer — full CRUD for every entity.
// Used by the Zustand store (useAdminCatalogStore) and any
// client component that needs direct Supabase access.
//
// IMPORTANT: This file runs in the BROWSER. It uses the
// public anon key. Sensitive writes (bypassing RLS) must go
// through Server Actions that use supabaseAdmin (service role).
// =============================================================

import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import {
  pizzaSchema,
  toppingSchema,
  extraSchema,
  addonSchema,
  dessertSchema,
  categorySchema,
  notificationSchema,
} from '@/lib/validations';
import type {
  Pizza,
  Topping,
  Extra,
  Addon,
  Dessert,
  Category,
  Order,
  Notification,
  SiteConfigItem,
  Size,
} from '@/types';

// Re-export entity types with Admin prefix for the Zustand store
export type AdminPizza    = Pizza;
export type AdminTopping  = Topping;
export type AdminExtra    = Extra;
export type AdminAddon    = Addon;
export type AdminDessert  = Dessert;
export type AdminCategory = Category;
export type AdminOrder    = Order;

// ── Supabase browser client ───────────────────────────────────

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// =============================================================
// PIZZAS
// =============================================================

async function getPizzas(): Promise<AdminPizza[]> {
  const { data, error } = await supabase
    .from('pizzas')
    .select('*, categories(label, id), pizza_toppings(topping_id, toppings(*))')
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return data || [];
}

async function createPizza(
  data: z.infer<typeof pizzaSchema>
): Promise<AdminPizza> {
  const slug = data.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const { toppings, ...pizzaData } = data;

  const { data: pizza, error } = await supabase
    .from('pizzas')
    .insert({ ...pizzaData, slug })
    .select('*, categories(label, id)')
    .single();

  if (error) throw error;

  // Insert pizza_toppings junction rows
  if (toppings.length > 0) {
    const { error: ptErr } = await supabase
      .from('pizza_toppings')
      .insert(toppings.map(tid => ({ pizza_id: pizza.id, topping_id: tid })));
    if (ptErr) throw ptErr;
  }

  return pizza;
}

async function updatePizza(
  id: string,
  data: Partial<z.infer<typeof pizzaSchema>>
): Promise<AdminPizza> {
  const { toppings, ...pizzaData } = data;

  const { data: pizza, error } = await supabase
    .from('pizzas')
    .update(pizzaData)
    .eq('id', id)
    .select('*, categories(label, id)')
    .single();

  if (error) throw error;

  // Replace pizza_toppings if provided
  if (toppings !== undefined) {
    await supabase.from('pizza_toppings').delete().eq('pizza_id', id);
    if (toppings.length > 0) {
      const { error: ptErr } = await supabase
        .from('pizza_toppings')
        .insert(toppings.map(tid => ({ pizza_id: id, topping_id: tid })));
      if (ptErr) throw ptErr;
    }
  }

  return pizza;
}

async function deletePizza(id: string): Promise<void> {
  const { error } = await supabase.from('pizzas').delete().eq('id', id);
  if (error) throw error;
}

async function updatePizzaPrice(
  id: string,
  size: Size,
  price: number
): Promise<void> {
  if (price < 1) throw new Error('Price must be greater than 0');
  const col =
    size === 'small'
      ? 'price_small'
      : size === 'medium'
      ? 'price_medium'
      : 'price_large';
  const { error } = await supabase
    .from('pizzas')
    .update({ [col]: price })
    .eq('id', id);
  if (error) throw error;
}

async function togglePizzaActive(
  id: string,
  currentState: boolean
): Promise<void> {
  const { error } = await supabase
    .from('pizzas')
    .update({ is_active: !currentState })
    .eq('id', id);
  if (error) throw error;
}

// =============================================================
// TOPPINGS  (included / listed ingredients — no charge)
// =============================================================

async function getToppings(): Promise<AdminTopping[]> {
  const { data, error } = await supabase
    .from('toppings')
    .select('*')
    .order('category')
    .order('name');
  if (error) throw error;
  return data || [];
}

async function createTopping(
  data: z.infer<typeof toppingSchema>
): Promise<AdminTopping> {
  const slug = data.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  const { data: topping, error } = await supabase
    .from('toppings')
    .insert({ ...data, slug })
    .select('*')
    .single();
  if (error) throw error;
  return topping;
}

async function updateTopping(
  id: string,
  data: Partial<z.infer<typeof toppingSchema>>
): Promise<AdminTopping> {
  const { data: topping, error } = await supabase
    .from('toppings')
    .update(data)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return topping;
}

async function deleteTopping(id: string): Promise<void> {
  const { error } = await supabase.from('toppings').delete().eq('id', id);
  if (error) throw error;
}

// =============================================================
// EXTRAS  (chargeable toppings — size-dependent price)
// =============================================================

async function getExtras(): Promise<AdminExtra[]> {
  const { data, error } = await supabase
    .from('extras')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('name');
  if (error) throw error;
  return data || [];
}

async function createExtra(
  data: z.infer<typeof extraSchema>
): Promise<AdminExtra> {
  const slug = data.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  const { data: extra, error } = await supabase
    .from('extras')
    .insert({ ...data, slug })
    .select('*')
    .single();
  if (error) throw error;
  return extra;
}

async function updateExtra(
  id: string,
  data: Partial<z.infer<typeof extraSchema>>
): Promise<AdminExtra> {
  const { data: extra, error } = await supabase
    .from('extras')
    .update(data)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return extra;
}

async function deleteExtra(id: string): Promise<void> {
  const { error } = await supabase.from('extras').delete().eq('id', id);
  if (error) throw error;
}

/**
 * Update a single size price for an extra inline.
 * Used by the InlineExtraPrice component.
 */
async function updateExtraPrice(
  id: string,
  size: Size,
  price: number
): Promise<void> {
  if (price < 0) throw new Error('Price must be 0 or greater');
  const col =
    size === 'small'
      ? 'price_small'
      : size === 'medium'
      ? 'price_medium'
      : 'price_large';
  const { error } = await supabase
    .from('extras')
    .update({ [col]: price })
    .eq('id', id);
  if (error) throw error;
}

async function toggleExtraSoldOut(
  id: string,
  currentState: boolean
): Promise<void> {
  const { error } = await supabase
    .from('extras')
    .update({ is_sold_out: !currentState })
    .eq('id', id);
  if (error) throw error;
}

// =============================================================
// ADDONS  (flat-price side items — Garlic Bread, Calzone…)
// =============================================================

async function getAddons(): Promise<AdminAddon[]> {
  const { data, error } = await supabase
    .from('addons')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('name');
  if (error) throw error;
  return data || [];
}

async function createAddon(
  data: z.infer<typeof addonSchema>
): Promise<AdminAddon> {
  const slug = data.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  const { data: addon, error } = await supabase
    .from('addons')
    .insert({ ...data, slug })
    .select('*')
    .single();
  if (error) throw error;
  return addon;
}

async function updateAddon(
  id: string,
  data: Partial<z.infer<typeof addonSchema>>
): Promise<AdminAddon> {
  const { data: addon, error } = await supabase
    .from('addons')
    .update(data)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return addon;
}

async function deleteAddon(id: string): Promise<void> {
  const { error } = await supabase.from('addons').delete().eq('id', id);
  if (error) throw error;
}

async function toggleAddonSoldOut(
  id: string,
  currentState: boolean
): Promise<void> {
  const { error } = await supabase
    .from('addons')
    .update({ is_sold_out: !currentState })
    .eq('id', id);
  if (error) throw error;
}

// =============================================================
// DESSERTS
// =============================================================

async function getDesserts(): Promise<AdminDessert[]> {
  const { data, error } = await supabase
    .from('desserts')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('name');
  if (error) throw error;
  return data || [];
}

async function createDessert(
  data: z.infer<typeof dessertSchema>
): Promise<AdminDessert> {
  const slug = data.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  const { data: dessert, error } = await supabase
    .from('desserts')
    .insert({ ...data, slug })
    .select('*')
    .single();
  if (error) throw error;
  return dessert;
}

async function updateDessert(
  id: string,
  data: Partial<z.infer<typeof dessertSchema>>
): Promise<AdminDessert> {
  const { data: dessert, error } = await supabase
    .from('desserts')
    .update(data)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return dessert;
}

async function deleteDessert(id: string): Promise<void> {
  const { error } = await supabase.from('desserts').delete().eq('id', id);
  if (error) throw error;
}

async function toggleDessertSoldOut(
  id: string,
  currentState: boolean
): Promise<void> {
  const { error } = await supabase
    .from('desserts')
    .update({ is_sold_out: !currentState })
    .eq('id', id);
  if (error) throw error;
}

// =============================================================
// CATEGORIES
// =============================================================

async function getCategories(): Promise<AdminCategory[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data || [];
}

async function createCategory(
  data: z.infer<typeof categorySchema>
): Promise<AdminCategory> {
  const slug = data.label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  const { data: category, error } = await supabase
    .from('categories')
    .insert({ ...data, slug })
    .select('*')
    .single();
  if (error) throw error;
  return category;
}

async function updateCategory(
  id: string,
  data: Partial<z.infer<typeof categorySchema>>
): Promise<AdminCategory> {
  const { data: category, error } = await supabase
    .from('categories')
    .update(data)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return category;
}

async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw error;
}

// =============================================================
// ORDERS  (read + status update — creation is done client-side)
// =============================================================

async function getOrders(
  statuses?: Array<Order['status']>
): Promise<AdminOrder[]> {
  let query = supabase
    .from('orders')
    .select(`
      *,
      order_items (
        id, item_type, size, quantity, unit_price, extras_json, customization_json,
        pizzas(name),
        extras(name),
        addons(name),
        desserts(name)
      )
    `)
    .order('created_at', { ascending: false });

  if (statuses && statuses.length > 0) {
    query = query.in('status', statuses);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

async function updateOrderStatus(
  id: string,
  status: Order['status']
): Promise<void> {
  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', id);
  if (error) throw error;
}

// =============================================================
// NOTIFICATIONS
// =============================================================

async function getNotifications(): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

async function createNotification(
  data: z.infer<typeof notificationSchema>
): Promise<Notification> {
  const { data: notification, error } = await supabase
    .from('notifications')
    .insert(data)
    .select('*')
    .single();
  if (error) throw error;
  return notification;
}

async function updateNotification(
  id: string,
  data: Partial<z.infer<typeof notificationSchema>>
): Promise<Notification> {
  const { data: notification, error } = await supabase
    .from('notifications')
    .update(data)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return notification;
}

async function deleteNotification(id: string): Promise<void> {
  const { error } = await supabase.from('notifications').delete().eq('id', id);
  if (error) throw error;
}

async function toggleNotificationActive(
  id: string,
  currentState: boolean
): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_active: !currentState })
    .eq('id', id);
  if (error) throw error;
}

// =============================================================
// SITE CONFIG
// =============================================================

async function getSiteConfig(): Promise<SiteConfigItem[]> {
  const { data, error } = await supabase
    .from('site_config')
    .select('*')
    .order('key');
  if (error) throw error;
  return data || [];
}

async function updateSiteConfig(key: string, value: string): Promise<void> {
  const { error } = await supabase
    .from('site_config')
    .update({ value })
    .eq('key', key);
  if (error) throw error;
}

// =============================================================
// EXPORTED API OBJECT
// =============================================================

export const adminApi = {
  // Pizzas
  getPizzas,
  createPizza,
  updatePizza,
  deletePizza,
  updatePizzaPrice,
  togglePizzaActive,

  // Toppings (included, no charge)
  getToppings,
  createTopping,
  updateTopping,
  deleteTopping,

  // Extras (chargeable, size-dependent)
  getExtras,
  createExtra,
  updateExtra,
  deleteExtra,
  updateExtraPrice,
  toggleExtraSoldOut,

  // Addons (flat-price sides)
  getAddons,
  createAddon,
  updateAddon,
  deleteAddon,
  toggleAddonSoldOut,

  // Desserts
  getDesserts,
  createDessert,
  updateDessert,
  deleteDessert,
  toggleDessertSoldOut,

  // Categories
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,

  // Orders
  getOrders,
  updateOrderStatus,

  // Notifications
  getNotifications,
  createNotification,
  updateNotification,
  deleteNotification,
  toggleNotificationActive,

  // Site Config
  getSiteConfig,
  updateSiteConfig,
};

export type AdminApi = typeof adminApi;
