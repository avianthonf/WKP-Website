# Work Done: Building a Full-Stack Pizza Ordering Platform from Scratch

## Background

This document captures the complete technical journey of building **We Knead Pizza (WKP)** — a production-grade, WhatsApp-first pizza ordering platform — from scratch. The project consists of two websites (an admin dashboard and a customer storefront), a Supabase PostgreSQL backend, and a fully automated CI/CD pipeline deploying to Vercel, all running at zero cost.

### The Failed First Attempt

The first attempt at building this project used **React with plain JavaScript**. That version ran into persistent, hard-to-debug issues: silent type mismatches in props passed between components, runtime crashes from undefined object properties, and subtle bugs in the Supabase query results where column names were misspelled but JavaScript never complained. Refactoring was painful because renaming a field in one file had no way to surface all the other files that depended on it. The decision was made to scrap the JS codebase entirely and rebuild from scratch using **TypeScript**.

### Why TypeScript Changed Everything

TypeScript catches at compile time the exact class of bugs that plagued the JS version:
- Misspelled property names are flagged immediately (`pizza.proce_small` vs `pizza.price_small`).
- Function signatures enforce the shape of data flowing between components.
- Optional chaining (`?.`) and strict null checks prevent the "cannot read property of undefined" crashes.
- Refactoring is safe: renaming a type field highlights every file that needs updating.
- IDE autocomplete works reliably because the compiler knows every type.

The rebuild took significantly less debugging time despite being more code, because the compiler acted as a constant safety net.

---

## Phase 1: Monorepo and Project Scaffolding

### Decision: npm Workspaces Monorepo

The project needed two separate Next.js apps (admin and storefront) that share types, validation schemas, and utility functions. The options considered were:
- **Separate repositories** — rejected because sharing code requires publishing packages or git submodules, both painful for a solo developer.
- **Turborepo** — considered but adds complexity and a learning curve for marginal benefit at this scale.
- **npm workspaces** — chosen because it is built into npm, requires zero extra tooling, and lets both apps import from a shared `packages/core` package with just `"@wkp/core": "*"` in their `package.json`.

### Root `package.json`

```json
{
  "name": "wkp-monorepo",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev": "npm run dev --workspaces",
    "build": "npm run build --workspaces",
    "test": "npm run test --workspaces",
    "lint": "npm run lint --workspaces"
  }
}
```

**Key learning:**
- `"private": true` prevents accidental publishing to npm.
- `"workspaces"` tells npm to link `apps/admin`, `apps/storefront`, and `packages/core` together so they can import each other without publishing.
- `--workspaces` flag runs a script in every workspace. `npm run dev` starts both apps simultaneously.

### `packages/core/package.json`

```json
{
  "name": "@wkp/core",
  "version": "1.0.0",
  "main": "index.ts",
  "types": "index.ts",
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "zod": "^3.22.4"
  }
}
```

**Key learning:**
- Setting `"main"` and `"types"` to `index.ts` (not a compiled `.js` file) means both apps consume the TypeScript source directly. Next.js compiles it during its own build step, so no separate build step is needed for the shared package.
- The `@wkp/` scope is a naming convention. It does not require an npm organization because the package is never published.

### `packages/core/index.ts`

```ts
export * from './validations';
export * from './adminApi';
export * from './cms-backup-restore';
export * from './useAdminCatalogStore';
```

**Key learning:**
- `export * from './validations'` re-exports everything from that module. This means consumers can write `import { pizzaSchema } from '@wkp/core'` instead of reaching into internal paths.
- This barrel-export pattern keeps the public API of the package clean while the internal structure can be reorganized freely.

---

## Phase 2: Next.js App Setup

### Why Next.js 15 with App Router

Next.js was chosen over plain React (Create React App / Vite) because:
- **Server Components** render on the server, which means Supabase queries run server-side and never expose database credentials to the browser.
- **Server Actions** (`'use server'`) allow writing backend mutation logic (insert, update, delete) directly in the same codebase without building a separate REST API.
- **File-based routing** via the `app/` directory means creating a file at `app/menu/page.tsx` automatically creates the `/menu` route.
- **Built-in image optimization** via `next/image` handles lazy loading, responsive sizing, and format conversion.
- **ISR and caching** via `revalidatePath` and `revalidateTag` let the admin trigger cache invalidation after mutations.

### Admin `apps/admin/package.json`

```json
{
  "name": "wekneadpizza-admin",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "test": "cross-env NODE_OPTIONS=--experimental-vm-modules vitest",
    "test:watch": "cross-env NODE_OPTIONS=--experimental-vm-modules vitest --watch",
    "test:coverage": "cross-env NODE_OPTIONS=--experimental-vm-modules vitest --coverage",
    "seed:menu": "node scripts/seed-menu.mjs"
  }
}
```

**Key learning — every dependency and why it was chosen:**

| Package | Why |
|---|---|
| `next` 15.2.8 | App Router with React Server Components. The latest stable version at build time. |
| `react` ^19 | Required by Next.js 15. React 19 introduces the React Compiler and improved server component support. |
| `react-dom` ^19 | DOM-specific methods for React. Always matches the React version. |
| `@supabase/supabase-js` ^2.39 | The official Supabase client. Provides `.from('table').select()` query builder, auth, storage, and realtime APIs. |
| `@supabase/ssr` ^0.1 | SSR-specific Supabase helpers. Handles cookie-based auth sessions in Next.js server components. |
| `@supabase/auth-helpers-nextjs` ^0.9 | Legacy auth helpers. Used alongside `@supabase/ssr` for backward compatibility. |
| `zod` ^3.22 | Runtime schema validation. Validates form data on both client and server. TypeScript infers types from schemas via `z.infer<typeof schema>`. |
| `react-hook-form` ^7.51 | Form state management. Handles validation, dirty tracking, and submission without re-rendering the entire form on every keystroke. |
| `@hookform/resolvers` ^3.3 | Connects Zod schemas to React Hook Form so one schema does both runtime validation and TypeScript type inference. |
| `framer-motion` ^12.38 | Animation library. Provides `motion.div`, `AnimatePresence`, and spring physics for page transitions, card hover effects, and ambient orb animations. |
| `lucide-react` ^0.344 | Icon library. Tree-shakeable SVG icons. Each icon is imported individually (`import { Pizza } from 'lucide-react'`) so only used icons ship to the browser. |
| `react-hot-toast` ^2.4 | Toast notification library. Shows success/error messages after server actions complete. |
| `zustand` ^4.5 | Lightweight state management. Used in `@wkp/core` for the admin catalog store. Simpler than Redux — a single `create()` call returns a hook. |
| `@dnd-kit/core` ^6.1 | Drag-and-drop framework. Powers the Kanban board for order management. |
| `@dnd-kit/sortable` ^8.0 | Sortable preset for @dnd-kit. Provides sortable containers and items. |
| `@dnd-kit/utilities` ^3.2 | CSS transform utilities for @dnd-kit. Handles the visual feedback during drag. |

**Dev dependencies and why:**

| Package | Why |
|---|---|
| `typescript` ^5 | The TypeScript compiler. Provides type checking and IDE support. |
| `tailwindcss` ^4.2 | Utility-first CSS framework. v4 uses a CSS-native engine (no PostCSS config needed in most cases). |
| `@tailwindcss/postcss` ^4.2 | PostCSS plugin for Tailwind v4. Required for Next.js integration. |
| `eslint` ^9, `eslint-config-next` | Linting. Catches common React mistakes (missing keys, unused variables, accessibility issues). |
| `vitest` ^2.0 | Test runner. Compatible with Vite, faster than Jest, supports ESM natively. |
| `@testing-library/react` ^16 | React component testing. Renders components and queries the DOM by accessible roles/text, not implementation details. |
| `@testing-library/dom` ^10.4 | DOM testing utilities. Foundation for `@testing-library/react`. |
| `@testing-library/jest-dom` ^6.4 | Custom matchers like `toBeInTheDocument()`, `toHaveTextContent()`. |
| `@testing-library/user-event` ^14.5 | Simulates real user interactions (click, type, tab) more accurately than `fireEvent`. |
| `jsdom` ^24 | Browser-like DOM environment for tests. Vitest runs in Node but needs DOM APIs. |
| `msw` ^2.3 | Mock Service Worker. Intercepts network requests in tests to return controlled responses without hitting Supabase. |
| `@vitejs/plugin-react` ^6.0 | Vite plugin for React. Required by Vitest to transform JSX. |
| `cross-env` ^10.1 | Sets environment variables cross-platform. `NODE_OPTIONS=--experimental-vm-modules` is needed for Vitest ESM support on Windows. |
| `babel-plugin-react-compiler` 1.0.0 | React Compiler plugin. Automatically memoizes components and hooks, reducing manual `useMemo`/`useCallback` usage. |

### Storefront `apps/storefront/package.json`

The storefront has a leaner dependency set — no form library, no DnD, no toast, no Zustand, no test framework:

```json
{
  "dependencies": {
    "@supabase/ssr": "^0.7.0",
    "@supabase/supabase-js": "^2.99.3",
    "@wkp/core": "*",
    "framer-motion": "^12.38.0",
    "lucide-react": "^0.577.0",
    "next": "15.2.8",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "zod": "^3.25.76"
  }
}
```

**Key learning:**
- The storefront only needs Zod for the `createWhatsAppOrder` server action validation. It does not need `react-hook-form` because the checkout form is simple enough to manage with `useState`.
- `@wkp/core` at `"*"` means "use whatever version is in the workspace." npm links it directly.
- The storefront has no test framework because end-to-end behavior is validated through the admin tests and manual QA.

---

## Phase 3: Supabase Backend

### Why Supabase

Supabase was chosen over Firebase, PlanetScale, or a custom Express API because:
- **Free tier** includes PostgreSQL, Auth, Storage, and Realtime — everything this project needs at zero cost.
- **PostgreSQL** is a real relational database with proper foreign keys, constraints, and joins. Firebase's NoSQL model would require denormalization.
- **Row Level Security (RLS)** policies control access at the database level, not the application level.
- **Realtime subscriptions** push database changes to connected clients via WebSocket, powering the live Kanban board.
- **Storage** provides S3-compatible file storage with public URLs for menu images.
- **Auto-generated REST API** means no backend code needed for reads — the Supabase client generates SQL from the query builder methods.

### Database Schema Design

The schema was designed around these domain entities:

**`site_config`** — the configuration backbone:
- A key-value table where every piece of dynamic storefront text lives.
- `key` (unique text), `value` (text), `label` (human-readable name), `type` (text/url/image/boolean/number/textarea/time/json), `is_public` (boolean).
- This design was chosen over separate config tables because the storefront has 300+ configurable text strings. A key-value table scales linearly without schema changes.

**`pizzas`** — the core product:
- Three price columns (`price_small`, `price_medium`, `price_large`) instead of a separate `prices` table. This was a deliberate denormalization to avoid joins on every menu page load.
- Boolean flags: `is_veg`, `is_bestseller`, `is_spicy`, `is_new`, `is_active`, `is_sold_out`. Each controls a specific UI badge or filter.
- `image_url` is nullable — pizzas can exist without images.
- `sort_order` controls display sequence.

**`pizza_toppings`** — junction table:
- Links pizzas to toppings (many-to-many). Each pizza can have multiple toppings, and each topping can belong to multiple pizzas.
- Supabase's query builder supports nested selects: `.select('*, pizza_toppings(topping_id, toppings(*))')` fetches a pizza with all its toppings in one query.

**`extras`** — size-dependent pricing:
- Like pizzas, extras have `price_small`, `price_medium`, `price_large` because extra toppings cost different amounts depending on pizza size.

**`addons` and `desserts`** — flat pricing:
- Single `price` column because these are standalone items, not pizza modifications.

**`orders`** — the order record:
- `order_number` is a Postgres `SERIAL` (auto-incrementing integer). This gives customers a short, memorable order reference.
- `fulfillment_type` is an enum-like check constraint (`'delivery'` or `'pickup'`).
- Delivery location fields: `delivery_latitude`, `delivery_longitude`, `delivery_location_url` (Google Maps pin), `delivery_location_source` (`'geolocation'`, `'manual'`, or `'mixed'`), `delivery_location_accuracy_meters`.
- `scheduled_for` (nullable timestamp) stores the requested delivery time for after-hours orders.
- `status` follows a Kanban flow: `pending` → `preparing` → `out_for_delivery` → `delivered` (or `cancelled`).

**`order_items`** — line items:
- Foreign keys to `pizzas`, `extras`, `addons`, `desserts` (all nullable since each line item is one type).
- `extras_json` and `customization_json` store per-item extra toppings and builder customizations as JSON.

**`staff_members`** — operational data:
- Roles, shifts, status. Used in the dashboard overview.

**`notifications`** — site-wide announcements:
- `is_active`, `pinned`, `expires_at`. The storefront shows the first active, non-expired notification.

### SQL Migrations

All schema changes are tracked as sequential SQL migration files in `apps/admin/supabase/migrations/`. This is critical because:
- Migrations are **version-controlled** — every schema change is a Git commit.
- Migrations are **idempotent** — seed data uses `ON CONFLICT (key) DO UPDATE` so re-running is safe.
- Migrations are **ordered** — filenames start with timestamps (`202603200001_`) to ensure correct application order.

#### Migration 1: `202603200001_staff_and_dashboard_flags.sql`

```sql
CREATE TABLE IF NOT EXISTS public.staff_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'kitchen',
  initials TEXT NOT NULL DEFAULT '',
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  shift_start TIME,
  shift_end TIME,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','off_shift','on_call','offline')),
  is_on_shift BOOLEAN NOT NULL DEFAULT true,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Key learning:**
- `gen_random_uuid()` generates a UUID v4 primary key. UUIDs are preferred over sequential integers for distributed systems and for hiding record count from API consumers.
- `CHECK (status IN (...))` is a PostgreSQL check constraint that enforces allowed values at the database level, not just the application level.
- `TIMESTAMPTZ` stores timestamps with timezone information. Always use this over `TIMESTAMP` to avoid timezone bugs.
- `DEFAULT now()` auto-sets creation time.

The migration also seeds initial staff and inserts the `dashboard_live_mode` config key:

```sql
INSERT INTO public.site_config (key, value, label, type, is_public)
VALUES ('dashboard_live_mode', 'true', 'Dashboard Live Mode', 'boolean', false)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
```

**Key learning:**
- `ON CONFLICT (key) DO UPDATE` is PostgreSQL's upsert. If a row with the same `key` exists, it updates instead of failing. This makes the migration re-runnable.
- `is_public = false` means this setting is admin-only and should not be exposed to the storefront's public API.

#### Migration 2: `202603200002_menu_images_storage.sql`

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('menu', 'menu', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'menu');

CREATE POLICY "Authenticated insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'menu' AND auth.role() = 'authenticated');
```

**Key learning:**
- Supabase Storage uses PostgreSQL tables internally (`storage.buckets`, `storage.objects`).
- `public = true` makes the bucket's download URLs accessible without authentication.
- RLS policies on `storage.objects` control who can upload/delete. `auth.role() = 'authenticated'` means only logged-in users can upload, but anyone can read.
- `FOR SELECT USING (...)` is the read policy. `FOR INSERT WITH CHECK (...)` is the write policy. The SQL is different because SELECT uses `USING` and INSERT/UPDATE use `WITH CHECK`.

#### Migration 3: `202603220001_add_is_public_to_site_config.sql`

```sql
ALTER TABLE public.site_config ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;
UPDATE public.site_config SET is_public = true WHERE is_public IS NULL;
```

**Key learning:**
- `IF NOT EXISTS` makes the ALTER idempotent. Running it twice does not fail.
- The UPDATE backfills existing rows that predate the column addition.

#### Migration 4: `202603220002_allow_json_site_config_type.sql`

```sql
ALTER TABLE public.site_config DROP CONSTRAINT IF EXISTS site_config_type_check;
ALTER TABLE public.site_config ADD CONSTRAINT site_config_type_check
  CHECK (type IN ('text', 'url', 'image', 'boolean', 'number', 'textarea', 'time', 'json'));
```

**Key learning:**
- PostgreSQL does not support `ALTER CONSTRAINT`. To modify a check constraint, you must drop and re-add it.
- The `json` type was added to support structured content like navigation links, FAQ items, and privacy/terms sections.

#### Migration 5: `202603220003_seed_storefront_copy_defaults.sql`

This is the largest migration — ~280 lines seeding 300+ config keys. Every piece of customer-visible text in the storefront is backed by a config key:

```sql
INSERT INTO public.site_config (key, value, label, type, is_public) VALUES
  ('hero_title', 'We Knead Pizza', 'Hero Title', 'text', true),
  ('hero_subtitle', 'Hand-tossed pizza, warm sides, and a guided order flow.', 'Hero Subtitle', 'textarea', true),
  ('announcement_bar', 'Freshly made daily.', 'Announcement Bar', 'text', true),
  ('whatsapp_number', '918484802540', 'WhatsApp Number', 'text', false),
  -- ... 300+ more rows
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  label = EXCLUDED.label,
  type = EXCLUDED.type,
  is_public = EXCLUDED.is_public;
```

**Key learning:**
- This approach means every UI string can be changed from the admin dashboard without deploying code.
- The naming convention uses page prefixes: `home_*`, `menu_*`, `cart_*`, `about_*`, `contact_*`, `delivery_*`, `builder_*`, `shell_*`, `storefront_*`.
- `EXCLUDED` refers to the values that were attempted to be inserted. This is PostgreSQL's way of referencing the "new" values in an `ON CONFLICT` clause.

#### Migration 7: `202603220007_add_order_scheduling_and_location_fields.sql`

```sql
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS fulfillment_type TEXT DEFAULT NULL
    CHECK (fulfillment_type IS NULL OR fulfillment_type IN ('delivery', 'pickup')),
  ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS delivery_location_url TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS delivery_location_source TEXT DEFAULT NULL
    CHECK (delivery_location_source IS NULL OR delivery_location_source IN ('geolocation', 'manual', 'mixed')),
  ADD COLUMN IF NOT EXISTS delivery_latitude DOUBLE PRECISION DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS delivery_longitude DOUBLE PRECISION DEFAULT NULL;
```

**Key learning:**
- `CHECK (column IS NULL OR column IN (...))` allows both NULL and a restricted set of values. This is needed because the column is optional.
- `DOUBLE PRECISION` is PostgreSQL's 64-bit floating point, suitable for lat/lng coordinates.
- The migration also backfills existing orders: `UPDATE public.orders SET fulfillment_type = 'delivery' WHERE delivery_address IS NOT NULL AND fulfillment_type IS NULL`.

---

## Phase 4: TypeScript Type System

### Admin Types (`apps/admin/src/types/index.ts`)

Every database table has a corresponding TypeScript interface:

```ts
export type Size = 'small' | 'medium' | 'large';
export type CategoryType = 'pizza' | 'addon' | 'dessert';
export type ToppingCategory = 'cheese' | 'meat' | 'vegetable' | 'sauce' | 'herb' | 'other';
export type OrderStatus = 'pending' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';
export type PaymentMethod = 'cash' | 'upi' | 'card';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
```

**Key learning:**
- `type Size = 'small' | 'medium' | 'large'` is a **string literal union type**. A variable of type `Size` can only hold one of those three exact strings. This is more restrictive than `string` and catches typos at compile time.
- These types mirror the PostgreSQL check constraints. The database enforces them at the storage layer; TypeScript enforces them at the application layer.

```ts
export interface Pizza {
  id: string;
  slug: string;
  name: string;
  description?: string;
  category_id: string;
  price_small: number;
  price_medium: number;
  price_large: number;
  image_url?: string | null;
  is_veg: boolean;
  is_bestseller: boolean;
  is_spicy: boolean;
  is_new: boolean;
  is_active: boolean;
  is_sold_out: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  categories?: { label: string; id: string };
  pizza_toppings?: { topping_id: string; toppings?: Topping }[];
}
```

**Key learning:**
- `description?: string` means the field is optional (may be absent from the object).
- `image_url?: string | null` means the field can be absent, present as a string, or present as `null`. This triple-state is common with database columns that are nullable.
- `categories?: { label: string; id: string }` represents the joined category data from Supabase's nested select. This is an inline type — no need for a separate interface.
- `pizza_toppings?: { topping_id: string; toppings?: Topping }[]` represents the many-to-many join result. Supabase returns the junction table rows, each containing the nested topping object.

### Storefront Types (`apps/storefront/app/lib/types.ts`)

The storefront has its own type definitions — similar but not identical to the admin types:

```ts
export interface StorefrontBundle {
  categories: Category[];
  pizzas: Pizza[];
  toppings: Topping[];
  extras: Extra[];
  addons: Addon[];
  desserts: Dessert[];
  notifications: Notification[];
  config: Record<string, string>;
  isOpen: boolean;
  maintenanceMode: boolean;
}
```

**Key learning:**
- `Record<string, string>` is a TypeScript utility type representing an object with string keys and string values. It is the type of the flattened config map (`{ hero_title: 'We Knead Pizza', ... }`).
- The storefront types use `string | null` (with explicit `null`) instead of `string | undefined` because Supabase returns `null` for empty database columns, not `undefined`.

```ts
export interface CartLine {
  id: string;
  kind: 'pizza' | 'extra' | 'addon' | 'dessert';
  sourceId: string;
  name: string;
  imageUrl?: string | null;
  size?: Size;
  quantity: number;
  unitPrice: number;
  extras?: Array<{ id: string; name: string; price: number }>;
  customization?: Record<string, unknown>;
  notes?: string;
}
```

**Key learning:**
- `CartLine` is a frontend-only type. It represents an item in the shopping cart, not a database row.
- `Record<string, unknown>` is safer than `Record<string, any>` because `unknown` requires type checking before use, while `any` disables all type checking.

---

## Phase 5: Zod Validation Schemas (`packages/core/validations.ts`)

Zod provides runtime validation that TypeScript cannot. TypeScript types are erased at runtime — they do not exist in the compiled JavaScript. Zod schemas validate actual data at runtime and also generate TypeScript types.

```ts
import { z } from 'zod';

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
  toppings:      z.array(z.string().uuid()).default([]),
});

export type PizzaFormData = z.infer<typeof pizzaSchema>;
```

**Key learning:**
- `z.string().min(2, 'Name must be at least 2 characters')` validates that the string has at least 2 characters and provides a custom error message.
- `z.string().uuid('Invalid category')` validates UUID format.
- `z.string().url().optional().or(z.literal(''))` accepts either a valid URL, `undefined` (optional), or an empty string. This is needed because form inputs start empty.
- `z.boolean().default(true)` means if the field is missing, it defaults to `true`.
- `z.infer<typeof pizzaSchema>` extracts the TypeScript type from the Zod schema. This is the critical link: one schema defines both runtime validation and compile-time types. Changing the schema automatically updates the type.

Similar schemas exist for `topping`, `extra`, `addon`, `dessert`, `category`, and `notification`.

---

## Phase 6: Supabase Client Architecture

Both apps need multiple Supabase clients for different contexts. This was one of the most confusing parts to learn because the same database is accessed from four different execution environments.

### Admin App — Four Supabase Clients

#### 1. Service-Role Client (`apps/admin/src/lib/supabaseAdmin.ts`)

```ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseAdmin =
  !shouldUseMockSupabase() && supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl!, supabaseServiceKey)
    : createMockSupabaseClient();
```

**Key learning:**
- The **service role key** bypasses all Row Level Security policies. It can read and write anything. This is used in server actions for admin mutations (create/update/delete pizzas, orders, settings).
- `process.env.SUPABASE_SERVICE_ROLE_KEY` (without `NEXT_PUBLIC_` prefix) is only available on the server. Next.js only exposes `NEXT_PUBLIC_*` variables to the browser.
- The `!` non-null assertion (`supabaseUrl!`) tells TypeScript "I know this is not null" after the conditional check.
- The mock fallback allows the admin to build in CI environments where Supabase credentials are not available.

#### 2. Server SSR Client (`apps/admin/src/lib/supabaseServer.ts`)

```ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createSupabaseServer() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch { }
        },
      },
    }
  );
}
```

**Key learning:**
- `@supabase/ssr` provides `createServerClient` which integrates Supabase auth with Next.js cookies. The auth session (JWT) is stored in cookies, not localStorage, because server components cannot access localStorage.
- `await cookies()` is a Next.js 15 API that reads the request's cookies in a server component.
- The `setAll` try-catch is needed because server components start streaming before all cookies can be set. Setting a cookie after streaming starts throws an error that is safe to ignore.
- The **anon key** (not service role) is used here because this client respects RLS policies. It authenticates as the logged-in user.

#### 3. Browser Client (`apps/admin/src/lib/supabaseBrowser.ts`)

```ts
'use client';

import { createBrowserClient } from '@supabase/ssr';

export function createSupabaseBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

**Key learning:**
- `'use client'` directive marks this file as client-only. It can never be imported in a server component.
- `createBrowserClient` stores the auth session in cookies (not localStorage) and handles refresh token rotation automatically.
- Used in the dashboard layout for session checks (`supabase.auth.getUser()`).

#### 4. Lightweight Client (`apps/admin/src/lib/supabaseClient.ts`)

```ts
'use client';

import { createSupabaseBrowser } from '@/lib/supabaseBrowser';

export function createClient() {
  return createSupabaseBrowser();
}
```

**Key learning:**
- This is a convenience re-export. Components import `createClient` for realtime subscriptions in the KanbanBoard and SettingsClient.
- `@/lib/` is a TypeScript path alias configured in `tsconfig.json` that maps to `src/lib/`. This avoids `../../../lib/` relative imports.

#### 5. Mock Fallback (`apps/admin/src/lib/supabaseFallback.ts`)

```ts
export function shouldUseMockSupabase() {
  return !hasSupabaseEnv() && (process.env.GITHUB_ACTIONS === 'true' || process.env.NODE_ENV === 'development');
}
```

This file creates a **Proxy-based mock Supabase client** that returns empty arrays for selects and null for mutations. Key learning:

```ts
function createMockQueryBuilder() {
  let mode: 'many' | 'single' | 'head' = 'many';

  const builder: any = new Proxy({}, {
    get(_target, prop) {
      if (prop === 'then') {
        return (onFulfilled?: (value: MockResult) => unknown) =>
          Promise.resolve(createMockResult(mode)).then(onFulfilled);
      }
      if (prop === 'single' || prop === 'maybeSingle') {
        mode = 'single';
        return builder;
      }
      if (prop === 'select') {
        return (_columns?: string, options?: { head?: boolean }) => {
          if (options?.head) mode = 'head';
          return builder;
        };
      }
      // All other chain methods return the builder
      return () => builder;
    },
  });

  return builder;
}
```

**Key learning:**
- `Proxy` is a JavaScript metaprogramming feature. It intercepts property access and method calls on an object.
- The mock builder mimics Supabase's chainable API (`.from('x').select('*').eq('id', 1).single()`). Every method returns the builder itself, and when the chain is awaited (`.then`), it resolves with empty data.
- This allows the admin app to build successfully in GitHub Actions CI without real Supabase credentials.

### Storefront App — Two Supabase Clients

The storefront uses a simpler setup because it has no auth UI:

```ts
// apps/storefront/app/lib/supabase.ts
export async function createSupabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() { return cookieStore.getAll(); },
      setAll(cookieList) {
        try {
          cookieList.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch { }
      },
    },
  });
}

export function createSupabaseService() {
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}
```

**Key learning:**
- `auth: { persistSession: false }` tells the service client not to store auth state. This is important for server-side usage — each request creates a fresh client.
- The storefront server actions use the service client to insert orders, bypassing RLS.

### Environment Variables (`apps/storefront/app/lib/env.ts`)

```ts
function requireEnv(name: string): string {
  const value = process.env[name];
  return value || '';
}

export const env = {
  NEXT_PUBLIC_SUPABASE_URL: requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  NEXT_PUBLIC_WHATSAPP_NUMBER: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '918484802540',
} as const;
```

**Key learning:**
- `as const` makes the object deeply readonly. TypeScript infers the narrowest possible types (literal strings instead of `string`).
- Centralizing env access in one file means every consumer gets the same fallback behavior and type safety.

---

## Phase 7: Admin Dashboard — Layout and Overview

### Dashboard Layout (`apps/admin/src/app/dashboard/layout.tsx`)

The layout file wraps every dashboard page. It is the first file a user "hits" after login.

```tsx
import { redirect } from 'next/navigation';
import { createSupabaseServer } from '@/lib/supabaseServer';
```

**Key learning:**
- In Next.js App Router, `layout.tsx` renders **once** and wraps all child routes. Navigating between `/dashboard/pizzas` and `/dashboard/orders` does not re-render the layout.
- `redirect()` from `next/navigation` performs a server-side redirect. Unlike `useRouter().push()`, it works in server components.

```tsx
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');
```

**Key learning:**
- `async function DashboardLayout` — layouts in the App Router can be `async`. This is a React Server Component (RSC). It runs on the server, can await database calls, and never ships JavaScript to the browser.
- `supabase.auth.getUser()` reads the JWT from cookies and returns the authenticated user. If the session has expired or no session exists, `user` is `null`.
- The `{ children }` prop receives the current page component based on the URL.

The layout fetches dashboard configuration:

```tsx
const { data: configRows } = await supabase
  .from('site_config')
  .select('key, value')
  .in('key', ['dashboard_live_mode']);

const liveMode = configRows?.find(r => r.key === 'dashboard_live_mode')?.value === 'true';
```

**Key learning:**
- `.in('key', ['dashboard_live_mode'])` is Supabase's `WHERE key IN (...)` equivalent. More efficient than fetching all config rows when only one is needed.
- The live mode flag controls an animated pulse indicator in the navbar.

The layout includes:
- **Navbar** with store name, live mode indicator, notification bell with count badge, and user avatar.
- **Sidebar** with navigation links to Overview, Pizzas, Orders, Categories, Notifications, Settings.
- **Framer Motion** page transitions with `AnimatePresence` and `motion.main`.
- **Toast provider** from `react-hot-toast`.

```tsx
<AnimatePresence mode="wait">
  <motion.main
    key={pathname}
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.18, ease: 'easeOut' }}
  >
    {children}
  </motion.main>
</AnimatePresence>
```

**Key learning:**
- `AnimatePresence` detects when its children change (keyed by `pathname`) and plays exit animations before removing the old child and enter animations on the new child.
- `mode="wait"` means the old page fully exits before the new page enters. Without this, both pages would be visible simultaneously during the transition.
- `key={pathname}` tells React to unmount and remount the child when the URL changes, triggering the animation.

### Dashboard Overview Page (`apps/admin/src/app/dashboard/page.tsx`)

This 600-line file is the dashboard home. It demonstrates several key patterns:

**Parallel data fetching:**

```tsx
const [
  { count: totalOrders },
  { data: recentOrders },
  { data: configRows },
  { data: staffMembers },
] = await Promise.all([
  supabase.from('orders').select('*', { count: 'exact', head: true }),
  supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false }).limit(10),
  supabase.from('site_config').select('key, value').in('key', ['is_open', 'site_maintenance_mode']),
  supabase.from('staff_members').select('*').eq('status', 'active'),
]);
```

**Key learning:**
- `Promise.all([...])` runs all queries **in parallel**, not sequentially. This is critical for performance — 4 parallel queries take as long as the slowest one, while sequential queries take the sum of all.
- `{ count: 'exact', head: true }` asks Supabase to return only the count, not the actual rows. This is a PostgreSQL `SELECT count(*)` optimization.
- `.order('created_at', { ascending: false })` sorts newest first.
- Array destructuring (`const [a, b, c, d] = await Promise.all([...])`) assigns each result to a named variable.

**Revenue calculation:**

```tsx
const totalRevenue = recentOrders?.reduce((sum, order) => {
  if (order.status !== 'cancelled') {
    return sum + (order.total_price || 0);
  }
  return sum;
}, 0) || 0;
```

**Key learning:**
- `.reduce()` iterates over an array and accumulates a single value. The `0` is the initial value.
- `|| 0` handles the case where `recentOrders` is null/undefined — the optional chaining `?.reduce()` returns `undefined`, and `undefined || 0` gives `0`.

**Date formatting with IST timezone:**

```tsx
function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
```

**Key learning:**
- `Intl.DateTimeFormat` (used internally by `toLocaleDateString`) handles timezone conversion automatically.
- `'en-IN'` locale formats dates in the Indian English style (e.g., "23 Mar 2026").
- `timeZone: 'Asia/Kolkata'` converts UTC timestamps from the database to Indian Standard Time for display.

**Sparkline generation:**

```tsx
function generateSparklinePath(data: number[], width: number, height: number) {
  if (data.length < 2) return '';
  const max = Math.max(...data, 1);
  const step = width / (data.length - 1);
  return data
    .map((value, i) => {
      const x = i * step;
      const y = height - (value / max) * height;
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');
}
```

**Key learning:**
- SVG paths use `M x y` (move to) and `L x y` (line to) commands.
- The data is normalized: `value / max * height` maps each value to a y-coordinate between 0 and the chart height.
- `height - y` flips the coordinate because SVG y-axis goes downward (0 at top).

### Error Boundary (`apps/admin/src/app/dashboard/error.tsx`)

```tsx
'use client';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div>
      <h2>Something went wrong</h2>
      <button onClick={() => reset()}>Try again</button>
    </div>
  );
}
```

**Key learning:**
- `error.tsx` must be a client component (`'use client'`). Next.js error boundaries use React's error boundary pattern, which requires client-side rendering.
- `reset()` re-renders the route segment, effectively retrying the failed server component.
- `error.digest` is a server-side error hash that can be used for logging without exposing the full error to the client.

### Not Found (`apps/admin/src/app/dashboard/not-found.tsx`)

```tsx
export default function DashboardNotFound() {
  return (
    <div>
      <h1>404 — Page not found</h1>
      <Link href="/dashboard">Back to Dashboard</Link>
    </div>
  );
}
```

**Key learning:**
- `not-found.tsx` is triggered when `notFound()` is called from a server component or when no route matches.
- This is a server component (no `'use client'`), so it renders with zero JavaScript.

---

## Phase 8: Admin Server Actions — CRUD Operations

Server actions are the mechanism for mutating data from the frontend without building a separate API. They are marked with `'use server'` and can be called directly from client components.

### Pizza CRUD (`apps/admin/src/app/dashboard/pizzas/actions.ts`)

**Creating a pizza:**

```tsx
'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { slugify } from '@/lib/utils';

export async function createPizza(data: any) {
  const slug = slugify(data.name);

  const { data: pizza, error } = await supabaseAdmin
    .from('pizzas')
    .insert({
      name: data.name,
      slug,
      description: data.description || null,
      category_id: data.category_id,
      price_small: data.price_small,
      price_medium: data.price_medium,
      price_large: data.price_large,
      image_url: data.image_url || null,
      is_veg: data.is_veg ?? true,
      is_bestseller: data.is_bestseller ?? false,
      is_spicy: data.is_spicy ?? false,
      is_new: data.is_new ?? false,
      is_active: data.is_active ?? true,
      sort_order: data.sort_order ?? 0,
    })
    .select('id')
    .single();

  if (error) throw error;
```

**Key learning:**
- `supabaseAdmin` uses the service role key, bypassing RLS. Admin mutations need this because the `pizzas` table does not have INSERT policies for the anon key.
- `slugify(data.name)` converts "Margherita Supreme" to "margherita-supreme". Slugs are used in URLs and must be unique.
- `data.is_veg ?? true` — the **nullish coalescing operator** `??` returns the right side only if the left side is `null` or `undefined`. Unlike `||`, it does not trigger for `false` or `0`.
- `.select('id').single()` returns the newly created row's ID. Without `.select()`, Supabase returns nothing after INSERT.

**Handling topping associations:**

```tsx
  if (data.toppings?.length) {
    const toppingRows = data.toppings.map((toppingId: string) => ({
      pizza_id: pizza.id,
      topping_id: toppingId,
    }));

    const { error: toppingError } = await supabaseAdmin
      .from('pizza_toppings')
      .insert(toppingRows);

    if (toppingError) throw toppingError;
  }

  revalidatePath('/dashboard/pizzas');
  revalidatePath('/dashboard');
  revalidateTag('storefront');

  return { success: true, id: pizza.id };
}
```

**Key learning:**
- The junction table `pizza_toppings` is populated separately after the pizza is created. This is a two-step process because the pizza ID is needed for the junction rows.
- `revalidatePath('/dashboard/pizzas')` tells Next.js to regenerate the cached page at that path on the next request. Without this, the UI would show stale data.
- `revalidateTag('storefront')` invalidates any page or fetch that was tagged with `'storefront'`, ensuring the customer-facing site reflects the change.

**Updating a pizza:**

```tsx
export async function updatePizza(id: string, data: any) {
  const slug = slugify(data.name);

  const { error } = await supabaseAdmin
    .from('pizzas')
    .update({
      name: data.name,
      slug,
      description: data.description || null,
      // ... all fields
    })
    .eq('id', id);

  if (error) throw error;

  // Sync toppings: delete old, insert new
  await supabaseAdmin.from('pizza_toppings').delete().eq('pizza_id', id);

  if (data.toppings?.length) {
    await supabaseAdmin
      .from('pizza_toppings')
      .insert(data.toppings.map((tid: string) => ({ pizza_id: id, topping_id: tid })));
  }

  revalidatePath('/dashboard/pizzas');
  revalidateTag('storefront');
}
```

**Key learning:**
- The "delete all, then re-insert" pattern for junction tables is simpler than computing a diff. For small collections (a pizza has 5-15 toppings), the overhead is negligible.
- `.eq('id', id)` is Supabase's `WHERE id = $1`. Multiple `.eq()` calls can be chained for compound conditions.

**Toggling pizza active state:**

```tsx
export async function togglePizzaActive(id: string, isActive: boolean) {
  const { error } = await supabaseAdmin
    .from('pizzas')
    .update({ is_active: isActive })
    .eq('id', id);

  if (error) throw error;
  revalidatePath('/dashboard/pizzas');
  revalidateTag('storefront');
}
```

**Key learning:**
- Single-field updates are efficient — Supabase generates `UPDATE pizzas SET is_active = $1 WHERE id = $2`.

### Category CRUD (`apps/admin/src/app/dashboard/categories/actions.ts`)

```tsx
export async function deleteCategory(id: string) {
  const protectedSlugs = ['veg-pizzas', 'non-veg-pizzas', 'addons', 'desserts'];

  const { data: category } = await supabaseAdmin
    .from('categories')
    .select('slug')
    .eq('id', id)
    .single();

  if (category && protectedSlugs.includes(category.slug)) {
    throw new Error('Cannot delete a system category');
  }

  const { error } = await supabaseAdmin.from('categories').delete().eq('id', id);
  if (error) throw error;
  revalidatePath('/dashboard/categories');
}
```

**Key learning:**
- **Guard clauses** protect system data. The four core categories cannot be deleted because the storefront relies on them for menu grouping.
- The category is fetched first to check its slug before deletion. This is a two-query pattern: read-then-write.

### Order Actions (`apps/admin/src/app/dashboard/orders/actions.ts`)

```tsx
export async function updateOrderStatus(id: string, status: string) {
  const { error } = await supabaseAdmin
    .from('orders')
    .update({ status })
    .eq('id', id);

  if (error) throw error;
  revalidatePath('/dashboard/orders');
  revalidatePath('/dashboard/orders/history');
}
```

**Key learning:**
- Order status transitions are simple column updates. The Kanban board calls this when a card is dragged to a new column.
- Both `/dashboard/orders` (live) and `/dashboard/orders/history` (archive) are revalidated because an order moving to `delivered` or `cancelled` affects both views.

### Settings Actions (`apps/admin/src/app/dashboard/settings/actions.ts`)

The settings system has the most complex actions because it handles multiple data types:

```tsx
export async function upsertSiteConfig(data: {
  key: string;
  value: string;
  label?: string;
  type?: string;
  description?: string;
  is_public?: boolean;
}) {
  const { error } = await supabaseAdmin
    .from('site_config')
    .upsert(
      {
        key: data.key,
        value: data.value,
        label: data.label || data.key,
        type: data.type || 'text',
        description: data.description || null,
        is_public: data.is_public ?? true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'key' }
    );

  if (error) throw error;

  if (data.key === 'dashboard_live_mode') {
    revalidatePath('/dashboard');
  }

  revalidatePath('/dashboard/settings');
  revalidateTag('storefront');
}
```

**Key learning:**
- `.upsert()` combines INSERT and UPDATE. If a row with the same `key` exists, it updates; otherwise, it inserts. `{ onConflict: 'key' }` specifies which column to check for conflicts.
- `dashboard_live_mode` gets special treatment because changing it affects the layout's live indicator, not just the settings page.

**Image upload:**

```tsx
export async function uploadStorefrontAsset(formData: FormData) {
  const file = formData.get('file') as File;
  const configKey = formData.get('configKey') as string;

  if (!file || !configKey) throw new Error('Missing file or config key');

  const extension = file.name.split('.').pop();
  const fileName = `${configKey}-${Date.now()}.${extension}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from('menu')
    .upload(fileName, file, { upsert: true });

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabaseAdmin.storage
    .from('menu')
    .getPublicUrl(fileName);

  await upsertSiteConfig({
    key: configKey,
    value: publicUrl,
    type: 'image',
  });

  return { url: publicUrl };
}
```

**Key learning:**
- `FormData` is the browser's built-in API for sending files. Server actions receive it directly — no multipart parsing library needed.
- `formData.get('file') as File` retrieves the file from the FormData and type-asserts it as a `File` object.
- `Date.now()` in the filename prevents caching issues when replacing an image.
- `{ upsert: true }` overwrites the file if it already exists.
- After uploading, the public URL is saved back into `site_config` so the storefront can reference it.

**Delete protection:**

```tsx
export async function deleteSiteConfig(id: string) {
  const protectedKeys = [
    'dashboard_live_mode', 'is_open', 'site_maintenance_mode',
    'hero_title', 'store_name', 'whatsapp_number',
  ];

  const { data: item } = await supabaseAdmin
    .from('site_config')
    .select('key')
    .eq('id', id)
    .single();

  if (item && protectedKeys.includes(item.key)) {
    throw new Error(`Cannot delete protected setting: ${item.key}`);
  }

  const { error } = await supabaseAdmin.from('site_config').delete().eq('id', id);
  if (error) throw error;
  revalidatePath('/dashboard/settings');
}
```

**Key learning:**
- Critical configuration keys are protected from accidental deletion. Deleting `whatsapp_number` would break the entire order flow.

### Notification Actions (`apps/admin/src/app/dashboard/notifications/actions.ts`)

```tsx
export async function createNotification(data: any) {
  const { error } = await supabaseAdmin.from('notifications').insert({
    title: data.title,
    body: data.body || null,
    type: data.type || 'info',
    is_active: data.is_active ?? true,
    pinned: data.pinned ?? false,
    expires_at: data.expires_at || null,
  });

  if (error) throw error;
  revalidatePath('/dashboard/notifications');
  revalidatePath('/');
}
```

**Key learning:**
- `revalidatePath('/')` invalidates the root layout, which re-fetches the notification count displayed in the dashboard navbar badge.
- `expires_at` is a nullable timestamp. Notifications auto-expire when the storefront filters by `expires_at > now()`.

### Dashboard Quick-Create Actions (`apps/admin/src/app/dashboard/actions.ts`)

```tsx
export async function createTopping(data: any) {
  const slug = slugify(data.name);
  const { error } = await supabaseAdmin
    .from('toppings')
    .insert({ ...data, slug });

  if (error) throw error;
  revalidatePath('/dashboard/pizzas');
}
```

**Key learning:**
- `{ ...data, slug }` uses the spread operator to copy all fields from `data` and add/override the `slug` field. This is a common pattern for augmenting form data before insertion.
- These quick-create actions are simpler than the pizza actions because toppings, extras, addons, and desserts have no junction tables.

---

## Phase 9: Admin Key Components

### MenuStudio (`apps/admin/src/app/dashboard/pizzas/MenuStudio.tsx`)

The MenuStudio is a 725-line client component that serves as the hub for all menu management. It demonstrates several key React patterns.

**Tab system with TypeScript:**

```tsx
type TabKey = 'pizzas' | 'categories' | 'toppings' | 'extras' | 'addons' | 'desserts';

const tabs: Array<{ key: TabKey; label: string; icon: LucideIcon }> = [
  { key: 'pizzas', label: 'Pizzas', icon: PizzaIcon },
  { key: 'categories', label: 'Categories', icon: Grid2X2 },
  // ...
];

const [activeTab, setActiveTab] = useState<TabKey>('pizzas');
```

**Key learning:**
- `LucideIcon` is the type exported by lucide-react for icon components. This allows the tabs array to hold icon component references, not instances.
- `useState<TabKey>('pizzas')` constrains the state to only valid tab keys. Calling `setActiveTab('invalid')` would be a compile error.

**Memoized filtering:**

```tsx
const filteredPizzas = useMemo(() => {
  const term = pizzaSearch.toLowerCase().trim();
  return pizzas.filter((pizza) => {
    const matchesSearch =
      !term ||
      pizza.name.toLowerCase().includes(term) ||
      (pizza.description || '').toLowerCase().includes(term) ||
      (pizza.categories?.label || '').toLowerCase().includes(term);
    const matchesActive = !showActiveOnly || pizza.is_active;
    const matchesBestseller = !showBestsellersOnly || pizza.is_bestseller;
    return matchesSearch && matchesActive && matchesBestseller;
  });
}, [pizzaSearch, pizzas, showActiveOnly, showBestsellersOnly]);
```

**Key learning:**
- `useMemo` caches the filtered result and only recomputes when the dependency array changes. Without it, the filter would run on every render, even when unrelated state changes.
- The dependency array `[pizzaSearch, pizzas, showActiveOnly, showBestsellersOnly]` lists every value used inside the callback. If any of these changes, the memo is recomputed.
- The filter logic combines three predicates with `&&`. Each predicate is "disabled" when its toggle is off (e.g., `!showActiveOnly` evaluates to `true`, so the condition passes).

**Summary statistics:**

```tsx
const pizzaStats = useMemo(
  () => ({
    visible: filteredPizzas.length,
    active: filteredPizzas.filter((pizza) => pizza.is_active).length,
    bestselling: filteredPizzas.filter((pizza) => pizza.is_bestseller).length,
    veg: filteredPizzas.filter((pizza) => pizza.is_veg).length,
  }),
  [filteredPizzas]
);
```

**Key learning:**
- This memoization chains off `filteredPizzas`. When filters change, `filteredPizzas` recomputes, which then triggers `pizzaStats` to recompute. This is an efficient derivation chain.

**Create-signal pattern for child components:**

```tsx
const [createSignals, setCreateSignals] = useState<Record<TabKey, number>>({
  pizzas: 0, categories: 0, toppings: 0, extras: 0, addons: 0, desserts: 0,
});

const requestCreate = (tab: TabKey) => {
  setActiveTab(tab);
  setCreateSignals((prev) => ({
    ...prev,
    [tab]: prev[tab] + 1,
  }));
};
```

**Key learning:**
- This is an alternative to lifting state up. Instead of passing a boolean `isCreateOpen` to child components, a numeric signal is incremented. Child components detect the change via `useEffect` watching the signal value. This avoids prop drilling and allows multiple simultaneous create triggers.

### KanbanBoard (`apps/admin/src/app/dashboard/orders/KanbanBoard.tsx`)

The KanbanBoard is a 209-line client component implementing drag-and-drop order management with realtime updates.

**DnD Kit setup:**

```tsx
import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
```

**Key learning:**
- `@dnd-kit` is a modular DnD library. `DndContext` provides the drag context. `SortableContext` makes a list of items draggable. `useSortable` is a hook that attaches drag handles and transform styles to individual items.
- `closestCenter` is the collision detection strategy — when a dragged item is released, it snaps to the closest droppable center.

**Optimistic updates:**

```tsx
function handleDragEnd(event: DragEndEvent) {
  const { active, over } = event;
  if (!over || active.id === over.id) return;

  const orderId = active.id as string;
  const newStatus = over.id as string;

  // Optimistic update
  setOrders((prev) =>
    prev.map((order) =>
      order.id === orderId ? { ...order, status: newStatus } : order
    )
  );

  // Server mutation
  updateOrderStatus(orderId, newStatus).catch(() => {
    // Rollback on failure
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId ? { ...order, status: previousStatus } : order
      )
    );
    toast.error('Failed to update order status');
  });
}
```

**Key learning:**
- **Optimistic updates** immediately update the UI before the server confirms. This makes the interface feel instant. If the server call fails, the UI is rolled back.
- `setOrders((prev) => prev.map(...))` uses the functional form of setState, which receives the current state. This avoids stale closure bugs when multiple updates happen quickly.

**Realtime subscription:**

```tsx
useEffect(() => {
  const supabase = createClient();

  const channel = supabase
    .channel('orders-realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'orders' },
      (payload) => {
        if (payload.eventType === 'INSERT') {
          setOrders((prev) => [payload.new as Order, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setOrders((prev) =>
            prev.map((order) =>
              order.id === (payload.new as Order).id ? (payload.new as Order) : order
            )
          );
        } else if (payload.eventType === 'DELETE') {
          setOrders((prev) =>
            prev.filter((order) => order.id !== (payload.old as Order).id)
          );
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);
```

**Key learning:**
- `supabase.channel('orders-realtime')` creates a named WebSocket channel. The name must be unique per subscription.
- `.on('postgres_changes', ...)` listens for INSERT, UPDATE, and DELETE events on the `orders` table. Supabase uses PostgreSQL's `LISTEN`/`NOTIFY` under the hood.
- `event: '*'` subscribes to all event types. Could be restricted to `'UPDATE'` if only status changes matter.
- `payload.new` contains the updated row. `payload.old` contains the previous version (only available for UPDATE and DELETE).
- The cleanup function `return () => supabase.removeChannel(channel)` unsubscribes when the component unmounts. Without this, the WebSocket would remain open, causing memory leaks and duplicate event handlers.

### SettingsClient (`apps/admin/src/app/dashboard/settings/SettingsClient.tsx`)

The SettingsClient is the largest component in the admin app. It manages 300+ configuration keys with realtime sync, inline editing, image uploads, and type-specific input rendering.

**Realtime sync:**

```tsx
useEffect(() => {
  const supabase = createClient();

  const channel = supabase
    .channel('site-config-sync')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'site_config' },
      (payload) => {
        if (payload.eventType === 'INSERT') {
          setItems((prev) => [...prev, payload.new as SiteConfigItem]);
        } else if (payload.eventType === 'UPDATE') {
          setItems((prev) =>
            prev.map((item) =>
              item.id === (payload.new as SiteConfigItem).id
                ? (payload.new as SiteConfigItem)
                : item
            )
          );
        } else if (payload.eventType === 'DELETE') {
          setItems((prev) =>
            prev.filter((item) => item.id !== (payload.old as { id: string }).id)
          );
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);
```

**Key learning:**
- This is the same realtime pattern as the KanbanBoard but for config items. When another admin tab updates a setting, this component reflects the change immediately.
- The `as SiteConfigItem` type assertion tells TypeScript the shape of the payload. Supabase's realtime payload type is generic, so explicit casting is needed.

**Type-specific input rendering:**

The SettingsClient renders different input types based on the `type` column:
- `text` → `<input type="text" />`
- `textarea` → `<textarea />`
- `url` → `<input type="url" />` with a preview link
- `image` → File upload input with preview thumbnail
- `boolean` → Toggle switch
- `number` → `<input type="number" />`
- `time` → `<input type="time" />`
- `json` → `<textarea />` with JSON validation

---

## Phase 10: Admin Testing

### Test Configuration (`vitest.config.ts`)

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
```

**Key learning:**
- `environment: 'jsdom'` gives tests a browser-like DOM. Without this, `document.querySelector` and React DOM rendering would fail.
- `globals: true` makes `describe`, `it`, `expect` available without importing them.
- `setupFiles` runs before all tests — used to import `@testing-library/jest-dom` for custom matchers.
- The `@` alias must match the one in `tsconfig.json` so test imports resolve correctly.

### Setup File (`vitest.setup.ts`)

```ts
import '@testing-library/jest-dom';
```

**Key learning:**
- This single import adds matchers like `toBeInTheDocument()`, `toHaveTextContent()`, and `toBeDisabled()` to the `expect` API.

### MSW Mocking (`src/mocks/handlers.ts`)

```ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('*/rest/v1/pizzas*', () => {
    return HttpResponse.json([]);
  }),
  http.get('*/rest/v1/site_config*', () => {
    return HttpResponse.json([]);
  }),
];
```

**Key learning:**
- MSW (Mock Service Worker) intercepts HTTP requests at the network level. Supabase's JS client makes REST API calls under the hood, so MSW can intercept them.
- `http.get('*/rest/v1/pizzas*', ...)` matches any GET request to a URL containing `/rest/v1/pizzas`. The wildcards handle different Supabase project URLs.
- Tests never hit real Supabase — they run against these mock handlers.

### Example Test: InlineExtraPrice

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import InlineExtraPrice from '@/components/admin/InlineExtraPrice';

describe('InlineExtraPrice', () => {
  it('renders the current price', () => {
    render(
      <InlineExtraPrice
        extraId="1"
        size="small"
        currentPrice={150}
        onUpdate={vi.fn()}
      />
    );

    expect(screen.getByText('150')).toBeInTheDocument();
  });

  it('opens edit mode on click', async () => {
    const user = userEvent.setup();

    render(
      <InlineExtraPrice
        extraId="1"
        size="small"
        currentPrice={150}
        onUpdate={vi.fn()}
      />
    );

    await user.click(screen.getByText('150'));
    expect(screen.getByRole('spinbutton')).toBeInTheDocument();
  });
});
```

**Key learning:**
- `render()` mounts the component in the jsdom environment.
- `screen.getByText('150')` queries the DOM by visible text content. This tests what the user sees, not internal state.
- `userEvent.setup()` creates a user event instance. `user.click()` simulates a real click with all associated events (mousedown, mouseup, click).
- `vi.fn()` creates a mock function. It records calls but does nothing — used when the test does not care about the callback behavior.
- `screen.getByRole('spinbutton')` finds an `<input type="number">`. The `spinbutton` role is the ARIA role for number inputs.

---

## Phase 11: Storefront Data Layer

The storefront is a read-heavy, public-facing Next.js app. Its architecture is built around a single data-fetching function that loads everything the site needs in one parallel query.

### The Storefront Bundle (`apps/storefront/app/lib/storefront.ts`)

```ts
export async function fetchStorefrontBundle(): Promise<StorefrontBundle> {
  const supabase = await createSupabaseServer();

  const [
    { data: categories },
    { data: pizzas },
    { data: toppings },
    { data: extras },
    { data: addons },
    { data: desserts },
    { data: notifications },
    { data: configRows },
  ] = await Promise.all([
    supabase.from('categories').select('*').eq('is_active', true).order('sort_order'),
    supabase.from('pizzas').select('*, categories(id, label, slug), pizza_toppings(topping_id, toppings(*))').eq('is_active', true).order('sort_order'),
    supabase.from('toppings').select('*').eq('is_active', true).order('sort_order'),
    supabase.from('extras').select('*').eq('is_active', true).order('sort_order'),
    supabase.from('addons').select('*').eq('is_active', true).order('sort_order'),
    supabase.from('desserts').select('*').eq('is_active', true).order('sort_order'),
    supabase.from('notifications').select('*').eq('is_active', true).order('created_at', { ascending: false }),
    supabase.from('site_config').select('key, value').eq('is_public', true),
  ]);

  const config = toConfigMap(configRows || []);

  return {
    categories: categories || [],
    pizzas: pizzas || [],
    toppings: toppings || [],
    extras: extras || [],
    addons: addons || [],
    desserts: desserts || [],
    notifications: notifications || [],
    config,
    isOpen: config.is_open !== 'false',
    maintenanceMode: config.site_maintenance_mode === 'true',
  };
}
```

**Key learning:**
- **Eight parallel queries** via `Promise.all`. Each query filters by `is_active = true` so inactive items never reach the storefront.
- The pizza query uses **nested selects**: `categories(id, label, slug)` fetches the joined category, and `pizza_toppings(topping_id, toppings(*))` fetches the junction table rows with their nested topping objects. This is Supabase's PostgREST embedding syntax — it generates SQL JOINs automatically.
- `toConfigMap` flattens the config rows into a `Record<string, string>`:

```ts
function toConfigMap(rows: { key: string; value: string }[]): Record<string, string> {
  return rows.reduce<Record<string, string>>((acc, row) => {
    acc[row.key] = row.value;
    return acc;
  }, {});
}
```

- `.eq('is_public', true)` ensures admin-only config keys (like `dashboard_live_mode` and `whatsapp_number`) are not sent to the storefront. Wait — `whatsapp_number` is `is_public = false` in the seed migration, but the order action fetches it server-side with the service role client, bypassing this filter.

**Helper utilities:**

```ts
export function getConfigValue(config: Record<string, string>, key: string, fallback = ''): string {
  return config[key] || fallback;
}

export function money(amount: number): string {
  return `₹${Math.round(amount)}`;
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
```

**Key learning:**
- `getConfigValue` with a fallback means every UI element has a sensible default even if the config key is missing.
- `money()` uses `₹` (Indian Rupee symbol) and rounds to integers. No floating-point display because Indian pizza pricing is always in whole rupees.
- `slugify` uses two regex replacements: first replaces non-alphanumeric sequences with hyphens, then trims leading/trailing hyphens.

### Catalog Helpers (`apps/storefront/app/lib/catalog.ts`)

This 711-line file contains ~70 functions that extract data from the bundle. It is the single source of truth for how config values become UI text.

**Pattern: every function takes the bundle and returns a formatted value:**

```ts
export function getHeroTitle(bundle: StorefrontBundle): string {
  return getConfigValue(bundle.config, 'hero_title', 'We Knead Pizza');
}

export function getHeroSubtitle(bundle: StorefrontBundle): string {
  return getConfigValue(bundle.config, 'hero_subtitle', 'Hand-tossed pizza, warm sides, and a guided order flow.');
}

export function getStoreName(bundle: StorefrontBundle): string {
  return getConfigValue(bundle.config, 'store_name', getHeroTitle(bundle));
}
```

**Key learning:**
- Functions like `getStoreName` fall back to `getHeroTitle` if `store_name` is not configured. This cascading fallback pattern means the store always has a name.
- Each function is pure (no side effects, no state mutation) and testable in isolation.

**Storefront state machine:**

```ts
export type StorefrontState = {
  mode: 'open' | 'after_hours' | 'closed' | 'maintenance';
  primaryAction: { href: string; label: string };
  statusLabel: string;
  statusDescription: string;
};

export function getStorefrontState(bundle: StorefrontBundle): StorefrontState {
  const config = bundle.config;
  const availability = getStoreAvailabilityFromConfig(config);

  if (availability.mode === 'maintenance') {
    return {
      mode: 'maintenance',
      primaryAction: { href: '/status', label: getConfigValue(config, 'storefront_maintenance_action_label', 'View status') },
      statusLabel: getConfigValue(config, 'storefront_maintenance_label', 'Under maintenance'),
      statusDescription: getConfigValue(config, 'storefront_maintenance_description', 'We are updating the storefront.'),
    };
  }

  if (availability.mode === 'closed') {
    return {
      mode: 'closed',
      primaryAction: { href: '/status', label: getConfigValue(config, 'storefront_closed_action_label', 'View hours') },
      statusLabel: getConfigValue(config, 'storefront_closed_label', 'Currently closed'),
      statusDescription: getConfigValue(config, 'storefront_closed_description', 'Check back during our opening hours.'),
    };
  }

  if (availability.mode === 'after_hours') {
    return {
      mode: 'after_hours',
      primaryAction: { href: '/menu', label: getConfigValue(config, 'storefront_after_hours_action_label', 'Schedule for later') },
      statusLabel: getConfigValue(config, 'storefront_after_hours_label', 'After hours'),
      statusDescription: getConfigValue(config, 'storefront_after_hours_description', 'Order now and schedule delivery.'),
    };
  }

  return {
    mode: 'open',
    primaryAction: { href: '/menu', label: getConfigValue(config, 'storefront_open_action_label', 'Order now') },
    statusLabel: getConfigValue(config, 'storefront_open_label', 'Open now'),
    statusDescription: getConfigValue(config, 'storefront_open_description', 'We are accepting orders.'),
  };
}
```

**Key learning:**
- This is a **state machine** pattern. The store is always in exactly one of four states, and each state defines its own labels, descriptions, and primary action.
- The function returns a fully resolved object — the caller does not need to know the state logic.
- Every text value has a hardcoded fallback, so the storefront renders even if the database is empty.

**Pricing helpers:**

```ts
export function getPizzaPriceForSize(pizza: Pizza, size: Size): number {
  switch (size) {
    case 'small': return pizza.price_small;
    case 'medium': return pizza.price_medium;
    case 'large': return pizza.price_large;
    default: return pizza.price_medium;
  }
}

export function getExtraPriceForSize(extra: Extra, size: Size): number {
  switch (size) {
    case 'small': return extra.price_small;
    case 'medium': return extra.price_medium;
    case 'large': return extra.price_large;
    default: return extra.price_medium;
  }
}
```

**Key learning:**
- The `default` case returns medium price as a safe fallback. TypeScript's exhaustive checking via `switch` would catch a missing case if `Size` gained a new variant.

**Navigation links:**

```ts
export function getNavLinks(bundle: StorefrontBundle) {
  return [
    { href: '/menu', label: getConfigValue(bundle.config, 'shell_nav_menu_label', 'Menu') },
    { href: '/about', label: getConfigValue(bundle.config, 'shell_nav_about_label', 'About') },
    { href: '/delivery', label: getConfigValue(bundle.config, 'shell_nav_delivery_label', 'Delivery') },
    { href: '/contact', label: getConfigValue(bundle.config, 'shell_nav_contact_label', 'Contact') },
  ];
}
```

**Key learning:**
- Even the navigation labels are configurable. This allows the store to be completely rebranded without code changes.

### Store Hours Engine (`apps/storefront/app/lib/store-hours.ts`)

This 280-line file handles timezone-aware store availability — one of the most complex parts of the project.

**Core types:**

```ts
export type StoreAvailabilityMode = 'open' | 'after_hours' | 'closed' | 'maintenance';

export type StoreAvailability = {
  mode: StoreAvailabilityMode;
  timeZone: string;
  openingTime: string;
  closingTime: string;
  openingMinutes: number;
  closingMinutes: number;
  currentMinutes: number;
  withinSchedule: boolean;
  nextOpenAt: Date;
};
```

**Key learning:**
- Times are stored as "minutes since midnight" internally (`openingMinutes`, `closingMinutes`, `currentMinutes`). This makes comparison trivial: `currentMinutes >= openingMinutes && currentMinutes < closingMinutes`.
- `nextOpenAt` is a UTC `Date` object for the next opening time. Used to display "Opens at 11:00 AM" on the storefront.

**Timezone handling with `Intl.DateTimeFormat`:**

```ts
function getStoreLocalDateTime(now: Date, timeZone: string): StoreLocalDateTime {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });

  const parts = formatter.formatToParts(now);
  const getPart = (type: string) => Number(parts.find((part) => part.type === type)?.value || '0');

  return {
    year: getPart('year'),
    month: getPart('month'),
    day: getPart('day'),
    hour: getPart('hour'),
    minute: getPart('minute'),
  };
}
```

**Key learning:**
- `Intl.DateTimeFormat` is the browser/Node.js built-in for timezone conversion. No external library (like `moment-timezone` or `date-fns-tz`) needed.
- `'en-CA'` locale is used because it formats dates as `YYYY-MM-DD`, making parsing reliable.
- `formatToParts()` returns an array of `{ type, value }` objects instead of a formatted string. This avoids string parsing ambiguity.
- `hourCycle: 'h23'` forces 24-hour format (00-23).

**Timezone offset calculation:**

```ts
function getTimeZoneOffsetMinutes(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    timeZoneName: 'shortOffset',
    hour: '2-digit',
    minute: '2-digit',
  });

  const offsetLabel = formatter.formatToParts(date).find((part) => part.type === 'timeZoneName')?.value;
  return parseOffsetMinutes(offsetLabel || 'GMT');
}
```

**Key learning:**
- `timeZoneName: 'shortOffset'` produces strings like "GMT+5:30" for IST.
- The offset is extracted from the formatted string and parsed into minutes. This handles DST-aware timezones correctly because the offset is computed for the specific `date`.

**Overnight window handling:**

```ts
export function isTimeWithinWindow(currentMinutes: number, openingMinutes: number, closingMinutes: number) {
  if (openingMinutes === closingMinutes) return true;
  if (openingMinutes < closingMinutes) {
    return currentMinutes >= openingMinutes && currentMinutes < closingMinutes;
  }
  // Overnight window (e.g., 22:00 to 04:00)
  return currentMinutes >= openingMinutes || currentMinutes < closingMinutes;
}
```

**Key learning:**
- A store open from 22:00 to 04:00 has `openingMinutes > closingMinutes`. The condition becomes `OR` instead of `AND`: the store is open if it is after 22:00 **or** before 04:00.
- If opening equals closing, the store is considered 24/7 open.

**Scheduled order resolution:**

```ts
export function resolveScheduledOrderTime(
  config: Record<string, string>,
  requestedTime: string,
  now = new Date()
): ScheduledOrderResolution {
  const availability = getStoreAvailabilityFromConfig(config, now);
  const requestedMinutes = parseClockMinutes(normalizeTimeValue(requestedTime, ''));

  if (availability.mode === 'closed' || availability.mode === 'maintenance') {
    return { valid: false, reason: 'ordering_unavailable', timeZone: availability.timeZone };
  }

  if (requestedMinutes === null) {
    return { valid: false, reason: 'invalid_format', timeZone: availability.timeZone };
  }

  if (!isTimeWithinWindow(requestedMinutes, availability.openingMinutes, availability.closingMinutes)) {
    return { valid: false, reason: 'outside_window', timeZone: availability.timeZone };
  }

  // Find the next occurrence of this time
  for (let dayOffset = 0; dayOffset <= 7; dayOffset += 1) {
    const localDate = addDaysToStoreDate(getStoreLocalDateTime(now, availability.timeZone), dayOffset);
    const candidate = storeLocalDateTimeToUtc(localDate, requestedMinutes, availability.timeZone);

    if (candidate.getTime() > now.getTime() + 60 * 1000) {
      return {
        valid: true,
        scheduledFor: candidate,
        timeZone: availability.timeZone,
        normalizedTime: formatClockMinutes(requestedMinutes),
      };
    }
  }

  return { valid: false, reason: 'no_future_slot', timeZone: availability.timeZone };
}
```

**Key learning:**
- This is a **discriminated union** return type (`ScheduledOrderResolution`). When `valid` is `true`, TypeScript knows `scheduledFor` exists. When `valid` is `false`, TypeScript knows `reason` exists. This eliminates null checks at the call site.
- The loop searches up to 7 days forward for a valid slot. The `+ 60 * 1000` (1 minute) buffer prevents scheduling for "right now."
- `storeLocalDateTimeToUtc` converts the store's local time to a UTC `Date` by computing the timezone offset and subtracting it.

### WhatsApp Message Builder (`apps/storefront/app/lib/whatsapp.ts`)

```ts
export function buildWhatsAppMessage(input: {
  orderNumber?: number;
  customerName: string;
  customerPhone?: string;
  deliveryAddress?: string;
  deliveryLocationUrl?: string;
  scheduledFor?: string;
  notes?: string;
  fulfillment?: WhatsAppFulfillment;
  items: CartLine[];
  total: number;
  storeName?: string;
  sizeNames: Record<'small' | 'medium' | 'large', string>;
  copy: WhatsAppCopy;
}) {
  const lines = [
    `*${input.storeName || 'We Knead Pizza'} ${input.copy.headingLabel}${orderNumberSuffix}*`,
    '',
    `${input.copy.nameLabel}: ${input.customerName}`,
    `${input.copy.fulfillmentLabel}: ${fulfillmentValue}`,
    input.customerPhone ? `${input.copy.phoneLabel}: ${input.customerPhone}` : null,
    input.deliveryAddress ? `${addressLabel}: ${input.deliveryAddress}` : null,
    input.deliveryLocationUrl ? `${input.copy.locationLinkLabel}: ${input.deliveryLocationUrl}` : null,
    input.scheduledFor ? `${input.copy.scheduleLabel}: ${input.scheduledFor}` : null,
    input.notes ? `${input.copy.notesLabel}: ${input.notes}` : null,
    '',
    `*${input.copy.itemsHeading}*`,
    ...input.items.map((item) => {
      const size = item.size ? ` (${input.sizeNames[item.size]})` : '';
      const extras = item.extras?.length ? ` + ${item.extras.map((e) => e.name).join(', ')}` : '';
      return `${item.quantity}x ${item.name}${size}${extras} - ${input.copy.currencyLabel} ${Math.round(item.unitPrice * item.quantity)}`;
    }),
    '',
    `*${input.copy.totalLabel}*: ${input.copy.currencyLabel} ${Math.round(input.total)}`,
  ].filter(Boolean);

  return lines.join('\n');
}
```

**Key learning:**
- `*text*` is WhatsApp's bold formatting syntax. The heading and total are bold.
- Conditional lines use the ternary operator: `input.notes ? '...' : null`. The `.filter(Boolean)` at the end removes all `null` entries, so optional fields do not leave blank lines.
- `...input.items.map(...)` spreads the item lines into the array. Each item is formatted as "2x Margherita (Large) + Extra Cheese - INR 450".
- All labels come from the `copy` parameter, which is populated from `site_config`. This means the WhatsApp message can be fully localized.

```ts
export function buildWhatsAppUrl(phoneNumber: string, message: string) {
  const normalized = phoneNumber.replace(/\D/g, '');
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}
```

**Key learning:**
- `\D` matches any non-digit character. `.replace(/\D/g, '')` strips formatting from phone numbers (spaces, dashes, parentheses, plus signs).
- `encodeURIComponent` escapes the message for URL embedding. Without this, newlines and special characters would break the URL.
- `wa.me` is WhatsApp's official deep-link domain. On mobile, it opens WhatsApp directly. On desktop, it opens WhatsApp Web.

---

## Phase 12: Storefront Components

### StorefrontShell (`apps/storefront/app/components/storefront-shell.tsx`)

The StorefrontShell is a 353-line client component that wraps every storefront page with navigation, header, footer, and ambient animations.

```tsx
'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Bell, Menu, PhoneCall, Power, ShoppingBag, X } from 'lucide-react';
import { useCart } from './cart-provider';
```

**Key learning:**
- `useReducedMotion()` from Framer Motion returns `true` if the user has enabled "Reduce motion" in their OS accessibility settings. The shell disables ambient animations for these users.
- `usePathname()` returns the current URL path. Used to highlight the active navigation link.
- `useCart()` accesses the cart context to display the item count badge on the shopping bag icon.

**Ambient animation orbs:**

```tsx
<motion.span
  className="site-shell__orb site-shell__orb--one"
  animate={
    prefersReducedMotion
      ? {}
      : {
          x: [0, 18, 0],
          y: [0, -12, 0],
          scale: [1, 1.05, 1],
        }
  }
  transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
/>
```

**Key learning:**
- Array values in `animate` create **keyframe animations**. `x: [0, 18, 0]` means: start at 0, move to 18px, return to 0.
- `repeat: Infinity` loops the animation forever.
- `duration: 18` makes the animation slow (18 seconds per cycle), creating a subtle, ambient movement.
- The empty object `{}` when `prefersReducedMotion` is true means no animation is applied.

**Active navigation detection:**

```tsx
const currentHref = useMemo(() => {
  const active = navLinks.find(
    (item) => pathname === item.href || pathname?.startsWith(`${item.href}/`)
  );
  return active?.href || '/home';
}, [navLinks, pathname]);
```

**Key learning:**
- `pathname?.startsWith('/menu/')` matches both `/menu` and `/menu/margherita-supreme`. This keeps the "Menu" link highlighted on detail pages.
- `useMemo` prevents re-computing the active link on every render.

**Mobile drawer with body scroll lock:**

```tsx
useEffect(() => {
  document.body.style.overflow = drawerOpen ? 'hidden' : '';
  return () => { document.body.style.overflow = ''; };
}, [drawerOpen]);
```

**Key learning:**
- Setting `overflow: 'hidden'` on `document.body` prevents the page from scrolling while the mobile menu drawer is open.
- The cleanup function restores scrolling when the component unmounts or the drawer closes.

**Keyboard accessibility:**

```tsx
useEffect(() => {
  const onEscape = (event: KeyboardEvent) => {
    if (event.key === 'Escape') setDrawerOpen(false);
  };
  window.addEventListener('keydown', onEscape);
  return () => window.removeEventListener('keydown', onEscape);
}, []);
```

**Key learning:**
- Pressing Escape closes the mobile drawer. This is a basic accessibility requirement for modal-like UI.
- The event listener is added once (empty dependency array `[]`) and cleaned up on unmount.

### CartProvider (`apps/storefront/app/components/cart-provider.tsx`)

The CartProvider implements a React Context-based shopping cart with localStorage persistence.

```tsx
'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { CartLine } from '../lib/types';

type CartContextValue = {
  items: CartLine[];
  totalItems: number;
  subtotal: number;
  addItem: (item: Omit<CartLine, 'id' | 'quantity'> & { quantity?: number }) => void;
  removeItem: (id: string) => void;
  setQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
};
```

**Key learning:**
- `Omit<CartLine, 'id' | 'quantity'>` creates a type with all `CartLine` fields except `id` and `quantity`. This is because `addItem` generates the ID automatically and defaults quantity to 1.
- `& { quantity?: number }` adds an optional `quantity` field back. This is a TypeScript intersection type — it combines the Omitted type with the optional quantity.
- Context is chosen over Zustand because the cart is simple (add, remove, set quantity, clear) and only the storefront needs it.

**localStorage persistence:**

```tsx
const [items, setItems] = useState<CartLine[]>([]);

useEffect(() => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) setItems(JSON.parse(raw) as CartLine[]);
  } catch {
    setItems([]);
  }
}, []);

useEffect(() => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch { }
}, [items]);
```

**Key learning:**
- The cart is initialized empty (`useState<CartLine[]>([])`) and then hydrated from localStorage in a `useEffect`. This avoids hydration mismatches — server-rendered HTML always shows an empty cart, then the client updates it.
- Two separate effects: one reads on mount, one writes on every change. The `try/catch` handles cases where localStorage is full or blocked (private browsing).
- `JSON.parse(raw) as CartLine[]` parses the stored JSON string back into an array of cart items.

**Deterministic cart line ID:**

```tsx
const addItem: CartContextValue['addItem'] = (item) => {
  const quantity = item.quantity ?? 1;
  const key = [
    item.kind,
    item.sourceId,
    item.size || 'any',
    item.notes || '',
    JSON.stringify(item.extras || []),
  ].join('|');

  setItems((prev) => {
    const existing = prev.find((line) => line.id === key);
    if (existing) {
      return prev.map((line) =>
        line.id === key ? { ...line, quantity: line.quantity + quantity } : line
      );
    }
    return [...prev, { id: key, quantity, ...item }];
  });
};
```

**Key learning:**
- The cart line ID is a **composite key**: `kind|sourceId|size|notes|extras`. Two items with the same pizza, size, and extras merge into one line with increased quantity. Different sizes or different extras create separate lines.
- `JSON.stringify(item.extras || [])` ensures the extras array is compared by value, not by reference.
- The functional updater `setItems((prev) => ...)` prevents race conditions when multiple adds happen quickly.

**Memoized API:**

```tsx
const api = useMemo<CartContextValue>(() => {
  return {
    items,
    totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
    addItem,
    removeItem: (id) => setItems((prev) => prev.filter((item) => item.id !== id)),
    setQuantity: (id, quantity) =>
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item))
      ),
    clearCart: () => setItems([]),
  };
}, [items]);
```

**Key learning:**
- `useMemo` ensures the context value object is stable. Without it, a new object is created on every render, causing all consumers to re-render even if the cart has not changed.
- `Math.max(1, quantity)` prevents setting quantity below 1. A quantity of 0 should use `removeItem` instead.
- `totalItems` and `subtotal` are derived values computed from `items`. They are not stored separately because they can always be calculated.

---

## Phase 13: Storefront Pages

Every storefront page follows the same pattern: fetch the bundle, extract config values, render server-side HTML.

### Home Page (`apps/storefront/app/page.tsx` or `apps/storefront/app/home/page.tsx`)

The home page displays:
- Hero section with title, subtitle, and primary CTA
- Announcement bar
- Active notification banner
- Featured menu items (bestsellers)

```tsx
export default async function HomePage() {
  const bundle = await fetchStorefrontBundle();
  const storefrontState = getStorefrontState(bundle);
  const heroTitle = getHeroTitle(bundle);
  const heroSubtitle = getHeroSubtitle(bundle);

  return (
    <StorefrontShell bundle={bundle}>
      <section className="hero">
        <h1>{heroTitle}</h1>
        <p>{heroSubtitle}</p>
        <Link href={storefrontState.primaryAction.href}>
          {storefrontState.primaryAction.label}
        </Link>
      </section>
    </StorefrontShell>
  );
}
```

**Key learning:**
- `async function HomePage` — this is a React Server Component. The `fetchStorefrontBundle()` runs on the server during SSR.
- `StorefrontShell` wraps the page content, providing the navbar, footer, and ambient effects.
- The primary action button dynamically changes based on store state: "Order now" when open, "Schedule for later" when after hours, "View status" when closed.

### Menu Page (`apps/storefront/app/menu/page.tsx`)

Displays all pizzas grouped by category with filtering.

```tsx
export default async function MenuPage() {
  const bundle = await fetchStorefrontBundle();
  return (
    <StorefrontShell bundle={bundle}>
      <MenuBrowser bundle={bundle} />
    </StorefrontShell>
  );
}
```

**Key learning:**
- The page itself is minimal — it delegates rendering to the `MenuBrowser` client component. This pattern separates data fetching (server) from interactive rendering (client).

### Menu Detail Page (`apps/storefront/app/menu/[slug]/page.tsx`)

This page uses **dynamic routing**:

```tsx
export default async function MenuDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const bundle = await fetchStorefrontBundle();
  const pizza = bundle.pizzas.find((p) => p.slug === params.slug);

  if (!pizza) notFound();

  return (
    <StorefrontShell bundle={bundle}>
      {/* Pizza details, size selector, extras, add to cart */}
    </StorefrontShell>
  );
}
```

**Key learning:**
- `[slug]` in the folder name creates a dynamic route parameter. `/menu/margherita` maps to `params.slug = 'margherita'`.
- `notFound()` from `next/navigation` renders the closest `not-found.tsx` error page.
- The pizza is found by slug from the already-fetched bundle, avoiding an extra database query.

### Build Page (`apps/storefront/app/build/page.tsx`)

The pizza builder page hosts the `PizzaBuilder` client component that provides an interactive pizza customization experience:
- Size selection (small/medium/large) with price display
- Extra toppings selection with size-dependent pricing
- Add-to-cart functionality

### Cart Page (`apps/storefront/app/cart/page.tsx`)

The cart page hosts the `CartCheckout` client component:
- Displays cart items with quantity controls
- Customer information form (name, phone)
- Fulfillment type toggle (delivery/pickup)
- Address input or geolocation sharing for delivery
- Scheduled time picker for after-hours orders
- Order notes
- WhatsApp order submission

### About Page (`apps/storefront/app/about/page.tsx`)

```tsx
export default async function AboutPage() {
  const bundle = await fetchStorefrontBundle();
  const config = bundle.config;

  const eyebrow = getConfigValue(config, 'about_eyebrow', 'About us');
  const heroCopy = getConfigValue(config, 'about_hero_copy', 'The story of We Knead Pizza');
  const hoursLabel = getConfigValue(config, 'about_hours_label', 'Hours');
  const minOrderLabel = getConfigValue(config, 'about_min_order_label', 'Minimum order');
  const addressLabel = getConfigValue(config, 'about_address_label', 'Address');
  const mapLink = getConfigValue(config, 'google_maps_link');

  return (
    <StorefrontShell bundle={bundle}>
      <section>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{heroCopy}</h1>
        <div>
          <span>{hoursLabel}</span>
          <span>{getOpeningWindow(bundle)}</span>
        </div>
        {mapLink && (
          <a href={mapLink} target="_blank" rel="noopener noreferrer">
            View on Google Maps
          </a>
        )}
      </section>
    </StorefrontShell>
  );
}
```

**Key learning:**
- `target="_blank"` opens the link in a new tab. `rel="noopener noreferrer"` is a security best practice — `noopener` prevents the new page from accessing `window.opener`, and `noreferrer` prevents sending the referrer header.
- `{mapLink && (...)}` conditionally renders the Google Maps link only if the config value exists. This is React's **short-circuit rendering** pattern.

### Contact Page (`apps/storefront/app/contact/page.tsx`)

Displays phone, email, address, and WhatsApp chat link with a prefilled message from config.

### Delivery Page (`apps/storefront/app/delivery/page.tsx`)

Displays delivery hours, minimum order, delivery radius, address, and a WhatsApp link for delivery inquiries.

### Status Page (`apps/storefront/app/status/page.tsx`)

Dynamically shows the current store state (open/closed/maintenance/after-hours) with appropriate messaging from config.

### FAQ Page (`apps/storefront/app/faq/page.tsx`)

```tsx
const faqItemsRaw = getConfigValue(config, 'faq_items', '[]');
let faqItems: Array<{ q: string; a: string }> = [];
try {
  faqItems = JSON.parse(faqItemsRaw);
} catch { }
```

**Key learning:**
- The FAQ items are stored as JSON in the `site_config` table. The `try/catch` around `JSON.parse` prevents the page from crashing if the JSON is malformed.
- The admin can edit FAQ items as JSON in the settings editor (type `json`).

### Privacy and Terms Pages

Both follow the same pattern as FAQ — structured JSON content from `site_config`:

```tsx
const sectionsRaw = getConfigValue(config, 'privacy_sections', '[]');
let sections: Array<{ title: string; body: string }> = [];
try {
  sections = JSON.parse(sectionsRaw);
} catch { }
```

### Custom 404 Page (`apps/storefront/app/not-found.tsx`)

```tsx
export default async function NotFound() {
  const bundle = await fetchStorefrontBundle();
  const config = bundle.config;

  return (
    <StorefrontShell bundle={bundle}>
      <section>
        <span>{getConfigValue(config, '404_eyebrow', 'Page not found')}</span>
        <h1>{getConfigValue(config, '404_title', '404')}</h1>
        <p>{getConfigValue(config, '404_copy', 'The page you are looking for does not exist.')}</p>
        <Link href="/menu">{getConfigValue(config, '404_menu_label', 'Back to Menu')}</Link>
      </section>
    </StorefrontShell>
  );
}
```

**Key learning:**
- Even the 404 page fetches the bundle and uses configurable text. This ensures the 404 page maintains the store's branding and can be customized from the admin dashboard.

---

## Phase 14: Storefront Order Action (`apps/storefront/app/actions.ts`)

This is the most critical server action — it processes customer orders.

```tsx
'use server';

import { z } from 'zod';

const orderSchema = z.object({
  customerName: z.string().min(2),
  customerPhone: z.string().min(6).optional(),
  fulfillment: z.enum(['delivery', 'pickup']),
  deliveryAddress: z.string().optional(),
  manualAddress: z.string().optional(),
  scheduledTime: z.string().optional(),
  deliveryLocation: z.object({
    mapUrl: z.string().url(),
    latitude: z.number(),
    longitude: z.number(),
    accuracyMeters: z.number().nonnegative().optional().nullable(),
  }).optional(),
  pickupNote: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(
    z.object({
      id: z.string(),
      kind: z.enum(['pizza', 'extra', 'addon', 'dessert']),
      sourceId: z.string(),
      name: z.string(),
      size: z.enum(['small', 'medium', 'large']).optional(),
      quantity: z.number().int().positive(),
      unitPrice: z.number().nonnegative(),
      extras: z.array(z.object({ id: z.string(), name: z.string(), price: z.number() })).optional(),
      customization: z.record(z.any()).optional(),
    })
  ).min(1),
  total: z.number().nonnegative(),
});
```

**Key learning:**
- The schema validates the **entire order payload** on the server. Even if a malicious client sends modified data, the server catches it.
- `z.array(...).min(1)` ensures at least one item. An empty order is invalid.
- `z.number().int().positive()` ensures quantity is a positive integer.
- The `deliveryLocation` object validates geolocation data including the Google Maps URL, coordinates, and accuracy.

**The order flow:**

```tsx
export async function createWhatsAppOrder(payload: z.infer<typeof orderSchema>) {
  const data = orderSchema.parse(payload);
  const supabase = createServiceClient();

  // 1. Fetch all config for validation and message building
  const { data: configRows } = await supabase.from('site_config').select('key, value');
  const config = (configRows || []).reduce<Record<string, string>>((acc, row) => {
    acc[row.key] = row.value;
    return acc;
  }, {});
```

**Key learning:**
- The service client fetches ALL config (including private keys like `whatsapp_number`) because this runs server-side. The storefront's public bundle does not include private config.
- `z.infer<typeof orderSchema>` is the TypeScript type derived from the Zod schema. This ensures `data` has the exact shape after parsing.

```tsx
  // 2. Validate store availability
  const availability = getStoreAvailabilityFromConfig(config);

  if (availability.mode === 'maintenance') {
    throw new Error(getConfig('cart_paused_maintenance_message', '...'));
  }
  if (availability.mode === 'closed') {
    throw new Error(getConfig('cart_paused_closed_message', '...'));
  }
```

**Key learning:**
- The server re-checks store availability even though the client already checked. This prevents race conditions where the store closes between the user loading the cart and submitting the order.
- Error messages come from config, so they can be customized.

```tsx
  // 3. Validate delivery location for delivery orders
  const deliveryLocationSource =
    deliveryLocation && manualDeliveryAddress
      ? 'mixed'
      : deliveryLocation
        ? 'geolocation'
        : manualDeliveryAddress
          ? 'manual'
          : null;
```

**Key learning:**
- Three possible location sources: `geolocation` (device GPS pin), `manual` (typed address), or `mixed` (both). This is determined by which inputs the customer provided.
- The nested ternary is equivalent to an if-else chain but more compact.

```tsx
  // 4. Validate and resolve scheduled time for after-hours orders
  if (availability.mode === 'after_hours') {
    if (!data.scheduledTime?.trim()) {
      throw new Error(withHours(getConfig('cart_schedule_required_message', '...')));
    }

    const scheduleResolution = resolveScheduledOrderTime(config, data.scheduledTime.trim());
    if (!scheduleResolution.valid) {
      throw new Error(withHours(getConfig('cart_schedule_invalid_message', '...')));
    }

    scheduledFor = scheduleResolution.scheduledFor;
    scheduledForLabel = formatStoreDateTime(scheduleResolution.scheduledFor, scheduleResolution.timeZone);
  }
```

**Key learning:**
- `withHours(value)` replaces `{hours}` in the error message with the actual opening window (e.g., "11:00 - 23:00"). This is a simple template substitution.
- The discriminated union from `resolveScheduledOrderTime` makes the type narrowing automatic: after checking `!scheduleResolution.valid`, TypeScript knows `scheduledFor` does not exist. After the implicit else (no error thrown), it knows `scheduledFor` does exist.

```tsx
  // 5. Insert order into database
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      customer_name: data.customerName,
      customer_phone: data.customerPhone || null,
      fulfillment_type: data.fulfillment,
      delivery_address: data.fulfillment === 'delivery' ? manualDeliveryAddress || null : null,
      delivery_location_url: data.fulfillment === 'delivery' ? deliveryLocation?.mapUrl || null : null,
      delivery_location_source: data.fulfillment === 'delivery' ? deliveryLocationSource : null,
      delivery_latitude: data.fulfillment === 'delivery' ? deliveryLocation?.latitude ?? null : null,
      delivery_longitude: data.fulfillment === 'delivery' ? deliveryLocation?.longitude ?? null : null,
      scheduled_for: scheduledFor?.toISOString() || null,
      total_price: data.total,
      status: 'pending',
      payment_method: 'cash' satisfies PaymentMethod,
      payment_status: 'pending' satisfies PaymentStatus,
      notes: [
        data.notes?.trim() || null,
        data.fulfillment === 'pickup'
          ? data.pickupNote?.trim()
            ? `${pickupNoteLabel}: ${data.pickupNote.trim()}`
            : pickupRequestedNote
          : null,
      ].filter(Boolean).join(' - ') || null,
    })
    .select('id, order_number')
    .single();
```

**Key learning:**
- `'cash' satisfies PaymentMethod` is TypeScript's `satisfies` operator (TS 4.9+). It checks that `'cash'` is a valid `PaymentMethod` at compile time without widening the type to `PaymentMethod`. The value remains the literal `'cash'`.
- Delivery fields are conditionally null based on `fulfillment_type`. Pickup orders do not store delivery addresses.
- `.toISOString()` converts the UTC Date to an ISO 8601 string (e.g., "2026-03-24T05:30:00.000Z") for PostgreSQL.
- The notes field merges customer notes and pickup notes with " - " separator.

```tsx
  // 6. Insert order items
  const orderItems = data.items.map((item: CartLine) => ({
    order_id: order.id,
    item_type: item.kind,
    pizza_id: item.kind === 'pizza' ? item.sourceId : null,
    extra_id: item.kind === 'extra' ? item.sourceId : null,
    addon_id: item.kind === 'addon' ? item.sourceId : null,
    dessert_id: item.kind === 'dessert' ? item.sourceId : null,
    size: item.size || null,
    quantity: item.quantity,
    unit_price: item.unitPrice,
    extras_json: item.extras || null,
    customization_json: item.customization || null,
  }));

  await supabase.from('order_items').insert(orderItems);
```

**Key learning:**
- Each order item links to its source entity via a nullable foreign key. Only one of `pizza_id`, `extra_id`, `addon_id`, `dessert_id` is non-null per row. This is the **polymorphic association** pattern.

```tsx
  // 7. Build WhatsApp message and return URL
  const whatsappMessage = buildWhatsAppMessage({
    orderNumber: order.order_number,
    customerName: data.customerName,
    // ... all fields
    copy: {
      headingLabel: getConfig('cart_whatsapp_heading_label', 'Order'),
      // ... 15 label fields
    },
  });

  return {
    orderId: order.id,
    orderNumber: order.order_number,
    whatsappUrl: buildWhatsAppUrl(whatsappNumber, whatsappMessage),
  };
}
```

**Key learning:**
- The server action returns an object with the WhatsApp URL. The client component opens this URL in a new tab or redirects to it, launching WhatsApp with the pre-filled order message.
- The `order_number` (from PostgreSQL's SERIAL column) gives the customer a short reference number (e.g., #42).
- Every WhatsApp message label is configurable. The entire message format can be changed without code changes.

---

## Phase 15: CI/CD Pipeline

### GitHub Actions Workflow (`.github/workflows/vercel-deploy.yml`)

The deployment pipeline runs on every push to `main`, on pull requests, and on manual triggers.

```yaml
name: CI and Vercel Deploy

on:
  workflow_dispatch:
  pull_request:
  push:
    branches:
      - main
```

**Key learning:**
- `workflow_dispatch` allows manually triggering the workflow from the GitHub Actions UI.
- `pull_request` triggers on PR creation and updates — used for preview deployments.
- `push: branches: [main]` triggers on merges to main — used for production deployments.

```yaml
concurrency:
  group: vercel-${{ github.ref }}
  cancel-in-progress: true
```

**Key learning:**
- `concurrency` prevents multiple deployments for the same branch from running simultaneously. If a new push arrives while the previous deployment is still running, the old one is cancelled.
- `${{ github.ref }}` groups by branch name, so PRs to different branches can deploy concurrently.

**Build job:**

```yaml
jobs:
  build:
    name: Build and verify
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build --workspace apps/admin
      - run: npm run build --workspace apps/storefront
```

**Key learning:**
- `npm ci` (clean install) is used instead of `npm install` because it respects the lockfile exactly and is faster in CI.
- `cache: npm` caches the npm cache directory between runs, speeding up subsequent installs.
- Building both apps verifies that TypeScript compiles without errors and all imports resolve.

**Deploy job with matrix strategy:**

```yaml
  deploy:
    needs: build
    if: github.event_name == 'push' || github.event_name == 'workflow_dispatch' || (...)
    strategy:
      fail-fast: false
      matrix:
        include:
          - app: admin
            project_secret: VERCEL_ADMIN_PROJECT_ID
          - app: storefront
            project_secret: VERCEL_STOREFRONT_PROJECT_ID
```

**Key learning:**
- `needs: build` ensures the deploy job only runs after the build succeeds.
- `matrix` runs the deploy steps **twice in parallel** — once for admin, once for storefront. Each run uses different Vercel project credentials.
- `fail-fast: false` means if one app fails to deploy, the other still attempts deployment.
- `${{ secrets[matrix.project_secret] }}` dynamically accesses a GitHub secret by name. This avoids duplicating the deploy steps.

**Vercel CLI deployment:**

```yaml
      - run: npx --yes vercel@latest pull --yes --environment=${{ ... && 'production' || 'preview' }} --token=${{ env.VERCEL_TOKEN }}
      - run: npx --yes vercel@latest build ${{ ... && '--prod' || '' }} --token=${{ env.VERCEL_TOKEN }}
      - name: Deploy production
        if: (github.event_name == 'push' && github.ref == 'refs/heads/main') || github.event_name == 'workflow_dispatch'
        run: npx --yes vercel@latest deploy --prebuilt --prod --token=${{ env.VERCEL_TOKEN }}
```

**Key learning:**
- `vercel pull` downloads the project settings and environment variables from Vercel.
- `vercel build` compiles the Next.js app locally (in the CI runner), creating the `.vercel/output` directory.
- `vercel deploy --prebuilt` uploads the pre-built output without rebuilding on Vercel's servers. This is faster and gives more control over the build environment.
- `--prod` deploys to the production domain. Without it, Vercel creates a preview URL.
- `npx --yes vercel@latest` runs the latest Vercel CLI without prompting for confirmation.

### Environment Secrets

The workflow requires these GitHub repository secrets:

| Secret | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous (public) key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only) |
| `ADMIN_EMAIL` | Admin auto-login email |
| `NEXT_PUBLIC_ENABLE_AUTO_LOGIN` | Auto-login toggle |
| `VERCEL_TOKEN` | Vercel API token |
| `VERCEL_ORG_ID` | Vercel organization ID |
| `VERCEL_ADMIN_PROJECT_ID` | Vercel project ID for admin app |
| `VERCEL_STOREFRONT_PROJECT_ID` | Vercel project ID for storefront app |

**Key learning:**
- Secrets are never committed to Git. They are configured in the GitHub repository settings and injected as environment variables during the workflow run.
- `NEXT_PUBLIC_*` secrets are exposed to the browser. Non-prefixed secrets are server-only.
- The Vercel token is a personal access token generated from the Vercel dashboard. It authenticates the CLI.

---

## Phase 16: Tailwind CSS and Styling

### Tailwind v4 (`@tailwindcss/postcss`)

Tailwind CSS v4 was used, which is a significant departure from v3:
- No `tailwind.config.js` needed — configuration moves to CSS.
- CSS-native engine using `@layer` and `@theme`.
- The `@tailwindcss/postcss` package replaces the old PostCSS plugin.

**Key learning:**
- Tailwind utility classes like `px-4 py-2 text-sm font-semibold rounded-lg bg-white shadow-md` compose into complex styles without writing CSS.
- `hover:bg-white/70` — the `/70` is Tailwind's opacity modifier syntax. `bg-white/70` is `rgba(255,255,255,0.7)`.
- `xl:grid-cols-[minmax(0,1fr)_24rem]` — square bracket notation for arbitrary values. This creates a CSS Grid with a flexible first column and a fixed 24rem second column.
- CSS custom properties (e.g., `var(--ember)`, `var(--ink)`, `var(--stone)`) are used for theming colors. This allows the admin to change the brand color by updating a single variable.

---

## Phase 17: Key Architectural Decisions Summary

### Decision 1: Config-Driven Storefront

Every piece of text on the customer-facing site comes from the `site_config` table. This was the single most impactful architectural decision:
- The admin can change any text without a code deployment.
- The storefront is fully localizable.
- A/B testing text changes is trivial.
- The trade-off is ~300 config keys to manage, but the admin settings UI with search and categories makes this manageable.

### Decision 2: WhatsApp as Order Channel

Instead of building a payment gateway and order tracking system, orders are handed off to WhatsApp:
- Zero cost — no payment processing fees or SMS charges.
- The store owner receives orders in a familiar interface (WhatsApp).
- The customer gets a conversational order confirmation.
- The trade-off is no automated payment processing, but for a small pizza shop, WhatsApp is faster and more personal.

### Decision 3: Server Components by Default

Every page starts as a React Server Component. Client components are introduced only when interactivity is needed:
- `MenuBrowser` needs client-side filtering and state → `'use client'`
- `CartProvider` needs `useState`, `useEffect`, `localStorage` → `'use client'`
- `KanbanBoard` needs DnD and realtime → `'use client'`
- About, Contact, Status, FAQ pages have zero client JavaScript.

### Decision 4: Single Bundle Fetch

`fetchStorefrontBundle()` fetches everything in one call. This was chosen over per-page fetching because:
- The shell needs config values (nav links, store name, logo).
- Most pages need the same data (pizzas, categories, config).
- Eight parallel queries are fast enough (Supabase is in the same Vercel region).
- Next.js caches the fetch result, so subsequent requests within the same render hit the cache.

### Decision 5: Supabase Realtime Over Polling

The admin dashboard uses WebSocket subscriptions instead of periodic polling:
- Instant updates when orders arrive or change status.
- No wasted requests when nothing has changed.
- Supabase's free tier includes realtime at no extra cost.

### Decision 6: Monorepo with Shared Types

The `@wkp/core` package ensures type definitions and validation schemas are shared:
- A schema change in `validations.ts` is immediately reflected in both apps.
- No drift between admin and storefront type definitions.
- The Zustand store and API helpers live here because both apps may need them.

---

## Complete File Inventory

Every file in the project, grouped by purpose:

### Root
| File | Purpose |
|---|---|
| `package.json` | Monorepo workspaces, root scripts |
| `README.md` | System architecture and developer guide |
| `work-done.md` | This document |
| `.github/workflows/vercel-deploy.yml` | CI/CD pipeline |

### `packages/core/`
| File | Purpose |
|---|---|
| `package.json` | Shared package metadata and dependencies |
| `index.ts` | Barrel export for all shared modules |
| `validations.ts` | Zod schemas for all entities (pizza, topping, extra, addon, dessert, category, notification) |
| `adminApi.ts` | Supabase admin API helpers |
| `useAdminCatalogStore.ts` | Zustand store for admin catalog state |
| `cms-backup-restore.ts` | CMS backup and restore utilities |

### `apps/admin/`

**Configuration:**
| File | Purpose |
|---|---|
| `package.json` | Admin dependencies and scripts |
| `next.config.ts` | Next.js configuration |
| `tsconfig.json` | TypeScript configuration with path aliases |
| `vitest.config.ts` | Vitest test runner configuration |
| `vitest.setup.ts` | Test setup (jest-dom matchers) |
| `postcss.config.mjs` | PostCSS plugins (Tailwind) |

**Supabase clients:**
| File | Purpose |
|---|---|
| `src/lib/supabaseAdmin.ts` | Service-role client (bypasses RLS) |
| `src/lib/supabaseServer.ts` | SSR client (cookie-based auth) |
| `src/lib/supabaseBrowser.ts` | Browser client (client components) |
| `src/lib/supabaseClient.ts` | Convenience re-export |
| `src/lib/supabaseFallback.ts` | Mock client for CI/dev without credentials |

**Types and utilities:**
| File | Purpose |
|---|---|
| `src/types/index.ts` | All TypeScript interfaces (Pizza, Order, Category, etc.) |
| `src/lib/utils.ts` | Slugify, date formatting, other utilities |

**Dashboard layout and pages:**
| File | Purpose |
|---|---|
| `src/app/dashboard/layout.tsx` | Auth guard, navbar, sidebar, page transitions |
| `src/app/dashboard/page.tsx` | Overview with metrics, sparklines, recent orders |
| `src/app/dashboard/error.tsx` | Error boundary with retry |
| `src/app/dashboard/not-found.tsx` | 404 page |

**Pizza management:**
| File | Purpose |
|---|---|
| `src/app/dashboard/pizzas/page.tsx` | Data fetching for MenuStudio |
| `src/app/dashboard/pizzas/MenuStudio.tsx` | 725-line tabbed menu management UI |
| `src/app/dashboard/pizzas/actions.ts` | CRUD server actions for pizzas |

**Order management:**
| File | Purpose |
|---|---|
| `src/app/dashboard/orders/page.tsx` | Live orders data fetching |
| `src/app/dashboard/orders/KanbanBoard.tsx` | DnD Kanban with realtime |
| `src/app/dashboard/orders/actions.ts` | Order status update and delete |

**Settings:**
| File | Purpose |
|---|---|
| `src/app/dashboard/settings/page.tsx` | Config data fetching |
| `src/app/dashboard/settings/SettingsClient.tsx` | 300+ config editor with realtime sync |
| `src/app/dashboard/settings/actions.ts` | Config CRUD, image upload |

**Categories and notifications:**
| File | Purpose |
|---|---|
| `src/app/dashboard/categories/actions.ts` | Category CRUD with delete protection |
| `src/app/dashboard/notifications/actions.ts` | Notification CRUD |
| `src/app/dashboard/actions.ts` | Quick-create for toppings, extras, addons, desserts |

**Tests:**
| File | Purpose |
|---|---|
| `src/components/admin/__tests__/InlineExtraPrice.test.tsx` | Price inline edit tests |
| `src/components/admin/__tests__/Modal.test.tsx` | Modal component tests |
| `src/components/admin/__tests__/ToggleSoldOut.test.tsx` | Sold-out toggle tests |
| `src/mocks/handlers.ts` | MSW mock handlers |

**Migrations (in order):**
| File | Purpose |
|---|---|
| `supabase/migrations/202603200001_staff_and_dashboard_flags.sql` | Staff table + dashboard_live_mode |
| `supabase/migrations/202603200002_menu_images_storage.sql` | Storage bucket + RLS policies |
| `supabase/migrations/202603220001_add_is_public_to_site_config.sql` | Add is_public column |
| `supabase/migrations/202603220002_allow_json_site_config_type.sql` | Allow json type |
| `supabase/migrations/202603220003_seed_storefront_copy_defaults.sql` | 300+ config seeds |
| `supabase/migrations/202603220004_seed_order_handoff_settings.sql` | WhatsApp message labels |
| `supabase/migrations/202603220005_seed_legacy_and_prefill_settings.sql` | Legacy settings |
| `supabase/migrations/202603220006_remove_stale_logo_url.sql` | Cleanup stale keys |
| `supabase/migrations/202603220007_add_order_scheduling_and_location_fields.sql` | Order scheduling + location columns |
| `supabase/migrations/202603220008_seed_scheduling_and_location_settings.sql` | Scheduling/location config seeds |

### `apps/storefront/`

**Configuration:**
| File | Purpose |
|---|---|
| `package.json` | Storefront dependencies and scripts |
| `next.config.ts` | Next.js configuration |
| `tsconfig.json` | TypeScript configuration |

**Library files:**
| File | Purpose |
|---|---|
| `app/lib/types.ts` | All TypeScript interfaces including StorefrontBundle and CartLine |
| `app/lib/env.ts` | Centralized environment variable access |
| `app/lib/supabase.ts` | SSR and service Supabase clients |
| `app/lib/storefront.ts` | fetchStorefrontBundle, getConfigValue, money, slugify |
| `app/lib/catalog.ts` | 711-line file with ~70 config helper functions |
| `app/lib/store-hours.ts` | 280-line timezone-aware availability engine |
| `app/lib/whatsapp.ts` | WhatsApp message builder and URL generator |

**Components:**
| File | Purpose |
|---|---|
| `app/components/storefront-shell.tsx` | 353-line shell with nav, footer, ambient animations |
| `app/components/cart-provider.tsx` | Context-based cart with localStorage persistence |
| `app/components/menu-browser.tsx` | Interactive menu browsing with category filters |
| `app/components/pizza-builder.tsx` | Pizza customization (size, extras) |
| `app/components/cart-checkout.tsx` | Checkout form with fulfillment, scheduling, location |

**Pages:**
| File | Purpose |
|---|---|
| `app/page.tsx` (or `app/home/page.tsx`) | Home page with hero and featured items |
| `app/menu/page.tsx` | Menu listing |
| `app/menu/[slug]/page.tsx` | Dynamic pizza detail page |
| `app/build/page.tsx` | Pizza builder page |
| `app/cart/page.tsx` | Shopping cart and checkout |
| `app/about/page.tsx` | About page with store info |
| `app/contact/page.tsx` | Contact information |
| `app/delivery/page.tsx` | Delivery information |
| `app/status/page.tsx` | Current store status |
| `app/faq/page.tsx` | FAQ from JSON config |
| `app/privacy/page.tsx` | Privacy policy from JSON config |
| `app/terms/page.tsx` | Terms from JSON config |
| `app/not-found.tsx` | Custom 404 with configurable text |

**Server actions:**
| File | Purpose |
|---|---|
| `app/actions.ts` | createWhatsAppOrder (267-line order processing pipeline) and previewSlug |

---

## Cost Breakdown: How This Runs for Free

| Service | Free Tier Used | Limit |
|---|---|---|
| **Supabase** | Database, Auth, Storage, Realtime | 500 MB database, 1 GB storage, 50K auth users |
| **Vercel** | Two Next.js deployments | 100 GB bandwidth, serverless functions |
| **GitHub** | Repository, Actions CI/CD | 2,000 minutes/month for Actions |
| **WhatsApp** | Order messaging | No API cost (uses wa.me deep links) |
| **Total** | **$0/month** | Sufficient for a small pizza shop |

---

## Lessons Learned

1. **TypeScript pays for itself.** The time spent writing types is recovered tenfold in avoided debugging. The compiler catches bugs that would take hours to trace in JavaScript.

2. **Server Components simplify data fetching.** No need for `useEffect` + loading states for data that is known at render time. `async function Page()` just works.

3. **Server Actions replace API routes.** Instead of building REST endpoints with route handlers, `'use server'` functions are called directly from components. Less boilerplate, same security.

4. **Supabase's query builder is ergonomic.** `.from('pizzas').select('*, categories(label)').eq('is_active', true)` reads almost like English and generates efficient SQL.

5. **Config-driven UI scales.** Starting with hardcoded strings and then extracting them into `site_config` was the wrong order. The final approach — config-first with hardcoded fallbacks — meant the admin dashboard was useful from day one.

6. **Realtime is addictive.** Once the Kanban board updated in real time, polling felt unacceptable everywhere. Supabase's realtime API is trivial to set up.

7. **The monorepo keeps you honest.** Changing a shared type in `@wkp/core` immediately shows which files in both apps need updating. In separate repos, this drift would accumulate silently.

8. **CI/CD should be set up early.** The GitHub Actions workflow caught build errors that local development missed (different Node versions, missing environment variables, import resolution differences).

9. **Framer Motion is worth the bundle size.** The page transitions and ambient animations transform a static-feeling Next.js app into something that feels polished and intentional.

10. **Free tier is enough.** Supabase + Vercel + GitHub Actions provide a genuinely production-grade stack at zero cost. The constraints of the free tier (database size, bandwidth) are well above what a single pizza shop needs.
