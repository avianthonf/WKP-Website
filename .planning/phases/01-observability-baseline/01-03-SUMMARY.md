---
phase: 01-observability-baseline
plan: 03
subsystem: observability
tags: [logging, performance, dev-tooling]
requires: [OBS-02, OBS-03]
provides: [LOG-UTILS, PERF-AUDIT]
tech-stack: [pino, sentry, react-scan]
key-files: [apps/admin/src/lib/observability.ts, apps/admin/src/components/diagnostics/ReactScan.tsx]
metrics:
  duration: 15m
  completed_date: "2026-04-22"
---

# Phase 01 Plan 03: Observability Utilities Summary

Implemented structured logging and performance auditing tools to establish an observability baseline across the monorepo.

## Key Changes

### Structured Logging Utility
- Created `withObservedAction` HOF in `apps/admin/src/lib/observability.ts` and `apps/storefront/src/lib/observability.ts`.
- Integrated with `pino` for structured logging and Sentry for Server Action instrumentation.
- Automatically captures action duration, success status, and error details.
- Configured `pino-pretty` for human-readable logs in development.

### Development-Time Performance Auditing
- Integrated `react-scan` to detect component re-render loops and performance bottlenecks.
- Created `ReactScan` component that initializes the library only in development mode.
- Injected the component into the root layout of both Admin and Storefront applications.

## Decisions Made
- **Code Duplication vs Shared Package**: Chose to duplicate the `observability.ts` utility in both apps for now instead of moving to `packages/core` to avoid dependency overhead in the core package until patterns stabilize.
- **Development-Only React Scan**: Strictly gated `react-scan` by `NODE_ENV === 'development'` to ensure zero performance overhead or internal exposure in production.

## Known Stubs
None.

## Verification Results
- [x] `withObservedAction` exists in both apps.
- [x] `react-scan` integration verified in code.
- [x] Logging configured with `pino-pretty` for development.

## Commits
- e6d2239: feat(01-03): implement structured logging utilities
- d9b0d81: feat(01-03): integrate React Scan for development auditing

## Self-Check: PASSED
