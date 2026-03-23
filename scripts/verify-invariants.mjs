import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(process.cwd());

async function load(relPath) {
  return readFile(resolve(root, relPath), 'utf8');
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function hasBucketMigration(contents, bucketName, policyPrefix) {
  return (
    contents.includes(`values ('${bucketName}'`) &&
    contents.includes(`create policy ${policyPrefix}_public_read`) &&
    contents.includes(`bucket_id = '${bucketName}'`)
  );
}

async function main() {
  const catalog = await load('apps/storefront/app/lib/catalog.ts');
  const actions = await load('apps/admin/src/app/dashboard/settings/actions.ts');
  const menuImageField = await load('apps/admin/src/components/admin/MenuImageField.tsx');
  const pizzaForm = await load('apps/admin/src/components/admin/PizzaForm.tsx');
  const addons = await load('apps/admin/src/app/dashboard/addons/AddonsClient.tsx');
  const desserts = await load('apps/admin/src/app/dashboard/desserts/DessertsClient.tsx');
  const storageMigration = await load('apps/admin/supabase/migrations/202603200002_menu_images_storage.sql');
  const brandMigration = await load('apps/admin/supabase/migrations/202603220009_brand_assets_storage.sql');

  assert(!catalog.includes("logo_url"), 'Storefront catalog still references legacy logo_url');
  assert(catalog.includes("brand_logo_image_url"), 'Storefront catalog missing brand logo image support');

  assert(actions.includes("storage.from(bucket).upload"), 'Upload helper is not bucket-aware');
  assert(actions.includes("['brand-assets', 'menu'].includes(bucket)"), 'Upload helper does not restrict buckets to brand-assets/menu');

  assert(menuImageField.includes("bucket?: 'brand-assets' | 'menu';"), 'MenuImageField is missing bucket typing');
  assert(menuImageField.includes("bucket = 'brand-assets'"), 'MenuImageField default bucket is not brand-assets');
  assert(menuImageField.includes("formData.append('bucket', bucket)"), 'MenuImageField does not forward bucket selection');

  assert(pizzaForm.includes('bucket="menu"'), 'PizzaForm does not route pizza images to the menu bucket');
  assert(addons.includes('bucket="menu"'), 'AddonsClient does not route addon images to the menu bucket');
  assert(desserts.includes('bucket="menu"'), 'DessertsClient does not route dessert images to the menu bucket');

  assert(hasBucketMigration(storageMigration, 'menu', 'menu_images'), 'Menu storage migration is missing bucket creation/policies');
  assert(hasBucketMigration(brandMigration, 'brand-assets', 'brand_assets'), 'Brand-assets migration is missing bucket creation/policies');

  console.log('Invariant checks passed.');
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
