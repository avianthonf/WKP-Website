# Testing Patterns

**Analysis Date:** 2026-04-23

## Test Framework

**Runner:**
- Vitest (^2.0.5)
- Config: `apps/admin/vitest.config.ts`, `apps/storefront/vitest.config.ts`

**Assertion Library:**
- Vitest (compatible with Jest matchers)
- `@testing-library/jest-dom` for DOM-specific assertions

**Run Commands:**
```bash
npm test              # Run Vitest tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

## Test File Organization

**Location:**
- Co-located with implementation: `src/**/*.test.tsx` (e.g., `src/app/dashboard/toppings/ToppingsClient.test.tsx`)
- Separate test directory for infrastructure/setup: `apps/admin/test/` and `apps/storefront/test/`

**Naming:**
- `[FileName].test.ts` or `[FileName].test.tsx`

**Structure:**
```
apps/admin/
├── src/
│   └── .../
│       ├── Component.tsx
│       └── Component.test.tsx
└── test/
    ├── mocks/         # Shared mocks
    ├── setup.ts       # Global vitest setup
    └── utils/         # Test utilities (e.g., render-with-providers.tsx)
```

## Test Structure

**Suite Organization:**
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

describe('ComponentName', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly', () => {
    render(<ComponentName />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

**Patterns:**
- `beforeEach`: Clear all mocks using `vi.clearAllMocks()` to ensure test isolation.
- `describe/it`: Standard BDD-style organization.
- `render/screen`: React Testing Library pattern for component testing.
- `userEvent`: Use `@testing-library/user-event` for simulating user interactions.

## Mocking

**Framework:** Vitest (via `vi.mock` and `vi.fn`)

**Patterns:**
```typescript
// Mocking Server Actions
vi.mock('./actions', () => ({
  createTopping: vi.fn(() => Promise.resolve({ success: true })),
}));

// Mocking Next.js Navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));
```

**What to Mock:**
- External services (Supabase SDK clients)
- Next.js internal hooks (`useRouter`, `useParams`, `usePathname`)
- Server Actions in Client Component tests to isolate UI logic
- DOM APIs not available in JSDOM (e.g., `matchMedia`, `IntersectionObserver`, `ResizeObserver` - found in `test/setup.ts`)

**What NOT to Mock:**
- Pure logic/utility functions unless they have expensive side effects
- Zod schemas used for validation (use the real schemas to ensure data integrity)

## Fixtures and Factories

**Test Data:**
- Usually defined within the test file for local context and clarity.
- Shared mock objects in `test/mocks/` (e.g., `supabase.ts`, `next-navigation.ts`).

**Location:**
- Co-located with tests or in centralized `test/mocks/` directory.

## Coverage

**Requirements:** 80% minimum (enforced by project quality standards).

**View Coverage:**
```bash
npm run test:coverage
```

## Test Types

**Unit Tests:**
- Validation logic: `src/lib/validations.test.ts`
- Utility functions and shared core logic
- Individual presentational components: `src/components/admin/Modal.test.tsx`

**Integration Tests:**
- Client Components interacting with mocked Server Actions: `ToppingsClient.test.tsx`
- Catalog management logic: `apps/storefront/app/lib/catalog.test.ts`

**E2E Tests:**
- Playwright (recommended for critical user flows, though configuration is pending implementation)

## Common Patterns

**Async Testing:**
```typescript
await user.click(button);
await waitFor(() => {
  expect(mockAction).toHaveBeenCalledWith(expect.objectContaining({ ... }));
});
```

**Error Boundary Testing:**
- Verify that components gracefully handle errors and display `error.tsx` content (e.g., `apps/admin/src/app/dashboard/error.test.tsx`).

---

*Testing analysis: 2026-04-23*
