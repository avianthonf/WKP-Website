# Research Summary: WKP Bug-Fixing & Quality Initiative

**Domain:** Quality Engineering for Next.js 15 / Supabase Monorepo
**Researched:** 2026-04-22
**Overall Confidence:** HIGH

## Executive Summary

The WeKneadPizza (WKP) monorepo is currently hindered by significant technical debt in three primary "God Components" (`SettingsClient`, `MenuStudio`, `cart-checkout`) and reliability gaps in its Server Actions and Real-time synchronization. This research identifies a specific, 2025-2026 state-of-the-art stack designed to move the project from "reactive bug-fixing" to "systematic quality engineering."

The core strategy involves a three-pronged approach: **Isolation** of business logic from oversized components into `packages/core`, **Verification** through Playwright E2E and Vitest unit tests, and **Observability** via Sentry and `react-scan` to identify silent failures and re-render loops. By hardening the boundaries between the Client and Server, we can eliminate the "flicker" bugs and "stale state" issues inherent in the current Next.js 15 implementation.

## Key Findings

### From STACK.md (Technology Stack)
- **Verification:** Playwright 1.50+ for E2E (multi-role testing), Vitest 2.x for logic, and MSW for DB/Supabase failure simulation.
- **Safety:** Zod 3.24+ for contract safety and `next-safe-action` 7.x to eliminate silent failures in Server Actions.
- **Observability:** Sentry 8.x and `react-scan` are critical for identifying production race conditions and render loops.

### From FEATURES.md (Product Requirements)
- *Note: File was missing during synthesis. Priorities inferred from codebase analysis.*
- **Must-Have:** Consistent real-time synchronization, atomic mutations, and explicit error propagation to the UI.
- **Differentiator:** Optimistic UI that handles high-latency network conditions gracefully using React 19 `useOptimistic`.

### From ARCHITECTURE.md (Patterns)
- **Component Boundaries:** Shift toward "Logic Extraction" targets in `packages/core`, leaving UI components as thin views.
- **Reliable Mutations:** Adoption of a "Submit -> Mutate -> Invalidate -> Sync" flow with deterministic version checks in subscriptions.
- **Action Envelope:** Standardizing Server Action returns as `{ success: boolean, data?: T, error?: string }`.

### From PITFALLS.md (Risks)
- **Dual-Path Oscillation:** Avoid the race condition where Real-time updates and Server Action revalidations collide by using a "Source of Truth Lock."
- **Router Cache Persistence:** Next.js 15 Router Cache can serve stale data during "soft" navigations; requires explicit `router.refresh()`.
- **Silent Action Failures:** Uncaught errors in actions can leave UI components in a permanent "pending" state.

## Implications for Roadmap

Based on the combined research, the project should follow this specific phase structure:

### Phase 1: Observability & Baseline
- **Rationale:** We cannot fix what we cannot measure. Establishing a baseline of errors prevents "guessing" at fix priorities.
- **What it delivers:** Sentry integration, `react-scan` auditing, and structured logging in Server Actions.
- **Pitfalls to avoid:** Ensure Sentry doesn't leak the `SERVICE_ROLE_KEY` in its error reports.

### Phase 2: Contract & Action Safety
- **Rationale:** Hardening the API/DB boundary is a prerequisite for refactoring complex UI logic.
- **What it delivers:** `next-safe-action` implementation, unified Zod schemas in `packages/core`, and error envelope standardization.
- **Pitfalls to avoid:** Ensure Zod validation happens *inside* the server action to prevent client-side bypass.

### Phase 3: Logic Extraction (Dismantling God Components)
- **Rationale:** The 1900-line `SettingsClient.tsx` is the primary source of fragility.
- **What it delivers:** Extraction of real-time sync and form logic into tested custom hooks and `packages/core` utilities.
- **Pitfalls to avoid:** Dependency array bloat in `useEffect` when re-implementing subscriptions.

### Phase 4: E2E Regression Suite
- **Rationale:** High-value features like the Cart and Menu Studio need automated guards to prevent regression.
- **What it delivers:** Playwright test suite covering multi-tab interactions between Admin (settings change) and Storefront (UI update).
- **Pitfalls to avoid:** Flaky tests caused by Supabase Real-time latency (requires `waitForSelector` with generous timeouts).

## Research Flags

- **Requires Phase Research:** Phase 4 (E2E Auth strategy for Playwright + Supabase).
- **Standard Implementation:** Phase 1 & 2 (Well-documented patterns, low architectural risk).
- **Gaps identified:** Real-time mocking in unit tests is currently unresolved and will require a custom solution.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Tools are current industry standards for Next.js 15. |
| Features | MEDIUM | Inferred from codebase due to missing FEATURES.md. |
| Architecture | HIGH | Patterns are aligned with React 19 / App Router paradigms. |
| Pitfalls | HIGH | Race conditions and cache issues are well-documented in the ecosystem. |

## Sources

- Next.js 15 / React 19 Official Documentation
- Supabase Real-time Best Practices
- Sentry Next.js SDK Documentation
- Internal Codebase Analysis (`CONCERNS.md`, `adminApi.ts`)
