'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ChefHat, Search, Sparkles } from 'lucide-react';
import { useCart } from './cart-provider';
import {
  getAddonPrice,
  getDessertPrice,
  getExtraPrice,
  getConfigValue,
  getMenuHeroImageUrl,
  getPizzaDisplayToppings,
  getPizzaPrice,
  getSizeLabel,
  getSizeName,
  getStorefrontState,
  getMenuBrowserCopy,
  money,
} from '../lib/catalog';
import type { Pizza, Size, StorefrontBundle } from '../lib/types';
import type { CSSProperties, MouseEvent } from 'react';

type FilterKey = 'all' | 'pizza' | 'addon' | 'extra' | 'dessert';
const pizzaSizes: Size[] = ['small', 'medium', 'large'];

export function MenuBrowser({ bundle }: { bundle: StorefrontBundle }) {
  const { addItem, items } = useCart();
  const [filter, setFilter] = useState<FilterKey>('all');
  const [query, setQuery] = useState('');
  const [hasFinePointer, setHasFinePointer] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const storefrontState = getStorefrontState(bundle);
  const orderingPaused = storefrontState.mode !== 'open';
  const menuCopy = getMenuBrowserCopy(bundle);
  const menuHeroTitle = getConfigValue(
    bundle.config,
    'menu_hero_title',
    'A menu that feels like a craving, not a catalog.'
  );
  const menuHeroCopy = getConfigValue(
    bundle.config,
    'menu_hero_copy',
    'Slide through the menu, find the thing that clicks, and move from discovery to checkout without breaking the mood.'
  );
  const menuSectionTitle = menuCopy.sectionTitle;
  const menuSectionCopy = menuCopy.sectionCopy;
  const menuHeroImageUrl = getMenuHeroImageUrl(bundle);
  const filters: Array<{ key: FilterKey; label: string }> = [
    { key: 'all', label: menuCopy.allFilterLabel },
    { key: 'pizza', label: menuCopy.pizzasFilterLabel },
    { key: 'addon', label: menuCopy.addonsFilterLabel },
    { key: 'extra', label: menuCopy.extrasFilterLabel },
    { key: 'dessert', label: menuCopy.dessertsFilterLabel },
  ];
  const activeFilterIndex = Math.max(0, filters.findIndex((item) => item.key === filter));

  useEffect(() => {
    const media = window.matchMedia('(hover: hover) and (pointer: fine)');
    const update = () => setHasFinePointer(media.matches);

    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  const canHover = !prefersReducedMotion && hasFinePointer;

  const pizzaCategoryOptions = useMemo(
    () => bundle.categories.filter((category) => category.type === 'pizza'),
    [bundle.categories]
  );

  const pizzaCartCounts = useMemo(() => {
    return items.reduce((acc, item) => {
      if (item.kind !== 'pizza' || !item.size) return acc;
      const current = acc.get(item.sourceId) ?? { small: 0, medium: 0, large: 0 };
      current[item.size] += item.quantity;
      acc.set(item.sourceId, current);
      return acc;
    }, new Map<string, Record<Size, number>>());
  }, [items]);

  const menuItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = (value?: string | null) => !q || (value || '').toLowerCase().includes(q);

    return {
      pizzas: bundle.pizzas.filter((item) => (filter === 'all' || filter === 'pizza') && (matches(item.name) || matches(item.description))),
      addons: bundle.addons.filter((item) => (filter === 'all' || filter === 'addon') && (matches(item.name) || matches(item.description))),
      extras: bundle.extras.filter((item) => (filter === 'all' || filter === 'extra') && matches(item.name)),
      desserts: bundle.desserts.filter((item) => (filter === 'all' || filter === 'dessert') && (matches(item.name) || matches(item.description))),
    };
  }, [bundle.addons, bundle.desserts, bundle.extras, bundle.pizzas, filter, query]);

  const totalVisible = menuItems.pizzas.length + menuItems.addons.length + menuItems.extras.length + menuItems.desserts.length;
  const countsSummary = menuCopy.countsTemplate
    .replace('{pizzas}', String(bundle.pizzas.length))
    .replace('{addons}', String(bundle.addons.length))
    .replace('{extras}', String(bundle.extras.length))
    .replace('{desserts}', String(bundle.desserts.length));

  return (
    <div className="page-wrap">
      <section className="hero-card reveal">
        <div className="hero-card__grid">
          <div>
            <span className="eyebrow">
              <Sparkles size={12} />
              {menuCopy.heroEyebrow}
            </span>
            <h1 className="hero-title">{menuHeroTitle}</h1>
            <p className="hero-copy">{menuHeroCopy}</p>

            <div className="hero-actions">
              <Link href={orderingPaused ? '/status' : '/build'} className="button">
                <ChefHat size={16} />
                {orderingPaused ? menuCopy.heroViewStatusLabel : menuCopy.heroOpenBuilderLabel}
              </Link>
              <Link href={orderingPaused ? '/contact' : '/cart'} className="button-secondary">
                {orderingPaused ? menuCopy.heroContactLabel : menuCopy.heroReviewCartLabel}
              </Link>
            </div>

            <div className="hero-grid">
              <motion.div
                className="stat-card"
                initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
                animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.12 }}
              >
                <div className="stat-card__label">{menuCopy.whatsShowingLabel}</div>
                <div className="stat-card__value">{totalVisible}</div>
                <div className="stat-card__note">{menuCopy.whatsShowingCopy}</div>
              </motion.div>
              <motion.div
                className="stat-card"
                initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
                animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.18 }}
              >
                <div className="stat-card__label">{menuCopy.pizzaMoodsLabel}</div>
                <div className="stat-card__value">{pizzaCategoryOptions.length}</div>
                <div className="stat-card__note">{menuCopy.pizzaMoodsCopy}</div>
              </motion.div>
              <motion.div
                className="stat-card"
                initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
                animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.24 }}
              >
                <div className="stat-card__label">{menuCopy.freshPairingsLabel}</div>
                <div className="stat-card__value">{bundle.toppings.length}</div>
                <div className="stat-card__note">{menuCopy.freshPairingsCopy}</div>
              </motion.div>
            </div>
          </div>

          <div className="hero-aside">
            <div className="hero-preview">
              {menuHeroImageUrl ? (
                <img
                  src={menuHeroImageUrl as string}
                  alt={bundle.pizzas[0]?.name || bundle.config.store_name || menuCopy.heroPreviewFallbackAlt}
                  className="hero-preview__image"
                />
              ) : (
                <div className="hero-preview__image hero-preview__image--empty">
                  <span>{menuCopy.heroPreviewFallbackAlt}</span>
                </div>
              )}
              <div className="hero-preview__overlay">
                <div className="hero-preview__title">{bundle.pizzas[0]?.name || menuCopy.heroPreviewFallbackTitle}</div>
                <p className="hero-preview__meta">
                  {bundle.pizzas[0]?.description || menuCopy.heroPreviewFallbackCopy}
                </p>
              </div>
            </div>
            <div className="content-card">
            <div className="notice">
              <Sparkles size={16} />
              {menuCopy.sectionCopy}
            </div>
              {orderingPaused ? (
                <div className="notice" data-tone={storefrontState.tone}>
                  <Sparkles size={16} />
                  {storefrontState.summary}
                </div>
              ) : null}
              <div className="tag-list">
                {bundle.notifications.slice(0, 4).map((note) => (
                  <span key={note.id} className="tag tag--accent">
                    {note.title}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section__header">
          <div>
            <div className="section__eyebrow">{menuCopy.menuSectionEyebrow}</div>
            <h2 className="section__title">{menuSectionTitle}</h2>
            <p className="section__copy">{menuSectionCopy}</p>
          </div>
              <div className="stack stack--end">
            <span className="badge" data-tone={storefrontState.tone}>
              {storefrontState.label}
            </span>
            <span className="muted">
              {countsSummary}
            </span>
          </div>
        </div>

        <div className="content-card">
          <div className="stack">
            <div className="field">
              <label className="field__label" htmlFor="menu-search">
                {menuCopy.searchLabel}
              </label>
              <div className="search-field">
                <Search size={16} className="search-field__icon" />
                <input
                  id="menu-search"
                  className="field__control search-field__input"
                  placeholder={menuCopy.searchPlaceholder}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </div>
            </div>

            <div className="menu-tabs menu-tabs--filters">
              <div
                className="menu-tab-indicator"
                aria-hidden="true"
                style={
                  {
                    left: `${(activeFilterIndex / filters.length) * 100}%`,
                    width: `${100 / filters.length}%`,
                  } as CSSProperties
                }
              />
              {filters.map((item, index) => (
                <motion.button
                  key={item.key}
                  type="button"
                  className="menu-tab"
                  data-active={filter === item.key}
                  onClick={() => setFilter(item.key)}
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
                  animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  whileHover={canHover ? { y: -2, scale: 1.05 } : {}}
                  whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
                >
                  {item.label}
                </motion.button>
              ))}
            </div>

            <div className="menu-grid">
              {menuItems.pizzas.map((pizza, index) => (
                <PizzaCard
                  key={pizza.id}
                  index={index}
                  bundle={bundle}
                  copy={menuCopy}
                  pizza={pizza}
                  disabled={orderingPaused || pizza.is_sold_out}
                  cartCounts={pizzaCartCounts.get(pizza.id) || { small: 0, medium: 0, large: 0 }}
                  onAdd={(size) =>
                    addItem({
                      kind: 'pizza',
                      sourceId: pizza.id,
                      name: pizza.name,
                      imageUrl: pizza.image_url,
                      size,
                      unitPrice: getPizzaPrice(pizza, size),
                      customization: { defaultSize: size },
                    })
                  }
                />
              ))}

              {menuItems.addons.map((addon, index) => (
                <SimpleCard
                  key={addon.id}
                  index={index}
                  copy={menuCopy}
                  title={addon.name}
                  description={addon.description || menuCopy.cardAddonCopy}
                  price={getAddonPrice(addon)}
                  kindLabel={menuCopy.cardAddonKindLabel}
                  tone="warning"
                  href={`/menu/${addon.slug}`}
                  disabled={orderingPaused || addon.is_sold_out}
                  onAdd={() =>
                    addItem({
                      kind: 'addon',
                      sourceId: addon.id,
                      name: addon.name,
                      imageUrl: addon.image_url,
                      unitPrice: getAddonPrice(addon),
                    })
                  }
                />
              ))}

              {menuItems.extras.map((extra, index) => (
                <SimpleCard
                  key={extra.id}
                  index={index}
                  copy={menuCopy}
                  title={extra.name}
                  description={menuCopy.cardExtraCopy}
                  price={getExtraPrice(extra, 'medium')}
                  kindLabel={menuCopy.cardExtraKindLabel}
                  tone="success"
                  href={`/menu/${extra.slug}`}
                  disabled={orderingPaused || extra.is_sold_out}
                  onAdd={() =>
                    addItem({
                      kind: 'extra',
                      sourceId: extra.id,
                      name: extra.name,
                      unitPrice: getExtraPrice(extra, 'medium'),
                      customization: { size: 'medium' },
                    })
                  }
                />
              ))}

              {menuItems.desserts.map((dessert, index) => (
                <SimpleCard
                  key={dessert.id}
                  index={index}
                  copy={menuCopy}
                  title={dessert.name}
                  description={dessert.description || menuCopy.cardDessertCopy}
                  price={getDessertPrice(dessert)}
                  kindLabel={menuCopy.cardDessertKindLabel}
                  tone="danger"
                  href={`/menu/${dessert.slug}`}
                  disabled={orderingPaused || dessert.is_sold_out}
                  onAdd={() =>
                    addItem({
                      kind: 'dessert',
                      sourceId: dessert.id,
                      name: dessert.name,
                      imageUrl: dessert.image_url,
                      unitPrice: getDessertPrice(dessert),
                    })
                  }
                />
              ))}

              {totalVisible === 0 ? (
                <EmptyMenuState
                  copy={menuCopy}
                  title={query ? menuCopy.emptyMatchesTitle : menuCopy.emptyNoneTitle}
                  body={
                    query
                      ? menuCopy.emptyMatchesBody
                      : orderingPaused
                      ? menuCopy.emptyClosedBody
                      : menuCopy.emptyOpenBody
                  }
                  actionHref={orderingPaused ? '/status' : '/build'}
                  actionLabel={orderingPaused ? menuCopy.emptyClosedAction : menuCopy.emptyOpenAction}
                />
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section__header">
          <div>
            <div className="section__eyebrow">{menuCopy.pairingsEyebrow}</div>
            <h2 className="section__title">{menuCopy.pairingsTitle}</h2>
            <p className="section__copy">{menuCopy.pairingsCopy}</p>
          </div>
        </div>
        <div className="menu-grid">
              {bundle.toppings.length ? (
            bundle.toppings.slice(0, 12).map((topping, index) => (
              <motion.div
                key={topping.id}
                className="info-card"
                initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
                whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ duration: 0.45, delay: index * 0.03 }}
                whileHover={prefersReducedMotion ? {} : { y: -4 }}
              >
                <div className="info-card__title">{topping.category}</div>
                <div className="info-card__body">{topping.name}</div>
                <div className="info-card__copy">
                  {topping.is_veg ? menuCopy.vegIngredientLabel : menuCopy.nonVegIngredientLabel}
                </div>
              </motion.div>
            ))
          ) : (
            <motion.div
              className="info-card"
              style={{ gridColumn: '1 / -1' }}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
              whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
            >
              <div className="info-card__title">{menuCopy.pairingsNoneTitle}</div>
              <div className="info-card__copy">{menuCopy.pairingsNoneCopy}</div>
            </motion.div>
          )}
        </div>
      </section>
    </div>
  );
}

function PizzaCard({
  bundle,
  copy,
  pizza,
  disabled,
  cartCounts,
  onAdd,
  index,
}: {
  bundle: StorefrontBundle;
  copy: ReturnType<typeof getMenuBrowserCopy>;
  pizza: Pizza;
  disabled: boolean;
  cartCounts: Record<Size, number>;
  onAdd: (size: Size) => void;
  index: number;
}) {
  const prefersReducedMotion = useReducedMotion();
  const [hasFinePointer, setHasFinePointer] = useState(false);
  const [size, setSize] = useState<Size>('medium');
  const toppings = getPizzaDisplayToppings(pizza);
  const price = getPizzaPrice(pizza, size);
  const [tiltX, setTiltX] = useState(0);
  const [tiltY, setTiltY] = useState(0);

  useEffect(() => {
    const media = window.matchMedia('(hover: hover) and (pointer: fine)');
    const update = () => setHasFinePointer(media.matches);

    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  const canHover = !prefersReducedMotion && hasFinePointer;

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const tiltXValue = ((x - centerX) / centerX) * 8;
    const tiltYValue = ((centerY - y) / centerY) * 8;

    setTiltX(tiltXValue);
    setTiltY(tiltYValue);
  };

  const handleMouseLeave = () => {
    if (prefersReducedMotion) return;
    setTiltX(0);
    setTiltY(0);
  };

  return (
    <motion.article
      className="product-card product-card--wide"
      initial={prefersReducedMotion ? false : { opacity: 0, y: 18, scale: 0.985 }}
      whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.24 }}
      transition={{ duration: 0.5, delay: index * 0.045 }}
      whileHover={canHover ? { y: -8, scale: 1.015 } : {}}
    >
      <div
        className="product-card__tilt"
        onMouseMove={canHover ? handleMouseMove : undefined}
        onMouseLeave={canHover ? handleMouseLeave : undefined}
        style={
          {
            '--tilt-x': `${tiltX}deg`,
            '--tilt-y': `${tiltY}deg`,
          } as CSSProperties
        }
      >
          <div className="product-card__media">
          {pizza.image_url ? (
            <motion.img
              src={pizza.image_url}
              alt={pizza.name}
              initial={prefersReducedMotion ? false : { scale: 1 }}
              whileHover={canHover ? { scale: 1.05 } : {}}
              whileTap={prefersReducedMotion ? {} : { scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            />
          ) : null}
          <div className="product-card__media-overlay">
            <div className="tag-list">
              {pizza.is_bestseller ? <span className="tag tag--accent">{copy.cardBestsellerLabel}</span> : null}
              {pizza.is_new ? <span className="tag">{copy.cardNewLabel}</span> : null}
              {pizza.is_spicy ? <span className="tag">{copy.cardSpicyLabel}</span> : null}
              {pizza.is_sold_out ? <span className="tag">{copy.cardSoldOutLabel}</span> : null}
            </div>
          </div>
        </div>
        <div className="product-card__body">
          <div className="product-card__title-row">
            <div>
              <div className="product-card__title">{pizza.name}</div>
              <div className="product-card__meta">{pizza.description || copy.cardHouseRecipeCopy}</div>
            </div>
            <span className="badge" data-tone={pizza.is_veg ? 'success' : 'neutral'}>
              {pizza.is_veg ? copy.cardVegLabel : copy.cardNonVegLabel}
            </span>
          </div>
          <div className="tag-list">
            {pizza.categories?.label ? <span className="tag">{pizza.categories.label}</span> : null}
            {toppings.map((item) => (
              <span key={item} className="tag">
                {item}
              </span>
            ))}
          </div>
          <div className="pizza-card__price-panel">
            <span className="pizza-card__eyebrow">{copy.cardSelectedPriceLabel}</span>
            <div className="pizza-card__price-value">{money(price)}</div>
            <div className="pizza-card__price-note">{copy.cardPriceNoteTemplate.replace('{size}', getSizeName(bundle, size))}</div>
          </div>
          <div className="pizza-card__size-panel">
            <span className="pizza-card__section-label">{copy.cardPickSizeLabel}</span>
            <div className="size-tabs">
              {pizzaSizes.map((item) => (
                <button
                  key={item}
                  type="button"
                  className="size-tab"
                  data-active={size === item}
                  onClick={() => setSize(item)}
                >
                  <span className="size-tab__label">{getSizeLabel(bundle, item)}</span>
                  <span className="size-tab__meta">{getSizeName(bundle, item)}</span>
                </button>
              ))}
            </div>
            <div className="pizza-card__cart-mix" aria-label={copy.cardCartAriaLabel}>
              <span className="pizza-card__section-label">{copy.cardInCartLabel}</span>
              <div className="pizza-card__cart-pills">
                {pizzaSizes.map((item) => (
                  <span key={item} className="cart-size-pill">
                    <strong>{cartCounts[item]}</strong>
                    <span>{getSizeLabel(bundle, item)}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="product-card__actions">
            <Link href={`/menu/${pizza.slug}`} className="button-secondary">
              {copy.cardDetailsLabel}
            </Link>
            <button type="button" className="button" onClick={() => onAdd(size)} disabled={disabled}>
              {disabled
                ? pizza.is_sold_out
                  ? copy.cardSoldOutLabel
                  : copy.cardOrderingPausedLabel
                : copy.cardAddTemplate.replace('{size}', getSizeName(bundle, size))}
            </button>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

function SimpleCard({
  copy,
  title,
  description,
  price,
  kindLabel,
  tone,
  href,
  disabled,
  onAdd,
  index,
}: {
  copy: ReturnType<typeof getMenuBrowserCopy>;
  title: string;
  description: string;
  price: number;
  kindLabel: string;
  tone: 'warning' | 'success' | 'danger';
  href: string;
  disabled: boolean;
  onAdd: () => void;
  index: number;
}) {
  const prefersReducedMotion = useReducedMotion();
  const [hasFinePointer, setHasFinePointer] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(hover: hover) and (pointer: fine)');
    const update = () => setHasFinePointer(media.matches);

    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  const canHover = !prefersReducedMotion && hasFinePointer;

  return (
    <motion.article
      className="product-card"
      initial={prefersReducedMotion ? false : { opacity: 0, y: 16, scale: 0.99 }}
      whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.24 }}
      transition={{ duration: 0.45, delay: index * 0.04 }}
      whileHover={canHover ? { y: -6, scale: 1.01 } : {}}
    >
      <div className="product-card__body">
        <div className="product-card__title-row">
          <div>
            <div className="tag-list">
              <span className="tag tag--accent">{kindLabel}</span>
            </div>
            <div className="product-card__title product-card__title--spaced">{title}</div>
          </div>
          <span className="badge" data-tone={tone}>
            {money(price)}
          </span>
        </div>
        <div className="product-card__meta">{description}</div>
          <div className="product-card__actions">
            <Link href={href} className="button-secondary">
            {copy.cardDetailsLabel}
            </Link>
            <button type="button" className="button" onClick={onAdd} disabled={disabled}>
            {disabled ? copy.cardOrderingPausedLabel : copy.cardAddToCartLabel}
            </button>
          </div>
        </div>
      </motion.article>
  );
}

function EmptyMenuState({
  copy,
  title,
  body,
  actionHref,
  actionLabel,
}: {
  copy: ReturnType<typeof getMenuBrowserCopy>;
  title: string;
  body: string;
  actionHref: string;
  actionLabel: string;
}) {
  return (
    <article className="info-card menu-empty-card">
      <div className="info-card__title">{title}</div>
      <div className="info-card__copy">{body}</div>
      <div className="hero-actions">
        <Link href={actionHref} className="button">
          {actionLabel}
        </Link>
        <Link href="/faq" className="button-secondary">
          {copy.learnMoreLabel}
        </Link>
      </div>
    </article>
  );
}
