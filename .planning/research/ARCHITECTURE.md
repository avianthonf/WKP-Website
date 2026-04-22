# Architecture Patterns: Reliability Improvement Initiative

**Domain:** E-commerce / Admin Dashboard (Next.js 15 + Supabase)
**Researched:** 2026-04-22

## Recommended Architecture for Reliability

A systematic bug-fixing initiative in a Next.js 15 App Router environment should shift from a "feature-first" to a "safety-first" architecture. This involves reinforcing the boundaries between Client Components, Server Actions, and the Data Layer.

### Component Boundaries

| Component Type | Reliability Responsibility | Communicates With |
|-----------|---------------|-------------------|
| **Client Containers** (e.g., `SettingsClient`) | Optimistic UI, local state isolation, error recovery | Server Actions, Supabase Realtime |
| **Server Actions** | Atomic transactions, schema validation, cache invalidation | Supabase Admin SDK, Next.js Cache |
| **Shared API Layer** (`adminApi.ts`) | Type-safe data fetching, consistent error transformation | Supabase Client SDK |
| **Validation Layer** (`Zod`) | Unified truth for data shapes across client and server | Forms, API calls, Actions |

### Data Flow for Reliable Mutations

To prevent race conditions and stale state (common in Next.js 15), mutations must follow a strict "Submit -> Mutate -> Invalidate -> Sync" flow:

1. **Submit:** Client triggers Server Action via `useTransition`.
2. **Mutate:** Server Action performs atomic DB operation using Service Role.
3. **Invalidate:** Server Action calls `revalidatePath` or `revalidateTag`.
4. **Sync:** `useEffect` in Client Components listens for Postgres Changes to reconcile local state with the server truth.

## Patterns to Follow

### Pattern 1: Deterministic Real-time Reconciliation
**What:** Use a "version" or "updated_at" check in real-time subscriptions to prevent race conditions where an old subscription payload overwrites a newer local state.
**When:** In high-frequency update components like `SettingsClient`.
**Example:**
```typescript
useEffect(() => {
  const channel = supabase.channel('site_config')
    .on('postgres_changes', { event: 'UPDATE', table: 'site_config' }, (payload) => {
      setConfigs(prev => {
        const existing = prev.find(c => c.key === payload.new.key);
        // Only update if the incoming data is actually newer or different
        if (existing && existing.updated_at >= payload.new.updated_at) return prev;
        return prev.map(c => c.key === payload.new.key ? payload.new : c);
      });
    })
    .subscribe();
}, []);
```

### Pattern 2: Server Action Error Envelope
**What:** All Server Actions should return a consistent result object instead of throwing uncaught exceptions that trigger global error boundaries.
**When:** All data mutations.
**Example:**
```typescript
type ActionResult<T> = { success: true; data: T } | { success: false; error: string; code?: string };

export async function updateConfig(data: Schema): Promise<ActionResult<Config>> {
  try {
    const validated = schema.parse(data);
    const { data: result, error } = await supabaseAdmin.from('config').update(validated);
    if (error) throw error;
    revalidatePath('/settings');
    return { success: true, data: result };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Large "God" Client Components
**What:** Components like the 1900-line `SettingsClient.tsx` that handle fetching, state, real-time, and UI.
**Why bad:** Impossible to test isolated bug fixes; side effects collide.
**Instead:** Split into "Data Hooks" (for real-time/fetching) and "UI Presenters" (small, testable forms).

### Anti-Pattern 2: Silent Failures in Mutations
**What:** Calling a Supabase mutation and only checking `if (error) console.log(error)`.
**Why bad:** Users think the change saved, but it didn't persist, leading to "ghost data."
**Instead:** Always propagate errors to the UI via toast notifications or form error states.

## Fix Order & Dependencies

Based on architectural dependencies, fixes should be addressed in this order:

1.  **Validation Alignment:** Fix inconsistent Zod schemas in `packages/core` first. Everything depends on these shapes.
2.  **Server Action Robustness:** Wrap existing Actions in the Error Envelope pattern to ensure consistent failure reporting.
3.  **Real-time Race Conditions:** Fix `SettingsClient` and `MenuStudio` subscription logic to handle rapid updates.
4.  **Component Refactoring:** Decompose the "Big Three" (`SettingsClient`, `MenuStudio`, `CartCheckout`) only after their core logic is verified.

## Sources

- [Next.js 15 Server Actions Documentation](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [Supabase Realtime Patterns](https://supabase.com/docs/guides/realtime/postgres-changes)
- [WKP Codebase Analysis (PROJECT.md, adminApi.ts)](D:/Users/Avinash/Documents/WKP-Website/.planning/PROJECT.md)
