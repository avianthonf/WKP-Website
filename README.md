# WKP Website Monorepo

This repository contains two Next.js apps that work together:

- `apps/storefront` is the customer-facing pizza site.
- `apps/admin` is the internal CMS and operations dashboard.
- `packages/core` holds shared types, helpers, and cross-app utilities.

The product is designed so the admin controls the data, Supabase stores the source of truth, and the storefront renders almost everything from live database content.

## Quick Start

Install dependencies:

```bash
npm install
```

Run all workspaces in development:

```bash
npm run dev
```

Build everything:

```bash
npm run build
```

Lint everything:

```bash
npm run lint
```

## Workspace Commands

Run only one app when you need to focus:

```bash
npm run dev --workspace apps/admin
npm run dev --workspace apps/storefront
npm run build --workspace apps/admin
npm run build --workspace apps/storefront
```

The admin app also has:

```bash
npm run test --workspace apps/admin
npm run test:watch --workspace apps/admin
npm run test:coverage --workspace apps/admin
npm run seed:menu --workspace apps/admin
```

## Project Structure

- `apps/admin` - settings, catalog CRUD, live order management, staff, analytics, and uploads.
- `apps/storefront` - homepage, menu browsing, item detail pages, builder, cart, checkout, and public informational pages.
- `packages/core` - shared interfaces and utilities.
- `.github/workflows` - CI and Vercel deployment workflow.

## Data Model

Supabase is the backend for both apps.

### Main Tables

- `site_config` - curated storefront and admin settings.
- `pizzas`, `addons`, `extras`, `desserts`, `toppings`, `categories` - menu catalog data.
- `orders` - live order records and handoff metadata.
- supporting tables for notifications and admin workflows.

### Source of Truth Rules

- Text and image content for the storefront should come from Supabase-backed settings whenever a curated key exists.
- Admin settings should save to Supabase first, then the storefront should read the same key.
- Product/catalog data such as pizzas, toppings, addons, extras, and desserts is edited in dedicated admin screens, not in the Settings page.
- Arbitrary advanced config keys can be saved, but they only affect the storefront if a consumer exists for that key.

## Admin App

The admin app is the CMS and operations console.

### What It Controls

- store branding
- hero copy
- menu, builder, cart, about, contact, delivery, status, FAQ, privacy, terms, and 404 copy
- site images
- navigation links
- store hours and availability flags
- live order queue
- catalog CRUD
- staff and operational dashboards

### Admin Settings Behavior

- Settings save to Supabase `site_config`.
- Image fields support file picker upload and URL entry.
- Image uploads are written through a server action into Supabase Storage.
- The settings page is meant to be user friendly, not a raw JSON editor.

### Admin Quirks

- If a setting is curated, the storefront should already have a consumer for it.
- If a setting is added as a brand-new custom key in advanced config, it may save correctly but still do nothing until the storefront is taught to read it.
- The live schema must include `is_public` on `site_config`.
- JSON-backed `site_config.type` values are used for structured content blocks like navigation, FAQ, privacy, and terms.
- Image uploads can fail if the file is too large or the storage bucket is missing or misconfigured.
- The admin checkout and order views surface schedule and delivery metadata once the storefront sends it.

## Storefront App

The storefront is intentionally dynamic and should read live data instead of hardcoded text whenever possible.

### Pages

- `/home`
- `/menu`
- `/menu/[slug]`
- `/build`
- `/cart`
- `/about`
- `/contact`
- `/delivery`
- `/status`
- `/faq`
- `/privacy`
- `/terms`
- 404 state

### Storefront Behavior Rules

- If the store is open, checkout should not ask for a delivery time.
- If the store is closed by schedule but still orderable, checkout should require a scheduled time within the configured opening window.
- If the store is closed by admin or in maintenance, ordering should be blocked.
- Mobile checkout should hand off directly to WhatsApp with the order text prepared.
- Desktop checkout should show a QR handoff with an open-on-PC link.
- Delivery should request location permission first, then allow a manual address fallback.
- The WhatsApp message should include schedule and location details when they exist.

### Layout Rules

- The page experience should be content first and utility second.
- Hero or info cards should not sit above the main content if the page already has a primary list, grid, or form.
- The menu page keeps menu items first and utility copy below.
- The builder page keeps the form and summary flow clear, with the helper card below.
- The cart page keeps the cart summary above the WhatsApp handoff card.
- The storefront shell shows a floating cart button only when at least one item is in the cart.

### Storefront Quirks

- The top logo assumes square artwork. It should not stretch, crop, or overflow.
- The top bar only needs the open/closed badge, not an extra duplicate status card.
- Empty cart actions should not route directly into checkout.
- The storefront and admin image previews now use `next/image`, so the old raw image build warnings should stay gone unless a new one is introduced later.
- The store state has more than one practical mode:
  - `open`
  - `after_hours`
  - `closed`
  - `maintenance`

## Availability Logic

The live store state is derived from Supabase settings and the current time.

- `is_open = false` means the store is closed by admin.
- `site_maintenance_mode = true` means maintenance takes priority.
- When the current time is outside the configured opening window, the store enters after-hours scheduling mode.
- When the current time is inside the opening window, the storefront should show `Open now` and skip the scheduled-time prompt.

## Menu and Builder UI Rules

These pages use a content-first layout.

- The menu hero exists, but the actual menu grid comes first.
- Utility content such as explanation cards, tags, and notices belongs below the main menu content.
- The builder summary is useful, but it should sit below the main build form rather than displacing it.
- If you manually reorder JSX and also use layout CSS ordering, keep the intent clear so future edits do not fight each other.

## Deployment

The repo is deployed with Vercel as two separate projects:

- `apps/admin`
- `apps/storefront`

### Vercel Notes

- Keep the Vercel project root directory aligned with the app directory.
- Do not double-apply `apps/admin` or `apps/storefront` in both the dashboard and the CLI workflow.
- Production and preview deployments are managed by the GitHub Actions workflow in `.github/workflows/vercel-deploy.yml`.

### Common Deployment Secrets

GitHub secrets used by the workflow typically include:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_ADMIN_PROJECT_ID`
- `VERCEL_STOREFRONT_PROJECT_ID`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_EMAIL`
- `NEXT_PUBLIC_ENABLE_AUTO_LOGIN`

Vercel environment variables should include the same Supabase values for the apps that need them.

## Coding Practices

This codebase is meant to stay practical and consistent.

- Prefer TypeScript for app logic and shared helpers.
- Prefer Supabase-backed values over hardcoded copy when the content is customer visible.
- Put shared logic into `packages/core` or app-local helpers instead of repeating it in multiple components.
- Use server actions for privileged writes such as storage uploads or admin saves.
- Keep admin forms descriptive and user friendly. Editors should not need to know database internals.
- Keep layout changes intentional. Utility cards should not overshadow the primary task.
- Use `apply_patch` for manual file edits.
- Prefer `rg` for search and `rg --files` for file discovery.
- Avoid destructively rewriting unrelated changes.

## Known Quirks and Gotchas

- Build logs may show `no-img-element` warnings from Next.js. They are warnings, not failures, at present.
- Some deployment issues came from Vercel project root path mismatches. The dashboard root and the CLI working directory must agree.
- Manual order buttons should not send an empty cart to checkout.
- Storefront text is only as dynamic as the admin and Supabase settings that exist. If a key is not curated, it will not appear magically.
- The admin settings page can save image URLs, but direct uploads depend on the storage bucket and server action path being healthy.
- Geolocation may fail on devices that deny permission or do not support it. The cart flow keeps a manual address fallback for that case.

## Testing

Recommended checks before merging:

```bash
npm run build --workspace apps/admin
npm run build --workspace apps/storefront
npm run lint --workspace apps/admin
npm run lint --workspace apps/storefront
```

For type safety:

```bash
npx tsc --noEmit -p apps/admin/tsconfig.json
npx tsc --noEmit -p apps/storefront/tsconfig.json
```

## Editing Checklist

Before changing shared behavior, ask:

1. Is this data already in Supabase?
2. Does the admin expose a user friendly editor for it?
3. Does the storefront consume the same field?
4. Does the order flow still behave correctly on mobile and desktop?
5. Does the layout still keep content before utility cards?

If the answer to any of those is no, the change is probably incomplete.
