# WKP Website Monorepo

A production-grade, WhatsApp-first pizza ordering platform built as an npm workspaces monorepo. The admin dashboard controls catalog data, site configuration, and live order management. The storefront renders everything dynamically from Supabase and hands orders off to WhatsApp.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Quick Start](#quick-start)
3. [Workspace Commands](#workspace-commands)
4. [Project Structure](#project-structure)
5. [Technology Stack](#technology-stack)
6. [Data Model](#data-model)
7. [Admin App](#admin-app)
8. [Storefront App](#storefront-app)
9. [Supabase Migrations](#supabase-migrations)
10. [Availability and Store State Logic](#availability-and-store-state-logic)
11. [Order Flow](#order-flow)
12. [Configuration System](#configuration-system)
13. [Deployment](#deployment)
14. [Testing](#testing)
15. [Coding Practices](#coding-practices)
16. [Known Quirks and Gotchas](#known-quirks-and-gotchas)
17. [Editing Checklist](#editing-checklist)
18. [Development Journey](#development-journey)

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                       Vercel (Hosting)                           │
│  ┌─────────────────────┐       ┌──────────────────────────────┐ │
│  │   apps/admin         │       │   apps/storefront            │ │
│  │   Next.js 15 (RSC)   │       │   Next.js 15 (RSC)           │ │
│  │   Dashboard + CMS     │       │   Customer-facing site       │ │
│  │   Port 3000 (dev)     │       │   Port 3001 (dev)            │ │
│  └────────┬─────────────┘       └────────────┬─────────────────┘ │
│           │                                   │                   │
│           │  Server Actions / Supabase SDK     │ Server Components │
│           └───────────┬───────────────────────┘                   │
│                       │                                           │
│  ┌────────────────────▼──────────────────────────────────────┐   │
│  │              packages/core                                 │   │
│  │  Shared types, validations, admin API helpers, Zustand     │   │
│  └────────────────────┬──────────────────────────────────────┘   │
└───────────────────────┼──────────────────────────────────────────┘
                        │
           ┌────────────▼────────────┐
           │      Supabase           │
           │  PostgreSQL + Auth      │
           │  Storage (menu bucket)  │
           │  Realtime subscriptions │
           └─────────────────────────┘
                        │
           ┌────────────▼────────────┐
           │      WhatsApp           │
           │  Order handoff via URL  │
           └─────────────────────────┘
```

**Data flow**: Admin writes to Supabase -> Storefront reads live from Supabase -> Customer builds cart -> Order saved to Supabase -> WhatsApp message composed and handed off.

---

## Quick Start

```bash
npm install
npm run dev          # Runs both apps concurrently
npm run build        # Builds both apps
npm run lint         # Lints both apps
```

## Workspace Commands

Focus on a single app:

```bash
npm run dev --workspace apps/admin
npm run dev --workspace apps/storefront
npm run build --workspace apps/admin
npm run build --workspace apps/storefront
```

Admin-specific commands:

```bash
npm run test --workspace apps/admin
npm run test:watch --workspace apps/admin
npm run test:coverage --workspace apps/admin
npm run seed:menu --workspace apps/admin
```

---

## Project Structure

```
wkp-monorepo/
├── apps/
│   ├── admin/                          # Admin dashboard (Next.js 15)
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── dashboard/          # Main dashboard shell
│   │   │   │   │   ├── page.tsx        # Overview with metrics, sparklines, recent orders
│   │   │   │   │   ├── layout.tsx      # Client layout with sidebar, navbar, auth guard
│   │   │   │   │   ├── actions.ts      # CRUD: categories, toppings, extras, addons, desserts
│   │   │   │   │   ├── error.tsx       # Error boundary
│   │   │   │   │   ├── not-found.tsx   # 404 page
│   │   │   │   │   ├── pizzas/         # MenuStudio tabbed UI, pizza CRUD + price actions
│   │   │   │   │   ├── orders/         # KanbanBoard with DnD, realtime, order status actions
│   │   │   │   │   ├── categories/     # Category CRUD with system-category protection
│   │   │   │   │   ├── toppings/       # Topping management
│   │   │   │   │   ├── extras/         # Extra management with size-based pricing
│   │   │   │   │   ├── addons/         # Addon management
│   │   │   │   │   ├── desserts/       # Dessert management
│   │   │   │   │   ├── notifications/  # Notification CRUD with active toggle
│   │   │   │   │   ├── settings/       # Site config editor, image uploads, realtime sync
│   │   │   │   │   └── prices/         # Price management views
│   │   │   │   └── login/              # Auth login page
│   │   │   ├── components/
│   │   │   │   ├── Navbar.tsx          # Top bar with live mode toggle
│   │   │   │   ├── Sidebar.tsx         # Collapsible navigation drawer
│   │   │   │   ├── MotionSurface.tsx   # Framer Motion wrapper for cards
│   │   │   │   └── admin/             # Reusable admin UI components
│   │   │   │       ├── Modal.tsx       # Dialog component
│   │   │   │       ├── PizzaForm.tsx   # Pizza create/edit form
│   │   │   │       ├── InlinePrice.tsx # Inline pizza price editor
│   │   │   │       ├── InlineExtraPrice.tsx
│   │   │   │       ├── InlineSimplePrice.tsx
│   │   │   │       ├── MenuImageField.tsx  # Image upload + URL field
│   │   │   │       ├── TogglePizzaActive.tsx
│   │   │   │       ├── ToggleSoldOut.tsx
│   │   │   │       └── DeletePizzaButton.tsx
│   │   │   ├── lib/
│   │   │   │   ├── supabaseAdmin.ts    # Service-role Supabase client
│   │   │   │   ├── supabaseServer.ts   # SSR cookie-based client
│   │   │   │   ├── supabaseBrowser.ts  # Browser-side client
│   │   │   │   ├── supabaseClient.ts   # Lightweight browser client
│   │   │   │   └── validations.ts      # Zod schemas for all entities
│   │   │   └── types/
│   │   │       └── index.ts            # All TypeScript interfaces
│   │   ├── supabase/
│   │   │   └── migrations/             # 8 sequential SQL migration files
│   │   └── scripts/
│   │       └── seed-menu.mjs           # Menu seeding script
│   │
│   └── storefront/                     # Customer-facing site (Next.js 15)
│       └── app/
│           ├── home/page.tsx           # Immersive homepage
│           ├── menu/page.tsx           # Menu browser with filters + search
│           ├── menu/[slug]/page.tsx    # Dynamic item detail
│           ├── build/page.tsx          # Custom pizza builder
│           ├── cart/page.tsx           # Cart + WhatsApp checkout
│           ├── about/page.tsx          # About with location, hours, recipe info
│           ├── contact/page.tsx        # Contact with WhatsApp, email, map
│           ├── delivery/page.tsx       # Delivery info, hours, radius, minimums
│           ├── status/page.tsx         # Live store status (open/closed/after-hours/maintenance)
│           ├── faq/page.tsx            # FAQ from structured JSON config
│           ├── privacy/page.tsx        # Privacy policy from structured JSON config
│           ├── terms/page.tsx          # Terms from structured JSON config
│           ├── not-found.tsx           # 404 page
│           ├── actions.ts              # Server actions: createWhatsAppOrder, previewSlug
│           ├── components/
│           │   ├── storefront-shell.tsx # Shell with nav, footer, cart FAB, status bar
│           │   ├── immersive-home.tsx   # Homepage hero, features, signature picks
│           │   ├── menu-browser.tsx     # Menu grid, filters, search, pairing toppings
│           │   ├── menu-item-detail.tsx # Item detail with pricing, status, toppings
│           │   ├── pizza-builder.tsx    # Build flow: base, size, extras, notes, summary
│           │   ├── cart-checkout.tsx    # Checkout: customer info, location, schedule, handoff
│           │   └── cart-provider.tsx    # Client-side cart state via React context
│           └── lib/
│               ├── storefront.ts       # fetchStorefrontBundle (single DB round-trip)
│               ├── catalog.ts          # ~70 helper functions for config, pricing, state
│               ├── store-hours.ts      # Timezone-aware open/closed/after-hours logic
│               ├── whatsapp.ts         # WhatsApp URL builder
│               ├── supabase.ts         # Supabase client factories
│               ├── env.ts              # Typed environment variables
│               ├── types.ts            # Storefront-specific TypeScript interfaces
│               └── cart-store.ts       # Cart persistence logic
│
├── packages/
│   └── core/                           # Shared package (@wkp/core)
│       ├── index.ts                    # Re-exports
│       ├── adminApi.ts                 # Admin API helpers
│       ├── validations.ts             # Shared Zod validation schemas
│       ├── useAdminCatalogStore.ts    # Zustand store for admin catalog state
│       └── cms-backup-restore.ts      # CMS backup/restore utilities
│
├── .github/workflows/                  # CI/CD with Vercel
├── package.json                        # Root workspace config
└── package-lock.json
```

---

## Technology Stack

| Layer | Technology | Version |
|---|---|---|
| **Framework** | Next.js (App Router, RSC) | 15.2.8 |
| **Language** | TypeScript | ^5 |
| **UI** | React | ^19 |
| **Animations** | Framer Motion | ^12.38 |
| **Icons** | Lucide React | ^0.344 (admin), ^0.577 (storefront) |
| **Database** | Supabase (PostgreSQL) | SDK ^2.39+ |
| **Auth** | Supabase Auth + SSR helpers | @supabase/ssr |
| **Validation** | Zod | ^3.22+ |
| **State (admin)** | Zustand | ^4.5 |
| **State (storefront)** | React Context (cart-provider) | built-in |
| **Forms (admin)** | React Hook Form + Zod resolver | ^7.51 |
| **DnD (admin)** | @dnd-kit/core + sortable | ^6.1 / ^8.0 |
| **Toasts (admin)** | react-hot-toast | ^2.4 |
| **Testing** | Vitest + Testing Library + MSW | ^2.0 |
| **Deployment** | Vercel (two projects) | via GitHub Actions |

---

## Data Model

Supabase PostgreSQL is the single source of truth for both apps.

### Core Tables

| Table | Purpose |
|---|---|
| `site_config` | Key-value store for all storefront and admin settings. Has `is_public` flag. Supports types: `text`, `url`, `image`, `boolean`, `number`, `textarea`, `time`, `json`. |
| `pizzas` | Pizza catalog with three size-based prices, flags (veg, bestseller, spicy, new, sold_out), and image URL. |
| `categories` | Pizza grouping with type (`pizza`, `addon`, `dessert`), sort order, active flag. System categories are protected from deletion. |
| `toppings` | Ingredients with category (cheese, meat, vegetable, sauce, herb, other) and veg flag. |
| `pizza_toppings` | Join table linking pizzas to their toppings. |
| `extras` | Size-priced add-on toppings (small/medium/large pricing). |
| `addons` | Flat-price side items with image support. |
| `desserts` | Flat-price sweet items with image support. |
| `orders` | Order records with customer info, fulfillment type, delivery location (lat/lng/accuracy/source), scheduled time, status, payment. |
| `order_items` | Line items linked to orders, referencing pizzas/extras/addons/desserts by FK. |
| `notifications` | Site-wide notices with active toggle, pinning, and expiry. |
| `staff_members` | Staff roster with roles, shifts, status, and initials. |

### Storage Buckets

| Bucket | Access | Purpose |
|---|---|---|
| `menu` | Public read, authenticated write | Menu item images |
| `brand-assets` | Via server action | Storefront branding images (logo, hero, feature) |

Both buckets are backed by idempotent migrations in `apps/admin/supabase/migrations/` and are validated by `npm run verify:invariants`.

### Source of Truth Rules

- Text and image content for the storefront comes from Supabase `site_config` whenever a curated key exists.
- Admin settings save to Supabase first; the storefront reads the same key.
- Catalog data (pizzas, toppings, addons, extras, desserts) is edited in dedicated admin screens, not the Settings page.
- Custom config keys can be saved but only affect the storefront if a consumer exists for that key.

---

## Admin App

### Dashboard Overview (`/dashboard`)

Server-rendered page that fetches metrics from Supabase in parallel:
- **Total revenue** (sum of delivered orders)
- **Total orders**, **active tickets** (pending/preparing/out_for_delivery)
- **Store status** (open/closed from `is_open` config)
- **Recent orders table** (last 5)
- **Sparkline activity chart** (last 12 hours, bucketed into 6 bars)
- **Quick actions**: Create pizza, Store settings, Order history

### Dashboard Layout (`/dashboard/layout.tsx`)

Client component that:
- Guards auth session (redirects to `/login` if no session, unless dev auto-login)
- Fetches `dashboard_live_mode` and notification count on mount
- Renders `Sidebar` + `Navbar` with live-mode toggle
- Animates page transitions via Framer Motion `AnimatePresence`
- Uses ambient floating orb animations for visual polish

### Menu Studio (`/dashboard/pizzas`)

Tabbed interface (`MenuStudio.tsx`) with six tabs:
- **Pizzas** - Card/table view, search, active/bestseller filters, inline price editing, create via modal
- **Categories** - CRUD with system-category protection (veg-pizzas, non-veg-pizzas, addons, desserts)
- **Toppings** - CRUD with veg flag and category grouping
- **Extras** - Size-based pricing CRUD
- **Addons** - Flat-price CRUD with image upload
- **Desserts** - Flat-price CRUD with image upload

Each tab delegates to its own client component and server actions.

### Live Orders (`/dashboard/orders`)

- **KanbanBoard** with three columns: Pending, Preparing, Out for Delivery
- **Drag-and-drop** status transitions via @dnd-kit
- **Realtime subscriptions** via Supabase postgres_changes for live updates
- **Optimistic updates** with rollback on server error
- Order history available at `/dashboard/orders/history`

### Settings (`/dashboard/settings`)

- `SettingsClient.tsx` (1923 lines) - comprehensive config editor
- Groups settings by prefix (home_, menu_, cart_, about_, contact_, delivery_, etc.)
- Supports inline editing of all config types: text, textarea, url, boolean, number, time, image, json
- **Image fields**: File picker upload via server action to Supabase Storage, or direct URL entry
- **Realtime sync**: Subscribes to `site_config` changes for live updates
- **Add/delete** custom config keys (protected keys like `is_open` cannot be deleted)
- **Dashboard live mode** toggle persists to `site_config`

### Server Actions

| Module | Actions |
|---|---|
| `dashboard/actions.ts` | `createCategory`, `createTopping`, `createExtra`, `createAddon`, `createDessert` |
| `dashboard/pizzas/actions.ts` | `createPizza`, `updatePizza`, `deletePizza`, `updatePizzaPrice`, `togglePizzaActive` |
| `dashboard/orders/actions.ts` | `updateOrderStatus`, `deleteOrder` |
| `dashboard/categories/actions.ts` | `createCategory`, `updateCategory`, `deleteCategory` |
| `dashboard/notifications/actions.ts` | `createNotification`, `updateNotification`, `deleteNotification`, `toggleNotificationActive` |
| `dashboard/settings/actions.ts` | `updateSiteConfig`, `upsertSiteConfig`, `upsertDashboardLiveMode`, `uploadStorefrontAsset`, `createSiteConfig`, `deleteSiteConfig` |

All server actions use `supabaseAdmin` (service-role client), validate input, and call `revalidatePath`/`revalidateTag` for cache invalidation.

### Admin Supabase Clients

| Client | File | Usage |
|---|---|---|
| `supabaseAdmin` | `lib/supabaseAdmin.ts` | Service-role key. Used in server actions for privileged writes. |
| `createSupabaseServer` | `lib/supabaseServer.ts` | Cookie-based SSR client. Used in server components for authenticated reads. |
| `createSupabaseBrowser` | `lib/supabaseBrowser.ts` | Browser client. Used in layout for session checks. |
| `createClient` | `lib/supabaseClient.ts` | Lightweight browser client. Used for realtime subscriptions. |

---

## Storefront App

### Core Architecture

Every storefront page follows the same pattern:
1. Call `fetchStorefrontBundle()` - single parallel query fetching all active catalog + config + notifications
2. Pass bundle to `<StorefrontShell>` wrapper (nav, footer, cart FAB, status bar)
3. Pass bundle to page-specific client component

The `StorefrontBundle` type contains: categories, pizzas, toppings, extras, addons, desserts, notifications, config (key-value map), isOpen, maintenanceMode.

### Pages

| Route | Component | Description |
|---|---|---|
| `/home` | `ImmersiveHome` | Hero with ambient orbs, signature picks carousel, 3-step intro cards, closing banner |
| `/menu` | `MenuBrowser` | Filter tabs (All/Pizzas/Addons/Extras/Desserts), search, pizza cards with size selector, simple cards for addons/extras/desserts, toppings pairing grid |
| `/menu/[slug]` | `MenuItemDetailClient` | Dynamic detail page for any menu item type, pricing, status, toppings, back/cart actions |
| `/build` | `PizzaBuilder` | Base pizza selector, size picker, extras toggle, quantity, notes, live price summary |
| `/cart` | `CartCheckout` | Customer info, fulfillment selector, geolocation + manual address, order scheduling, WhatsApp handoff with QR |
| `/about` | Server component | Hours, min order, address, recipe/workflow/location info cards |
| `/contact` | Server component | WhatsApp, address, hours, map, email, ordering info cards |
| `/delivery` | Server component | Hours, address, map, minimum, radius info cards |
| `/status` | Server component | Live state display (open/closed/after-hours/maintenance) |
| `/faq` | Server component | Structured JSON-backed FAQ items |
| `/privacy` | Server component | Structured JSON-backed privacy sections |
| `/terms` | Server component | Structured JSON-backed terms sections |
| 404 | Server component | Not-found with menu/home actions |

### Key Client Components

**StorefrontShell** (`storefront-shell.tsx`)
- Responsive nav with mobile drawer
- Dynamic nav links from `nav_links` JSON config
- Open/closed status badge
- Floating cart FAB (visible when cart has items)
- Footer with store info, nav links, social
- Brand logo from config or text fallback

**MenuBrowser** (`menu-browser.tsx`, ~705 lines)
- Hero section with stats (pizza count, topping count, category count)
- Filter tabs and search input
- Pizza cards: image, name, description, category badge, size price selector, add-to-cart per size
- Simple cards for addons, extras, desserts: flat price, add-to-cart
- Toppings pairing grid (veg/non-veg labels)
- Empty states: no matches, no items, store closed

**PizzaBuilder** (`pizza-builder.tsx`, ~389 lines)
- Base pizza dropdown
- Size radio buttons (S/M/L) with prices
- Extras checkboxes with size-aware pricing
- Quantity stepper
- Notes textarea
- Live price summary card
- Add-to-cart with ordering-paused awareness

**CartCheckout** (`cart-checkout.tsx`, ~768 lines)
- Cart item list with remove buttons and size counts
- Customer name + phone fields
- Fulfillment toggle (delivery/pickup)
- **Delivery location flow**: geolocation request -> confirm pin -> optional manual address fallback
- **Scheduling**: Required when `after_hours` mode; time picker within opening window
- **Order submission**: Validates -> calls `createWhatsAppOrder` server action -> shows QR handoff or mobile deep link
- **Post-checkout**: Order number, QR code, "Open on PC" link, "View status" link

**CartProvider** (`cart-provider.tsx`)
- React Context for client-side cart state
- Add/remove items, quantity management
- Persists across page navigations

### Storefront Server Actions (`actions.ts`)

**`createWhatsAppOrder`**:
1. Validates input with Zod schema (customer name, phone, items, fulfillment type, address, schedule, location)
2. Fetches `store_name`, `whatsapp_number`, and all cart label configs from `site_config`
3. Checks store availability (open/after-hours/closed/maintenance)
4. Generates sequential order number
5. Inserts order + order_items into Supabase
6. Builds formatted WhatsApp message text
7. Returns `{ orderNumber, whatsappUrl }` for client handoff

### Storefront Catalog Helpers (`lib/catalog.ts`, ~711 lines)

~70 pure functions that extract typed values from the bundle config map:
- **Config readers**: `getConfigValue`, `getConfigBoolean`, `getConfigImageValue`, `getStructuredContent`
- **Store identity**: `getStoreName`, `getSiteMetaTitle`, `getSiteMetaDescription`, `getThemeColor`
- **Navigation**: `getNavLinks` (JSON-parsed), `getShellCopy`
- **Images**: `getHomeFeaturedImageUrl`, `getMenuHeroImageUrl`, `getCartHeroImageUrl`, `getBuilderHeroImageUrl`
- **Store state**: `getStorefrontState` (returns mode, tone, labels, actions), `isOrderingPaused`
- **Pricing**: `getPizzaPrice`, `getExtraPrice`, `getAddonPrice`, `getDessertPrice`, `getLinePrice`
- **Page copy**: `getMenuBrowserCopy`, `getPizzaBuilderCopy`, `getCartCheckoutCopy`, `getMenuItemDetailCopy`

### Store Hours Logic (`lib/store-hours.ts`)

- Reads `store_timezone` (default: `Asia/Kolkata`), `opening_time`, `closing_time`, `is_open`, `site_maintenance_mode`
- Returns `StoreAvailability` with mode: `open` | `after_hours` | `closed` | `maintenance`
- Cross-midnight windows are handled (e.g., 18:00-02:00)
- Used by `getStorefrontState()` to determine UI state across all pages

---

## Supabase Migrations

Located at `apps/admin/supabase/migrations/`. Applied sequentially:

| File | Purpose |
|---|---|
| `202603200001_staff_and_dashboard_flags.sql` | Creates `staff_members` table, seeds 4 default staff, adds `dashboard_live_mode` config |
| `202603200002_menu_images_storage.sql` | Creates `menu` storage bucket (public), sets RLS policies for authenticated CRUD |
| `202603220001_add_is_public_to_site_config.sql` | Adds `is_public` boolean column to `site_config` |
| `202603220002_allow_json_site_config_type.sql` | Expands `site_config.type` check constraint to include `json` |
| `202603220003_seed_storefront_copy_defaults.sql` | Seeds ~300+ config keys for all storefront pages (home, menu, builder, cart, about, contact, delivery, FAQ, status, etc.) |
| `202603220004_seed_order_handoff_settings.sql` | Seeds WhatsApp message template labels and checkout error messages |
| `202603220005_seed_legacy_and_prefill_settings.sql` | Seeds legacy hero bg, delivery radius, contact/delivery prefill messages |
| `202603220006_remove_stale_logo_url.sql` | Removes empty `logo_url` config row |
| `202603220007_add_order_scheduling_and_location_fields.sql` | Adds `fulfillment_type`, `scheduled_for`, `delivery_location_*` columns to `orders` table with constraints |
| `202603220008_seed_scheduling_and_location_settings.sql` | Seeds ~40+ config keys for scheduling UI, geolocation flow, and after-hours labels |

All seed migrations use `ON CONFLICT (key) DO UPDATE` for idempotency.

---

## Availability and Store State Logic

The storefront derives its live state from Supabase settings and the current server time:

| Condition | Mode | Ordering | Schedule Required |
|---|---|---|---|
| `site_maintenance_mode = true` | `maintenance` | Blocked | No |
| `is_open = false` | `closed` | Blocked | No |
| `is_open = true` but current time outside opening window | `after_hours` | Allowed | Yes |
| `is_open = true` and current time inside opening window | `open` | Allowed | No |

Each mode maps to a `StorefrontState` object with: tone (success/warning/danger), label, summary, primaryAction, secondaryAction, orderingEnabled, requiresScheduledTime.

---

## Order Flow

1. **Browse**: Customer views menu items, filters, searches
2. **Build**: Optionally uses pizza builder for custom orders
3. **Cart**: Items accumulated via `CartProvider` context
4. **Checkout**:
   - Enter customer name + phone
   - Select delivery or pickup
   - If delivery: share GPS pin or type address
   - If after-hours: select scheduled time within opening window
   - Submit order
5. **Server action** (`createWhatsAppOrder`):
   - Zod validation
   - Check store availability
   - Generate order number
   - Insert `orders` + `order_items` to Supabase
   - Build WhatsApp message text with all order details
   - Return `{ orderNumber, whatsappUrl }`
6. **Handoff**:
   - Mobile: direct WhatsApp deep link
   - Desktop: QR code + "Open on PC" link
7. **Kitchen**: Order appears in admin Kanban board via realtime subscription

---

## Configuration System

The `site_config` table is the heart of the storefront's dynamic content system.

### Config Types

| Type | Editor Widget | Example Keys |
|---|---|---|
| `text` | Single-line input | `hero_title`, `brand_tagline` |
| `textarea` | Multi-line input | `hero_subtitle`, `footer_copy` |
| `url` | URL input | `google_maps_link` |
| `image` | File upload + URL input | `brand_logo_image_url`, `home_feature_image_url` |
| `boolean` | Toggle switch | `is_open`, `site_maintenance_mode`, `dashboard_live_mode` |
| `number` | Number input | `min_order_amount`, `delivery_radius_km` |
| `time` | Time input | `opening_time`, `closing_time` |
| `json` | JSON editor | `nav_links`, `faq_items`, `privacy_sections`, `terms_sections` |

### Config Key Naming Convention

Keys are namespaced by page/component prefix:
- `home_*` - Homepage sections
- `menu_*` - Menu page, cards, hero, filters, detail
- `builder_*` / `build_*` - Pizza builder
- `cart_*` - Cart, checkout, handoff, WhatsApp message
- `about_*`, `contact_*`, `delivery_*`, `faq_*`, `status_*` - Informational pages
- `storefront_*` - Global storefront state labels
- `shell_*` - Navigation shell labels
- `home_step_*` - Homepage intro cards
- `home_signature_*` - Homepage featured picks
- `home_closing_*` - Homepage closing banner

### Image Upload Flow

1. Admin selects file in `MenuImageField` component
2. File sent to `uploadStorefrontAsset` server action
3. Server validates type (image/*) and size (<16 MB)
4. Uploaded to `brand-assets` bucket in Supabase Storage
5. Public URL returned and saved to `site_config`

---

## Deployment

### Vercel (Two Projects)

| Project | Root Directory | App |
|---|---|---|
| Admin | `apps/admin` | Dashboard + CMS |
| Storefront | `apps/storefront` | Customer site |

### GitHub Actions

Production and preview deployments managed by `.github/workflows/vercel-deploy.yml`.

### Required Secrets

| Secret | Purpose |
|---|---|
| `VERCEL_TOKEN` | Vercel API token |
| `VERCEL_ORG_ID` | Vercel organization |
| `VERCEL_ADMIN_PROJECT_ID` | Admin project ID |
| `VERCEL_STOREFRONT_PROJECT_ID` | Storefront project ID |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server only) |
| `ADMIN_EMAIL` | Admin auto-login email |
| `NEXT_PUBLIC_ENABLE_AUTO_LOGIN` | Dev auto-login flag |

Vercel environment variables must mirror these for both projects.

---

## Testing

### Admin Unit Tests

The admin app uses **Vitest** + **Testing Library** + **MSW** (Mock Service Worker).

Test files found:
- `components/admin/InlineExtraPrice.test.tsx`
- `components/admin/Modal.test.tsx`
- `components/admin/ToggleSoldOut.test.tsx`

Run tests:

```bash
npm run test --workspace apps/admin
npm run test:watch --workspace apps/admin
npm run test:coverage --workspace apps/admin
```

### Build Verification

```bash
npm run build --workspace apps/admin
npm run build --workspace apps/storefront
npm run lint --workspace apps/admin
npm run lint --workspace apps/storefront
```

### Type Checking

```bash
npx tsc --noEmit -p apps/admin/tsconfig.json
npx tsc --noEmit -p apps/storefront/tsconfig.json
```

---

## Coding Practices

- **TypeScript everywhere** for app logic and shared helpers.
- **Supabase-backed values** over hardcoded copy for customer-visible content.
- **Shared logic** goes in `packages/core` or app-local lib helpers.
- **Server actions** for privileged writes (storage uploads, admin saves, order creation).
- **Zod validation** on both client and server boundaries.
- **Realtime subscriptions** for live updates in admin (orders, settings).
- **`revalidatePath` / `revalidateTag`** after every mutation for cache consistency.
- **Framer Motion** for page transitions, card hover effects, and ambient animations.
- **Content-first layout**: Primary content (menu grid, builder form, cart) always above utility cards.
- **`force-dynamic`** on all pages to ensure live data on every request.
- All config value reads use `getConfigValue(config, key, fallback)` pattern for safe defaults.

---

## Known Quirks and Gotchas

- Build logs may show `no-img-element` warnings from Next.js (warnings, not failures).
- Vercel deployment issues can stem from project root path mismatches between dashboard and CLI.
- Manual order buttons should not send an empty cart to checkout.
- Storefront text is only as dynamic as the admin config keys that exist. Missing keys fall back silently.
- Image uploads depend on the storage bucket and server action path being healthy.
- Geolocation may fail on devices that deny permission. The cart keeps a manual address fallback.
- The top logo assumes square artwork. It should not stretch, crop, or overflow.
- The top bar only needs the open/closed badge, not a duplicate status card.
- Cross-midnight opening windows (e.g., 18:00-02:00) are handled by `store-hours.ts`.
- JSON config values (nav_links, faq_items, privacy/terms sections) must be valid JSON arrays of `{title, body}` objects.
- System categories (`veg-pizzas`, `non-veg-pizzas`, `addons`, `desserts`) are protected from deletion.
- Protected config keys (`is_open`, `site_maintenance_mode`) cannot be deleted from the settings page.

---

## Editing Checklist

Before changing shared behavior, verify:

1. Is this data already in Supabase `site_config`?
2. Does the admin expose a user-friendly editor for it?
3. Does the storefront consume the same field via `getConfigValue`?
4. Does the order flow still behave correctly on mobile and desktop?
5. Does the layout still keep content before utility cards?
6. Are all migrations idempotent (using `ON CONFLICT` or `IF NOT EXISTS`)?
7. Have you run lint and build for both workspaces?
8. Have you run `npm run verify:invariants` to catch stale aliases and bucket drift?

If the answer to any of those is no, the change is probably incomplete.

### Invariant Checks

Run this before merging changes that touch settings, uploads, or storefront copy:

```bash
npm run verify:invariants
```

It currently checks:

- `brand-assets` and `menu` remain the only supported upload buckets
- branding uploads stay on `brand-assets`
- menu item image uploads stay on `menu`
- the storefront no longer falls back to stale `logo_url`
- the image upload helper only accepts the intended buckets

### Image Generation Prototype

The admin app includes a one-item image generation script for menu assets:

```bash
npm run generate:image --workspace apps/admin -- --type pizza --slug margarita --dry-run
```

Paste your Hugging Face token into `HF_TOKEN` at the top of the script, then remove `--dry-run` to generate and upload the asset. The script writes prompts and generated files to `apps/admin/tmp/generated-images/`, which is ignored by git.

---

## Development Journey

A comprehensive technical document covering the complete development process — every file, every line of code that required learning, every architectural decision, and every library choice — is available in [`work-done.md`](./work-done.md). It is written from the perspective of a Computer Science graduate student building a full-stack React+TypeScript application for the first time, including the rationale for rebuilding from an earlier React+JS attempt.

**Topics covered in `work-done.md`:**
- Monorepo scaffolding and npm workspaces setup
- Next.js 15 App Router with React Server Components and Server Actions
- Supabase PostgreSQL schema design and 10 sequential SQL migrations
- TypeScript type system design and Zod validation schemas
- Four-client Supabase architecture (service-role, SSR, browser, mock fallback)
- Admin dashboard: layout, overview metrics, MenuStudio, KanbanBoard with DnD and realtime, SettingsClient with realtime sync
- Storefront data layer: StorefrontBundle, 70+ catalog helpers, timezone-aware store hours engine, WhatsApp message builder
- Storefront components: shell with ambient animations, cart provider with localStorage persistence, all 12+ pages
- Order processing pipeline: Zod validation, availability checks, scheduled time resolution, Supabase insertion, WhatsApp URL generation
- CI/CD with GitHub Actions deploying two Vercel projects via matrix strategy
- Complete file inventory and cost breakdown ($0/month)
