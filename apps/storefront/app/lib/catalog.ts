import type { Addon, CartLine, Dessert, Extra, Pizza, Size, StorefrontBundle } from './types';

export function getConfigValue(config: Record<string, string>, key: string, fallback = '') {
  return config[key] || fallback;
}

export function getConfigImageValue(config: Record<string, string>, key: string) {
  const value = getConfigValue(config, key, '').trim();
  return value || null;
}

export function getConfigBoolean(config: Record<string, string>, key: string, fallback = false) {
  const value = config[key];
  if (value === undefined || value === null || value === '') return fallback;
  return value === 'true' || value === '1';
}

export type StructuredContentBlock = {
  title: string;
  body: string;
  linkLabel?: string;
  linkHref?: string;
};

export type NavLinkItem = {
  href: string;
  label: string;
};

export function getStructuredContent(
  bundle: StorefrontBundle,
  key: string,
  fallback: StructuredContentBlock[]
) {
  const raw = getConfigValue(bundle.config, key, '');
  if (!raw) return fallback;

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return fallback;

    const blocks = parsed
      .filter((item): item is StructuredContentBlock => {
        return Boolean(
          item &&
            typeof item === 'object' &&
            typeof (item as StructuredContentBlock).title === 'string' &&
            typeof (item as StructuredContentBlock).body === 'string'
        );
      })
      .map((item) => ({
        title: item.title,
        body: item.body,
        linkLabel: typeof item.linkLabel === 'string' ? item.linkLabel : undefined,
        linkHref: typeof item.linkHref === 'string' ? item.linkHref : undefined,
      }));

    return blocks.length ? blocks : fallback;
  } catch {
    return fallback;
  }
}

export function getStoreName(bundle: StorefrontBundle) {
  return getConfigValue(
    bundle.config,
    'store_name',
    getConfigValue(bundle.config, 'hero_title', 'We Knead Pizza')
  ).replace(/\s*\|.*$/, '');
}

export function getSiteMetaTitle(bundle: StorefrontBundle) {
  return getConfigValue(
    bundle.config,
    'site_meta_title',
    `${getStoreName(bundle)} | Crafted Pizza Ordering`
  );
}

export function getSiteMetaDescription(bundle: StorefrontBundle) {
  return getConfigValue(
    bundle.config,
    'site_meta_description',
    'An editorial pizza storefront with live menu data, WhatsApp ordering, and a premium customer experience.'
  );
}

export function getThemeColor(bundle: StorefrontBundle) {
  return getConfigValue(bundle.config, 'site_theme_color', '#050403');
}

export function getStorePhone(bundle: StorefrontBundle) {
  const value = getConfigValue(bundle.config, 'whatsapp_number', '');
  return value.replace(/\D/g, '');
}

export function getHeroTitle(bundle: StorefrontBundle) {
  return getConfigValue(bundle.config, 'hero_title', 'We Knead Pizza');
}

export function getHeroSubtitle(bundle: StorefrontBundle) {
  return getConfigValue(
    bundle.config,
    'hero_subtitle',
    'Hand-tossed pizza, warm sides, and a WhatsApp-first order flow built for real life.'
  );
}

export function getAnnouncement(bundle: StorefrontBundle) {
  return getConfigValue(
    bundle.config,
    'announcement_bar',
    'Freshly made daily with premium ingredients and live order handling.'
  );
}

export function getFooterCopy(bundle: StorefrontBundle) {
  return getConfigValue(
    bundle.config,
    'footer_copy',
    'A premium storefront for pizza, crafted to feel warm, cinematic, and easy to order from.'
  );
}

export function getBrandLogoUrl(bundle: StorefrontBundle) {
  return getConfigImageValue(bundle.config, 'brand_logo_image_url');
}

export function getSupportEmail(bundle: StorefrontBundle) {
  return getConfigValue(bundle.config, 'support_email', 'hello@wkp.local');
}

export function getNavLinks(bundle: StorefrontBundle) {
  const fallback: NavLinkItem[] = [
    { href: '/home', label: 'Home' },
    { href: '/menu', label: 'Menu' },
    { href: '/build', label: 'Build' },
    { href: '/cart', label: 'Cart' },
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
  ];

  const raw = getConfigValue(bundle.config, 'nav_links', '');
  if (!raw) return fallback;

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return fallback;

    const links = parsed
      .filter(
        (item): item is NavLinkItem =>
          Boolean(item && typeof item === 'object' && typeof (item as NavLinkItem).href === 'string' && typeof (item as NavLinkItem).label === 'string')
      )
      .map((item) => ({
        href: item.href.trim() || '/',
        label: item.label.trim() || 'Link',
      }));

    return links.length ? links : fallback;
  } catch {
    return fallback;
  }
}

export function getAddressLine(bundle: StorefrontBundle) {
  const first = getConfigValue(bundle.config, 'address_line1', 'Carona, Goa');
  const second = getConfigValue(bundle.config, 'address_line2', '');
  return [first, second].filter(Boolean).join(', ');
}

export function getFeaturedImageUrl(bundle: StorefrontBundle) {
  return (
    bundle.pizzas.find((item) => item.image_url)?.image_url ||
    bundle.addons.find((item) => item.image_url)?.image_url ||
    bundle.desserts.find((item) => item.image_url)?.image_url ||
    null
  );
}

export function getHomeFeaturedImageUrl(bundle: StorefrontBundle) {
  return getConfigImageValue(bundle.config, 'home_feature_image_url') || getFeaturedImageUrl(bundle);
}

export function getMenuHeroImageUrl(bundle: StorefrontBundle) {
  return getConfigImageValue(bundle.config, 'menu_hero_image_url') || getFeaturedImageUrl(bundle);
}

export function getCartHeroImageUrl(bundle: StorefrontBundle) {
  return getConfigImageValue(bundle.config, 'cart_hero_image_url') || getFeaturedImageUrl(bundle);
}

export function getBuilderHeroImageUrl(bundle: StorefrontBundle) {
  return getConfigImageValue(bundle.config, 'builder_hero_image_url') || getFeaturedImageUrl(bundle);
}

export function getMenuDetailFallbackImageUrl(bundle: StorefrontBundle) {
  return getConfigImageValue(bundle.config, 'menu_detail_image_url') || getFeaturedImageUrl(bundle);
}

export function getMinimumOrder(bundle: StorefrontBundle) {
  return Number(getConfigValue(bundle.config, 'min_order_amount', '0')) || 0;
}

export function getOpeningWindow(bundle: StorefrontBundle) {
  const opening = getConfigValue(bundle.config, 'opening_time', '11:00');
  const closing = getConfigValue(bundle.config, 'closing_time', '23:00');
  return `${opening} - ${closing}`;
}

export type StorefrontAvailability = 'open' | 'closed' | 'maintenance';

export type StorefrontState = {
  mode: StorefrontAvailability;
  tone: 'success' | 'warning' | 'danger';
  label: string;
  summary: string;
  primaryAction: {
    href: string;
    label: string;
  };
  secondaryAction: {
    href: string;
    label: string;
  };
};

export function getStorefrontState(bundle: StorefrontBundle): StorefrontState {
  if (bundle.maintenanceMode) {
    return {
      mode: 'maintenance',
      tone: 'warning',
      label: 'Maintenance mode',
      summary:
        'The storefront is being updated. Browsing still works, but checkout is paused until maintenance ends.',
      primaryAction: {
        href: '/status',
        label: 'View status',
      },
      secondaryAction: {
        href: '/contact',
        label: 'Contact us',
      },
    };
  }

  if (!bundle.isOpen) {
    return {
      mode: 'closed',
      tone: 'danger',
      label: 'Closed',
      summary:
        'Orders are closed right now. Browse the menu and check the live status for the next open window.',
      primaryAction: {
        href: '/status',
        label: 'View status',
      },
      secondaryAction: {
        href: '/menu',
        label: 'Browse menu',
      },
    };
  }

  return {
    mode: 'open',
    tone: 'success',
    label: 'Open now',
    summary:
      `Orders are live now. Checkout is available and the live window is ${getOpeningWindow(bundle)}.`,
    primaryAction: {
      href: '/cart',
      label: 'View cart',
    },
    secondaryAction: {
      href: '/menu',
      label: 'Browse menu',
    },
  };
}

export function isOrderingPaused(bundle: StorefrontBundle) {
  return getStorefrontState(bundle).mode !== 'open';
}

export function getSizeLabel(size: Size) {
  return size === 'small' ? 'S' : size === 'medium' ? 'M' : 'L';
}

export function getSizeName(size: Size) {
  return size === 'small' ? 'Small' : size === 'medium' ? 'Medium' : 'Large';
}

export function getOrderLink(bundle: StorefrontBundle) {
  const phone = getStorePhone(bundle);
  return phone ? `https://wa.me/${phone}` : '/contact';
}

export function getPizzaPrice(pizza: Pizza, size: Size) {
  return size === 'small' ? pizza.price_small : size === 'medium' ? pizza.price_medium : pizza.price_large;
}

export function getExtraPrice(extra: Extra, size: Size) {
  return size === 'small' ? extra.price_small : size === 'medium' ? extra.price_medium : extra.price_large;
}

export function getAddonPrice(addon: Addon) {
  return addon.price;
}

export function getDessertPrice(dessert: Dessert) {
  return dessert.price;
}

export function getLinePrice(line: CartLine) {
  return line.quantity * line.unitPrice;
}

export function getPizzaDisplayToppings(pizza: Pizza) {
  return (pizza.pizza_toppings || [])
    .map((entry) => entry.toppings?.name)
    .filter(Boolean)
    .slice(0, 4) as string[];
}

export function moneyOrDash(value: number | null | undefined) {
  return value ? money(value) : 'Free';
}

export function money(value: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value || 0);
}
