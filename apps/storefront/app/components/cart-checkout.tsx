'use client';

import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useMemo, useState, useTransition, type FormEvent } from 'react';
import { ArrowRight, CheckCircle2, PhoneCall, ShoppingBag, Trash2 } from 'lucide-react';
import { useCart } from './cart-provider';
import { createWhatsAppOrder } from '../actions';
import {
  getConfigValue,
  getCartHeroImageUrl,
  getLinePrice,
  getMinimumOrder,
  getOpeningWindow,
  getOrderLink,
  getSizeLabel,
  getSizeName,
  getStorefrontState,
  money,
} from '../lib/catalog';
import type { Size, StorefrontBundle } from '../lib/types';

export function CartCheckout({ bundle }: { bundle: StorefrontBundle }) {
  const { items, subtotal, totalItems, clearCart, removeItem, setQuantity } = useCart();
  const prefersReducedMotion = useReducedMotion();
  const [fulfillment, setFulfillment] = useState<'delivery' | 'pickup'>('delivery');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const storefrontState = getStorefrontState(bundle);

  const minimumOrder = getMinimumOrder(bundle);
  const deliveryRequired = fulfillment === 'delivery';
  const orderingPaused = storefrontState.mode !== 'open';
  const checkoutHeroTitle = getConfigValue(bundle.config, 'cart_hero_title', 'Send the order on WhatsApp and keep moving.');
  const checkoutHeroCopy = getConfigValue(
    bundle.config,
    'cart_hero_copy',
    'This checkout keeps WhatsApp as the primary customer action while storing the same order for kitchen visibility and reporting.'
  );
  const checkoutPreviewTitle = getConfigValue(bundle.config, 'cart_preview_title', 'Your cart is ready');
  const checkoutPreviewCopy = getConfigValue(
    bundle.config,
    'cart_preview_copy',
    'Orders are stored in the system and sent to WhatsApp with the full payload intact.'
  );
  const cartHeroImageUrl = getCartHeroImageUrl(bundle);
  const checkoutHoursCopy = getConfigValue(bundle.config, 'cart_hours_copy', 'Store hours:');
  const checkoutMinimumCopy = getConfigValue(bundle.config, 'cart_minimum_copy', 'Minimum order');
  const emptyCartCopy = getConfigValue(bundle.config, 'cart_empty_copy', 'Your cart is empty. Add items from Menu or Build first.');
  const isReady =
    items.length > 0 &&
    customerName.trim().length >= 2 &&
    customerPhone.trim().length >= 6 &&
    !orderingPaused;
  const total = useMemo(() => subtotal, [subtotal]);
  const pizzaSizeTotals = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        if (item.kind !== 'pizza' || !item.size) return acc;
        acc[item.size] += item.quantity;
        return acc;
      },
      { small: 0, medium: 0, large: 0 } as Record<Size, number>
    );
  }, [items]);
  const pizzaTotalCount = pizzaSizeTotals.small + pizzaSizeTotals.medium + pizzaSizeTotals.large;
  const pizzaSizesInCart = (['small', 'medium', 'large'] as Size[])
    .filter((size) => pizzaSizeTotals[size] > 0)
    .map((size) => getSizeName(size));
  const statusTone =
    status &&
    (status.toLowerCase().includes('could not') || status.toLowerCase().includes('paused') || status.toLowerCase().includes('closed'))
      ? 'warning'
      : 'success';

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isReady) {
      if (orderingPaused) {
        setStatus(
          bundle.maintenanceMode
            ? 'Orders are paused while the storefront is in maintenance mode.'
            : 'Orders are currently closed. Please try again when the store is open.'
        );
        return;
      }

      setStatus('Please fill the customer details before sending the order.');
      return;
    }

    if (deliveryRequired && deliveryAddress.trim().length < 8) {
      setStatus('Please add a delivery address or switch to pickup.');
      return;
    }

    startTransition(async () => {
      try {
        const response = await createWhatsAppOrder({
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          deliveryAddress: deliveryRequired ? deliveryAddress.trim() : 'Pickup order',
          notes: [notes.trim(), fulfillment === 'pickup' ? 'Pickup requested' : null].filter(Boolean).join(' - '),
          total,
          items: items.map((item) => ({
            id: item.id,
            kind: item.kind,
            sourceId: item.sourceId,
            name: item.name,
            imageUrl: item.imageUrl,
            size: item.size,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            notes: item.notes,
            extras: item.extras,
            customization: item.customization,
          })),
        });

        clearCart();
        window.location.href = response.whatsappUrl;
      } catch (error) {
        setStatus(error instanceof Error ? error.message : 'We could not place the order.');
      }
    });
  };

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
              <PhoneCall size={12} />
              {getConfigValue(bundle.config, 'cart_eyebrow', 'WhatsApp checkout')}
            </span>
            <h1 className="hero-title">{checkoutHeroTitle}</h1>
            <p className="hero-copy">{checkoutHeroCopy}</p>
            <div className="hero-actions">
              {orderingPaused ? (
                <Link href="/status" className="button">
                  <PhoneCall size={16} />
                  View live status
                </Link>
              ) : (
                <a href={getOrderLink(bundle)} className="button">
                  <PhoneCall size={16} />
                  Open WhatsApp
                </a>
              )}
              <a href="/menu" className="button-secondary">
                Continue browsing
              </a>
            </div>
          </div>

          <div className="hero-aside">
            <div className="hero-preview">
              {cartHeroImageUrl ? (
                <img src={cartHeroImageUrl as string} alt="Live menu preview" className="hero-preview__image" />
              ) : (
                <div className="hero-preview__image hero-preview__image--empty">
                  <span>{bundle.config.store_name || 'Live checkout'}</span>
                </div>
              )}
              <div className="hero-preview__overlay">
                <div className="hero-preview__title">{checkoutPreviewTitle}</div>
                <p className="hero-preview__meta">{checkoutPreviewCopy}</p>
              </div>
            </div>
            <div className="content-card">
              <div className="notice">
                <CheckCircle2 size={16} />
                {checkoutHoursCopy} {getOpeningWindow(bundle)}
              </div>
              <div className="notice" data-tone={total < minimumOrder ? 'warning' : 'success'}>
                <ShoppingBag size={16} />
                {checkoutMinimumCopy} {minimumOrder ? money(minimumOrder) : 'not set'}.
              </div>
              <div className="cart-size-summary">
                <div className="pizza-card__section-label">Pizza sizes in cart</div>
                <div className="pizza-card__cart-pills">
                  {(['small', 'medium', 'large'] as Size[]).map((size) => (
                    <span key={size} className="cart-size-pill">
                      <strong>{pizzaSizeTotals[size]}</strong>
                      <span>{getSizeLabel(size)}</span>
                    </span>
                  ))}
                </div>
                <div className="pizza-card__price-note">
                  {pizzaTotalCount > 0
                    ? `${pizzaTotalCount} pizza${pizzaTotalCount === 1 ? '' : 's'} across ${pizzaSizesInCart.join(', ')}`
                    : 'No pizzas in the cart yet'}
                </div>
              </div>
              {orderingPaused ? (
                <div className="notice" data-tone="warning">
                  <ShoppingBag size={16} />
                  {bundle.maintenanceMode
                    ? 'Checkout is paused while maintenance mode is active.'
                    : 'Checkout is paused until the store reopens.'}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section
        className="check-panel reveal"
        initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
        animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="check-panel__grid">
          <form className="field-grid" onSubmit={handleSubmit}>
            <div className="split">
              <div className="field">
                <label className="field__label" htmlFor="customerName">
                  Name
                </label>
                <input
                  id="customerName"
                  className="field__control"
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                  placeholder="Customer name"
                />
              </div>
              <div className="field">
                <label className="field__label" htmlFor="customerPhone">
                  Phone
                </label>
                <input
                  id="customerPhone"
                  className="field__control"
                  value={customerPhone}
                  onChange={(event) => setCustomerPhone(event.target.value)}
                  placeholder="+91 ..."
                />
              </div>
            </div>

            <div className="field">
              <label className="field__label" htmlFor="fulfillment">
                Fulfillment
              </label>
              <select
                id="fulfillment"
                className="field__select"
                value={fulfillment}
                onChange={(event) => setFulfillment(event.target.value as 'delivery' | 'pickup')}
              >
                <option value="delivery">Delivery</option>
                <option value="pickup">Pickup</option>
              </select>
            </div>

            <div className="field">
              <label className="field__label" htmlFor="deliveryAddress">
                {deliveryRequired ? 'Delivery address' : 'Pickup note'}
              </label>
              <textarea
                id="deliveryAddress"
                className="field__textarea"
                value={deliveryAddress}
                onChange={(event) => setDeliveryAddress(event.target.value)}
                placeholder={deliveryRequired ? 'House, street, landmark' : 'Pickup timing or note'}
              />
            </div>

            <div className="field">
              <label className="field__label" htmlFor="orderNotes">
                Notes
              </label>
              <textarea
                id="orderNotes"
                className="field__textarea"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Allergies, sauce preference, or timing notes"
              />
            </div>

            {status ? (
              <div className="notice" data-tone={statusTone} aria-live="polite">
                {status}
              </div>
            ) : null}

            <motion.button
              type={orderingPaused ? 'button' : 'submit'}
              className="button"
              disabled={!orderingPaused && (isPending || !isReady || (deliveryRequired && deliveryAddress.trim().length < 8))}
              onClick={
                orderingPaused
                  ? () => {
                      window.location.href = '/status';
                    }
                  : undefined
              }
              whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
              whileHover={prefersReducedMotion ? {} : { scale: 1.03 }}
              animate={isReady && !isPending && !orderingPaused && items.length > 0 ? { scale: 1.02, transition: { type: 'spring', stiffness: 300, damping: 20 } } : undefined}
            >
              {isPending ? 'Sending...' : orderingPaused ? 'View live status' : 'Send order on WhatsApp'}
              <ArrowRight size={16} />
            </motion.button>
            <p className="footnote">
              WhatsApp is the primary flow. The order is also persisted for kitchen tracking and reporting.
            </p>
          </form>

          <motion.aside
            className="content-card"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
            whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.45, delay: 0.08 }}
          >
            <div className="section__eyebrow">Order summary</div>
            <div className="section__title checkout-summary__title">Cart items</div>
            <div className="summary-list summary-list--spaced">
              <AnimatePresence initial={false}>
                {items.length ? (
                  items.map((item, index) => (
                    <motion.div
                      key={item.id}
                      layout
                      className="summary-row summary-row--top summary-row--cart"
                      initial={prefersReducedMotion ? false : { x: "-100%", opacity: 0 }}
                      animate={prefersReducedMotion ? false : { x: 0, opacity: 1 }}
                      exit={prefersReducedMotion ? undefined : { opacity: 0, y: -8, scale: 0.98 }}
                      transition={{ duration: 0.4, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <div className="cart-line">
                        <div className="cart-line__media" aria-hidden="true">
                          {item.imageUrl ? <img src={item.imageUrl} alt="" /> : <ShoppingBag size={14} />}
                        </div>
                        <div className="stack cart-line__content">
                          <span className="summary-row__label">{item.name}</span>
                          <span className="footnote">
                            {item.kind.charAt(0).toUpperCase() + item.kind.slice(1)}
                            {item.size ? ` - ${getSizeLabel(item.size)}` : ''}
                          </span>
                          <div className="menu-tabs cart-line__controls">
                            <motion.button
                              type="button"
                              className="menu-tab"
                              onClick={() => setQuantity(item.id, item.quantity - 1)}
                              whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
                              whileHover={prefersReducedMotion ? {} : { scale: 1.05 }}
                            >
                              -
                            </motion.button>
                            <span className="menu-tab" data-active="true">
                              {item.quantity}
                            </span>
                            <motion.button
                              type="button"
                              className="menu-tab"
                              onClick={() => setQuantity(item.id, item.quantity + 1)}
                              whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
                              whileHover={prefersReducedMotion ? {} : { scale: 1.05 }}
                            >
                              +
                            </motion.button>
                            <motion.button
                              type="button"
                              className="menu-tab"
                              onClick={() => removeItem(item.id)}
                              initial={prefersReducedMotion ? false : { width: 40 }}
                              whileHover={prefersReducedMotion ? undefined : { width: 80 }}
                              whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
                              style={{ overflow: 'hidden' }}
                            >
                              <Trash2 size={14} />
                              <motion.span
                                initial={prefersReducedMotion ? false : { opacity: 0 }}
                                animate={prefersReducedMotion ? false : { opacity: 1 }}
                                exit={prefersReducedMotion ? undefined : { opacity: 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                Remove
                              </motion.span>
                            </motion.button>
                          </div>
                        </div>
                      </div>
                      <span className="summary-row__value">{money(getLinePrice(item))}</span>
                    </motion.div>
                  ))
                ) : (
                  <motion.div
                    className="notice"
                    data-tone="warning"
                    initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
                    animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
                  >
                    {emptyCartCopy}
                  </motion.div>
                )}
              </AnimatePresence>
              <motion.div
                initial={prefersReducedMotion ? false : { y: 20, opacity: 0 }}
                animate={prefersReducedMotion ? false : { y: 0, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0 * 0.06, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="summary-row">
                  <span className="summary-row__label">Subtotal</span>
                  <span className="summary-row__value">{money(total)}</span>
                </div>
              </motion.div>
              <motion.div
                initial={prefersReducedMotion ? false : { y: 20, opacity: 0 }}
                animate={prefersReducedMotion ? false : { y: 0, opacity: 1 }}
                transition={{ duration: 0.4, delay: 1 * 0.06, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="summary-row">
                  <span className="summary-row__label">Items</span>
                  <span className="summary-row__value">{totalItems}</span>
                </div>
              </motion.div>
            </div>
          </motion.aside>
        </div>
      </motion.section>
    </div>
  );
}
