# Codebase Concerns

**Analysis Date:** 2026-04-23

## Tech Debt

**Server Action Redundancy:**
- Issue: Duplicate server action implementations for basic CRUD operations across multiple files.
- Files: `apps/admin/src/app/dashboard/actions.ts`, `apps/admin/src/app/dashboard/pizzas/actions.ts`, `apps/admin/src/app/dashboard/categories/actions.ts`
- Impact: High maintenance overhead, risk of inconsistent behavior (e.g., some use `withObservedAction` wrapper while others don't).
- Fix approach: Consolidate redundant actions into a shared library or standard service layer within `packages/core`.

**Inconsistent Error Handling in Actions:**
- Issue: Some server actions return `{ success: true }` / `{ error: string }` while others throw Errors directly.
- Files: `apps/admin/src/app/dashboard/actions.ts` (returns), `apps/admin/src/app/dashboard/pizzas/actions.ts` (throws).
- Impact: Inconsistent UI handling of errors; risk of unhandled promise rejections or leaked sensitive error details.
- Fix approach: Standardize on a result object pattern (e.g., `Result<T, E>`) for all server actions.

**Large Component Files (Prop Drilling & Complexity):**
- Issue: Large React components handling too many responsibilities (UI, State, Real-time subs).
- Files: `apps/admin/src/app/dashboard/settings/SettingsClient.tsx` (1886 lines), `apps/storefront/app/components/cart-checkout.tsx` (802 lines).
- Impact: Hard to test, slow to maintain, high risk of side effects when modifying unrelated logic.
- Fix approach: Extract business logic into custom hooks, split into smaller sub-components, and use state management (Zustand) more effectively.

**Unimplemented Backup/Restore Logic:**
- Issue: "TODO" comments indicate critical missing functionality for system recovery.
- Files: `packages/core/cms-backup-restore.ts`
- Impact: System administrators cannot currently restore data from backups, risking data loss if a manual intervention is needed.
- Fix approach: Implement the table-by-table upsert and file reading logic as noted in the source.

## Known Bugs

**Slug Generation Collisions:**
- Issue: Slugs are generated from labels/names without checking for uniqueness in the database.
- Files: `apps/admin/src/app/dashboard/categories/actions.ts`, `apps/admin/src/app/dashboard/pizzas/actions.ts`
- Impact: Potential `23505` (unique constraint) database errors if two items have the same name, or routing issues if slugs are not unique.
- Trigger: Create two categories or pizzas with the same name.
- Workaround: Manually rename items before creation.

## Security Considerations

**Service Role Key Exposure Risk:**
- Risk: `SUPABASE_SERVICE_ROLE_KEY` is used in several server-side files. If a developer accidentally imports one of these into a `'use client'` component, the key could be leaked.
- Files: `apps/admin/src/lib/supabaseAdmin.ts`
- Current mitigation: Next.js environment variable naming (`NEXT_PUBLIC_` prefix requirement) and manual code review.
- Recommendations: Use `server-only` package to ensure admin-level libraries cannot be imported into client components.

## Performance Bottlenecks

**Heavy Real-time Subscriptions:**
- Problem: `SettingsClient` subscribes to all changes in the `site_config` table and triggers a full state update on every event.
- Files: `apps/admin/src/app/dashboard/settings/SettingsClient.tsx`
- Cause: Subscribing to `*` (all events) and re-sorting the entire array in-memory on every change.
- Improvement path: Filter events at the subscription level or debounced/batch state updates for high-frequency changes.

## Fragile Areas

**Pizza-Topping Synchronization:**
- Files: `apps/admin/src/app/dashboard/pizzas/actions.ts`
- Why fragile: Uses a "delete-all-then-insert-all" pattern for syncing many-to-many relationships. This is non-transactional in the current implementation (two separate Supabase calls) and can leave the system in a partial state if the insert fails.
- Safe modification: Use a single RPC call or wrap both operations in a database transaction.
- Test coverage: Low.

## Missing Critical Features

**CMS Restore Functionality:**
- Problem: Backup exists but Restore is incomplete.
- Blocks: Disaster recovery workflows.

---

*Concerns audit: 2026-04-23*
