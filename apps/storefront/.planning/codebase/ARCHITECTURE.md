# Architecture

**Analysis Date:** 2026-04-22

## Pattern Overview

**Overall:** editorial E-commerce Storefront (Next.js 15 App Router)

**Key Characteristics:**
- **Dynamic Content Bundle:** Fetches a single large content bundle (`StorefrontBundle`) from Supabase to power the entire page and minimize round trips.
- **Client-Side Cart Management:** Uses React Context (`CartProvider`) for persistent shopping cart state across navigation.
- **Immersive UX:** Heavy use of Framer Motion for page transitions, ambient animations (orbs), and drawer interactions.
- **Feature Flagged/Config Driven:** Store status (open/closed), maintenance mode, and nearly all text content are controlled via Supabase `site_config`.

## Layers

**UI Layer (React Components):**
- Purpose: Render the interactive storefront experience.
- Location: `app/components/`
- Contains: `storefront-shell.tsx`, `immersive-home.tsx`, `cart-provider.tsx`, `pizza-builder.tsx`.
- Depends on: `app/lib/storefront.ts`, `app/lib/catalog.ts`, `@wkp/core`.
- Used by: `app/[route]/page.tsx`.

**Logic/Utility Layer:**
- Purpose: Provide data fetching, transformation, and business logic.
- Location: `app/lib/`
- Contains: `storefront.ts` (fetching), `catalog.ts` (getters/transformations), `supabase.ts` (client setup).
- Depends on: Supabase, environment variables.
- Used by: UI Layer and Route Handlers.

**Data Layer (Supabase):**
- Purpose: Source of truth for menu, configuration, and orders.
- Location: Remote (Supabase)
- Contains: Categories, Pizzas, Toppings, Site Config, Notifications.
- Used by: `app/lib/storefront.ts`.

## Data Flow

**Content Fetching Flow:**

1. `app/layout.tsx` or `app/[route]/page.tsx` calls `fetchStorefrontBundle()`.
2. `fetchStorefrontBundle` executes parallel Supabase queries for all required CMS data.
3. Data is aggregated into a `StorefrontBundle` object with added state like `isOpen`.
4. Bundle is passed down to `StorefrontShell` and specific page components.

**Cart Flow:**

1. User interacts with `pizza-builder.tsx` or `menu-browser.tsx`.
2. `useCart()` hook provides actions to modify local state.
3. `CartProvider` persists state (likely in localStorage, though implementation needs verification).
4. `StorefrontShell` updates cart count and FAB (Floating Action Button) visibility.

**State Management:**
- **Server State:** Managed via Next.js cache and `fetchStorefrontBundle`.
- **Client State:** Managed via `CartProvider` (React Context) for shopping cart.

## Key Abstractions

**StorefrontBundle:**
- Purpose: A unified object containing all data needed to render any part of the storefront.
- Examples: `app/lib/types.ts`
- Pattern: Bundle/Aggregator.

**Catalog Helpers:**
- Purpose: Functional getters that extract specific values from the config-heavy bundle, providing fallbacks and formatting.
- Examples: `app/lib/catalog.ts`
- Pattern: Utility/Transform.

## Entry Points

**Root Layout:**
- Location: `app/layout.tsx`
- Triggers: Initial app load.
- Responsibilities: Setting up fonts, metadata, cart context, and global HTML structure.

**Main Page Redirect:**
- Location: `app/page.tsx`
- Triggers: Accessing `/`.
- Responsibilities: Redirects users to `/home`.

**Edge Middleware (implied):**
- Location: Root (usually `middleware.ts`, though not explicitly seen in root list, Next.js 15 uses it for security headers).
- Responsibilities: CSP, HSTS, and Security headers.

## Error Handling

**Strategy:** Graceful fallbacks and runtime validation.

**Patterns:**
- **Fallback Bundle:** `fallbackBundle` in `storefront.ts` ensures the app doesn't crash if Supabase is unreachable or misconfigured.
- **Environment Validation:** `app/lib/env.ts` validates critical variables at runtime.
- **CMS Fallbacks:** Catalog helpers provide hardcoded defaults if CMS keys are missing.

## Cross-Cutting Concerns

**Logging:** Handled via custom utility in `lib/` (standardizing on `logger` pattern from global rules).
**Validation:** Zod is used for environment and (likely) order validation (`app/lib/env.ts`).
**Authentication:** Storefront is mostly public; admin operations use `SUPABASE_SERVICE_ROLE_KEY` securely on the server.

---

*Architecture analysis: 2026-04-22*
