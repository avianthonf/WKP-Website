'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { ArrowRight, ChefHat, Sparkles } from 'lucide-react';
import { useCart } from './cart-provider';
import {
  getConfigValue,
  getExtraPrice,
  getBuilderHeroImageUrl,
  getPizzaDisplayToppings,
  getPizzaPrice,
  getSizeName,
  getStorefrontState,
  money,
} from '../lib/catalog';
import type { Extra, Size, StorefrontBundle } from '../lib/types';

const sizes: Size[] = ['small', 'medium', 'large'];

export function PizzaBuilder({ bundle, initialPizzaSlug }: { bundle: StorefrontBundle; initialPizzaSlug?: string }) {
  const { addItem } = useCart();
  const prefersReducedMotion = useReducedMotion();
  const initialPizza = bundle.pizzas.find((pizza) => pizza.slug === initialPizzaSlug) || bundle.pizzas[0];
  const [pizzaId, setPizzaId] = useState(initialPizza?.id || '');
  const [size, setSize] = useState<Size>('medium');
  const [quantity, setQuantity] = useState(1);
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const storefrontState = getStorefrontState(bundle);
  const orderingPaused = storefrontState.mode !== 'open';
  const builderHeroTitle = getConfigValue(
    bundle.config,
    'build_hero_title',
    'Build a custom pizza without leaving the menu.'
  );
  const builderHeroImageUrl = getBuilderHeroImageUrl(bundle);
  const builderHeroCopy = getConfigValue(
    bundle.config,
    'build_hero_copy',
    'Pick a base recipe, choose a size, layer in extra toppings, then send the final order to WhatsApp with the exact details preserved in the cart.'
  );

  const pizza = bundle.pizzas.find((item) => item.id === pizzaId) || initialPizza;
  const extraItems = bundle.extras.filter((extra) => extra.is_active && !extra.is_sold_out);

  const total = useMemo(() => {
    const base = pizza ? getPizzaPrice(pizza, size) : 0;
    const extrasTotal = selectedExtras.reduce((sum, extraId) => {
      const extra = extraItems.find((item) => item.id === extraId);
      return sum + (extra ? getExtraPrice(extra, size) : 0);
    }, 0);
    return quantity * (base + extrasTotal);
  }, [extraItems, pizza, quantity, selectedExtras, size]);

  const selectedExtraRecords = selectedExtras
    .map((id) => extraItems.find((item) => item.id === id))
    .filter(Boolean) as Extra[];

  if (!pizza) {
    return (
      <section className="hero-card reveal">
        <p className="page-title">No pizzas are currently available.</p>
        <p className="page-subtitle">The menu is empty or all pizzas are disabled.</p>
      </section>
    );
  }

  return (
    <div className="page-wrap">
      <motion.section
        className="hero-card reveal"
        initial={prefersReducedMotion ? false : { opacity: 0, y: 18, scale: 0.992 }}
        animate={prefersReducedMotion ? {} : { opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="hero-card__grid">
          <div>
            <span className="eyebrow">
              <ChefHat size={12} />
              Pizza builder
            </span>
            <h1 className="hero-title">{builderHeroTitle}</h1>
            <p className="hero-copy">{builderHeroCopy}</p>
            <div className="hero-actions">
              {orderingPaused ? (
                <Link href="/status" className="button">
                  View live status
                </Link>
              ) : (
                <button
                  type="button"
                  className="button"
                  onClick={() =>
                    addItem({
                      kind: 'pizza',
                      sourceId: pizza.id,
                      name: `Custom ${pizza.name}`,
                      imageUrl: pizza.image_url,
                      size,
                      quantity,
                      unitPrice: total / Math.max(quantity, 1),
                      customization: {
                        basePizzaId: pizza.id,
                        basePizzaName: pizza.name,
                        selectedExtras,
                        size,
                        notes,
                      },
                      notes: notes || undefined,
                      extras: selectedExtraRecords.map((extra) => ({
                        id: extra.id,
                        name: extra.name,
                        price: getExtraPrice(extra, size),
                      })),
                    })
                  }
                >
                  Add custom pizza
                </button>
              )}
              <Link href="/menu" className="button-secondary">
                Back to menu
              </Link>
            </div>
          </div>
          <div className="hero-aside">
            <div className="hero-preview">
              {pizza.image_url || builderHeroImageUrl ? (
                <img
                  src={(pizza.image_url || builderHeroImageUrl) as string}
                  alt={pizza.name}
                  className="hero-preview__image"
                />
              ) : null}
              <div className="hero-preview__overlay">
                <div className="hero-preview__title">{pizza.name}</div>
                <p className="hero-preview__meta">{pizza.description || 'A live recipe from the menu.'}</p>
              </div>
            </div>
            <div className="content-card">
              <div className="notice">
                <Sparkles size={16} />
                Builder selections flow directly into the cart and WhatsApp order.
              </div>
              {orderingPaused ? (
                <div className="notice" data-tone={storefrontState.tone}>
                  <Sparkles size={16} />
                  {storefrontState.summary}
                </div>
              ) : null}
              <div className="tag-list">
                {getPizzaDisplayToppings(pizza).map((item) => (
                  <span key={item} className="tag tag--accent">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section
        className="check-panel reveal"
        initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
        animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="check-panel__grid">
          <div className="field-grid">
            <div className="field">
              <label className="field__label" htmlFor="pizza-select">
                Base pizza
              </label>
              <select
                id="pizza-select"
                className="field__select"
                value={pizza.id}
                onChange={(event) => setPizzaId(event.target.value)}
              >
                {bundle.pizzas.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="split">
              <div className="field">
                <label className="field__label">Size</label>
                <div className="menu-tabs">
                  {sizes.map((item, index) => (
                    <motion.button
                      key={item}
                      type="button"
                      className="menu-tab"
                      data-active={size === item}
                      onClick={() => setSize(item)}
                      initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
                      animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      whileHover={prefersReducedMotion ? {} : { y: -2, scale: 1.01 }}
                      whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
                    >
                      {item}
                    </motion.button>
                  ))}
                </div>
              </div>
              <div className="field">
                <label className="field__label" htmlFor="pizza-qty">
                  Quantity
                </label>
                <input
                  id="pizza-qty"
                  className="field__control"
                  type="number"
                  min={1}
                  max={12}
                  value={quantity}
                  onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))}
                />
              </div>
            </div>

            <div className="field">
              <label className="field__label">Extras</label>
              <div className="menu-tabs">
                {extraItems.map((extra, index) => {
                  const active = selectedExtras.includes(extra.id);
                  return (
                    <motion.button
                      key={extra.id}
                      type="button"
                      className="menu-tab"
                      data-active={active}
                      onClick={() =>
                        setSelectedExtras((prev) =>
                          prev.includes(extra.id)
                            ? prev.filter((value) => value !== extra.id)
                            : [...prev, extra.id]
                        )
                      }
                      initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
                      animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.04 }}
                      whileHover={prefersReducedMotion ? {} : { scale: 1.05 }}
                      whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
                    >
                      {extra.name} +{money(getExtraPrice(extra, size))}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            <div className="field">
              <label className="field__label" htmlFor="pizza-notes">
                Notes
              </label>
              <textarea
                id="pizza-notes"
                className="field__textarea"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Sauce preference, crust notes, or any special instruction"
              />
            </div>
          </div>

          <motion.aside
            className="side-panel"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
            whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.45, delay: 0.08 }}
          >
            <div className="side-panel__title">Live summary</div>
            <p className="side-panel__copy">This is the exact payload that lands in the cart and WhatsApp message.</p>
            <div className="summary-list summary-list--spaced">
              <motion.div
                initial={prefersReducedMotion ? false : { x: "100%", opacity: 0 }}
                animate={prefersReducedMotion ? false : { x: 0, opacity: 1 }}
                exit={prefersReducedMotion ? undefined : { x: "-100%", opacity: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              >
                <SummaryRow label="Base pizza" value={pizza.name} />
              </motion.div>
              <motion.div
                initial={prefersReducedMotion ? false : { x: "100%", opacity: 0 }}
                animate={prefersReducedMotion ? false : { x: 0, opacity: 1 }}
                exit={prefersReducedMotion ? undefined : { x: "-100%", opacity: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              >
                <SummaryRow label="Size" value={getSizeName(size)} />
              </motion.div>
              <motion.div
                initial={prefersReducedMotion ? false : { x: "100%", opacity: 0 }}
                animate={prefersReducedMotion ? false : { x: 0, opacity: 1 }}
                exit={prefersReducedMotion ? undefined : { x: "-100%", opacity: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              >
                <SummaryRow
                  label="Extras"
                  value={selectedExtraRecords.length ? selectedExtraRecords.map((item) => item.name).join(', ') : 'None'}
                />
              </motion.div>
              <motion.div
                initial={prefersReducedMotion ? false : { x: "100%", opacity: 0 }}
                animate={prefersReducedMotion ? false : { x: 0, opacity: 1 }}
                exit={prefersReducedMotion ? undefined : { x: "-100%", opacity: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              >
                <SummaryRow label="Quantity" value={String(quantity)} />
              </motion.div>
              <motion.div
                initial={prefersReducedMotion ? false : { x: "100%", opacity: 0 }}
                animate={prefersReducedMotion ? false : { x: 0, opacity: 1 }}
                exit={prefersReducedMotion ? undefined : { x: "-100%", opacity: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              >
                <SummaryRow label="Total" value={money(total)} accent />
              </motion.div>
            </div>
            {orderingPaused ? (
              <Link href="/status" className="button">
                View live status
                <ArrowRight size={16} />
              </Link>
            ) : (
              <button
                type="button"
                className="button"
                onClick={() =>
                  addItem({
                    kind: 'pizza',
                    sourceId: pizza.id,
                    name: `Custom ${pizza.name}`,
                    imageUrl: pizza.image_url,
                    size,
                    quantity,
                    unitPrice: total / Math.max(quantity, 1),
                    customization: {
                      basePizzaId: pizza.id,
                      basePizzaName: pizza.name,
                      selectedExtras,
                      size,
                      notes,
                    },
                    notes: notes || undefined,
                    extras: selectedExtraRecords.map((extra) => ({
                      id: extra.id,
                      name: extra.name,
                      price: getExtraPrice(extra, size),
                    })),
                  })
                }
              >
                Add to cart
                <ArrowRight size={16} />
              </button>
            )}
          </motion.aside>
        </div>
      </motion.section>
    </div>
  );
}

function SummaryRow({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="summary-row" data-accent={accent}>
      <span className="summary-row__label">{label}</span>
      <span className="summary-row__value">{value}</span>
    </div>
  );
}
