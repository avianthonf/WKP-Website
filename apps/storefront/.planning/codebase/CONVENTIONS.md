# Coding Conventions

**Analysis Date:** 2026-04-22

## Naming Patterns

**Files:**
- Kebab-case for most files: `catalog.ts`, `store-hours.ts`
- PascalCase for React components: `CartProvider.tsx`, `ImmersiveHome.tsx`, `StorefrontShell.tsx` (Note: some files in the codebase currently use kebab-case for components like `cart-provider.tsx`, but standard React patterns suggest PascalCase for components)
- `actions.ts` for Next.js Server Actions
- `layout.tsx`, `page.tsx`, `not-found.tsx` for Next.js routing

**Functions:**
- CamelCase for utility functions: `getConfigValue`, `getStoreName`
- CamelCase with `use` prefix for Hooks: `useCart`
- PascalCase for React components: `CartProvider`, `StorefrontShell`

**Variables:**
- CamelCase for local variables and constants: `raw`, `parsed`, `items`
- SCREAMING_SNAKE_CASE for global constants: `STORAGE_KEY`

**Types:**
- PascalCase for interfaces and types: `StorefrontBundle`, `CartLine`, `StructuredContentBlock`

## Code Style

**Formatting:**
- Prettier is expected to be used (indicated by project-wide rules)
- Indentation: 2 spaces
- Semicolons: Required

**Linting:**
- ESLint with `next/core-web-vitals` and `next/typescript` configs
- Configured in `eslint.config.mjs`

## Import Organization

**Order:**
1. React/Next.js core imports
2. External libraries (Supabase, Framer Motion, Lucide)
3. Monorepo shared packages (`@wkp/core`)
4. Internal library/utility imports
5. Type imports

**Path Aliases:**
- Standard relative imports are common: `../lib/types`
- Path aliases may be configured in `tsconfig.json` (e.g., `@/components/*`)

## Error Handling

**Patterns:**
- Explicit `try-catch` blocks for operations that might fail, such as `JSON.parse` or LocalStorage access
- Graceful fallbacks: many utility functions take a `fallback` parameter (e.g., `getStructuredContent`)
- Silent error swallowing in specific cases (e.g., cookie setting in Server Components or storage failures)
- Validation: Environment variables are validated at runtime (`app/lib/env.ts`)

## Logging

**Framework:** `console` (Note: `console.log` is discouraged in production by project rules, but no specialized logger was found in the storefront app)

**Patterns:**
- Errors are occasionally swallowed or ignored without explicit logging in utility files
- Server-side errors in Supabase clients are handled via `createServerClient` patterns

## Comments

**When to Comment:**
- Brief explanations for workaround or specific environment constraints (e.g., "Server components may not always be able to set cookies")
- Logic explanations for complex operations (e.g., cart item ID generation)

**JSDoc/TSDoc:**
- Minimal usage in the current codebase; types are preferred for documentation.

## Function Design

**Size:** Most utility functions are very small and focused (5-20 lines). Some complex UI components or state management hooks are larger.

**Parameters:** Prefer object bundles for complex state (e.g., `bundle: StorefrontBundle`) to keep parameter lists short.

**Return Values:** Explicit return types are used for public APIs and complex logic.

## Module Design

**Exports:**
- Named exports are used for utilities and components: `export function ...`
- Default exports are used for Next.js special files (`page.tsx`, `layout.tsx`)

**Barrel Files:** Not heavily used; files are imported directly from their locations in `app/lib` or `app/components`.

---

*Convention analysis: 2026-04-22*
