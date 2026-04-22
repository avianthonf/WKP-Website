# Coding Conventions

**Analysis Date:** 2026-04-22

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
- Prettier: Configured (implied by `.prettierrc` mention in rules, though file not directly read, standard Next.js setup)
- Next.js 15 defaults

**Linting:**
- ESLint: Using `eslint-config-next` (v15.2.8)
- Configuration file: `apps/admin/eslint.config.mjs`

## Import Organization

**Order:**
1. React and framework imports (`react`, `next/navigation`, `next/cache`)
2. External libraries (`lucide-react`, `zod`, `zustand`)
3. Internal package imports (`@wkp/core`)
4. Local project imports using `@/` alias (`@/lib/...`, `@/types/...`, `@/components/...`)
5. Local relative imports (`./actions`, `./styles.css`)

**Path Aliases:**
- `@/`: Points to `src/` directory in each app (e.g., `@/lib/supabaseAdmin`)

## Error Handling

**Patterns:**
- Try-catch blocks in Server Actions: `try { ... } catch (error: any) { ... }`
- Explicit re-throwing: `throw new Error(error.message || 'Specific message')`
- Server-side logging: `console.error('Context:', error)`
- Boundary handling: `error.tsx` files in App Router for UI-level error catching

## Logging

**Framework:** `console` (standard for Next.js Server Actions and client-side debugging)

**Patterns:**
- Errors are logged with context in catch blocks
- No `console.log` in production-ready code (enforced by convention)

## Comments

**When to Comment:**
- Complexity: Explaining non-obvious logic (e.g., regex for slug generation)
- Metadata: `'use server'` or `'use client'` directives at top of files
- Sectioning: `// Mock the server actions` in tests

**JSDoc/TSDoc:**
- Used sparingly for complex utility functions, though TypeScript interfaces provide most documentation

## Function Design

**Size:**
- Server actions are focused and small (typically <30 lines)
- Client components vary but follow the pattern of extracting logic into separate files or sub-components

**Parameters:**
- Destructured props for React components
- Data objects for creation/update actions (e.g., `formData: ToppingFormData`)

**Return Values:**
- Standardized response envelope for actions: `{ success: true }` or `{ success: false, error: string }`

## Module Design

**Exports:**
- Named exports preferred for utilities and actions
- Default exports used for App Router special files (`page.tsx`, `layout.tsx`)

**Barrel Files:**
- `index.ts` used in `src/types/` to consolidate exports

---

*Convention analysis: 2026-04-22*
