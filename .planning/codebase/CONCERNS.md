# Codebase Concerns

**Analysis Date:** 2026-04-22

## Tech Debt

**God Component (Settings):**
- Issue: `SettingsClient.tsx` has grown to nearly 1900 lines, handling everything from real-time database sync to complex UI state for multiple config types. This violates the "Many Small Files" principle and makes testing nearly impossible.
- Files: `apps/admin/src/app/dashboard/settings/SettingsClient.tsx`
- Impact: Extremely difficult to modify without side effects; slow IDE performance; high risk of bugs during config updates.
- Fix approach: Break into sub-components (e.g., `ConfigList`, `ConfigItem`, `RealtimeSyncProvider`) and move business logic into custom hooks.

**Oversized UI Components:**
- Issue: Several components exceed the 800-line maximum, containing significant business logic that should be in hooks or utility functions.
- Files: `apps/storefront/app/components/cart-checkout.tsx` (802 lines), `apps/admin/src/app/dashboard/pizzas/MenuStudio.tsx` (733 lines).
- Impact: High maintenance cost and poor readability.
- Fix approach: Extract logic into dedicated hooks (e.g., `useCheckout`) and split UI into smaller, focused components.

**Stubbed Backup/Restore Logic:**
- Issue: The core backup and restore utility is partially implemented, with critical TODOs for the actual restoration of data.
- Files: `packages/core/cms-backup-restore.ts`
- Impact: The backup/restore feature advertised in the admin panel may not actually work for data restoration.
- Fix approach: Implement the `table-by-table upsert` logic and JSON parsing as noted in the TODO comments.

## Known Bugs

**Real-time Config Race Conditions:**
- Symptoms: Local state updates in `SettingsClient.tsx` are handled both optimistically and via Postgres change notifications.
- Files: `apps/admin/src/app/dashboard/settings/SettingsClient.tsx`
- Trigger: Rapidly toggling boolean settings or multiple users editing config simultaneously.
- Workaround: Refreshing the page synchronizes state.

## Security Considerations

**Service Role Key Protection:**
- Risk: Potential for `SUPABASE_SERVICE_ROLE_KEY` to be leaked if used incorrectly in client-side code, though `CLAUDE.md` warns against this.
- Files: `apps/admin/src/lib/supabaseClient.ts` (implied usage in actions)
- Current mitigation: Environment variable validation and Server Actions.
- Recommendations: Implement a strict audit of all files using `SERVICE_ROLE_KEY` to ensure they are strictly server-side.

**Admin Email Allowlist:**
- Risk: Middleware relies on an `ADMIN_EMAIL` check which might be too simple for a multi-admin environment.
- Files: `apps/admin/src/middleware.ts`
- Current mitigation: Basic email check.
- Recommendations: Move to a more robust RBAC (Role-Based Access Control) system within Supabase.

## Performance Bottlenecks

**Unfiltered Real-time Subscriptions:**
- Problem: Subscribing to all changes on the `site_config` table.
- Files: `apps/admin/src/app/dashboard/settings/SettingsClient.tsx`
- Cause: `client.channel('site_config-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'site_config' }, ...)`
- Improvement path: Use filters in the subscription if only certain keys are needed, or throttle state updates.

## Fragile Areas

**Menu Studio State:**
- Files: `apps/admin/src/app/dashboard/pizzas/MenuStudio.tsx`
- Why fragile: Complex state management for pizza customization, categories, and addons in a single component.
- Safe modification: Use the `useAdminCatalogStore` hook but be careful of direct state mutations.
- Test coverage: Gaps in E2E testing for complex menu configurations.

## Missing Critical Features

**Data Restoration:**
- Problem: Backup creation exists but restoration is not fully implemented in the core package.
- Blocks: Disaster recovery and environment synchronization.

## Test Coverage Gaps

**Server Actions:**
- What's not tested: Most Server Actions in `apps/admin` lack unit tests for error paths.
- Files: `apps/admin/src/app/dashboard/**/actions.ts`
- Risk: Failed database operations might return "success" or crash the client.
- Priority: High

---

*Concerns audit: 2026-04-22*
