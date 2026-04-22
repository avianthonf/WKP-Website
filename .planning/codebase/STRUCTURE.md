# Codebase Structure

**Analysis Date:** 2026-04-22

## Directory Layout

```
[project-root]/
├── apps/               # Application-specific code
│   ├── admin/          # Admin Dashboard (Next.js)
│   └── storefront/     # Customer Storefront (Next.js)
├── packages/           # Shared monorepo packages
│   └── core/           # Shared business logic and API clients
├── scripts/            # Build and utility scripts
├── .planning/          # GSD planning and analysis documents
└── package.json        # Monorepo root configuration
```

## Directory Purposes

**apps/admin:**
- Purpose: Management dashboard for inventory, orders, and configuration.
- Contains: Next.js App Router structure, admin-specific components.
- Key files: `apps/admin/src/middleware.ts` (Auth gating), `apps/admin/next.config.ts`.

**apps/storefront:**
- Purpose: Customer-facing pizza ordering platform.
- Contains: Customer flows, menu display, checkout logic.

**packages/core:**
- Purpose: Shared logic to prevent duplication between apps.
- Contains: API abstractions, shared state (Zustand), validation schemas.
- Key files: `packages/core/adminApi.ts`, `packages/core/useAdminCatalogStore.ts`.

## Key File Locations

**Entry Points:**
- `apps/admin/src/app/page.tsx`: Admin landing page.
- `apps/storefront/src/app/page.tsx`: Storefront landing page.

**Configuration:**
- `apps/admin/src/lib/supabaseClient.ts`: Supabase initialization.
- `apps/admin/src/lib/validations.ts`: Admin form validation schemas.

**Core Logic:**
- `apps/admin/src/app/dashboard/[feature]/actions.ts`: Feature-specific server side logic.
- `packages/core/adminApi.ts`: Shared API interaction layer.

**Testing:**
- `apps/admin/test/`: General test directory.
- `apps/admin/src/components/admin/*.test.tsx`: Component-level unit tests.

## Naming Conventions

**Files:**
- Components: PascalCase (`PizzaForm.tsx`).
- Server Actions: `actions.ts`.
- Tests: `[name].test.ts` or `[name].test.tsx`.
- Clients: `[feature]Client.tsx` for client-side components.

**Directories:**
- App Router segments: Lowercase/kebab-case (`dashboard/pizzas`).

## Where to Add New Code

**New Feature:**
- Primary code: Create a new directory in `apps/admin/src/app/dashboard/[feature]`.
- Tests: Co-located `.test.tsx` or in `apps/admin/test`.

**New Component/Module:**
- Implementation: `apps/admin/src/components/admin` (if admin-only) or `packages/core` (if shared).

**Utilities:**
- Shared helpers: `packages/core/index.ts` or specific module in `packages/core`.

## Special Directories

**apps/admin/supabase:**
- Purpose: Database migrations and seed scripts.
- Generated: No
- Committed: Yes

---

*Structure analysis: 2026-04-22*
