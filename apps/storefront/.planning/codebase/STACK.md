# Technology Stack

**Analysis Date:** 2026-04-22

## Languages

**Primary:**
- TypeScript 5 - Used for the entire application codebase, providing type safety for React components, API routes, and library functions.

**Secondary:**
- CSS - Used with Tailwind CSS (implied by `globals.css` and Next.js 15 patterns) for styling.

## Runtime

**Environment:**
- Node.js (Version >= 20 implied by `@types/node`)

**Package Manager:**
- npm (Version not specified, but `package-lock.json` is typically present in this monorepo)
- Lockfile: present (implied by monorepo structure)

## Frameworks

**Core:**
- Next.js 15.2.8 - Core application framework using the App Router.
- React 19 - UI library used with Next.js.

**Testing:**
- Vitest 2.0.5 - Used for unit and integration testing.
- Cross-env 10.1.0 - Used to set environment variables across platforms during testing.

**Build/Dev:**
- Babel Plugin React Compiler 1.0.0 - Optimization for React 19.
- ESLint 9 - Linting tool for code quality.

## Key Dependencies

**Critical:**
- `@supabase/supabase-js` ^2.99.3 - Main client for interacting with Supabase services.
- `@supabase/ssr` ^0.7.0 - Supabase helper for Server-Side Rendering and Next.js App Router integration.
- `framer-motion` ^12.38.0 - Animation library used for immersive UI experiences.
- `zod` ^3.25.76 - Schema validation library used for environment variables and potentially API payloads.

**Infrastructure:**
- `@wkp/core` * - Internal monorepo package containing shared business logic, types, or utilities.
- `lucide-react` ^0.577.0 - Icon library.

## Configuration

**Environment:**
- Configured via `.env.local` (and other `.env*` files).
- Validated at runtime in `app/lib/env.ts`.
- Key configs: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.

**Build:**
- `next.config.ts` - Next.js configuration.
- `tsconfig.json` - TypeScript configuration.
- `eslint.config.mjs` - ESLint configuration.
- `vitest.config.ts` - Vitest configuration.

## Platform Requirements

**Development:**
- Node.js 20+
- Access to Supabase instance (URL and Anon Key).

**Production:**
- Vercel (implied by `vercel.json` presence and Next.js framework).

---

*Stack analysis: 2026-04-22*
