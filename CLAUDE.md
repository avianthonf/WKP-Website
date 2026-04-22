<!-- GSD:project-start source:PROJECT.md -->
## Project

**WKP Bug Fix Initiative**

A systematic bug-hunting and quality improvement initiative for the WeKneadPizza (WKP) monorepo — covering both the customer-facing storefront and the admin dashboard. The goal is to identify, catalog, and fix hidden bugs, race conditions, edge cases, and reliability issues across the entire codebase.

**Core Value:** Every user interaction — whether a customer ordering pizza or an admin managing the menu — must work reliably without silent failures, stale state, or data corruption.

### Constraints

- **No breaking changes**: Fixes must not alter existing working behavior
- **Backward compatible**: All fixes must maintain API contract compatibility
- **Test coverage**: Every bug fix must include a regression test
- **Incremental**: Ship fixes in small, verifiable increments — not a big-bang rewrite
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- TypeScript 5.x - Used across the entire monorepo (`apps/admin`, `apps/storefront`, `packages/core`) for type safety.
- SQL - Database schema definitions in `cms-schema.sql` (referenced in CLAUDE.md).
## Runtime
- Node.js (Version >= 20.x inferred from `@types/node`)
- Next.js 15.2.8 (React 19)
- npm - Managed via root `package.json` with workspace support.
- Lockfile: `package-lock.json` present in root.
## Frameworks
- Next.js 15 (App Router) - Full-stack framework for both Admin and Storefront.
- React 19 - UI library.
- Vitest 2.0.5 - Unit and integration testing framework.
- React Testing Library - UI testing.
- MSW (Mock Service Worker) - API mocking in `apps/admin`.
- Tailwind CSS 4.x - Utility-first CSS framework.
- Vercel - Deployment platform (inferred from `vercel.json`).
## Key Dependencies
- Supabase (supabase-js, @supabase/ssr) - Primary backend-as-a-service (Auth, DB, Storage).
- Zustand 4.5.2 - State management (used in Admin).
- React Hook Form 7.51.0 - Form handling in Admin.
- Zod 3.x - Schema validation for forms and API responses.
- Framer Motion 12.x - Animation library for both apps.
- @dnd-kit - Drag and drop functionality in Admin.
- Lucide React - Icon library.
- React Hot Toast - Notifications in Admin dashboard.
## Configuration
- Managed via `.env.local` files (not committed).
- Critical variables include `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
- `next.config.ts`: Next.js configuration.
- `tsconfig.json`: TypeScript configuration.
- `eslint.config.mjs`: Linting rules.
- `vitest.config.ts`: Test runner configuration.
## Platform Requirements
- Node.js environment with npm.
- Supabase project for database and auth.
- Vercel (likely deployment target).
- Supabase (Production tier).
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Naming Patterns
- React components: PascalCase (e.g., `ToppingsClient.tsx`, `KanbanBoard.tsx`)
- App Router pages/actions: kebab-case/specific names (e.g., `page.tsx`, `actions.ts`, `layout.tsx`)
- Utilities/Libraries: kebab-case (e.g., `supabaseAdmin.ts`, `validations.ts`)
- Tests: `.test.tsx` or `.test.ts` suffix (e.g., `ToppingsClient.test.tsx`)
- React components: PascalCase (e.g., `export function ToppingsClient(...)`)
- Server Actions: camelCase (e.g., `export async function createTopping(...)`)
- Utilities: camelCase (e.g., `export function getErrorMessage(...)`)
- General: camelCase (e.g., `const validated = ...`)
- Constants: UPPER_SNAKE_CASE for truly static values, camelCase for local constants
- Schemas: camelCase with 'Schema' suffix (e.g., `toppingSchema`)
- Interfaces: PascalCase (e.g., `interface Topping`)
- Type aliases: PascalCase (e.g., `type ToppingFormData`)
- Enum-like unions: PascalCase (e.g., `type ToppingCategory`)
## Code Style
- Prettier: Configured (implied by `.prettierrc` mention in rules, though file not directly read, standard Next.js setup)
- Next.js 15 defaults
- ESLint: Using `eslint-config-next` (v15.2.8)
- Configuration file: `apps/admin/eslint.config.mjs`
## Import Organization
- `@/`: Points to `src/` directory in each app (e.g., `@/lib/supabaseAdmin`)
## Error Handling
- Try-catch blocks in Server Actions: `try { ... } catch (error: any) { ... }`
- Explicit re-throwing: `throw new Error(error.message || 'Specific message')`
- Server-side logging: `console.error('Context:', error)`
- Boundary handling: `error.tsx` files in App Router for UI-level error catching
## Logging
- Errors are logged with context in catch blocks
- No `console.log` in production-ready code (enforced by convention)
## Comments
- Complexity: Explaining non-obvious logic (e.g., regex for slug generation)
- Metadata: `'use server'` or `'use client'` directives at top of files
- Sectioning: `// Mock the server actions` in tests
- Used sparingly for complex utility functions, though TypeScript interfaces provide most documentation
## Function Design
- Server actions are focused and small (typically <30 lines)
- Client components vary but follow the pattern of extracting logic into separate files or sub-components
- Destructured props for React components
- Data objects for creation/update actions (e.g., `formData: ToppingFormData`)
- Standardized response envelope for actions: `{ success: true }` or `{ success: false, error: string }`
## Module Design
- Named exports preferred for utilities and actions
- Default exports used for App Router special files (`page.tsx`, `layout.tsx`)
- `index.ts` used in `src/types/` to consolidate exports
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## Pattern Overview
- **Shared Core:** Common logic, types, and API clients reside in `packages/core`.
- **Server Actions:** Data mutations are handled via Next.js Server Actions for secure, high-privilege operations.
- **Client-Side State:** Uses Zustand for complex client state (e.g., catalog management in `packages/core/useAdminCatalogStore.ts`).
- **Supabase Integration:** Direct database and auth interaction using Supabase SDKs, split between client and server contexts.
## Layers
- Purpose: Entry points for users (Storefront and Admin).
- Location: `apps/admin` and `apps/storefront`
- Contains: Pages, layouts, UI components, and application-specific hooks.
- Depends on: `packages/core`, `@wkp/core` (internal alias)
- Used by: End users and administrators.
- Purpose: Centralize business logic and data access patterns.
- Location: `packages/core`
- Contains: API wrappers (`adminApi.ts`), shared stores (`useAdminCatalogStore.ts`), and validation schemas.
- Depends on: External SDKs (Supabase).
- Used by: Both `apps/admin` and `apps/storefront`.
- Purpose: Persistent storage, authentication, and file hosting.
- Location: Managed Service (Supabase)
- Contains: PostgreSQL database, Auth, and S3-compatible Storage.
## Data Flow
- **Server State:** Managed by Next.js cache and revalidation.
- **Client State:** Managed by Zustand in `packages/core/useAdminCatalogStore.ts` for real-time interactions and local UI state.
## Key Abstractions
- Purpose: Provides typed Supabase clients for different environments (Server, Browser, Admin).
- Examples: `apps/admin/src/lib/supabaseServer.ts`, `apps/admin/src/lib/supabaseBrowser.ts`.
- Pattern: Factory/Utility functions.
- Purpose: Encapsulates server-side side effects and database operations.
- Examples: `apps/admin/src/app/dashboard/pizzas/actions.ts`.
- Pattern: Command pattern via Next.js primitives.
## Entry Points
- Location: `apps/admin/src/app/page.tsx`
- Triggers: URL access to `/` or `/dashboard`.
- Responsibilities: Auth verification (via middleware), landing page rendering.
- Location: `apps/storefront/src/app/page.tsx`
- Triggers: Customer access to root domain.
- Responsibilities: Catalog display and order initiation.
## Error Handling
- **Try-Catch in Actions:** Standard catch blocks in server actions with explicit error throwing.
- **Next.js Error Files:** `error.tsx` files at various route segments (e.g., `apps/admin/src/app/dashboard/error.tsx`).
## Cross-Cutting Concerns
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, or `.github/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
