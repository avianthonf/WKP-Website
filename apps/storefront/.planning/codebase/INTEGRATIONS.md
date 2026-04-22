# External Integrations

**Analysis Date:** 2026-04-22

## APIs & External Services

**Messaging:**
- WhatsApp - Used for sending order details from the storefront to the store's business number.
  - SDK/Client: Direct URL via `https://wa.me/`
  - Implementation: `app/lib/whatsapp.ts` builds the formatted message and URL.

## Data Storage

**Databases:**
- Supabase (PostgreSQL + PostgREST) - Used as the primary CMS and order storage.
  - Connection: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
  - Client: `@supabase/supabase-js`, `@supabase/ssr`
  - Implementation: `app/lib/supabase.ts` handles client creation for both server components and service-role operations.

**File Storage:**
- Supabase Storage (implied) - Used for hosting menu item images (e.g., `imageUrl` in order items).

**Caching:**
- Next.js 15 Data Cache - Managed via `unstable_noStore` in `app/lib/storefront.ts` to ensure fresh data for menu and configuration.

## Authentication & Identity

**Auth Provider:**
- Supabase Auth - Used primarily for admin operations (implied by `createSupabaseServer` in `app/lib/supabase.ts` which uses `@supabase/ssr` to handle session cookies).
  - Implementation: Server-side client handles cookies in `app/lib/supabase.ts`.

## Monitoring & Observability

**Error Tracking:**
- Not explicitly detected in the codebase, likely relies on Vercel's built-in monitoring or console logging in development.

**Logs:**
- Server-side logging (Next.js/Vercel) for order processing and server actions.

## CI/CD & Deployment

**Hosting:**
- Vercel (implied by `vercel.json`).

**CI Pipeline:**
- Not explicitly configured in this directory, likely managed at the monorepo root.

## Environment Configuration

**Required env vars:**
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key for client-side/public access.
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key for bypassing RLS during order creation or administrative tasks.
- `NEXT_PUBLIC_WHATSAPP_NUMBER` - The business WhatsApp number to receive orders.

**Secrets location:**
- `.env.local` for development.
- Environment variables in Vercel/CI for production.

## Webhooks & Callbacks

**Incoming:**
- None detected in this storefront app (likely handled in edge functions or separate service).

**Outgoing:**
- Order redirection to WhatsApp: `app/actions.ts` generates a WhatsApp URL that the client navigates to upon order submission.

---

*Integration audit: 2026-04-22*
