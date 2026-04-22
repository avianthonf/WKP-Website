# Domain Pitfalls: Next.js 15 + Supabase Bug Fixing

**Domain:** Full-stack Pizza E-commerce (WKP)
**Researched:** 2026-04-22
**Focus:** Next.js 15, React 19, Supabase Real-time, Server Actions

## Critical Pitfalls

### 1. Dual-Path Oscillation (Race Conditions)
**What goes wrong:** A bug fix for state management creates a feedback loop. When a Server Action updates a setting, Next.js triggers `revalidatePath`. Simultaneously, Supabase Real-time sends a `postgres_changes` event. The client state is hit by two separate update paths at slightly different times.
**Why it happens:** The DB write triggers the Real-time stream *instantly*, while the Server Action revalidation takes the time of a full HTTP round trip + server rendering.
**Consequences:** UI "flicker" where a value changes, reverts to the old value (from a stale revalidation), and then snaps back to the new value (from Real-time).
**Prevention:** 
- Implement a "Source of Truth Lock": Ignore real-time updates for a specific key for ~1000ms after a local Server Action is initiated.
- Use React 19 `useOptimistic` to bridge the gap and ensure the UI stays on the "target" state regardless of which sync path arrives first.
**Detection:** Throttling network speed to "Slow 3G" in DevTools usually surfaces this immediately.

### 2. Next.js 15 Router Cache Persistence
**What goes wrong:** Fixing a "stale state" bug by adding `revalidatePath('/dashboard/settings')` appears to work in development but fails in production.
**Why it happens:** Next.js 15 maintains a client-side Router Cache. While `revalidatePath` clears the server-side cache, the client-side cache for the *current* session might still serve a stale version of the layout/page if the navigation was "prefetch: true" or occurred within the cache window.
**Prevention:**
- Use `router.refresh()` explicitly in the `useTransition` or `useActionState` completion callback.
- Ensure Server Actions return a fresh state object that the client can apply immediately without waiting for revalidation.
**Detection:** Observe if the bug is fixed after a manual CMD+R refresh but persists during "soft" client-side navigation.

### 3. Silent Action Failures (The "Pending Trap")
**What goes wrong:** A bug fix adds error handling to a Server Action, but the UI component gets "stuck" in a loading/pending state if an error occurs.
**Why it happens:** In Next.js 15 / React 19, if a Server Action throws an uncaught error, the `isPending` state from `useTransition` or the state from `useActionState` might not reset as expected if the Error Boundary is too far up the tree.
**Prevention:**
- **Always** wrap Server Action logic in a try/catch and return a structured error object (e.g., `{ success: false, error: '...' }`) rather than throwing.
- Ensure Zod validation happens *inside* the action and returns errors that the client can map to form fields.
**Detection:** Trigger a database constraint violation (e.g., duplicate key) and see if the "Save" button stays disabled forever.

## Moderate Pitfalls

### 4. Service Role Key Leakage in "Fixes"
**What goes wrong:** To fix a permission bug (RLS), a developer accidentally moves logic to a client component that uses the `SUPABASE_SERVICE_ROLE_KEY`.
**Why it happens:** The pressure to fix "broken admin features" leads to bypasses rather than fixing the underlying RLS policy.
**Prevention:**
- Strict audit: `grep` for `SERVICE_ROLE_KEY` should only show results in `src/actions/` or `src/lib/supabaseServer.ts`.
- Never initialize a Supabase client with the service role key in any file that doesn't have the `'use server'` directive.
**Detection:** Check the `apps/admin` build output/bundle size or use `process.env` validation to throw if the key is accessed on the client.

### 5. Dependency Array Bloat (God Component Side Effects)
**What goes wrong:** Fixing a bug in the 1900-line `SettingsClient.tsx` by adding a variable to a `useEffect` dependency array triggers an infinite loop or massive re-renders.
**Why it happens:** Large components often have hidden cross-dependencies. Updating one "fix" can trigger a Supabase subscription reset, which fetches data, which updates state, which triggers the effect again.
**Prevention:**
- Before fixing a bug in a God component, extract the relevant logic into a custom hook (e.g., `useSettingsSync`).
- Use `useRef` for values that shouldn't trigger re-subscriptions (like the Supabase client instance).
**Detection:** Use `console.count('Settings Render')` or React DevTools "Highlight updates" to spot render loops.

## Minor Pitfalls

### 6. Real-time Subscription Limit
**What goes wrong:** Adding "Real-time" to every list to fix "stale data" bugs leads to the admin dashboard hitting Supabase connection limits.
**Why it happens:** Each `supabase.channel()` counts as a connection. Opening 10 tabs with 5 subscriptions each adds up quickly.
**Prevention:** Use a single "multiplexed" subscription for the `site_config` table and filter updates in the client.
**Detection:** Check the "Realtime" tab in the Supabase Dashboard for spike in connections.

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| **Real-time Fixes** | Feedback Loops | Use `useOptimistic` + a "local change timestamp" to ignore old real-time packets. |
| **Server Action Errors** | Missing Propagations | Return `{ error }` objects; never rely on raw `throw`. |
| **Cache Invalidation** | Router Cache | Use `router.refresh()` in conjunction with `revalidatePath`. |
| **Admin Auth** | Middleware Gaps | Verify `supabase.auth.getUser()` in the action itself, not just the middleware. |

## Sources

- [Next.js 15 Caching Docs](https://nextjs.org/docs/app/building-your-application/caching)
- [Supabase Realtime Pitfalls](https://supabase.com/docs/guides/realtime/concepts#performance)
- [React 19 useActionState Reference](https://react.dev/reference/react/useActionState)
- [WKP CONCERNS.md (Internal)](D:/Users/Avinash/Documents/WKP-Website/.planning/codebase/CONCERNS.md)
