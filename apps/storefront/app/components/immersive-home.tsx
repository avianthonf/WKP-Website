'use client';

import Link from 'next/link';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Flame, Sparkles, ShoppingBag, Wand2 } from 'lucide-react';
import { useMemo, useRef } from 'react';
import { getConfigValue, getHomeFeaturedImageUrl, money } from '../lib/catalog';
import type { StorefrontBundle } from '../lib/types';

export function ImmersiveHome({
  bundle,
  storeName,
  heroTitle,
  heroSubtitle,
  announcement,
}: {
  bundle: StorefrontBundle;
  storeName: string;
  heroTitle: string;
  heroSubtitle: string;
  announcement: string;
}) {
  const prefersReducedMotion = useReducedMotion();
  const featuredPizzas = bundle.pizzas.slice(0, 4);
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end end'],
  });
  const heroTranslateY = useTransform(scrollYProgress, [0, 1], [0, 40]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.97]);
  const heroParticles = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => ({
        id: index + 1,
        size: 4 + ((index * 3) % 6),
        top: 12 + index * 9,
        left: 8 + ((index * 17) % 74),
        delay: index * 0.35,
        duration: 6 + (index % 4) * 1.1,
        tone: index % 2 === 0 ? 'var(--accent-gold)' : 'var(--accent-copper)',
      })),
    []
  );

  const introCards = [
    {
      href: getConfigValue(bundle.config, 'home_step_1_href', '/menu'),
      title: getConfigValue(bundle.config, 'home_step_1_title', 'Crave something now'),
      copy: getConfigValue(bundle.config, 'home_step_1_copy', 'Scroll the menu and tap into a signature pizza in seconds.'),
    },
    {
      href: getConfigValue(bundle.config, 'home_step_2_href', '/build'),
      title: getConfigValue(bundle.config, 'home_step_2_title', 'Make it yours'),
      copy: getConfigValue(bundle.config, 'home_step_2_copy', 'Start with a base, add extras, and build the exact bite you want.'),
    },
    {
      href: getConfigValue(bundle.config, 'home_step_3_href', '/cart'),
      title: getConfigValue(bundle.config, 'home_step_3_title', 'Send it fast'),
      copy: getConfigValue(bundle.config, 'home_step_3_copy', 'Checkout flows straight into WhatsApp with a clean order summary.'),
    },
  ];
  const introEyebrow = getConfigValue(bundle.config, 'home_steps_eyebrow', 'Start here');
  const heroImageUrl = getHomeFeaturedImageUrl(bundle);
  const introTitle = getConfigValue(
    bundle.config,
    'home_steps_title',
    'A three-step flow people actually enjoy using'
  );
  const introCta = getConfigValue(bundle.config, 'home_steps_cta', 'View all items');
  const signatureEyebrow = getConfigValue(bundle.config, 'home_signature_eyebrow', 'Signature picks');
  const signatureTitle = getConfigValue(
    bundle.config,
    'home_signature_title',
    'Tap a favorite, feel the rhythm, and order'
  );
  const signatureCopy = getConfigValue(
    bundle.config,
    'home_signature_copy',
    'A curated line-up that feels more like browsing a chef\'s counter than a spreadsheet.'
  );
  const closingEyebrow = getConfigValue(bundle.config, 'home_closing_eyebrow', "Tonight's move");
  const closingTitle = getConfigValue(
    bundle.config,
    'home_closing_title',
    'Pick a craving and let the site do the rest'
  );
  const closingPrimary = getConfigValue(bundle.config, 'home_closing_primary_cta', 'Start with menu');
  const closingSecondary = getConfigValue(bundle.config, 'home_closing_secondary_cta', 'Build custom');

  return (
    <div className="immersive-home">
      <motion.section
        ref={heroRef}
        className="hero-card hero-card--immersive reveal"
        initial={prefersReducedMotion ? false : { opacity: 0, y: 18, scale: 0.992 }}
        animate={prefersReducedMotion ? {} : { opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        style={
          prefersReducedMotion
            ? undefined
            : {
                y: heroTranslateY,
                scale: heroScale,
                willChange: 'transform',
              }
        }
      >
        <div className="hero-card__immersive-grid">
          <div className="hero-card__copy">
            <motion.span
              className="eyebrow eyebrow--hero"
              initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
              animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
            >
              <Sparkles size={12} />
              {announcement}
            </motion.span>

            <motion.h1
              className="hero-title hero-title--immersive"
              initial={prefersReducedMotion ? false : { opacity: 0, y: 22 }}
              animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.05 }}
            >
              {heroTitle}
            </motion.h1>

            <motion.p
              className="hero-copy hero-copy--immersive"
              initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
              animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.12 }}
            >
              {heroSubtitle}
            </motion.p>

            <motion.div
              className="hero-actions hero-actions--immersive"
              initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
              animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.18 }}
            >
              <Link href="/menu" className="button button--hero">
                Browse the menu
                <ArrowRight size={16} />
              </Link>
              <Link href="/build" className="button-secondary button-secondary--hero">
                <Wand2 size={16} />
                Build your pizza
              </Link>
              <Link href="/cart" className="button-ghost button-ghost--hero">
                <ShoppingBag size={16} />
                Checkout now
              </Link>
            </motion.div>

            <motion.div
              className="hero-orbit"
              initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
              animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.22 }}
            >
              <div className="hero-orbit__item">
                <span className="hero-orbit__label">Open</span>
                <strong>{bundle.isOpen ? 'Accepting orders' : 'Closed right now'}</strong>
              </div>
              <div className="hero-orbit__item">
                <span className="hero-orbit__label">Tonight</span>
                <strong>{bundle.pizzas.length ? `${bundle.pizzas[0].name}` : storeName}</strong>
              </div>
              <div className="hero-orbit__item">
                <span className="hero-orbit__label">Minimum</span>
                <strong>{money(Number(bundle.config.min_order_amount || 0))}</strong>
              </div>
            </motion.div>
          </div>

          <motion.div
            className="hero-card__showcase"
              initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.96, y: 24 }}
              animate={prefersReducedMotion ? {} : { opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.08 }}
            >
            <div className="hero-showcase">
              <div className="hero-showcase__glow" />
              <div className="hero-showcase__card hero-showcase__card--main">
                {heroImageUrl ? (
                  <img
                    src={heroImageUrl as string}
                    alt={bundle.pizzas[0]?.name || storeName}
                    className="hero-showcase__image"
                  />
                ) : (
                  <div className="hero-showcase__image hero-showcase__image--empty">
                    <span>{storeName}</span>
                  </div>
                )}
                <div className="hero-showcase__overlay">
                  <div className="hero-showcase__eyebrow">
                    <Flame size={13} />
                    Chef&apos;s pick
                  </div>
                  <div className="hero-showcase__title">{bundle.pizzas[0]?.name || 'Signature pizza'}</div>
                  <p className="hero-showcase__copy">
                    {getConfigValue(
                      bundle.config,
                      'home_feature_copy',
                      'Rich, hot, and ready to slide from discovery to order with almost no friction.'
                    )}
                  </p>
                </div>
              </div>

              <div className="hero-showcase__stack">
                {bundle.addons.slice(0, 2).map((item, index) => (
                  <motion.div
                    key={item.id}
                    className="hero-showcase__mini"
                    initial={prefersReducedMotion ? false : { opacity: 0, x: 20 }}
                    animate={prefersReducedMotion ? {} : { opacity: 1, x: 0 }}
                    transition={{ duration: 0.45, delay: 0.18 + index * 0.08 }}
                  >
                    <span className="hero-showcase__mini-label">Pair it with</span>
                    <strong>{item.name}</strong>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {!prefersReducedMotion && (
            <div className="hero-particles" aria-hidden="true">
              {heroParticles.map((particle) => (
                <motion.span
                  key={particle.id}
                  className="hero-particle"
                  style={{
                    width: `${particle.size}px`,
                    height: `${particle.size}px`,
                    backgroundColor: particle.tone,
                    top: `${particle.top}%`,
                    left: `${particle.left}%`,
                    opacity: 0.15,
                    animation: `float ${particle.duration}s var(--ease-organic) ${particle.delay}s infinite`,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </motion.section>

      <section className="section section--immersive">
        <div className="section__header section__header--immersive">
          <div>
            <div className="section__eyebrow">{introEyebrow}</div>
            <h2 className="section__title">{introTitle}</h2>
          </div>
          <Link href="/menu" className="button-ghost button-ghost--hero">
            {introCta}
          </Link>
        </div>

        <div className="intro-grid">
          {introCards.map((item, index) => (
            <motion.div
              key={item.title}
              className="intro-card"
              initial={prefersReducedMotion ? false : { opacity: 0, y: 20, scale: 0.95 }}
              whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: index * 0.12, ease: [0.16, 1, 0.3, 1] }}
              whileHover={prefersReducedMotion ? {} : { y: -8, scale: 1.03 }}
            >
              <div className="intro-card__eyebrow">{String(index + 1).padStart(2, '0')}</div>
              <div className="intro-card__title">{item.title}</div>
              <p className="intro-card__copy">{item.copy}</p>
              <Link href={item.href} className="intro-card__link">
                Open now
                <ArrowRight size={14} />
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="section section--immersive">
        <div className="section__header section__header--immersive">
          <div>
            <div className="section__eyebrow">{signatureEyebrow}</div>
            <h2 className="section__title">{signatureTitle}</h2>
          </div>
          <div className="section__copy section__copy--tight">{signatureCopy}</div>
        </div>

        <div className="signature-rail">
          {featuredPizzas.map((pizza, index) => (
            <motion.article
              key={pizza.id}
              className="signature-card"
              initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
              whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              whileHover={prefersReducedMotion ? {} : { y: -8, scale: 1.015 }}
            >
              <div className="signature-card__media">
                {pizza.image_url ? <img src={pizza.image_url} alt={pizza.name} /> : null}
              </div>
              <div className="signature-card__body">
                <div className="signature-card__top">
                  <span className="signature-card__tag">{pizza.is_bestseller ? 'Bestseller' : 'Signature'}</span>
                  <span className="signature-card__price">{money(pizza.price_medium)}</span>
                </div>
                <div className="signature-card__title">{pizza.name}</div>
                <p className="signature-card__copy">{pizza.description || 'A crowd-pleasing favorite from the live menu.'}</p>
                <div className="signature-card__actions">
                  <Link href={`/menu/${pizza.slug}`} className="button-secondary button-secondary--hero">
                    Details
                  </Link>
                  <Link href="/cart" className="button button--hero">
                    Order
                  </Link>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="section section--immersive">
        <motion.div
          className="closing-banner"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
          whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.45 }}
        >
          <div>
            <div className="section__eyebrow">{closingEyebrow}</div>
            <h2 className="section__title">{closingTitle}</h2>
          </div>
          <div className="closing-banner__actions">
            <Link href="/menu" className="button button--hero">
              {closingPrimary}
            </Link>
            <Link href="/build" className="button-secondary button-secondary--hero">
              {closingSecondary}
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
