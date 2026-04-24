# Architecture

**Analysis Date:** 2026-04-23

## Pattern Overview

**Overall:** Monorepo with Shared Core and Next.js 15 App Router

**Key Characteristics:**
- **Layered Monorepo:** Logic shared between `apps/admin` and `apps/storefront` is housed in `packages/core`.
- **Server-First Mutations:** Uses Next.js Server Actions for all data modifications, ensuring security and high-privilege operations are kept on the server.
- **Supabase Integration:** Direct PostgreSQL and Auth interaction using Supabase SDKs, with specific clients for server, browser, and administrative contexts.

## Layers

**Application Layer:**
- Purpose: Entry points for users (Storefront and Admin).
- Location: `apps/admin` and `apps/storefront`
- Contains: Pages, layouts, UI components, and application-specific hooks.
- Depends on: `packages/core` (internal alias `@wkp/core`)
- Used by: End users (Storefront) and administrators (Admin).

**Shared Core Layer:**
- Purpose: Centralize business logic, API wrappers, and validation schemas.
- Location: `packages/core`
- Contains: API abstractions (`adminApi.ts`), Zustand stores (`useAdminCatalogStore.ts`), and Zod schemas (`validations.ts`).
- Depends on: Supabase SDK.
- Used by: Both `apps/admin` and `apps/storefront`.

**Infrastructure Layer:**
- Purpose: Managed services for persistence and authentication.
- Location: Supabase (Managed Service)
- Contains: PostgreSQL, Auth, and Storage.

## Data Flow

**Mutation Flow (Server Actions):**
1. **Trigger:** User interacts with a Client Component (e.g., submitting a form).
2. **Action:** Component invokes a Server Action (e.g., `createTopping` in `actions.ts`).
3. **Validation:** Action validates input using Zod schemas from `packages/core`.
4. **Execution:** Action performs DB operation using `supabaseAdmin` or `supabaseServer`.
5. **Revalidation:** Action calls `revalidatePath` or `revalidateTag` to update Next.js cache.
6. **Response:** UI updates based on action response (success/error).

**State Management:**
- **Server State:** Handled by Next.js Data Cache and revalidation.
- **Client State:** Managed via Zustand in `packages/core/useAdminCatalogStore.ts` for complex local UI states (e.g., Kanban boards, drag-and-drop catalog management).

## Key Abstractions

**Supabase Client Factory:**
- Purpose: Provides environment-specific Supabase clients.
- Examples: `apps/admin/src/lib/supabaseServer.ts` (Server actions/pages), `apps/admin/src/lib/supabaseBrowser.ts` (Client components).
- Pattern: Utility functions.

**Observability Wrapper:**
- Purpose: Standardizes error logging and performance tracking.
- Location: `apps/admin/src/lib/observability.ts`.
- Pattern: Higher-order functions for wrapping server actions.

## Entry Points

**Admin App:**
- Location: `apps/admin/src/app/page.tsx`
- Triggers: URL access to `/` or `/dashboard`.
- Responsibilities: Auth redirection, layout management for the dashboard.

**Storefront App:**
- Location: `apps/storefront/src/app/page.tsx`
- Triggers: Public domain access.
- Responsibilities: Public catalog rendering and order flow initiation.

## Error Handling

**Strategy:** Multi-tier fallback and explicit logging.

**Patterns:**
- **Boundary Handling:** `error.tsx` files at various route levels catch unhandled UI errors.
- **Explicit Catching:** Server actions use try-catch blocks to log errors via observability wrappers and return standardized error objects to the UI.

## Cross-Cutting Concerns

**Logging:** Pino-based logging integrated into observability wrappers.
**Validation:** Zod-based schema validation at the edge of every server action.
**Authentication:** Next.js Middleware (`middleware.ts`) and Supabase Auth Helpers handle session management and protected routes.

---

*Architecture analysis: 2026-04-23*
