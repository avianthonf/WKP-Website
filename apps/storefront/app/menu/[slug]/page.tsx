import { notFound } from 'next/navigation';
import { StorefrontShell } from '../../components/storefront-shell';
import { MenuItemDetailClient } from '../../components/menu-item-detail';
import { fetchStorefrontBundle, money } from '../../lib/storefront';
import { getConfigValue, getMenuDetailFallbackImageUrl, getPizzaDisplayToppings, getPizzaPrice } from '../../lib/catalog';

export const dynamic = 'force-dynamic';

export default async function MenuItemPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const bundle = await fetchStorefrontBundle();

  const pizza = bundle.pizzas.find((item) => item.slug === slug);
  const addon = bundle.addons.find((item) => item.slug === slug);
  const extra = bundle.extras.find((item) => item.slug === slug);
  const dessert = bundle.desserts.find((item) => item.slug === slug);

  if (!pizza && !addon && !extra && !dessert) {
    notFound();
  }

  const title = pizza?.name || addon?.name || extra?.name || dessert?.name || 'Menu item';
  const description = pizza?.description || addon?.description || dessert?.description || 'Live from the menu.';
  const image = pizza?.image_url || addon?.image_url || dessert?.image_url || getMenuDetailFallbackImageUrl(bundle);
  const price =
    pizza ? getPizzaPrice(pizza, 'medium') : addon?.price || (extra ? extra.price_medium : dessert?.price || 0);
  const detailEyebrow = getConfigValue(bundle.config, 'menu_detail_eyebrow', 'Menu detail');
  const detailCopy = getConfigValue(bundle.config, 'menu_detail_copy', 'Live from the menu.');
  const priceCopy = getConfigValue(
    bundle.config,
    'menu_detail_price_copy',
    pizza ? `Small ${money(pizza.price_small)} - Large ${money(pizza.price_large)}` : 'Price comes from the live menu.'
  );
  const statusCopy = getConfigValue(
    bundle.config,
    'menu_detail_status_copy',
    pizza ? 'Availability follows the live menu state.' : 'Tap add in the menu to keep moving.'
  );
  const actionCopy = getConfigValue(
    bundle.config,
    'menu_detail_action_copy',
    'Use the main menu or builder to add this item to your cart.'
  );
  const orderingPaused = bundle.maintenanceMode || !bundle.isOpen;

  return (
    <StorefrontShell bundle={bundle}>
      <MenuItemDetailClient
        eyebrow={detailEyebrow}
        title={title}
        heroCopy={getConfigValue(bundle.config, 'menu_detail_hero_copy', description || detailCopy)}
        image={image}
        primaryPrice={price}
        priceCopy={priceCopy}
        statusText={pizza?.is_sold_out || addon?.is_sold_out || dessert?.is_sold_out || extra?.is_sold_out ? 'Sold out' : 'Available'}
        statusCopy={orderingPaused ? 'Ordering is paused while the storefront is closed or in maintenance mode.' : statusCopy}
        actionCopy={actionCopy}
        notice={getConfigValue(
          bundle.config,
          'menu_detail_notice',
          pizza ? 'Customizable pizza with live toppings and sizes.' : 'Single menu item with one-tap add to cart.'
        )}
        toppings={pizza ? getPizzaDisplayToppings(pizza) : []}
        isPizza={Boolean(pizza)}
        orderingPaused={orderingPaused}
        sizePrices={
          pizza
            ? [
                { size: 'small', price: pizza.price_small },
                { size: 'medium', price: pizza.price_medium },
                { size: 'large', price: pizza.price_large },
              ]
            : undefined
        }
      />
    </StorefrontShell>
  );
}
