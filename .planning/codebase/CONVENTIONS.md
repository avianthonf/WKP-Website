# Coding Conventions

**Analysis Date:** 2026-04-23

## Naming Patterns

**Files:**
- React components: PascalCase (e.g., `ToppingsClient.tsx`, `KanbanBoard.tsx`)
- App Router pages/actions: kebab-case/specific names (e.g., `page.tsx`, `actions.ts`, `layout.tsx`)
- Utilities/Libraries: kebab-case (e.g., `supabaseAdmin.ts`, `validations.ts`)
- Tests: `.test.tsx` or `.test.ts` suffix (e.g., `ToppingsClient.test.tsx`)

**Functions:**
- React components: PascalCase (e.g., `export function ToppingsClient(...)`)
- Server Actions: camelCase (e.g., `export async function createTopping(...)`)
- Utilities: camelCase (e.g., `export function getErrorMessage(...)`)

**Variables:**
- General: camelCase (e.g., `const validated = ...`)
- Constants: UPPER_SNAKE_CASE for truly static values, camelCase for local constants
- Schemas: camelCase with 'Schema' suffix (e.g., `toppingSchema`)

**Types:**
- Interfaces: PascalCase (e.g., `interface Topping`)
- Type aliases: PascalCase (e.g., `type ToppingFormData`)
- Enum-like unions: PascalCase (e.g., `type ToppingCategory`)

## Code Style

**Formatting:**
- Prettier: Configured for all JS/TS files (enforced by project rules).
- Next.js 15 defaults and React 19 patterns.

**Linting:**
- ESLint: Using `eslint-config-next` (v15.2.8).
- Configuration found in `apps/admin/eslint.config.mjs` and `apps/storefront/eslint.config.mjs`.

## Import Organization

**Order:**
1. React and framework imports (`react`, `next/navigation`, `next/cache`)
2. External libraries (`lucide-react`, `zod`, `zustand`, `@sentry/nextjs`, `pino`)
3. Internal package imports (`@wkp/core`)
4. Local project imports using `@/` alias (`@/lib/...`, `@/types/...`, `@/components/...`)
5. Local relative imports (`./actions`, `./styles.css`)

**Path Aliases:**
- `@/`: Points to `src/` directory in each app (e.g., `apps/admin/src/`)
- `@wkp/core`: Points to the shared core package in `packages/core`

## Error Handling

**Patterns:**
- **Server Actions:** Wrapped in `withObservedAction` (found in `apps/admin/src/lib/observability.ts`) which provides instrumentation via Sentry and structured logging via Pino.
- **Try-Catch Blocks:** Used within actions and utilities to handle database and validation errors.
- **Validation:** Zod is used for schema-based validation at system boundaries (forms and API responses).
- **UI Boundaries:** Next.js `error.tsx` files handle runtime errors at the route segment level.

## Logging

**Framework:** `pino` for structured logging, with `pino-pretty` in development.

**Patterns:**
- Errors are logged with context in catch blocks using `logger.error`.
- Sensitive data (emails, phone numbers) are automatically redacted in logs via `sanitizeErrorMessage` in `apps/admin/src/lib/observability.ts`.
- No `console.log` in production-ready code.

## Comments

**When to Comment:**
- Complexity: Explaining non-obvious logic (e.g., regex for slug generation).
- Metadata: `'use server'` or `'use client'` directives at top of files.
- Sectioning: `// Mock the server actions` in tests.

**JSDoc/TSDoc:**
- Used sparingly for complex utility functions, though TypeScript interfaces provide most documentation.

## Function Design

**Size:**
- Server actions are focused and small (typically <30 lines).
- Client components vary but follow the pattern of extracting logic into separate files or sub-components.

**Parameters:**
- Destructured props for React components.
- Data objects for creation/update actions (e.g., `formData: ToppingFormData`).

**Return Values:**
- Standardized response envelope for actions: `{ success: true }` or `{ success: false, error: string }`.

## Module Design

**Exports:**
- Named exports preferred for utilities and actions.
- Default exports used for App Router special files (`page.tsx`, `layout.tsx`).

**Barrel Files:**
- `index.ts` used in `src/types/` and `packages/core/` to consolidate exports.

---

*Convention analysis: 2026-04-23*
