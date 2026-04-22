# Architecture

**Analysis Date:** 2026-04-22

## Pattern Overview

**Overall:** Monorepo with Next.js 15 App Router (Full-stack TypeScript)

**Key Characteristics:**
- **Shared Core:** Common logic, types, and API clients reside in `packages/core`.
- **Server Actions:** Data mutations are handled via Next.js Server Actions for secure, high-privilege operations.
- **Client-Side State:** Uses Zustand for complex client state (e.g., catalog management in `packages/core/useAdminCatalogStore.ts`).
- **Supabase Integration:** Direct database and auth interaction using Supabase SDKs, split between client and server contexts.

## Layers

**Application Layer (Apps):**
- Purpose: Entry points for users (Storefront and Admin).
- Location: `apps/admin` and `apps/storefront`
- Contains: Pages, layouts, UI components, and application-specific hooks.
- Depends on: `packages/core`, `@wkp/core` (internal alias)
- Used by: End users and administrators.

**Shared Logic Layer (Packages):**
- Purpose: Centralize business logic and data access patterns.
- Location: `packages/core`
- Contains: API wrappers (`adminApi.ts`), shared stores (`useAdminCatalogStore.ts`), and validation schemas.
- Depends on: External SDKs (Supabase).
- Used by: Both `apps/admin` and `apps/storefront`.

**Infrastructure Layer (Supabase):**
- Purpose: Persistent storage, authentication, and file hosting.
- Location: Managed Service (Supabase)
- Contains: PostgreSQL database, Auth, and S3-compatible Storage.

## Data Flow

**Admin Dashboard Mutation Flow:**

1. User submits a form (e.g., `apps/admin/src/components/admin/PizzaForm.tsx`).
2. Server Action is invoked (e.g., `createPizza` in `apps/admin/src/app/dashboard/pizzas/actions.ts`).
3. Action validates input using Zod (`apps/admin/src/lib/validations.ts`).
4. Action interacts with Supabase using Service Role key (`apps/admin/src/lib/supabaseAdmin.ts`).
5. Next.js cache is invalidated via `revalidatePath` or `revalidateTag`.
6. UI reflects changes after server-side re-render.

**State Management:**
- **Server State:** Managed by Next.js cache and revalidation.
- **Client State:** Managed by Zustand in `packages/core/useAdminCatalogStore.ts` for real-time interactions and local UI state.

## Key Abstractions

**Supabase Client Factory:**
- Purpose: Provides typed Supabase clients for different environments (Server, Browser, Admin).
- Examples: `apps/admin/src/lib/supabaseServer.ts`, `apps/admin/src/lib/supabaseBrowser.ts`.
- Pattern: Factory/Utility functions.

**Server Actions:**
- Purpose: Encapsulates server-side side effects and database operations.
- Examples: `apps/admin/src/app/dashboard/pizzas/actions.ts`.
- Pattern: Command pattern via Next.js primitives.

## Entry Points

**Admin Entry:**
- Location: `apps/admin/src/app/page.tsx`
- Triggers: URL access to `/` or `/dashboard`.
- Responsibilities: Auth verification (via middleware), landing page rendering.

**Storefront Entry:**
- Location: `apps/storefront/src/app/page.tsx`
- Triggers: Customer access to root domain.
- Responsibilities: Catalog display and order initiation.

## Error Handling

**Strategy:** Comprehensive server-side catching with client-side error boundaries.

**Patterns:**
- **Try-Catch in Actions:** Standard catch blocks in server actions with explicit error throwing.
- **Next.js Error Files:** `error.tsx` files at various route segments (e.g., `apps/admin/src/app/dashboard/error.tsx`).

## Cross-Cutting Concerns

**Logging:** Primarily server-side console logging in actions; client-side console logging for debugging.
**Validation:** Shared Zod schemas in `apps/admin/src/lib/validations.ts` and `packages/core/validations.ts`.
**Authentication:** Supabase Auth integrated with Next.js Middleware (`apps/admin/src/middleware.ts`) for route protection.

---

*Architecture analysis: 2026-04-22*
