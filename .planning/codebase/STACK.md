# Technology Stack

**Analysis Date:** 2026-04-22

## Languages

**Primary:**
- TypeScript 5.x - Used across the entire monorepo (`apps/admin`, `apps/storefront`, `packages/core`) for type safety.

**Secondary:**
- SQL - Database schema definitions in `cms-schema.sql` (referenced in CLAUDE.md).

## Runtime

**Environment:**
- Node.js (Version >= 20.x inferred from `@types/node`)
- Next.js 15.2.8 (React 19)

**Package Manager:**
- npm - Managed via root `package.json` with workspace support.
- Lockfile: `package-lock.json` present in root.

## Frameworks

**Core:**
- Next.js 15 (App Router) - Full-stack framework for both Admin and Storefront.
- React 19 - UI library.

**Testing:**
- Vitest 2.0.5 - Unit and integration testing framework.
- React Testing Library - UI testing.
- MSW (Mock Service Worker) - API mocking in `apps/admin`.

**Build/Dev:**
- Tailwind CSS 4.x - Utility-first CSS framework.
- Vercel - Deployment platform (inferred from `vercel.json`).

## Key Dependencies

**Critical:**
- Supabase (supabase-js, @supabase/ssr) - Primary backend-as-a-service (Auth, DB, Storage).
- Zustand 4.5.2 - State management (used in Admin).
- React Hook Form 7.51.0 - Form handling in Admin.
- Zod 3.x - Schema validation for forms and API responses.
- Framer Motion 12.x - Animation library for both apps.
- @dnd-kit - Drag and drop functionality in Admin.

**Infrastructure:**
- Lucide React - Icon library.
- React Hot Toast - Notifications in Admin dashboard.

## Configuration

**Environment:**
- Managed via `.env.local` files (not committed).
- Critical variables include `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.

**Build:**
- `next.config.ts`: Next.js configuration.
- `tsconfig.json`: TypeScript configuration.
- `eslint.config.mjs`: Linting rules.
- `vitest.config.ts`: Test runner configuration.

## Platform Requirements

**Development:**
- Node.js environment with npm.
- Supabase project for database and auth.

**Production:**
- Vercel (likely deployment target).
- Supabase (Production tier).

---

*Stack analysis: 2026-04-22*
