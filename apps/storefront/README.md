# Storefront App

This app is the customer-facing pizza storefront.

For the full repo guide, setup notes, deployment quirks, and coding practices, see the root [README](../../README.md).

## Focus Areas

- Render the live menu and detail pages
- Keep the order flow dynamic and user friendly
- Pull text, images, and status from Supabase
- Support mobile WhatsApp handoff and desktop QR handoff
- Keep content first and utility cards below the main flow

## Development

From the repo root:

```bash
npm run dev --workspace apps/storefront
npm run build --workspace apps/storefront
npm run lint --workspace apps/storefront
```

## Important Notes

- The storefront should read curated content from Supabase whenever possible.
- Empty carts should not route into checkout.
- Open, after-hours, closed, and maintenance states all have different UI behavior.
- The top logo expects square artwork and should not stretch or crop.

