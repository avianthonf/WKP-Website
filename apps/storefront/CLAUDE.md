# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Common Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Testing
- `npm test` - Run Vitest tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage

## Architecture Overview

This is a Next.js 15 application that serves as the consumer-facing e-commerce website for We Knead Pizza.

### Technology Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Shared Dependencies**: Uses `@wkp/core` from the monorepo

### Key Features
- Dynamic content consumption from Supabase
- Site controls (maintenance mode, open/closed status)
- Edge Functions for order validation (`validate-order`)
- Graceful fallbacks when CMS data is missing
- Security features: CSP, HSTS, Permissions-Policy

### Integration Points
- Connects to Supabase for all CMS data
- Consumes content from admin dashboard via Supabase
- Uses edge middleware for security headers
- Implements site-wide CMS controls via layout components

## Development Workflow

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Setup**:
   - Copy `.env.example` to `.env.local`
   - Fill in required Supabase credentials:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY` (for admin operations)
     - `ADMIN_EMAIL` (for admin operations)

3. **Start Development Server**:
   ```bash
   npm run dev
   ```
   - Opens http://localhost:3000

4. **Testing**:
   ```bash
   npm test
   npm run test:watch
   npm run test:coverage
   ```

5. **Type Checking**:
   ```bash
   npx tsc --noEmit
   ```

6. **Linting**:
   ```bash
   npm run lint
   ```

## Important Notes

- **Security**: Never expose `SUPABASE_SERVICE_ROLE_KEY` client-side
- **Environment Validation**: Critical environment variables are validated at runtime
- **Dynamic Content**: All content is fetched from Supabase and revalidated
- **Error Boundaries**: Per-route error boundaries are implemented
- **Next.js 15**: This version has breaking changes from previous versions

## Further Reading

- Root `README.md` for comprehensive system architecture
- `cms-schema.sql` for database structure
- `next.config.mjs` for security configurations
- Edge middleware for security headers and CSP

**Note**: This application is part of a monorepo and shares code with the admin dashboard via the `@wkp/core` package.