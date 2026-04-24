# External Integrations

**Analysis Date:** 2026-04-23

## APIs & External Services

**Backend-as-a-Service:**
- Supabase - Primary integration for Database, Auth, and Storage.
  - SDK/Client: `@supabase/supabase-js`, `@supabase/ssr`
  - Auth: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

**Messaging:**
- WhatsApp - Used for order notifications and handoffs.
  - Implementation: Link-based redirection via `https://wa.me/`.
  - Config: `NEXT_PUBLIC_WHATSAPP_NUMBER`

**Observability:**
- Sentry - Error tracking and performance monitoring.
  - SDK/Client: `@sentry/nextjs`
  - Config: Managed via `sentry.*.config.ts` files in each app.

**Maps:**
- Google Maps - Used for location-based order tracking.
  - Implementation: External links to `https://www.google.com/maps`.

## Data Storage

**Databases:**
- PostgreSQL (via Supabase)
  - Connection: Managed via Supabase SDK.
  - Client: `supabase-js`

**File Storage:**
- Supabase Storage - Used for menu item images and media assets.
  - SDK/Client: `supabase.storage` from `supabase-js`.

**Caching:**
- Next.js Data Cache - Built-in caching for Server Actions and Page requests.

## Authentication & Identity

**Auth Provider:**
- Supabase Auth
  - Implementation: Email/password authentication with allowlist verification in `apps/admin/src/middleware.ts`.
  - Admin access: Gated by `ADMIN_EMAIL` env var check.

## Monitoring & Observability

**Error Tracking:**
- Sentry - Integrated into both `apps/admin` and `apps/storefront`.

**Logs:**
- Pino - Structured logging used server-side.
- Sentry - Distributed tracing and error logging.

## CI/CD & Deployment

**Hosting:**
- Vercel - Configured via `vercel.json` in `apps/admin` and `apps/storefront`.

**CI Pipeline:**
- Not explicitly detected, likely using Vercel's built-in Git integration.

## Environment Configuration

**Required env vars:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (Server-only)
- `ADMIN_EMAIL`
- `NEXT_PUBLIC_WHATSAPP_NUMBER`

**Secrets location:**
- `.env.local` files for development.
- Vercel Environment Variables for production.

## Webhooks & Callbacks

**Incoming:**
- Not detected (Supabase Webhooks may be configured in the Supabase dashboard but not visible in frontend code).

**Outgoing:**
- Edge Functions: `validate-order` mentioned in `apps/storefront/CLAUDE.md`.

---

*Integration audit: 2026-04-23*
