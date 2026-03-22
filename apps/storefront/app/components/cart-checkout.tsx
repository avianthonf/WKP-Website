'use client';

import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useMemo, useState, useTransition, type FormEvent } from 'react';
import { ArrowRight, CheckCircle2, PhoneCall, ShoppingBag, Trash2 } from 'lucide-react';
import { useCart } from './cart-provider';
import { createWhatsAppOrder } from '../actions';
import {
  getConfigValue,
  getCartHeroImageUrl,
  getCartCopy,
  getLinePrice,
  getMinimumOrder,
  getOpeningWindow,
  getOrderLink,
  getSizeLabel,
  getSizeName,
  getStoreName,
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
  const [handoff, setHandoff] = useState<{ orderNumber: number; whatsappUrl: string } | null>(null);
  const [deviceMode, setDeviceMode] = useState<'mobile' | 'desktop' | null>(null);
  const [isPending, startTransition] = useTransition();
  const storefrontState = getStorefrontState(bundle);
  const cartCopy = getCartCopy(bundle);

  useEffect(() => {
    const coarsePointer = window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768;
    setDeviceMode(coarsePointer ? 'mobile' : 'desktop');
  }, []);

  const minimumOrder = getMinimumOrder(bundle);
  const deliveryRequired = fulfillment === 'delivery';
  const orderingPaused = storefrontState.mode !== 'open';
  const checkoutHeroTitle = getConfigValue(bundle.config, 'cart_hero_title', 'Send the order and keep moving.');
  const checkoutHeroCopy = getConfigValue(
    bundle.config,
    'cart_hero_copy',
    'This checkout stores the order for the kitchen and prepares the final handoff after checkout.'
  );
  const checkoutPreviewTitle = getConfigValue(bundle.config, 'cart_preview_title', 'Your cart is ready');
  const checkoutPreviewCopy = getConfigValue(
    bundle.config,
    'cart_preview_copy',
    'Orders are stored in the system and prepared with the full payload intact.'
  );
  const cartHeroImageUrl = getCartHeroImageUrl(bundle);
  const checkoutHoursCopy = getConfigValue(bundle.config, 'cart_hours_copy', 'Store hours:');
  const checkoutMinimumCopy = getConfigValue(bundle.config, 'cart_minimum_copy', 'Minimum order');
  const emptyCartCopy = getConfigValue(bundle.config, 'cart_empty_copy', cartCopy.emptySummaryCopy);
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
    .map((size) => getSizeName(bundle, size));
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
            ? cartCopy.pausedMaintenanceMessage
            : cartCopy.pausedClosedMessage
        );
        return;
      }

      setStatus(cartCopy.missingCustomerMessage);
      return;
    }

    if (deliveryRequired && deliveryAddress.trim().length < 8) {
      setStatus(cartCopy.missingAddressMessage);
      return;
    }

    startTransition(async () => {
      try {
        const response = await createWhatsAppOrder({
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          fulfillment,
          deliveryAddress: deliveryRequired ? deliveryAddress.trim() : undefined,
          pickupNote: fulfillment === 'pickup' ? deliveryAddress.trim() : undefined,
          notes: notes.trim() || undefined,
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
        const shouldOpenOnMobile =
          deviceMode === 'mobile' ||
          (deviceMode === null && (window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768));

        if (shouldOpenOnMobile) {
          window.location.href = response.whatsappUrl;
          return;
        }

        setHandoff({ orderNumber: response.orderNumber, whatsappUrl: response.whatsappUrl });
        setStatus(`${cartCopy.orderNumberLabel} #${response.orderNumber} ${cartCopy.scanQrLabel}`);
      } catch (error) {
        setStatus(error instanceof Error ? error.message : cartCopy.generalErrorMessage);
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
              {getConfigValue(bundle.config, 'cart_eyebrow', 'Order checkout')}
            </span>
            <h1 className="hero-title">{checkoutHeroTitle}</h1>
            <p className="hero-copy">{checkoutHeroCopy}</p>
            <div className="hero-actions">
              {orderingPaused ? (
                <Link href="/status" className="button">
                  <PhoneCall size={16} />
                  {cartCopy.viewLiveStatusLabel}
                </Link>
              ) : (
                <Link href={getOrderLink(bundle, cartCopy.openOrderPrefillMessage)} className="button">
                  <PhoneCall size={16} />
                  {cartCopy.openOrderChatLabel}
                </Link>
              )}
              <Link href="/menu" className="button-secondary">
                {cartCopy.continueBrowsingLabel}
              </Link>
            </div>
          </div>

          <div className="hero-aside">
            <div className="hero-preview">
              {cartHeroImageUrl ? (
                <img src={cartHeroImageUrl as string} alt={cartCopy.previewImageAlt} className="hero-preview__image" />
              ) : (
                <div className="hero-preview__image hero-preview__image--empty">
                  <span>{getStoreName(bundle) || 'Live checkout'}</span>
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
                {checkoutMinimumCopy} {minimumOrder ? money(minimumOrder) : cartCopy.minimumNotSetLabel}.
              </div>
              <div className="cart-size-summary">
                <div className="pizza-card__section-label">{cartCopy.cartSizeSummaryLabel}</div>
                <div className="pizza-card__cart-pills">
                  {(['small', 'medium', 'large'] as Size[]).map((size) => (
                    <span key={size} className="cart-size-pill">
                      <strong>{pizzaSizeTotals[size]}</strong>
                      <span>{getSizeLabel(bundle, size)}</span>
                    </span>
                  ))}
                </div>
                <div className="pizza-card__price-note">
                  {pizzaTotalCount > 0
                    ? cartCopy.pizzaSummaryTemplate
                        .replace('{count}', String(pizzaTotalCount))
                        .replace('{plural}', pizzaTotalCount === 1 ? '' : 's')
                        .replace('{sizes}', pizzaSizesInCart.join(', '))
                    : cartCopy.emptySummaryCopy}
                </div>
              </div>
              {orderingPaused ? (
                <div className="notice" data-tone="warning">
                  <ShoppingBag size={16} />
                  {bundle.maintenanceMode
                    ? cartCopy.pausedMaintenanceMessage
                    : cartCopy.pausedClosedMessage}
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
                  {cartCopy.customerNameLabel}
              </label>
                <input
                  id="customerName"
                  className="field__control"
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                  placeholder={cartCopy.customerNamePlaceholder}
                />
              </div>
              <div className="field">
                <label className="field__label" htmlFor="customerPhone">
                  {cartCopy.customerPhoneLabel}
                </label>
                <input
                  id="customerPhone"
                  className="field__control"
                  value={customerPhone}
                  onChange={(event) => setCustomerPhone(event.target.value)}
                  placeholder={cartCopy.customerPhonePlaceholder}
                />
              </div>
            </div>

            <div className="field">
              <label className="field__label" htmlFor="fulfillment">
                {cartCopy.fulfillmentLabel}
              </label>
              <select
                id="fulfillment"
                className="field__select"
                value={fulfillment}
                onChange={(event) => setFulfillment(event.target.value as 'delivery' | 'pickup')}
              >
                <option value="delivery">{cartCopy.deliveryOptionLabel}</option>
                <option value="pickup">{cartCopy.pickupOptionLabel}</option>
              </select>
            </div>

            <div className="field">
              <label className="field__label" htmlFor="deliveryAddress">
                {deliveryRequired ? cartCopy.deliveryAddressLabel : cartCopy.pickupNoteLabel}
              </label>
              <textarea
                id="deliveryAddress"
                className="field__textarea"
                value={deliveryAddress}
                onChange={(event) => setDeliveryAddress(event.target.value)}
                placeholder={deliveryRequired ? cartCopy.deliveryAddressPlaceholder : cartCopy.pickupNotePlaceholder}
              />
            </div>

            <div className="field">
              <label className="field__label" htmlFor="orderNotes">
                {cartCopy.notesLabel}
              </label>
              <textarea
                id="orderNotes"
                className="field__textarea"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder={cartCopy.notesPlaceholder}
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
              animate={
                isReady && !isPending && !orderingPaused && items.length > 0
                  ? { scale: 1.02, transition: { type: 'spring', stiffness: 300, damping: 20 } }
                  : undefined
              }
            >
              {isPending ? cartCopy.sendingLabel : orderingPaused ? cartCopy.viewLiveStatusLabel : cartCopy.placeOrderLabel}
              <ArrowRight size={16} />
            </motion.button>
            <p className="footnote">
              {cartCopy.orderSavedCopy}
            </p>
          </form>

            {handoff ? (
              <motion.div
              className="content-card order-handoff"
              initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
              animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
            >
              <div className="section__eyebrow">{cartCopy.handoffTitle}</div>
              <div className="section__title checkout-summary__title">
                {cartCopy.handoffOrderPrefix}
                {handoff.orderNumber}
              </div>
              <p className="hero-copy hero-copy--tight">
                {cartCopy.scanQrLabel}
              </p>
              <div className="order-handoff__qr">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(handoff.whatsappUrl)}`}
                  alt={`${cartCopy.qrAltPrefix} ${handoff.orderNumber}`}
                  className="order-handoff__qr-image"
                />
              </div>
              <div className="hero-actions">
                <Link href={handoff.whatsappUrl} className="button-secondary" target="_blank" rel="noreferrer">
                  {cartCopy.openPcLabel}
                </Link>
                <Link href="/menu" className="button">
                  {cartCopy.backToMenuLabel}
                </Link>
              </div>
            </motion.div>
          ) : null}

          <motion.aside
            className="content-card"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
            whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.45, delay: 0.08 }}
          >
            {handoff ? (
              <div className="summary-list summary-list--spaced">
                <div className="notice" data-tone="success">
                  <CheckCircle2 size={16} />
                  {cartCopy.orderSavedLabel}
                </div>
                <div className="summary-row">
                  <span className="summary-row__label">{cartCopy.orderNumberLabel}</span>
                  <span className="summary-row__value">#{handoff.orderNumber}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-row__label">{cartCopy.nextStepLabel}</span>
                  <span className="summary-row__value">{cartCopy.nextStepCopy}</span>
                </div>
                <div className="hero-actions">
                  <Link href={handoff.whatsappUrl} className="button" target="_blank" rel="noreferrer">
                    {cartCopy.openPcLabel}
                  </Link>
                  <Link href="/status" className="button-secondary">
                    {cartCopy.viewLiveStatusLabel}
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <div className="section__eyebrow">{cartCopy.orderSummaryTitle}</div>
                <div className="section__title checkout-summary__title">{cartCopy.cartItemsLabel}</div>
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
                                {item.kind === 'pizza'
                                  ? cartCopy.itemKindPizzaLabel
                                  : item.kind === 'addon'
                                    ? cartCopy.itemKindAddonLabel
                                    : item.kind === 'extra'
                                      ? cartCopy.itemKindExtraLabel
                                      : cartCopy.itemKindDessertLabel}
                                {item.size ? ` - ${getSizeLabel(bundle, item.size)}` : ''}
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
                                    {cartCopy.removeLabel}
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
                      <span className="summary-row__label">{cartCopy.subtotalLabel}</span>
                      <span className="summary-row__value">{money(total)}</span>
                    </div>
                  </motion.div>
                  <motion.div
                    initial={prefersReducedMotion ? false : { y: 20, opacity: 0 }}
                    animate={prefersReducedMotion ? false : { y: 0, opacity: 1 }}
                    transition={{ duration: 0.4, delay: 1 * 0.06, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <div className="summary-row">
                      <span className="summary-row__label">{cartCopy.itemsLabel}</span>
                      <span className="summary-row__value">{totalItems}</span>
                    </div>
                  </motion.div>
                </div>
              </>
            )}
          </motion.aside>
        </div>
      </motion.section>
    </div>
  );
}
