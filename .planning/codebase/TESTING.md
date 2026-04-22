# Testing Patterns

**Analysis Date:** 2026-04-22

## Test Framework

**Runner:**
- Vitest (^2.0.5)
- Config: `apps/admin/vitest.config.ts`

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
- Separate test directory for infrastructure/setup: `apps/admin/test/`

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
    └── utils/         # Test utilities
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
- `beforeEach`: Clear all mocks to ensure test isolation
- `describe/it`: Standard BDD-style organization
- `render/screen`: React Testing Library pattern for component testing

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
- External services (Supabase)
- Next.js internal hooks (`useRouter`, `useParams`)
- Server Actions in Client Component tests
- DOM APIs not available in JSDOM (`matchMedia`, `IntersectionObserver`)

**What NOT to Mock:**
- Pure logic/utility functions unless they have side effects
- Zod schemas used for validation

## Fixtures and Factories

**Test Data:**
```typescript
const mockToppings: Topping[] = [
  {
    id: '1',
    slug: 'cheese-1',
    name: 'Mozzarella',
    // ... complete interface
  }
];
```

**Location:**
- Usually defined within the test file for local context
- Shared mocks in `test/mocks/` (e.g., `supabase.ts`, `next-navigation.ts`)

## Coverage

**Requirements:** 80% minimum (enforced by project rules)

**View Coverage:**
```bash
npm run test:coverage
```

## Test Types

**Unit Tests:**
- Validation logic: `src/lib/validations.test.ts`
- Utility functions
- Individual components: `src/components/admin/Modal.test.tsx`

**Integration Tests:**
- Client Components interacting with mocked Server Actions: `ToppingsClient.test.tsx`

**E2E Tests:**
- Playwright (recommended in rules, though no playwright config was found in root yet)

## Common Patterns

**Async Testing:**
```typescript
await user.click(button);
await waitFor(() => {
  expect(mockAction).toHaveBeenCalled();
});
```

**Form Testing:**
```typescript
await user.type(screen.getByLabelText('Name'), 'New Item');
await user.click(screen.getByRole('button', { name: /Add/i }));
```

---

*Testing analysis: 2026-04-22*
