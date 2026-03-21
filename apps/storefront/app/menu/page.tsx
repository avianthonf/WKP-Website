import { StorefrontShell } from '../components/storefront-shell';
import { MenuBrowser } from '../components/menu-browser';
import { fetchStorefrontBundle } from '../lib/storefront';

export const dynamic = 'force-dynamic';

export default async function MenuPage() {
  const bundle = await fetchStorefrontBundle();

  return (
    <StorefrontShell bundle={bundle}>
      <MenuBrowser bundle={bundle} />
    </StorefrontShell>
  );
}
