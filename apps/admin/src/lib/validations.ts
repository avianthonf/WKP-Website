import { z } from 'zod';

const imageUrlSchema = z.preprocess((value) => {
  if (value === '' || value === undefined) return null;
  return value;
}, z.string().url('Invalid URL').nullable());

export const pizzaSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  category_id: z.string().uuid('Invalid category ID'),
  price_small: z.number().min(1, 'Price must be at least 1'),
  price_medium: z.number().min(1, 'Price must be at least 1'),
  price_large: z.number().min(1, 'Price must be at least 1'),
  image_url: imageUrlSchema,
  is_veg: z.boolean().default(true),
  is_bestseller: z.boolean().default(false),
  is_spicy: z.boolean().default(false),
  is_new: z.boolean().default(false),
  is_active: z.boolean().default(true),
  sort_order: z.number().int().min(0).default(0),
  toppings: z.array(z.string().uuid()).default([]),
});

export const toppingSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  category: z.enum(['cheese', 'meat', 'vegetable', 'sauce', 'herb', 'other']),
  is_veg: z.boolean().default(true),
  is_active: z.boolean().default(true),
  sort_order: z.number().int().default(0),
});

export const extraSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  price_small: z.number().min(0),
  price_medium: z.number().min(0),
  price_large: z.number().min(0),
  is_veg: z.boolean().default(true),
  is_active: z.boolean().default(true),
  is_sold_out: z.boolean().default(false),
  sort_order: z.number().int().default(0),
});

export const addonSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  price: z.number().min(0),
  image_url: imageUrlSchema,
  is_veg: z.boolean().default(true),
  is_bestseller: z.boolean().default(false),
  is_active: z.boolean().default(true),
  is_sold_out: z.boolean().default(false),
  sort_order: z.number().int().default(0),
});

export const dessertSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  price: z.number().min(0),
  image_url: imageUrlSchema,
  is_veg: z.boolean().default(true),
  is_active: z.boolean().default(true),
  is_sold_out: z.boolean().default(false),
  sort_order: z.number().int().default(0),
});

export const categorySchema = z.object({
  label: z.string().min(1, 'Label is required'),
  description: z.string().optional(),
  icon: z.string().optional(),
  type: z.enum(['pizza', 'addon', 'dessert']),
  sort_order: z.number().int().default(0),
  is_active: z.boolean().default(true),
});

export const notificationSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  body: z.string().optional(),
  type: z.enum(['info', 'offer', 'event', 'timing', 'warning']).default('info'),
  is_active: z.boolean().default(true),
  pinned: z.boolean().default(false),
  expires_at: z.string().datetime().nullable().optional(),
});

export type PizzaFormData = z.infer<typeof pizzaSchema>;
export type ToppingFormData = z.infer<typeof toppingSchema>;
export type ExtraFormData = z.infer<typeof extraSchema>;
export type AddonFormData = z.infer<typeof addonSchema>;
export type DessertFormData = z.infer<typeof dessertSchema>;
export type CategoryFormData = z.infer<typeof categorySchema>;
export type NotificationFormData = z.infer<typeof notificationSchema>;
