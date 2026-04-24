# Codebase Structure

**Analysis Date:** 2026-04-23

## Directory Layout

```
[project-root]/
├── apps/
│   ├── admin/          # Admin Dashboard (Next.js)
│   │   ├── src/
│   │   │   ├── app/     # App Router (Pages, Actions, Layouts)
│   │   │   ├── components/ # UI Components
│   │   │   ├── lib/     # Supabase clients, Observability
│   │   │   └── types/   # TypeScript interfaces
│   └── storefront/     # Customer App (Next.js)
│       └── src/
│           ├── app/     # App Router
│           └── lib/     # Utilities
├── packages/
│   └── core/           # Shared logic (@wkp/core)
│       ├── adminApi.ts  # Shared API wrappers
│       ├── validations.ts # Zod schemas
│       └── useAdminCatalogStore.ts # Zustand store
├── scripts/            # Build/Utility scripts
└── tests/              # Global/Shared tests
```

## Directory Purposes

**apps/admin/src/app:**
- Purpose: Main routing and logic for the Admin application.
- Contains: `page.tsx` (entry points), `actions.ts` (data mutations), `layout.tsx` (structural UI).
- Key files: `dashboard/` routes for various pizza catalog entities.

**packages/core:**
- Purpose: Shared source of truth for business logic and validation.
- Contains: Logic that must remain consistent across both applications.
- Key files: `validations.ts` (schema definitions).

**apps/admin/src/lib:**
- Purpose: Application-specific infrastructure utilities.
- Contains: Supabase client initializers and observability wrappers.

## Key File Locations

**Entry Points:**
- `apps/admin/src/app/page.tsx`: Admin login/dashboard redirect.
- `apps/storefront/src/app/page.tsx`: Customer landing page.

**Configuration:**
- `package.json`: Monorepo workspace configuration.
- `apps/admin/next.config.ts`: Admin build settings.

**Core Logic:**
- `packages/core/adminApi.ts`: Shared database interaction logic.

**Testing:**
- `apps/admin/vitest.config.ts`: Test runner configuration for admin.
- `apps/admin/src/app/dashboard/pizzas/error.test.tsx`: Example of route-level testing.

## Naming Conventions

**Files:**
- `actions.ts`: Always used for Next.js Server Actions.
- `[name]Client.tsx`: Used for components that explicitly use `'use client'`.
- `*.test.tsx`: Standard suffix for Vitest tests.

**Directories:**
- Route Groups: `(auth)`, `(dashboard)` (if present) for Next.js route organization.
- Dynamic Routes: `[id]`, `[slug]` for dynamic parameters.

## Where to Add New Code

**New Feature (Admin):**
- UI: `apps/admin/src/app/dashboard/[feature-name]/page.tsx`
- Actions: `apps/admin/src/app/dashboard/[feature-name]/actions.ts`
- Components: `apps/admin/src/components/[feature-name]/`

**New Feature (Shared):**
- Schema/Validation: `packages/core/validations.ts`
- Shared API: `packages/core/adminApi.ts`

**Utilities:**
- Shared: `packages/core/index.ts` (and exported from there)
- Admin-only: `apps/admin/src/lib/`

## Special Directories

**apps/admin/src/app/dashboard/[entity]/actions.ts:**
- Purpose: Contains all server-side mutations for a specific dashboard entity (pizzas, toppings, etc.).
- Generated: No
- Committed: Yes

---

*Structure analysis: 2026-04-23*
