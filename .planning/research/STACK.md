# Technology Stack: Bug-Fixing & Quality Initiative

**Project:** WeKneadPizza (WKP) Monorepo
**Researched:** 2026-04-22
**Focus:** Next.js 15, Supabase Real-time, React 19 Bug Hunting

## Recommended Quality Stack

This stack is selected to address the specific reliability issues identified in `CONCERNS.md`, particularly real-time race conditions, Server Action silent failures, and oversized component fragility.

### 1. Verification & Testing (Prevention)
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| [Playwright](https://playwright.dev/) | 1.50+ | E2E Regression | Best-in-class for multi-role testing (Admin vs Storefront). Essential for catching race conditions in the checkout and menu ordering flows. |
| [Vitest](https://vitest.dev/) | 2.x | Unit/Integration | Maintains consistency with the existing `apps/admin` setup. Extremely fast for testing extracted business logic. |
| [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) | 16.x | Component Testing | Standard for React 19. Used to verify that refactored components maintain user-facing behavior. |
| [MSW (Mock Service Worker)](https://mswjs.io/) | 2.x | API/DB Mocking | Already partially used. Vital for simulating Supabase failures, network timeouts, and auth expiration in a controlled way. |

### 2. Runtime Safety & Logic (Reliability)
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| [Zod](https://zod.dev/) | 3.24+ | Contract Safety | Required for enforcing data integrity at the Supabase boundary. Prevents "stale state" bugs by failing fast when DB data doesn't match expectations. |
| [next-safe-action](https://next-safe-action.dev/) | 7.x | Action Wrapper | Solves the "silent failure" issue in Server Actions. Provides standardized middleware for logging, validation, and error propagation. |
| [React Error Boundary](https://github.com/bvaughn/react-error-boundary) | 5.x | Fault Tolerance | Prevents a single component failure (e.g., in `SettingsClient`) from crashing the entire Admin dashboard. |

### 3. Observability & Discovery (Bug Hunting)
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| [Sentry](https://sentry.io/) | 8.x (Next.js SDK) | Error Tracking | The primary tool for "Discovery." Catches silent production errors and provides breadcrumbs for race conditions that are hard to reproduce locally. |
| [react-scan](https://react-scan.com/) | Latest | Re-render Auditing | Specifically targets the "unfiltered real-time subscription" concern. Identifies exactly why `SettingsClient` or `MenuStudio` are re-rendering unnecessarily. |
| [Pino](https://github.com/pinojs/pino) | 9.x | Structured Logging | Replaces `console.log` in Server Actions. Allows for searchable logs in Vercel/Sentry to trace data mutation paths. |

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| E2E Testing | Playwright | Cypress | Playwright has superior support for Next.js 15, faster execution, and better multi-tab support for testing Admin/Storefront interactions. |
| Unit Testing | Vitest | Jest | Jest requires complex Babel/SWC transforms for Next.js 15; Vitest works natively with the existing Vite-based build logic. |
| Action Safety | next-safe-action | Manual Try/Catch | Manual handling is prone to "missing error propagation" (identified in `PROJECT.md`). |

## Installation

Run these in the monorepo root to add to the relevant workspaces:

```bash
# Add to apps/admin and apps/storefront
npm install playwright @playwright/test -w apps/admin -w apps/storefront
npm install @sentry/nextjs next-safe-action react-error-boundary -w apps/admin -w apps/storefront
npm install -D react-scan -w apps/admin -w apps/storefront

# Add to packages/core (Logic extraction targets)
npm install zod pino -w packages/core
npm install -D vitest @vitest/ui -w packages/core
```

## Sources

- [Next.js 15 Documentation (Testing)](https://nextjs.org/docs/app/building-your-application/testing)
- [Supabase Real-time Best Practices](https://supabase.com/docs/guides/realtime)
- [React 19 Upgrade Guide](https://react.dev/blog/2024/12/05/react-19)
- [Sentry Next.js SDK Reference](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [next-safe-action v7 Docs](https://next-safe-action.dev/docs/getting-started)
