// =============================================================
// src/store/useAdminCatalogStore.ts
// Zustand catalog store — aligned with the new schema.
// Manages: pizzas, toppings, extras, addons, desserts, categories
// =============================================================

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
  adminApi,
  type AdminPizza,
  type AdminTopping,
  type AdminExtra,
  type AdminAddon,
  type AdminDessert,
  type AdminCategory,
} from '@/lib/adminApi';

// Re-export entity types for convenience
export type {
  AdminPizza,
  AdminTopping,
  AdminExtra,
  AdminAddon,
  AdminDessert,
  AdminCategory,
} from '@/lib/adminApi';

// ── Loading / error shape ────────────────────────────────────

type LoadingMap = {
  pizzas:     boolean;
  toppings:   boolean;
  extras:     boolean;
  addons:     boolean;
  desserts:   boolean;
  categories: boolean;
};

type ErrorMap = {
  pizzas:     string | null;
  toppings:   string | null;
  extras:     string | null;
  addons:     string | null;
  desserts:   string | null;
  categories: string | null;
};

// ── Store interface ──────────────────────────────────────────

interface AdminCatalogState {
  // ── Data ──────────────────────────────────────────────────
  pizzas:     AdminPizza[];
  toppings:   AdminTopping[];
  extras:     AdminExtra[];
  addons:     AdminAddon[];
  desserts:   AdminDessert[];
  categories: AdminCategory[];

  // ── Loading ───────────────────────────────────────────────
  loading: LoadingMap;

  // ── Errors ────────────────────────────────────────────────
  errors: ErrorMap;

  // ── Fetch actions ─────────────────────────────────────────
  fetchPizzas:     () => Promise<void>;
  fetchToppings:   () => Promise<void>;
  fetchExtras:     () => Promise<void>;
  fetchAddons:     () => Promise<void>;
  fetchDesserts:   () => Promise<void>;
  fetchCategories: () => Promise<void>;
  fetchAll:        () => Promise<void>;

  // ── Pizza mutations ───────────────────────────────────────
  createPizza: (data: Parameters<typeof adminApi.createPizza>[0])           => Promise<void>;
  updatePizza: (id: string, data: Parameters<typeof adminApi.updatePizza>[1]) => Promise<void>;
  deletePizza: (id: string)                                                  => Promise<void>;

  // ── Topping mutations ─────────────────────────────────────
  createTopping: (data: Parameters<typeof adminApi.createTopping>[0])             => Promise<void>;
  updateTopping: (id: string, data: Parameters<typeof adminApi.updateTopping>[1]) => Promise<void>;
  deleteTopping: (id: string)                                                      => Promise<void>;

  // ── Extra mutations ───────────────────────────────────────
  createExtra: (data: Parameters<typeof adminApi.createExtra>[0])             => Promise<void>;
  updateExtra: (id: string, data: Parameters<typeof adminApi.updateExtra>[1]) => Promise<void>;
  deleteExtra: (id: string)                                                    => Promise<void>;

  // ── Addon mutations ───────────────────────────────────────
  createAddon: (data: Parameters<typeof adminApi.createAddon>[0])             => Promise<void>;
  updateAddon: (id: string, data: Parameters<typeof adminApi.updateAddon>[1]) => Promise<void>;
  deleteAddon: (id: string)                                                    => Promise<void>;

  // ── Dessert mutations ─────────────────────────────────────
  createDessert: (data: Parameters<typeof adminApi.createDessert>[0])               => Promise<void>;
  updateDessert: (id: string, data: Parameters<typeof adminApi.updateDessert>[1])   => Promise<void>;
  deleteDessert: (id: string)                                                        => Promise<void>;

  // ── Category mutations ────────────────────────────────────
  createCategory: (data: Parameters<typeof adminApi.createCategory>[0])               => Promise<void>;
  updateCategory: (id: string, data: Parameters<typeof adminApi.updateCategory>[1])   => Promise<void>;
  deleteCategory: (id: string)                                                          => Promise<void>;

  // ── Utility ───────────────────────────────────────────────
  clearErrors: () => void;
}

// ── Helper: generic fetch wrapper ────────────────────────────

function makeLoader<K extends keyof LoadingMap>(
  set: (fn: (s: AdminCatalogState) => Partial<AdminCatalogState>) => void,
  key: K,
  fetcher: () => Promise<AdminCatalogState[K]>
) {
  return async () => {
    set(s => ({ loading: { ...s.loading, [key]: true }, errors: { ...s.errors, [key]: null } }));
    try {
      const result = await fetcher();
      set(() => ({ [key]: result } as unknown as Partial<AdminCatalogState>));
    } catch (err) {
      set(s => ({
        errors: {
          ...s.errors,
          [key]: err instanceof Error ? err.message : `Failed to fetch ${key}`,
        },
      }));
    } finally {
      set(s => ({ loading: { ...s.loading, [key]: false } }));
    }
  };
}

// ── Store ─────────────────────────────────────────────────────

export const useAdminCatalogStore = create<AdminCatalogState>()(
  devtools(
    (set, get) => ({
      // ── Initial state ────────────────────────────────────
      pizzas:     [],
      toppings:   [],
      extras:     [],
      addons:     [],
      desserts:   [],
      categories: [],
      loading:    { pizzas: false, toppings: false, extras: false, addons: false, desserts: false, categories: false },
      errors:     { pizzas: null,  toppings: null,  extras: null,  addons: null,  desserts: null,  categories: null  },

      // ── Fetch ─────────────────────────────────────────────
      fetchPizzas:     makeLoader(set, 'pizzas',     adminApi.getPizzas),
      fetchToppings:   makeLoader(set, 'toppings',   adminApi.getToppings),
      fetchExtras:     makeLoader(set, 'extras',     adminApi.getExtras),
      fetchAddons:     makeLoader(set, 'addons',     adminApi.getAddons),
      fetchDesserts:   makeLoader(set, 'desserts',   adminApi.getDesserts),
      fetchCategories: makeLoader(set, 'categories', adminApi.getCategories),

      fetchAll: async () => {
        await Promise.all([
          get().fetchPizzas(),
          get().fetchToppings(),
          get().fetchExtras(),
          get().fetchAddons(),
          get().fetchDesserts(),
          get().fetchCategories(),
        ]);
      },

      // ── Pizza mutations ───────────────────────────────────
      createPizza: async (data) => {
        await adminApi.createPizza(data);
        await get().fetchPizzas();
      },
      updatePizza: async (id, data) => {
        await adminApi.updatePizza(id, data);
        await get().fetchPizzas();
      },
      deletePizza: async (id) => {
        await adminApi.deletePizza(id);
        set(s => ({ pizzas: s.pizzas.filter(p => p.id !== id) }));
      },

      // ── Topping mutations ─────────────────────────────────
      createTopping: async (data) => {
        await adminApi.createTopping(data);
        await get().fetchToppings();
      },
      updateTopping: async (id, data) => {
        await adminApi.updateTopping(id, data);
        await get().fetchToppings();
      },
      deleteTopping: async (id) => {
        await adminApi.deleteTopping(id);
        set(s => ({ toppings: s.toppings.filter(t => t.id !== id) }));
      },

      // ── Extra mutations ───────────────────────────────────
      createExtra: async (data) => {
        await adminApi.createExtra(data);
        await get().fetchExtras();
      },
      updateExtra: async (id, data) => {
        await adminApi.updateExtra(id, data);
        await get().fetchExtras();
      },
      deleteExtra: async (id) => {
        await adminApi.deleteExtra(id);
        set(s => ({ extras: s.extras.filter(e => e.id !== id) }));
      },

      // ── Addon mutations ───────────────────────────────────
      createAddon: async (data) => {
        await adminApi.createAddon(data);
        await get().fetchAddons();
      },
      updateAddon: async (id, data) => {
        await adminApi.updateAddon(id, data);
        await get().fetchAddons();
      },
      deleteAddon: async (id) => {
        await adminApi.deleteAddon(id);
        set(s => ({ addons: s.addons.filter(a => a.id !== id) }));
      },

      // ── Dessert mutations ─────────────────────────────────
      createDessert: async (data) => {
        await adminApi.createDessert(data);
        await get().fetchDesserts();
      },
      updateDessert: async (id, data) => {
        await adminApi.updateDessert(id, data);
        await get().fetchDesserts();
      },
      deleteDessert: async (id) => {
        await adminApi.deleteDessert(id);
        set(s => ({ desserts: s.desserts.filter(d => d.id !== id) }));
      },

      // ── Category mutations ────────────────────────────────
      createCategory: async (data) => {
        await adminApi.createCategory(data);
        await get().fetchCategories();
      },
      updateCategory: async (id, data) => {
        await adminApi.updateCategory(id, data);
        await get().fetchCategories();
      },
      deleteCategory: async (id) => {
        await adminApi.deleteCategory(id);
        set(s => ({ categories: s.categories.filter(c => c.id !== id) }));
      },

      // ── Utility ───────────────────────────────────────────
      clearErrors: () =>
        set(() => ({
          errors: {
            pizzas: null,
            toppings: null,
            extras: null,
            addons: null,
            desserts: null,
            categories: null,
          },
        })),
    }),
    { name: 'AdminCatalogStore' }
  )
);
