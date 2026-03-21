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

This is a Next.js 15 application that serves as the admin dashboard for We Knead Pizza.

### Technology Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Forms**: React Hook Form with Zod validation
- **State Management**: Zustand
- **Icons**: Lucide React
- **Drag & Drop**: @dnd-kit
- **Shared Dependencies**: Uses `@wkp/core` from the monorepo

### Key Features
- Full CRUD operations for all CMS entities
- Backup and restore workflows with JSON-based exports
- Real-time driver tracking and inventory master controls
- Tabbed interface for different content types
- Modal forms for creating/editing content with validation
- Auth-helper gated with email allowlist verification in middleware

### Integration Points
- Supabase Auth for authentication
- Supabase PostgreSQL for all data storage
- Supabase Storage for media assets
- Server Actions for high-privilege operations
- Edge Functions for order validation

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
     - `SUPABASE_SERVICE_ROLE_KEY` (required for admin operations)
     - `ADMIN_EMAIL` (required for admin operations)
     - `NEXT_PUBLIC_WHATSAPP_NUMBER` (for order functionality)

3. **Start Development Server**:
   ```bash
   npm run dev
   ```
   - Opens http://localhost:3001 (or next available port)

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
- **Authentication**: Uses Supabase Auth with email allowlist verification
- **Environment Validation**: Critical environment variables are validated at runtime
- **Server Actions**: High-privilege operations use Server Actions
- **Next.js 15**: This version has breaking changes from previous versions
- **Drag & Drop**: Uses @dnd-kit for sortable functionality

## Further Reading

- Root `README.md` for comprehensive system architecture
- `cms-schema.sql` for database structure
- `next.config.mjs` for security configurations
- Edge middleware for security headers and CSP
- Server Actions for high-privilege operations

**Note**: This application is part of a monorepo and shares code with the storefront via the `@wkp/core` package.