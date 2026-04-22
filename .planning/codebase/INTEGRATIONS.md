# External Integrations

**Analysis Date:** 2026-04-22

## APIs & External Services

**Backend-as-a-Service:**
- Supabase - Used for database, authentication, and file storage across the platform.
  - SDK/Client: `@supabase/supabase-js`, `@supabase/ssr`, `@supabase/auth-helpers-nextjs`
  - Auth: `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

**Communication:**
- WhatsApp - Used for order functionality.
  - Auth: `NEXT_PUBLIC_WHATSAPP_NUMBER` env var.

## Data Storage

**Databases:**
- Supabase PostgreSQL - Primary relational database for CMS content, orders, and site configuration.
  - Client: Supabase JS Client

**File Storage:**
- Supabase Storage - Used for media assets (images, etc.).

**Caching:**
- Next.js Data Cache - Built-in caching for server-side fetches.

## Authentication & Identity

**Auth Provider:**
- Supabase Auth
  - Implementation: Gated with email allowlist verification in middleware. Managed via `@supabase/ssr` in Next.js 15.

## Monitoring & Observability

**Error Tracking:**
- Not explicitly detected (likely standard console/Next.js error logging).

**Logs:**
- Supabase dashboard logs and Vercel deployment logs.

## CI/CD & Deployment

**Hosting:**
- Vercel - Configured via `vercel.json` in both `apps/admin` and `apps/storefront`.

**CI Pipeline:**
- Not explicitly detected in `.github/` (not explored), but standard Vercel integration is implied.

## Environment Configuration

**Required env vars:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_EMAIL`
- `NEXT_PUBLIC_WHATSAPP_NUMBER`

**Secrets location:**
- `.env.local` for development.
- Environment secrets in Vercel/Supabase dashboards for production.

## Webhooks & Callbacks

**Incoming:**
- Supabase Webhooks (potential, for triggering edge functions).

**Outgoing:**
- Edge Functions - `validate-order` mentioned in `apps/storefront/CLAUDE.md`.

---

*Integration audit: 2026-04-22*
