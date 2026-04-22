---
phase: 01-observability-baseline
plan: 01
subsystem: infra
tags: [sentry, nextjs, observability, pino, react-scan]
requires: []
provides:
  - Sentry and logging dependencies added to admin and storefront workspaces
  - Next.js build config wrapped with Sentry in both apps
  - Production source maps hidden for Sentry builds
affects: [observability-baseline, admin, storefront]
tech-stack:
  added: [@sentry/nextjs, pino, react-scan, pino-pretty]
  patterns: [Sentry-wrapped Next.js config, hidden production source maps]
key-files:
  created: []
  modified: [apps/admin/package.json, apps/storefront/package.json, package-lock.json, apps/admin/next.config.ts, apps/storefront/next.config.ts]
key-decisions:
  - "Used direct workspace dependency installation instead of sentry-wizard to avoid interactive setup in executor mode"
  - "Configured withSentryConfig manually in both apps so hideSourceMaps could be enforced explicitly"
patterns-established:
  - "Observability infrastructure is added app-by-app with symmetric admin/storefront config"
  - "Sentry build integration must set hideSourceMaps: true"
requirements-completed: [OBS-01]
duration: 25min
completed: 2026-04-22
---

# Phase 01: Observability & Baseline Summary

**Sentry dependencies and build-time Next.js config were established for both admin and storefront with hidden production source maps**

## Performance

- **Duration:** 25 min
- **Started:** 2026-04-22T15:10:00Z
- **Completed:** 2026-04-22T15:35:00Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Added Sentry, Pino, React Scan, and Pino Pretty dependencies to both applications
- Wrapped both Next.js app configs with `withSentryConfig`
- Enforced `hideSourceMaps: true` in both applications for safer production builds

## Task Commits

Each task was committed atomically:

1. **Task 1: Install Observability Dependencies** - `ce1f209` (chore)
2. **Task 2: Configure Sentry Infrastructure** - `ad80d4c` (chore)

**Plan metadata:** `ad80d4c` (docs: complete plan)

## Files Created/Modified
- `apps/admin/package.json` - Added Sentry and structured logging dependencies
- `apps/storefront/package.json` - Added Sentry and structured logging dependencies
- `package-lock.json` - Recorded workspace dependency resolution
- `apps/admin/next.config.ts` - Wrapped admin config with `withSentryConfig`
- `apps/storefront/next.config.ts` - Wrapped storefront config with `withSentryConfig`

## Decisions Made
- Used manual Sentry config wiring instead of the interactive wizard
- Deferred runtime Sentry initialization files to the next plan wave

## Deviations from Plan

### Auto-fixed Issues

**1. [Execution Recovery] Completed Task 2 after executor stopped before summary creation**
- **Found during:** Post-wave spot check
- **Issue:** The executor committed Task 1 but exited before writing the summary or applying Task 2 changes
- **Fix:** Finished the planned `withSentryConfig` changes and created the required summary in the same worktree
- **Files modified:** `apps/admin/next.config.ts`, `apps/storefront/next.config.ts`, `.planning/phases/01-observability-baseline/01-01-SUMMARY.md`
- **Verification:** Spot-check on modified files and worktree commit history
- **Committed in:** `ad80d4c`

---

**Total deviations:** 1 auto-fixed (execution recovery)
**Impact on plan:** No scope creep. Recovery completed the original planned work only.

## Issues Encountered
- The original executor stopped after the dependency-install commit without creating `01-01-SUMMARY.md`, so the remaining planned config work had to be recovered in the same worktree.

## User Setup Required

**External services require manual configuration.** Add these environment variables before runtime verification:
- `SENTRY_AUTH_TOKEN`
- `SENTRY_ORG`
- `SENTRY_PROJECT`
- `NEXT_PUBLIC_SENTRY_DSN`

## Next Phase Readiness
- Runtime Sentry initialization files can now be added in Wave 2
- Both apps now have the required packages and build wrapper for subsequent instrumentation

---
*Phase: 01-observability-baseline*
*Completed: 2026-04-22*
