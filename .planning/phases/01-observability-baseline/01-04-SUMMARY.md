---
phase: 01-observability-baseline
plan: 04
subsystem: observability
tags: [sentry, logging, error-boundaries]
dependency_graph:
  requires: [01-03]
  provides: [error-reporting, action-telemetry]
  affects: [apps/admin, apps/storefront]
tech_stack:
  added: [Sentry]
  patterns: [withObservedAction]
key_files:
  created: [apps/storefront/app/error.tsx]
  modified: [apps/admin/src/app/dashboard/error.tsx, apps/admin/src/app/dashboard/actions.ts]
decisions:
  - Instrumented createCategory and createTopping as pilots for Server Action observability.
  - Standardized error boundary reporting using Sentry.captureException in useEffect.
metrics:
  duration: 235s
  completed_date: "2026-04-22"
---

# Phase 01 Plan 04: Global Error Boundaries & Action Instrumentation Summary

## Summary
Successfully applied global error boundaries to both Admin and Storefront applications and instrumented the first set of Server Actions with the withObservedAction observability wrapper.

## Key Changes

### 1. Global Error Boundaries
- **Admin Dashboard**: Updated apps/admin/src/app/dashboard/error.tsx to report exceptions to Sentry using Sentry.captureException within a useEffect hook.
- **Storefront**: Created apps/storefront/app/error.tsx (previously missing) to provide a global error boundary for the consumer app, matching the Admin's pattern and UI styling.
- **Recovery UI**: Both boundaries include a "Try Again" recovery path via the reset function.

### 2. Server Action Instrumentation
- **Pilot Implementation**: Instrumented createCategory and createTopping in apps/admin/src/app/dashboard/actions.ts.
- **Wrapper Pattern**: Used withObservedAction to provide structured logging (via Pino) and automated Sentry tracing/instrumentation.
- **Improved Visibility**: These critical paths now provide duration metrics and success/failure telemetry in logs.

## Deviations from Plan
None - plan executed as written.

## Self-Check: PASSED
- [x] Admin error boundary instrumented
- [x] Storefront error boundary created and instrumented
- [x] Pilot server actions wrapped with withObservedAction
- [x] All changes committed with fix and feat types

## Commits
- 2b1e8b5: fix(01-04): update global error boundaries with Sentry reporting
- dda83b0: feat(01-04): instrument initial Server Actions with observability wrapper