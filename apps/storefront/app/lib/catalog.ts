import type { Addon, CartLine, Dessert, Extra, Pizza, Size, StorefrontBundle } from './types';
import {
  getStoreAvailabilityFromConfig,
  getStoreTimeZoneFromConfig,
  type StoreAvailability,
  type StoreAvailabilityMode,
} from './store-hours';
import { buildWhatsAppUrl } from './whatsapp';

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
    'An editorial pizza storefront with live menu data, guided ordering, and a premium customer experience.'
  );
}

export function getThemeColor(bundle: StorefrontBundle) {
  return getConfigValue(bundle.config, 'site_theme_color', '#F5F0E8');
}

export function getDashboardLiveMode(bundle: StorefrontBundle) {
  return getConfigValue(bundle.config, 'dashboard_live_mode', 'true') !== 'false';
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
    'Hand-tossed pizza, warm sides, and a guided order flow built for real life.'
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

function getPizzaById(bundle: StorefrontBundle, pizzaId: string | null | undefined) {
  const id = (pizzaId || '').trim();
  if (!id) return null;
  return bundle.pizzas.find((item) => item.id === id) || null;
}

function resolvePizzaSelection(
  bundle: StorefrontBundle,
  selectionIds: Array<string | null | undefined>,
  excludedIds: Array<string | null | undefined> = []
) {
  const excluded = new Set(excludedIds.map((id) => (id || '').trim()).filter(Boolean));
  const selected: Pizza[] = [];
  const selectedIds = new Set<string>();

  selectionIds.forEach((selectionId) => {
    const pizza = getPizzaById(bundle, selectionId);
    if (!pizza || excluded.has(pizza.id) || selectedIds.has(pizza.id)) return;
    selected.push(pizza);
    selectedIds.add(pizza.id);
  });

  const fallback = bundle.pizzas.filter((pizza) => !excluded.has(pizza.id) && !selectedIds.has(pizza.id));
  return [...selected, ...fallback];
}

export function getHomeHeroPizza(bundle: StorefrontBundle) {
  return (
    getPizzaById(bundle, getConfigValue(bundle.config, 'home_hero_pizza_id', '')) ||
    bundle.pizzas[0] ||
    null
  );
}

export function getHomeFeaturedPizzas(bundle: StorefrontBundle) {
  const heroPizza = getHomeHeroPizza(bundle);
  const featured = resolvePizzaSelection(
    bundle,
    [
      getConfigValue(bundle.config, 'home_featured_pizza_1_id', ''),
      getConfigValue(bundle.config, 'home_featured_pizza_2_id', ''),
      getConfigValue(bundle.config, 'home_featured_pizza_3_id', ''),
      getConfigValue(bundle.config, 'home_featured_pizza_4_id', ''),
    ],
    heroPizza ? [heroPizza.id] : []
  );

  return featured.slice(0, 4);
}

export function getHomeFeaturedImageUrl(bundle: StorefrontBundle) {
  return (
    getConfigImageValue(bundle.config, 'home_feature_image_url') ||
    getConfigImageValue(bundle.config, 'hero_bg_url') ||
    getFeaturedImageUrl(bundle)
  );
}

export function getHomeHeroImageUrl(bundle: StorefrontBundle) {
  return getHomeHeroPizza(bundle)?.image_url || getHomeFeaturedImageUrl(bundle);
}

export function getHeroBackgroundImageUrl(bundle: StorefrontBundle) {
  return getConfigImageValue(bundle.config, 'hero_bg_url') || getHomeFeaturedImageUrl(bundle);
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

export function getDeliveryRadiusKm(bundle: StorefrontBundle) {
  return Number(getConfigValue(bundle.config, 'delivery_radius_km', '0')) || 0;
}

export function getOpeningWindow(bundle: StorefrontBundle) {
  const opening = getConfigValue(bundle.config, 'opening_time', '11:00');
  const closing = getConfigValue(bundle.config, 'closing_time', '23:00');
  return `${opening} - ${closing}`;
}

export function getStoreTimeZone(bundle: StorefrontBundle) {
  return getStoreTimeZoneFromConfig(bundle.config);
}

export function getStoreAvailability(bundle: StorefrontBundle, now = new Date()): StoreAvailability {
  return getStoreAvailabilityFromConfig(bundle.config, now);
}

export type StorefrontAvailability = StoreAvailabilityMode;

export type StorefrontState = {
  mode: StorefrontAvailability;
  tone: 'success' | 'warning' | 'danger';
  label: string;
  summary: string;
  orderingEnabled: boolean;
  requiresScheduledTime: boolean;
  primaryAction: {
    href: string;
    label: string;
  };
  secondaryAction: {
    href: string;
    label: string;
  };
};

export function getShellCopy(bundle: StorefrontBundle) {
  return {
    primaryNavLabel: getConfigValue(bundle.config, 'shell_primary_nav_label', 'Primary'),
    openNavigationLabel: getConfigValue(bundle.config, 'shell_open_navigation_label', 'Open navigation menu'),
    closeNavigationLabel: getConfigValue(bundle.config, 'shell_close_navigation_label', 'Close navigation menu'),
    mobileNavigationLabel: getConfigValue(bundle.config, 'shell_mobile_navigation_label', 'Mobile navigation'),
    orderChatLabel: getConfigValue(bundle.config, 'shell_order_chat_label', 'Order chat'),
    locationLabel: getConfigValue(bundle.config, 'shell_location_label', 'Location'),
    hoursLabel: getConfigValue(bundle.config, 'shell_hours_label', 'Hours'),
    orderLabel: getConfigValue(bundle.config, 'shell_order_label', 'Order'),
    syncLabel: getConfigValue(bundle.config, 'shell_sync_label', 'Control room sync'),
    liveLabel: getConfigValue(bundle.config, 'shell_live_label', 'Live'),
    pausedLabel: getConfigValue(bundle.config, 'shell_paused_label', 'Paused'),
    cartAriaLabelTemplate: getConfigValue(bundle.config, 'shell_cart_aria_label_template', 'Cart with {count} items'),
  };
}

export function getMenuBrowserCopy(bundle: StorefrontBundle) {
  return {
    heroEyebrow: getConfigValue(bundle.config, 'menu_hero_eyebrow', "Tonight's selection"),
    whatsShowingLabel: getConfigValue(bundle.config, 'menu_whats_showing_label', "What's showing"),
    whatsShowingCopy: getConfigValue(bundle.config, 'menu_whats_showing_copy', 'A live selection from the kitchen.'),
    pizzaMoodsLabel: getConfigValue(bundle.config, 'menu_pizza_moods_label', 'Pizza moods'),
    pizzaMoodsCopy: getConfigValue(bundle.config, 'menu_pizza_moods_copy', 'Each one is a different craving lane.'),
    freshPairingsLabel: getConfigValue(bundle.config, 'menu_fresh_pairings_label', 'Fresh pairings'),
    freshPairingsCopy: getConfigValue(bundle.config, 'menu_fresh_pairings_copy', 'Everything that makes the pizza sing.'),
    browseLabel: getConfigValue(bundle.config, 'menu_browse_label', 'Browse the menu'),
    learnMoreLabel: getConfigValue(bundle.config, 'menu_learn_more_label', 'Learn more'),
    searchLabel: getConfigValue(bundle.config, 'menu_search_label', 'Search'),
    searchPlaceholder: getConfigValue(bundle.config, 'menu_search_placeholder', 'Search by craving, topping, or favorite'),
    allFilterLabel: getConfigValue(bundle.config, 'menu_filter_all_label', 'All'),
    pizzasFilterLabel: getConfigValue(bundle.config, 'menu_filter_pizzas_label', 'Pizzas'),
    addonsFilterLabel: getConfigValue(bundle.config, 'menu_filter_addons_label', 'Addons'),
    dessertsFilterLabel: getConfigValue(bundle.config, 'menu_filter_desserts_label', 'Desserts'),
    vegFilterLabel: getConfigValue(bundle.config, 'menu_filter_veg_label', 'Veg'),
    nonVegFilterLabel: getConfigValue(bundle.config, 'menu_filter_nonveg_label', 'Non-veg'),
    menuSectionEyebrow: getConfigValue(bundle.config, 'menu_section_eyebrow', 'Browse the menu'),
    sectionTitle: getConfigValue(bundle.config, 'menu_section_title', 'Find the thing that feels right'),
    sectionCopy: getConfigValue(
      bundle.config,
      'menu_section_copy',
      'Search the live menu and add items with one tap. Pizzas can also be customized in the builder.'
    ),
    countsTemplate: getConfigValue(
      bundle.config,
      'menu_counts_template',
      '{pizzas} pizzas, {addons} addons, {desserts} desserts'
    ),
    emptyMatchesTitle: getConfigValue(bundle.config, 'menu_empty_matches_title', 'No matches found'),
    emptyMatchesBody: getConfigValue(bundle.config, 'menu_empty_matches_body', 'Try a different search term or clear the filters.'),
    emptyNoneTitle: getConfigValue(bundle.config, 'menu_empty_none_title', 'No menu items yet'),
    emptyOpenBody: getConfigValue(
      bundle.config,
      'menu_empty_open_body',
      'The menu is waiting for the kitchen to publish items.'
    ),
    emptyClosedBody: getConfigValue(
      bundle.config,
      'menu_empty_closed_body',
      'The menu is live, but ordering is paused until the store reopens.'
    ),
    emptyOpenAction: getConfigValue(bundle.config, 'menu_empty_open_action', 'Open builder'),
    emptyClosedAction: getConfigValue(bundle.config, 'menu_empty_closed_action', 'View live status'),
    heroOpenBuilderLabel: getConfigValue(bundle.config, 'menu_hero_open_builder_label', 'Open Builder'),
    heroViewStatusLabel: getConfigValue(bundle.config, 'menu_hero_view_status_label', 'View live status'),
    heroContactLabel: getConfigValue(bundle.config, 'menu_hero_contact_label', 'Contact us'),
    heroReviewCartLabel: getConfigValue(bundle.config, 'menu_hero_review_cart_label', 'Review Cart'),
    heroPreviewFallbackTitle: getConfigValue(bundle.config, 'menu_hero_preview_fallback_title', 'Chef Special'),
    heroPreviewFallbackCopy: getConfigValue(
      bundle.config,
      'menu_hero_preview_fallback_copy',
      'A signature bite from the kitchen right now.'
    ),
    heroPreviewFallbackAlt: getConfigValue(bundle.config, 'menu_hero_preview_fallback_alt', 'Live menu'),
    pairingsEyebrow: getConfigValue(bundle.config, 'menu_pairings_eyebrow', 'Pairings'),
    pairingsTitle: getConfigValue(bundle.config, 'menu_pairings_title', 'The little things that complete the bite'),
    pairingsCopy: getConfigValue(
      bundle.config,
      'menu_pairings_copy',
      'Toppings are shown as a live ingredient library so customers can see what rounds out the menu.'
    ),
    pairingsNoneTitle: getConfigValue(bundle.config, 'menu_pairings_none_title', 'No pairings yet'),
    pairingsNoneCopy: getConfigValue(
      bundle.config,
      'menu_pairings_none_copy',
      'The kitchen has not published pairings yet. Once they do, they will appear here.'
    ),
    vegIngredientLabel: getConfigValue(bundle.config, 'menu_ingredient_veg_label', 'Vegetarian ingredient'),
    nonVegIngredientLabel: getConfigValue(bundle.config, 'menu_ingredient_nonveg_label', 'Non-veg ingredient'),
    cardBestsellerLabel: getConfigValue(bundle.config, 'menu_card_bestseller_label', 'Bestseller'),
    cardNewLabel: getConfigValue(bundle.config, 'menu_card_new_label', 'New'),
    cardSpicyLabel: getConfigValue(bundle.config, 'menu_card_spicy_label', 'Spicy'),
    cardSoldOutLabel: getConfigValue(bundle.config, 'menu_card_soldout_label', 'Sold out'),
    cardVegLabel: getConfigValue(bundle.config, 'menu_card_veg_label', 'Veg'),
    cardNonVegLabel: getConfigValue(bundle.config, 'menu_card_nonveg_label', 'Non-veg'),
    cardSelectedPriceLabel: getConfigValue(bundle.config, 'menu_card_selected_price_label', 'Selected price'),
    cardPriceNoteTemplate: getConfigValue(bundle.config, 'menu_card_price_note_template', '{size} size, ready to add'),
    cardPickSizeLabel: getConfigValue(bundle.config, 'menu_card_pick_size_label', 'Pick a size'),
    cardInCartLabel: getConfigValue(bundle.config, 'menu_card_in_cart_label', 'In cart'),
    cardDetailsLabel: getConfigValue(bundle.config, 'menu_card_details_label', 'Details'),
    cardAddTemplate: getConfigValue(bundle.config, 'menu_card_add_template', 'Add {size}'),
    cardAddToCartLabel: getConfigValue(bundle.config, 'menu_card_add_to_cart_label', 'Add to cart'),
    cardHouseRecipeCopy: getConfigValue(bundle.config, 'menu_card_house_recipe_copy', 'House recipe from the live menu.'),
    cardAddonCopy: getConfigValue(bundle.config, 'menu_card_addon_copy', 'Flat-price side item'),
    cardDessertCopy: getConfigValue(bundle.config, 'menu_card_dessert_copy', 'Sweet finish to the meal'),
    cardAddonKindLabel: getConfigValue(bundle.config, 'menu_card_addon_kind_label', 'Addon'),
    cardDessertKindLabel: getConfigValue(bundle.config, 'menu_card_dessert_kind_label', 'Dessert'),
    cardOrderingPausedLabel: getConfigValue(bundle.config, 'menu_card_ordering_paused_label', 'Ordering paused'),
    cardCartAriaLabel: getConfigValue(bundle.config, 'menu_card_cart_aria_label', 'Pizza sizes already in cart'),
  };
}

export function getMenuDetailCopy(bundle: StorefrontBundle) {
  return {
    backToMenuLabel: getConfigValue(bundle.config, 'menu_detail_back_to_menu_label', 'Back to menu'),
    viewStatusLabel: getConfigValue(bundle.config, 'menu_detail_view_status_label', 'View live status'),
    viewCartLabel: getConfigValue(bundle.config, 'menu_detail_view_cart_label', 'View cart'),
    livePriceLabel: getConfigValue(bundle.config, 'menu_detail_live_price_label', 'Live price'),
    readyToAddLabel: getConfigValue(bundle.config, 'menu_detail_ready_to_add_label', 'Ready to add'),
    oneTapLabel: getConfigValue(bundle.config, 'menu_detail_one_tap_label', 'One tap to cart'),
    addFromMenuLabel: getConfigValue(bundle.config, 'menu_detail_add_from_menu_label', 'Add from menu'),
    orderingPausedLabel: getConfigValue(bundle.config, 'menu_detail_ordering_paused_label', 'Ordering paused'),
    statusPausedLabel: getConfigValue(bundle.config, 'menu_detail_status_paused_label', 'Ordering paused while the storefront is closed or in maintenance mode.'),
  };
}

export function getBuilderCopy(bundle: StorefrontBundle) {
  return {
    eyebrow: getConfigValue(bundle.config, 'builder_eyebrow', 'Pizza builder'),
    noPizzasTitle: getConfigValue(bundle.config, 'builder_no_pizzas_title', 'No pizzas are currently available.'),
    noPizzasBody: getConfigValue(bundle.config, 'builder_no_pizzas_body', 'The menu is empty or all pizzas are disabled.'),
    viewStatusLabel: getConfigValue(bundle.config, 'builder_view_status_label', 'View live status'),
    backToMenuLabel: getConfigValue(bundle.config, 'builder_back_to_menu_label', 'Back to menu'),
    addCustomLabel: getConfigValue(bundle.config, 'builder_add_custom_label', 'Add custom pizza'),
    noticeCopy: getConfigValue(
      bundle.config,
      'builder_notice_copy',
      'Builder selections flow directly into the cart and order handoff.'
    ),
    pausedNoticeCopy: getConfigValue(
      bundle.config,
      'builder_paused_notice_copy',
      'The storefront is paused, so builder changes will wait until the store reopens.'
    ),
    basePizzaLabel: getConfigValue(bundle.config, 'builder_base_pizza_label', 'Base pizza'),
    sizeLabel: getConfigValue(bundle.config, 'builder_size_label', 'Size'),
    quantityLabel: getConfigValue(bundle.config, 'builder_quantity_label', 'Quantity'),
    extrasLabel: getConfigValue(bundle.config, 'builder_extras_label', 'Extras'),
    notesLabel: getConfigValue(bundle.config, 'builder_notes_label', 'Notes'),
    notesPlaceholder: getConfigValue(
      bundle.config,
      'builder_notes_placeholder',
      'Sauce preference, crust notes, or any special instruction'
    ),
    previewCopy: getConfigValue(bundle.config, 'builder_preview_copy', 'A live recipe from the menu.'),
    summaryTitle: getConfigValue(bundle.config, 'builder_summary_title', 'Live summary'),
    summaryCopy: getConfigValue(
      bundle.config,
      'builder_summary_copy',
      'This is the exact payload that lands in the cart and final handoff.'
    ),
    summaryBaseLabel: getConfigValue(bundle.config, 'builder_summary_base_label', 'Base pizza'),
    summarySizeLabel: getConfigValue(bundle.config, 'builder_summary_size_label', 'Size'),
    summaryExtrasLabel: getConfigValue(bundle.config, 'builder_summary_extras_label', 'Extras'),
    summaryNoneLabel: getConfigValue(bundle.config, 'builder_summary_none_label', 'None'),
    summaryQuantityLabel: getConfigValue(bundle.config, 'builder_summary_quantity_label', 'Quantity'),
    summaryTotalLabel: getConfigValue(bundle.config, 'builder_summary_total_label', 'Total'),
    addToCartLabel: getConfigValue(bundle.config, 'builder_add_to_cart_label', 'Add to cart'),
  };
}

export function getCartCopy(bundle: StorefrontBundle) {
  return {
    viewLiveStatusLabel: getConfigValue(bundle.config, 'cart_view_live_status_label', 'View live status'),
    continueBrowsingLabel: getConfigValue(bundle.config, 'cart_continue_browsing_label', 'Continue browsing'),
    customerNameLabel: getConfigValue(bundle.config, 'cart_customer_name_label', 'Name'),
    customerPhoneLabel: getConfigValue(bundle.config, 'cart_customer_phone_label', 'Phone'),
    customerNamePlaceholder: getConfigValue(bundle.config, 'cart_customer_name_placeholder', 'Customer name'),
    customerPhonePlaceholder: getConfigValue(bundle.config, 'cart_customer_phone_placeholder', '+91 ...'),
    fulfillmentLabel: getConfigValue(bundle.config, 'cart_fulfillment_label', 'Fulfillment'),
    deliveryOptionLabel: getConfigValue(bundle.config, 'cart_delivery_option_label', 'Delivery'),
    pickupOptionLabel: getConfigValue(bundle.config, 'cart_pickup_option_label', 'Pickup'),
    deliveryAddressLabel: getConfigValue(bundle.config, 'cart_delivery_address_label', 'Delivery address'),
    pickupNoteLabel: getConfigValue(bundle.config, 'cart_pickup_note_label', 'Pickup note'),
    deliveryAddressPlaceholder: getConfigValue(
      bundle.config,
      'cart_delivery_address_placeholder',
      'House, street, landmark'
    ),
    pickupNotePlaceholder: getConfigValue(bundle.config, 'cart_pickup_note_placeholder', 'Pickup timing or note'),
    notesLabel: getConfigValue(bundle.config, 'cart_notes_label', 'Notes'),
    notesPlaceholder: getConfigValue(
      bundle.config,
      'cart_notes_placeholder',
      'Allergies, sauce preference, or timing notes'
    ),
    placeOrderLabel: getConfigValue(bundle.config, 'cart_place_order_label', 'Place order'),
    sendingLabel: getConfigValue(bundle.config, 'cart_sending_label', 'Sending...'),
    emptySummaryTitle: getConfigValue(bundle.config, 'cart_empty_summary_title', 'Your cart is empty'),
    emptySummaryCopy: getConfigValue(
      bundle.config,
      'cart_empty_summary_copy',
      'Add items from Menu or Build first.'
    ),
    orderSummaryTitle: getConfigValue(bundle.config, 'cart_order_summary_title', 'Order summary'),
    cartItemsLabel: getConfigValue(bundle.config, 'cart_items_label', 'Cart items'),
    subtotalLabel: getConfigValue(bundle.config, 'cart_subtotal_label', 'Subtotal'),
    itemsLabel: getConfigValue(bundle.config, 'cart_items_count_label', 'Items'),
    removeLabel: getConfigValue(bundle.config, 'cart_remove_label', 'Remove'),
    itemKindPizzaLabel: getConfigValue(bundle.config, 'cart_item_kind_pizza_label', 'Pizza'),
    itemKindAddonLabel: getConfigValue(bundle.config, 'cart_item_kind_addon_label', 'Addon'),
    itemKindExtraLabel: getConfigValue(bundle.config, 'cart_item_kind_extra_label', 'Extra'),
    itemKindDessertLabel: getConfigValue(bundle.config, 'cart_item_kind_dessert_label', 'Dessert'),
    orderSavedLabel: getConfigValue(bundle.config, 'cart_order_saved_label', 'The order is saved and ready to send.'),
    orderNumberLabel: getConfigValue(bundle.config, 'cart_order_number_label', 'Order number'),
    nextStepLabel: getConfigValue(bundle.config, 'cart_next_step_label', 'Next step'),
    nextStepCopy: getConfigValue(bundle.config, 'cart_next_step_copy', 'Scan the QR or open the link'),
    scanQrLabel: getConfigValue(bundle.config, 'cart_scan_qr_label', 'Scan the QR code with your phone to open the exact order message, then send it from there.'),
    openPcLabel: getConfigValue(bundle.config, 'cart_open_pc_label', 'Open on this computer'),
    backToMenuLabel: getConfigValue(bundle.config, 'cart_back_to_menu_label', 'Back to menu'),
    viewStatusLabel: getConfigValue(bundle.config, 'cart_view_status_label', 'View status'),
    handoffTitle: getConfigValue(bundle.config, 'cart_handoff_title', 'Send from your phone'),
    handoffOrderPrefix: getConfigValue(bundle.config, 'cart_handoff_order_prefix', 'Order #'),
    cartSizeSummaryLabel: getConfigValue(bundle.config, 'cart_size_summary_label', 'Pizza sizes in cart'),
    handoffReadyCopy: getConfigValue(bundle.config, 'cart_handoff_ready_copy', 'The order is saved and ready to send.'),
    handoffOpenPcCopy: getConfigValue(bundle.config, 'cart_handoff_open_pc_copy', 'Open on this computer'),
    orderSavedCopy: getConfigValue(
      bundle.config,
      'cart_order_saved_copy',
      'The order is saved for kitchen tracking and reporting before the handoff opens.'
    ),
    previewImageAlt: getConfigValue(bundle.config, 'cart_preview_image_alt', 'Live menu preview'),
    qrAltPrefix: getConfigValue(bundle.config, 'cart_qr_alt_prefix', 'QR code for order'),
    minimumNotSetLabel: getConfigValue(bundle.config, 'cart_minimum_not_set_label', 'not set'),
    pizzaSummaryTemplate: getConfigValue(
      bundle.config,
      'cart_pizza_summary_template',
      '{count} pizza{plural} across {sizes}'
    ),
    pausedMaintenanceMessage: getConfigValue(
      bundle.config,
      'cart_paused_maintenance_message',
      'Orders are paused while the storefront is in maintenance mode.'
    ),
    pausedClosedMessage: getConfigValue(
      bundle.config,
      'cart_paused_closed_message',
      'Orders are currently closed. Please try again when the store is open.'
    ),
    missingCustomerMessage: getConfigValue(
      bundle.config,
      'cart_missing_customer_message',
      'Please fill the customer details before sending the order.'
    ),
    missingAddressMessage: getConfigValue(
      bundle.config,
      'cart_missing_address_message',
      'Please add a delivery address or switch to pickup.'
    ),
    generalErrorMessage: getConfigValue(
      bundle.config,
      'cart_general_error_message',
      'We could not place the order.'
    ),
    missingStoreNameMessage: getConfigValue(
      bundle.config,
      'cart_missing_store_name_message',
      'Store name is missing. Please try again in a moment.'
    ),
    missingWhatsappNumberMessage: getConfigValue(
      bundle.config,
      'cart_missing_whatsapp_number_message',
      'Order chat is not configured yet. Please contact the store directly.'
    ),
    pickupRequestedNote: getConfigValue(bundle.config, 'cart_pickup_requested_note', 'Pickup requested'),
    whatsappHeadingLabel: getConfigValue(bundle.config, 'cart_whatsapp_heading_label', 'Order'),
    whatsappOrderNumberPrefix: getConfigValue(bundle.config, 'cart_whatsapp_order_number_prefix', '#'),
    whatsappNameLabel: getConfigValue(bundle.config, 'cart_whatsapp_name_label', 'Name'),
    whatsappFulfillmentLabel: getConfigValue(bundle.config, 'cart_whatsapp_fulfillment_label', 'Fulfillment'),
    whatsappDeliveryLabel: getConfigValue(bundle.config, 'cart_whatsapp_delivery_label', 'Delivery'),
    whatsappPickupLabel: getConfigValue(bundle.config, 'cart_whatsapp_pickup_label', 'Pickup'),
    whatsappPhoneLabel: getConfigValue(bundle.config, 'cart_whatsapp_phone_label', 'Phone'),
    whatsappAddressLabel: getConfigValue(bundle.config, 'cart_whatsapp_address_label', 'Address'),
    whatsappPickupNoteLabel: getConfigValue(bundle.config, 'cart_whatsapp_pickup_note_label', 'Pickup note'),
    whatsappNotesLabel: getConfigValue(bundle.config, 'cart_whatsapp_notes_label', 'Notes'),
    whatsappItemsHeading: getConfigValue(bundle.config, 'cart_whatsapp_items_heading', 'Items'),
    whatsappTotalLabel: getConfigValue(bundle.config, 'cart_whatsapp_total_label', 'Total'),
    whatsappCurrencyLabel: getConfigValue(bundle.config, 'cart_whatsapp_currency_label', 'INR'),
  };
}

export function getStorefrontState(bundle: StorefrontBundle): StorefrontState {
  const availability = getStoreAvailability(bundle);

  if (availability.mode === 'maintenance') {
    return {
      mode: 'maintenance',
      tone: 'warning',
      label: getConfigValue(bundle.config, 'storefront_maintenance_label', 'Maintenance mode'),
      summary: getConfigValue(
        bundle.config,
        'storefront_maintenance_summary',
        'The storefront is being updated. Browsing still works, but checkout is paused until maintenance ends.'
      ),
      orderingEnabled: false,
      requiresScheduledTime: false,
      primaryAction: {
        href: '/status',
        label: getConfigValue(bundle.config, 'storefront_maintenance_primary_label', 'View status'),
      },
      secondaryAction: {
        href: '/contact',
        label: getConfigValue(bundle.config, 'storefront_maintenance_secondary_label', 'Contact us'),
      },
    };
  }

  if (availability.mode === 'closed') {
    return {
      mode: 'closed',
      tone: 'danger',
      label: getConfigValue(bundle.config, 'storefront_closed_label', 'Closed'),
      summary: getConfigValue(
        bundle.config,
        'storefront_closed_summary',
        'Orders are closed right now. Browse the menu and check the live status for the next open window.'
      ),
      orderingEnabled: false,
      requiresScheduledTime: false,
      primaryAction: {
        href: '/status',
        label: getConfigValue(bundle.config, 'storefront_closed_primary_label', 'View status'),
      },
      secondaryAction: {
        href: '/menu',
        label: getConfigValue(bundle.config, 'storefront_closed_secondary_label', 'Browse menu'),
      },
    };
  }

  if (availability.mode === 'after_hours') {
    return {
      mode: 'after_hours',
      tone: 'warning',
      label: getConfigValue(bundle.config, 'storefront_after_hours_label', 'Closed now'),
      summary: getConfigValue(
        bundle.config,
        'storefront_after_hours_summary',
        `The kitchen is outside the live window right now, but you can still schedule an order within ${getOpeningWindow(bundle)}.`
      ),
      orderingEnabled: true,
      requiresScheduledTime: true,
      primaryAction: {
        href: '/cart',
        label: getConfigValue(bundle.config, 'storefront_after_hours_primary_label', 'Schedule order'),
      },
      secondaryAction: {
        href: '/status',
        label: getConfigValue(bundle.config, 'storefront_after_hours_secondary_label', 'View hours'),
      },
    };
  }

  return {
    mode: 'open',
    tone: 'success',
    label: getConfigValue(bundle.config, 'storefront_open_label', 'Open now'),
    summary: getConfigValue(
      bundle.config,
      'storefront_open_summary',
      `Orders are live now. Checkout is available and the live window is ${getOpeningWindow(bundle)}.`
    ),
    orderingEnabled: true,
    requiresScheduledTime: false,
    primaryAction: {
      href: '/cart',
      label: getConfigValue(bundle.config, 'storefront_open_primary_label', 'View cart'),
    },
    secondaryAction: {
      href: '/menu',
      label: getConfigValue(bundle.config, 'storefront_open_secondary_label', 'Browse menu'),
    },
  };
}

export function isOrderingPaused(bundle: StorefrontBundle) {
  return !getStorefrontState(bundle).orderingEnabled;
}

export function getSizeLabel(bundle: StorefrontBundle, size: Size) {
  return size === 'small'
    ? getConfigValue(bundle.config, 'size_small_label', 'S')
    : size === 'medium'
      ? getConfigValue(bundle.config, 'size_medium_label', 'M')
      : getConfigValue(bundle.config, 'size_large_label', 'L');
}

export function getSizeName(bundle: StorefrontBundle, size: Size) {
  return size === 'small'
    ? getConfigValue(bundle.config, 'size_small_name', 'Small')
    : size === 'medium'
      ? getConfigValue(bundle.config, 'size_medium_name', 'Medium')
      : getConfigValue(bundle.config, 'size_large_name', 'Large');
}

export function getOrderLink(bundle: StorefrontBundle, message?: string) {
  const phone = getStorePhone(bundle);
  if (!phone) return '/contact';
  return message ? buildWhatsAppUrl(phone, message) : `https://wa.me/${phone}`;
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
