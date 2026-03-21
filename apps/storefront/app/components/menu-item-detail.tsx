'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, BadgeCheck, ChefHat, ShoppingBag, Sparkles } from 'lucide-react';
import { getSizeLabel, getSizeName, money } from '../lib/catalog';
import type { Size } from '../lib/types';

type SizePrice = {
  size: Size;
  price: number;
};

type MenuItemDetailProps = {
  eyebrow: string;
  title: string;
  heroCopy: string;
  image?: string | null;
  previewCopy: string;
  primaryPrice: number;
  priceTitle: string;
  priceCopy: string;
  statusTitle: string;
  statusText: string;
  statusCopy: string;
  actionTitle: string;
  actionCopy: string;
  notice: string;
  toppings: string[];
  sizePrices?: SizePrice[];
  isPizza?: boolean;
  orderingPaused?: boolean;
};

const sectionMotion = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
};

export function MenuItemDetailClient({
  eyebrow,
  title,
  heroCopy,
  image,
  previewCopy,
  primaryPrice,
  priceTitle,
  priceCopy,
  statusTitle,
  statusText,
  statusCopy,
  actionTitle,
  actionCopy,
  notice,
  toppings,
  sizePrices,
  isPizza = false,
  orderingPaused = false,
}: MenuItemDetailProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="page-wrap menu-detail-shell">
      <motion.section
        className="hero-card menu-detail-hero reveal"
        initial={prefersReducedMotion ? false : 'hidden'}
        whileInView={prefersReducedMotion ? undefined : 'visible'}
        viewport={{ once: true, amount: 0.25 }}
        variants={sectionMotion}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="hero-card__grid menu-detail-hero__grid">
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
            animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.08 }}
          >
            <span className="eyebrow">
              <BadgeCheck size={12} />
              {eyebrow}
            </span>
            <h1 className="hero-title">{title}</h1>
            <p className="hero-copy">{heroCopy}</p>

            <div className="hero-actions menu-detail-hero__actions">
              <Link href="/menu" className="button-secondary">
                Back to menu
              </Link>
              <Link href={orderingPaused ? '/status' : '/cart'} className="button">
                <ShoppingBag size={16} />
                {orderingPaused ? 'View live status' : 'View cart'}
              </Link>
            </div>

            <div className="hero-grid menu-detail-hero__stats">
              <motion.div
                className="stat-card"
                initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
                animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.12 }}
              >
                <div className="stat-card__label">{priceTitle}</div>
                <div className="stat-card__value">{money(primaryPrice)}</div>
                <div className="stat-card__note">{priceCopy}</div>
              </motion.div>
              <motion.div
                className="stat-card"
                initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
                animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.18 }}
              >
                <div className="stat-card__label">{statusTitle}</div>
                <div className="stat-card__value">{orderingPaused ? 'Ordering paused' : statusText}</div>
                <div className="stat-card__note">{statusCopy}</div>
              </motion.div>
              <motion.div
                className="stat-card"
                initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
                animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.24 }}
              >
                <div className="stat-card__label">{actionTitle}</div>
                <div className="stat-card__value">{orderingPaused ? 'Status first' : 'Fast lane'}</div>
                <div className="stat-card__note">
                  {orderingPaused ? 'Ordering is paused until the store reopens.' : actionCopy}
                </div>
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            className="hero-aside menu-detail-hero__aside"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 18, scale: 0.985 }}
            animate={prefersReducedMotion ? {} : { opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.55, delay: 0.12 }}
          >
              <div className="hero-preview menu-detail-hero__preview">
                {image ? <img src={image} alt={title} className="hero-preview__image" /> : null}
                <div className="hero-preview__overlay">
                  <div className="hero-preview__title">{money(primaryPrice)}</div>
                  <p className="hero-preview__meta">{previewCopy}</p>
                </div>
              </div>

            <div className="content-card menu-detail-hero__card">
              <div className="notice">
                <ChefHat size={16} />
                {notice}
              </div>

              {isPizza && sizePrices?.length ? (
                <div className="menu-detail-price-grid">
                  {sizePrices.map((entry, index) => (
                    <motion.div
                      key={entry.size}
                      className="menu-detail-price-chip"
                      initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
                      animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: 0.08 + index * 0.05 }}
                      whileHover={prefersReducedMotion ? {} : { y: -3 }}
                    >
                      <span className="menu-detail-price-chip__label">{getSizeLabel(entry.size)}</span>
                      <span className="menu-detail-price-chip__value">{money(entry.price)}</span>
                      <span className="menu-detail-price-chip__note">{getSizeName(entry.size)}</span>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="menu-detail-mini-stack">
                  <div className="menu-detail-mini-stack__item">
                    <span className="menu-detail-mini-stack__label">Live price</span>
                    <strong>{money(primaryPrice)}</strong>
                  </div>
                  <div className="menu-detail-mini-stack__item">
                    <span className="menu-detail-mini-stack__label">Ready to add</span>
                    <strong>One tap to cart</strong>
                  </div>
                </div>
              )}

              {toppings.length ? (
                <div className="tag-list menu-detail-hero__tags">
                  {toppings.map((item) => (
                    <span key={item} className="tag tag--accent">
                      <Sparkles size={11} />
                      {item}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </motion.div>
        </div>
      </motion.section>

      <section className="info-grid menu-detail-info-grid">
        <motion.div
          className="info-card"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
          whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.4 }}
          whileHover={prefersReducedMotion ? {} : { y: -4 }}
        >
          <div className="info-card__title">{priceTitle}</div>
          <div className="info-card__body">{money(primaryPrice)}</div>
          <div className="info-card__copy">{priceCopy}</div>
        </motion.div>

        <motion.div
          className="info-card"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
          whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          whileHover={prefersReducedMotion ? {} : { y: -4 }}
        >
          <div className="info-card__title">{statusTitle}</div>
          <div className="info-card__body">{statusText}</div>
          <div className="info-card__copy">{statusCopy}</div>
        </motion.div>

        <motion.div
          className="info-card"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
          whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          whileHover={prefersReducedMotion ? {} : { y: -4 }}
        >
          <div className="info-card__title">{actionTitle}</div>
          <div className="info-card__body">
            <ArrowRight size={16} /> {orderingPaused ? 'View live status' : 'Add from menu'}
          </div>
          <div className="info-card__copy">
            {orderingPaused ? 'The kitchen is not accepting new orders at the moment.' : actionCopy}
          </div>
        </motion.div>
      </section>
    </div>
  );
}
