# Testing Patterns

**Analysis Date:** 2026-04-22

## Test Framework

**Runner:**
- Vitest `^2.0.5`
- Config: `vitest.config.ts`

**Assertion Library:**
- Vitest (compatible with Jest syntax)

**Run Commands:**
```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage (configured in package.json)
```

## Test File Organization

**Location:**
- Co-located with implementation: `app/lib/catalog.test.ts`

**Naming:**
- `[name].test.ts` for logic tests

**Structure:**
```
app/lib/
├── catalog.ts
└── catalog.test.ts
```

## Test Structure

**Suite Organization:**
```typescript
import { describe, expect, it } from 'vitest';
import { someFunction } from './file';

describe('suite name', () => {
  it('does something expected', () => {
    const result = someFunction(input);
    expect(result).toBe(expected);
  });
});
```

**Patterns:**
- `describe` blocks for grouping related functions or features
- `it` or `test` for individual test cases
- Factory functions for test data: `makeBundle(config)` in `app/lib/catalog.test.ts`

## Mocking

**Framework:** Vitest (builtin)

**Patterns:**
- Use `satisfies` for type-safe base test objects: `const baseBundle = { ... } satisfies StorefrontBundle;`
- Data-driven testing: passing different configurations to a factory to test various scenarios

**What to Mock:**
- CMS data / Bundles (pizzas, configs, etc.)
- Environment variables
- External API responses

**What NOT to Mock:**
- Pure utility logic
- Transformation functions

## Fixtures and Factories

**Test Data:**
```typescript
const baseBundle = {
  categories: [],
  pizzas: [],
  // ...
} satisfies StorefrontBundle;

function makeBundle(config: Record<string, string>): StorefrontBundle {
  return { ...baseBundle, config };
}
```

**Location:**
- Defined within the test files for small suites
- Shared fixtures may be extracted to separate files if needed

## Coverage

**Requirements:** 80% minimum coverage is defined by global project rules.

**View Coverage:**
```bash
npm run test:coverage
```

## Test Types

**Unit Tests:**
- Used for logic and utility functions in `app/lib/`
- Example: `catalog.test.ts` testing configuration resolution

**Integration Tests:**
- API and Supabase interaction tests (not yet identified in the current storefront app, but expected for a production site)

**E2E Tests:**
- Framework: Playwright (per global project rules)
- Scope: Critical user flows (cart, checkout, menu browsing)

## Common Patterns

**Async Testing:**
- Use `async/await` in test functions for testing Promises (e.g., Supabase client creators)

**Error Testing:**
```typescript
expect(() => someFunction()).toThrow('Expected error message');
```

---

*Testing analysis: 2026-04-22*
