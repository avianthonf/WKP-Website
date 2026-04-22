# Codebase Structure

**Analysis Date:** 2026-04-22

## Directory Layout

```
storefront/
├── app/                # Next.js App Router (Main logic)
│   ├── about/          # Static content page
│   ├── build/          # Custom pizza builder page
│   ├── cart/           # Shopping cart and checkout
│   ├── components/     # UI Components (Shell, Providers, Widgets)
│   ├── home/           # Immersive landing page
│   ├── lib/            # Utilities, Types, and Fetching logic
│   ├── menu/           # Dynamic menu browsing
│   └── layout.tsx      # Root layout and context providers
├── public/             # Static assets (images, fonts)
├── src/                # Mirrored directory (re-exports app/)
│   └── app/            # Legacy or compatibility mirror
├── eslint.config.mjs   # Linting configuration
├── next.config.ts      # Next.js configuration
├── package.json        # Dependencies and scripts
└── vitest.config.ts    # Test configuration
```

## Directory Purposes

**app/:**
- Purpose: Core application logic using Next.js App Router.
- Contains: Page routes, shared components, and library code.
- Key files: `layout.tsx`, `page.tsx`.

**app/components/:**
- Purpose: Reusable React components.
- Contains: Both "use client" and server components.
- Key files: `storefront-shell.tsx`, `cart-provider.tsx`.

**app/lib/:**
- Purpose: Infrastructure and business logic.
- Contains: API clients, types, and helper functions.
- Key files: `storefront.ts` (fetchers), `catalog.ts` (getters), `types.ts`.

**src/:**
- Purpose: Mirroring structure.
- Contains: Re-exports from the root `app/` directory. This is an unusual pattern likely used for monorepo tool compatibility or migration.

## Key File Locations

**Entry Points:**
- `app/layout.tsx`: Global wrapper.
- `app/home/page.tsx`: Primary landing experience.

**Configuration:**
- `next.config.ts`: Next.js settings.
- `app/lib/env.ts`: Environment variable validation.

**Core Logic:**
- `app/lib/storefront.ts`: Data aggregation and fetching.
- `app/lib/catalog.ts`: Business logic and data transformation.

**Testing:**
- `app/lib/catalog.test.ts`: Logic tests.
- `vitest.config.ts`: Vitest setup.

## Naming Conventions

**Files:**
- Components: `kebab-case.tsx` (e.g., `cart-checkout.tsx`)
- Utilities: `kebab-case.ts` (e.g., `store-hours.ts`)
- Route Pages: `page.tsx` (Next.js standard)

**Directories:**
- Routes: `kebab-case` (e.g., `about/`, `faq/`)
- Support: `kebab-case` (e.g., `components/`, `lib/`)

## Where to Add New Code

**New Feature:**
- Primary page: Create a new directory in `app/` with `page.tsx`.
- Component logic: `app/components/`
- Data requirements: Update `StorefrontBundle` in `app/lib/types.ts` and fetcher in `app/lib/storefront.ts`.

**New Component/Module:**
- Implementation: `app/components/`
- Styling: Tailwind classes within components or `app/globals.css`.

**Utilities:**
- Shared helpers: `app/lib/`

## Special Directories

**app/lib/ types:**
- Purpose: TypeScript definitions for the entire storefront.
- Generated: No (Manual).
- Committed: Yes.

---

*Structure analysis: 2026-04-22*
