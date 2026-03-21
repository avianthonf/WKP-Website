import { describe, it, expect } from 'vitest';
import {
  pizzaSchema,
  toppingSchema,
  extraSchema,
  addonSchema,
  dessertSchema,
  PizzaFormData,
  ToppingFormData,
  ExtraFormData,
  AddonFormData,
  DessertFormData,
} from '../lib/validations';

describe('Validation Schemas', () => {
  describe('Topping Schema', () => {
    it('accepts valid topping data', () => {
      const data: ToppingFormData = {
        name: 'Mozzarella',
        category: 'cheese',
        is_veg: true,
        is_active: true,
        sort_order: 1,
      };
      expect(toppingSchema.parse(data)).toEqual(data);
    });

    it('rejects empty name', () => {
      expect(() => toppingSchema.parse({ name: '', category: 'cheese', is_veg: true, is_active: true, sort_order: 0 })).toThrow('Name is required');
    });

    it('rejects invalid category enum', () => {
      expect(() => toppingSchema.parse({ name: 'Test', category: 'invalid' as never, is_veg: true, is_active: true })).toThrow();
    });

    it('accepts all category values', () => {
      const categories = ['cheese', 'meat', 'vegetable', 'sauce', 'herb', 'other'] as const;
      categories.forEach(cat => {
        const result = toppingSchema.parse({ name: 'Test', category: cat, is_veg: true, is_active: true });
        expect(result.category).toBe(cat);
      });
    });

    it('defaults is_veg and is_active to true', () => {
      const result = toppingSchema.parse({ name: 'Test', category: 'cheese' });
      expect(result.is_veg).toBe(true);
      expect(result.is_active).toBe(true);
    });
  });

  describe('Extra Schema', () => {
    it('accepts valid extra data', () => {
      const data: ExtraFormData = {
        name: 'Olives',
        price_small: 20,
        price_medium: 30,
        price_large: 40,
        is_veg: true,
        is_active: true,
        is_sold_out: false,
        sort_order: 2,
      };
      expect(extraSchema.parse(data)).toEqual(data);
    });

    it('rejects negative prices', () => {
      try {
        extraSchema.parse({
          name: 'Test',
          price_small: -10,
          price_medium: 0,
          price_large: 0,
          is_veg: true,
          is_active: true,
        });
        throw new Error('should not reach');
      } catch (error: unknown) {
        const err = error as { issues?: Array<{ message?: unknown }>; message?: string };
        if (Array.isArray(err?.issues?.[0]?.message)) {
          expect(err.issues?.[0]?.message).toContain('must be greater than or equal to');
        } else {
          expect(err.message).toContain('Number');
        }
      }
    });

    it('accepts zero prices', () => {
      const result = extraSchema.parse({
        name: 'Free Extra',
        price_small: 0,
        price_medium: 0,
        price_large: 0,
        is_veg: true,
        is_active: true,
      });
      expect(result.price_small).toBe(0);
    });

    it('defaults is_sold_out to false', () => {
      const result = extraSchema.parse({
        name: 'Test',
        price_small: 0,
        price_medium: 0,
        price_large: 0,
        is_veg: true,
        is_active: true,
      });
      expect(result.is_sold_out).toBe(false);
    });
  });

  describe('Addon Schema', () => {
    it('accepts valid addon data', () => {
      const data: AddonFormData = {
        name: 'Garlic Bread',
        description: 'Freshly baked with garlic butter',
        price: 99,
        image_url: 'https://example.com/garlic-bread.jpg',
        is_veg: true,
        is_bestseller: true,
        is_active: true,
        is_sold_out: false,
        sort_order: 1,
      };
      expect(addonSchema.parse(data)).toEqual(data);
    });

    it('normalizes missing image_url to null', () => {
      const result = addonSchema.parse({
        name: 'Simple Addon',
        price: 50,
        is_veg: true,
        is_active: true,
      });
      expect(result.description).toBeUndefined();
      expect(result.image_url).toBeNull();
    });

    it('rejects invalid image URL', () => {
      expect(() => addonSchema.parse({
        name: 'Test',
        price: 50,
        image_url: 'not-a-url',
        is_veg: true,
        is_active: true,
      })).toThrow('Invalid URL');
    });

    it('accepts empty image_url as null', () => {
      const result = addonSchema.parse({
        name: 'Test',
        price: 50,
        image_url: '',
        is_veg: true,
        is_active: true,
      });
      expect(result.image_url).toBeNull();
    });
  });

  describe('Pizza Schema', () => {
    it('accepts nullable image_url', () => {
      const data: PizzaFormData = {
        name: 'Test Pizza',
        description: 'A simple test pizza',
        category_id: '123e4567-e89b-12d3-a456-426614174000',
        price_small: 100,
        price_medium: 150,
        price_large: 200,
        image_url: null,
        is_veg: true,
        is_bestseller: false,
        is_spicy: false,
        is_new: false,
        is_active: true,
        sort_order: 0,
        toppings: [],
      };
      expect(pizzaSchema.parse(data)).toEqual(data);
    });
  });

  describe('Dessert Schema', () => {
    it('accepts valid dessert data', () => {
      const data: DessertFormData = {
        name: 'Tiramisu',
        description: 'Classic Italian dessert',
        price: 149,
        image_url: null,
        is_veg: true,
        is_active: true,
        is_sold_out: false,
        sort_order: 3,
      };
      expect(dessertSchema.parse(data)).toEqual(data);
    });

    it('requires non-negative price', () => {
      try {
        dessertSchema.parse({
          name: 'Test',
          price: -10,
          is_veg: true,
          is_active: true,
        });
        throw new Error('should not reach');
      } catch (error: unknown) {
        const err = error as { issues?: Array<{ message?: unknown }>; message?: string };
        if (Array.isArray(err?.issues?.[0]?.message)) {
          expect(err.issues?.[0]?.message).toContain('must be greater than or equal to');
        } else {
          expect(err.message).toContain('Number');
        }
      }
    });
  });
});
