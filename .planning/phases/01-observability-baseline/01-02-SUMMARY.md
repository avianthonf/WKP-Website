---
phase: 01-observability-baseline
plan: 02
subsystem: observability
tags: [sentry, instrumentation, nextjs-15]
requires: [01-01]
provides: [OBS-01]
tech-stack: [Sentry, Next.js 15 Instrumentation]
key-files: [apps/admin/sentry.server.config.ts, apps/admin/sentry.client.config.ts, apps/admin/sentry.edge.config.ts, apps/admin/src/instrumentation.ts, apps/storefront/sentry.server.config.ts, apps/storefront/sentry.client.config.ts, apps/storefront/sentry.edge.config.ts, apps/storefront/src/instrumentation.ts]
metrics:
  duration: 10m
  tasks_completed: 2
---

# Phase 01 Plan 02: Sentry Initialization Summary

Sentry has been successfully initialized across all runtimes for both the Admin and Storefront applications. This setup leverages the Next.js 15 `instrumentation.ts` hook for early error capture during application bootstrap.

## Key Changes

### Sentry Runtime Configurations
Created standardized Sentry initialization files for each runtime:
- `sentry.client.config.ts`: Browser runtime (includes Replay integration).
- `sentry.server.config.ts`: Node.js runtime.
- `sentry.edge.config.ts`: Edge runtime (Middleware, Edge Functions).

Traces are sampled at 1.0 to ensure full visibility during the baseline phase.

### Instrumentation Hooks
Implemented `src/instrumentation.ts` in both apps to register Sentry handlers:
- Detects runtime (`nodejs` vs `edge`).
- Dynamically imports the corresponding Sentry configuration.
- Ensures observability is active before the app starts serving requests.

## Test Plan

### Automated Verification
- Verified file existence in `apps/admin` and `apps/storefront`.
- Verified `register` function export in both instrumentation files.

### Manual Verification (Next Phase)
- Trigger a server-side error (e.g., in a Server Action) to verify capture.
- Trigger a client-side error to verify browser reporting.

## Deviations from Plan

- **Edge Configs Added:** While the plan mentioned server/client, I also added `sentry.edge.config.ts` for both apps to ensure full Next.js 15 runtime coverage (Middleware and Edge functions), which is a best practice for Sentry v8+.
- **File Placement:** Confirmed that `instrumentation.ts` must be inside `src/` because both apps use a `src` directory structure.

## Self-Check: PASSED
- [x] All tasks executed
- [x] Each task committed individually
- [x] SUMMARY.md created in plan directory
- [x] No modifications to shared orchestrator artifacts
