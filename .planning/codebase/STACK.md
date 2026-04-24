# Technology Stack

**Analysis Date:** 2026-04-23

## Languages

**Primary:**
- TypeScript 5.x - Used across the entire monorepo (`apps/admin`, `apps/storefront`, `packages/core`) for type safety.

**Secondary:**
- SQL - Database schema definitions in `cms-schema.sql`.

## Runtime

**Environment:**
- Node.js (Version >= 20.x inferred from `@types/node`)

**Package Manager:**
- npm - Managed via root `package.json` with workspace support.
- Lockfile: `package-lock.json` present.

## Frameworks

**Core:**
- Next.js 15 (App Router) - Full-stack framework for both `apps/admin` and `apps/storefront`.
- React 19 - UI library.
- Tailwind CSS 4.x - Utility-first CSS framework.

**Testing:**
- Vitest 2.0.5 - Unit and integration testing framework.
- React Testing Library - UI testing.
- MSW (Mock Service Worker) - API mocking used in `apps/admin`.

**Build/Dev:**
- Sentry - Error tracking and performance monitoring.
- ESLint 9.x - Linting.
- PostCSS - CSS transformation.

## Key Dependencies

**Critical:**
- Supabase (supabase-js, @supabase/ssr, @supabase/auth-helpers-nextjs) - Backend-as-a-service for Auth, DB, and Storage.
- Zustand 4.5.2 - Client-side state management (used in `apps/admin` and `packages/core`).
- Zod 3.x - Schema validation for forms and API responses.

**Infrastructure:**
- Pino - Logging library.
- Framer Motion 12.x - Animation library.
- @dnd-kit - Drag and drop functionality in `apps/admin`.
- Lucide React - Icon library.
- React Hook Form 7.51.0 - Form handling in `apps/admin`.

## Configuration

**Environment:**
- Managed via `.env.local` files (not committed).
- Key variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_EMAIL`.

**Build:**
- `apps/admin/next.config.ts`: Next.js configuration for admin.
- `apps/storefront/next.config.ts`: Next.js configuration for storefront.
- `apps/admin/tsconfig.json`: TypeScript configuration.

## Platform Requirements

**Development:**
- Node.js environment with npm.
- Supabase project credentials.

**Production:**
- Vercel - Deployment platform for Next.js applications.
- Supabase - Production-tier database and authentication.

---

*Stack analysis: 2026-04-23*
