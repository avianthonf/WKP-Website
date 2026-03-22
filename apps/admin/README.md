# Admin App

This app is the CMS and operations dashboard for the WKP storefront.

For the full repo guide, setup notes, deployment quirks, and coding practices, see the root [README](../../README.md).

## Focus Areas

- Edit curated storefront settings
- Upload images and manage site copy
- Manage the live menu catalog
- Review and process orders
- Keep the admin UX simple enough for non-technical edits

## Development

From the repo root:

```bash
npm run dev --workspace apps/admin
npm run build --workspace apps/admin
npm run lint --workspace apps/admin
```

## Important Notes

- Settings must save to Supabase `site_config`.
- Image uploads use a file picker and Supabase Storage.
- Curated settings should always have storefront consumers.
- Structured values like navigation and legal blocks are JSON-backed in Supabase.

