import { StorefrontShell } from '../components/storefront-shell';
import { CartCheckout } from '../components/cart-checkout';
import { fetchStorefrontBundle } from '../lib/storefront';

export const dynamic = 'force-dynamic';

export default async function CartPage() {
  const bundle = await fetchStorefrontBundle();

  return (
    <StorefrontShell bundle={bundle}>
      <CartCheckout bundle={bundle} />
    </StorefrontShell>
  );
}
