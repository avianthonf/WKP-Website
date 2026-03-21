// =============================================================
// src/lib/validations.ts
// Zod schemas — one per entity, derived types exported.
// All schemas align with the new Supabase schema exactly.
// =============================================================

import { z } from 'zod';

// ── Pizza ─────────────────────────────────────────────────────

export const pizzaSchema = z.object({
  name:          z.string().min(2, 'Name must be at least 2 characters'),
  description:   z.string().optional(),
  category_id:   z.string().uuid('Invalid category'),
  price_small:   z.number().min(1, 'Small price must be greater than 0'),
  price_medium:  z.number().min(1, 'Medium price must be greater than 0'),
  price_large:   z.number().min(1, 'Large price must be greater than 0'),
  image_url:     z.string().url('Must be a valid URL').optional().or(z.literal('')),
  is_veg:        z.boolean().default(true),
  is_bestseller: z.boolean().default(false),
  is_spicy:      z.boolean().default(false),
  is_new:        z.boolean().default(false),
  is_active:     z.boolean().default(true),
  sort_order:    z.number().int().min(0).default(0),
  /** Array of topping UUIDs that will populate pizza_toppings junction */
  toppings:      z.array(z.string().uuid()).default([]),
});

export type PizzaFormData = z.infer<typeof pizzaSchema>;

// ── Topping (included / listed ingredient) ────────────────────

export const toppingSchema = z.object({
  name:       z.string().min(1, 'Name is required'),
  category:   z.enum(['cheese', 'meat', 'vegetable', 'sauce', 'herb', 'other']),
  is_veg:     z.boolean().default(true),
  is_active:  z.boolean().default(true),
  sort_order: z.number().int().min(0).default(0),
});

export type ToppingFormData = z.infer<typeof toppingSchema>;

// ── Extra (chargeable add-on topping, size-dependent price) ───

export const extraSchema = z.object({
  name:          z.string().min(1, 'Name is required'),
  price_small:   z.number().min(0, 'Price must be 0 or greater'),
  price_medium:  z.number().min(0, 'Price must be 0 or greater'),
  price_large:   z.number().min(0, 'Price must be 0 or greater'),
  is_veg:        z.boolean().default(true),
  is_active:     z.boolean().default(true),
  sort_order:    z.number().int().min(0).default(0),
});

export type ExtraFormData = z.infer<typeof extraSchema>;

// ── Addon (flat-price side item with image) ───────────────────

export const addonSchema = z.object({
  name:          z.string().min(1, 'Name is required'),
  description:   z.string().optional(),
  price:         z.number().min(0, 'Price must be 0 or greater'),
  image_url:     z.string().url('Must be a valid URL').optional().or(z.literal('')),
  is_veg:        z.boolean().default(true),
  is_bestseller: z.boolean().default(false),
  is_active:     z.boolean().default(true),
  sort_order:    z.number().int().min(0).default(0),
});

export type AddonFormData = z.infer<typeof addonSchema>;

// ── Dessert ───────────────────────────────────────────────────

export const dessertSchema = z.object({
  name:        z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  price:       z.number().min(0, 'Price must be 0 or greater'),
  image_url:   z.string().url('Must be a valid URL').optional().or(z.literal('')),
  is_veg:      z.boolean().default(true),
  is_active:   z.boolean().default(true),
  sort_order:  z.number().int().min(0).default(0),
});

export type DessertFormData = z.infer<typeof dessertSchema>;

// ── Category ──────────────────────────────────────────────────

export const categorySchema = z.object({
  label:       z.string().min(1, 'Label is required'),
  description: z.string().optional(),
  icon:        z.string().optional(),
  type:        z.enum(['pizza', 'addon', 'dessert']),
  sort_order:  z.number().int().min(0).default(0),
  is_active:   z.boolean().default(true),
});

export type CategoryFormData = z.infer<typeof categorySchema>;

// ── Notification ──────────────────────────────────────────────

export const notificationSchema = z.object({
  title:      z.string().min(1, 'Title is required'),
  body:       z.string().optional(),
  type:       z.enum(['info', 'offer', 'event', 'timing', 'warning']).default('info'),
  is_active:  z.boolean().default(true),
  pinned:     z.boolean().default(false),
  expires_at: z.string().datetime().nullable().optional(),
});

export type NotificationFormData = z.infer<typeof notificationSchema>;
