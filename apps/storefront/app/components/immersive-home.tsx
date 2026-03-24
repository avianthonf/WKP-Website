'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Flame, Sparkles, ShoppingBag, Wand2 } from 'lucide-react';
import { useEffect, useMemo, useRef } from 'react';
import { useCart } from './cart-provider';
import {
  getConfigValue,
  getHomeHeroBackgroundImageUrl,
  getHomeHeroBackgroundMediaType,
  getHomeHeroBackgroundVideoUrl,
  getHomeFeaturedPizzas,
  getHomeHeroImageUrl,
  getHomeHeroPizza,
  getStorefrontState,
  money,
} from '../lib/catalog';
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
  const { totalItems } = useCart();
  const heroPizza = getHomeHeroPizza(bundle);
  const featuredPizzas = getHomeFeaturedPizzas(bundle);
  const storefrontState = getStorefrontState(bundle);
  const orderingAvailable = storefrontState.orderingEnabled;
  const isOpenNow = storefrontState.mode === 'open';
  const isAfterHours = storefrontState.mode === 'after_hours';
  const hasItemsInCart = totalItems > 0;
  const orderPrimaryHref = orderingAvailable ? (hasItemsInCart ? '/cart' : '/menu') : '/status';
  const orderPrimaryLabel = orderingAvailable
    ? isOpenNow
      ? hasItemsInCart
        ? getConfigValue(bundle.config, 'home_hero_checkout_label', 'Checkout now')
        : getConfigValue(bundle.config, 'home_hero_menu_label', 'Browse the menu')
      : isAfterHours
        ? hasItemsInCart
          ? getConfigValue(bundle.config, 'home_hero_after_hours_label', 'Schedule order')
          : getConfigValue(bundle.config, 'home_hero_menu_label', 'Browse the menu')
        : getConfigValue(bundle.config, 'home_feature_paused_label', 'View live status')
    : getConfigValue(bundle.config, 'home_feature_paused_label', 'View live status');
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

  const heroImageUrl = getHomeHeroImageUrl(bundle);
  const heroBackgroundImageUrl = getHomeHeroBackgroundImageUrl(bundle);
  const heroBackgroundMediaType = getHomeHeroBackgroundMediaType(bundle);
  const heroBackgroundVideoUrl = getHomeHeroBackgroundVideoUrl(bundle);
  const showHeroBackgroundImage = prefersReducedMotion || heroBackgroundMediaType !== 'video' || !heroBackgroundVideoUrl;
  const isHeroVideoMode = !showHeroBackgroundImage && heroBackgroundMediaType === 'video' && !!heroBackgroundVideoUrl;
  const featurePrimaryLabel = orderPrimaryLabel;
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
        className={`hero-card hero-card--immersive reveal${isHeroVideoMode ? ' hero-card--video' : ''}`}
        initial={prefersReducedMotion ? false : { opacity: 0, y: 18, scale: 0.992 }}
        animate={prefersReducedMotion ? {} : { opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        style={
          prefersReducedMotion || isHeroVideoMode
            ? showHeroBackgroundImage
              ? {
                  backgroundImage: `linear-gradient(135deg, rgba(247, 241, 231, 0.92), rgba(247, 241, 231, 0.76)), url(${heroBackgroundImageUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }
              : undefined
            : {
                y: heroTranslateY,
                scale: heroScale,
                willChange: 'transform',
                ...(showHeroBackgroundImage
                  ? {
                      backgroundImage: `linear-gradient(135deg, rgba(247, 241, 231, 0.92), rgba(247, 241, 231, 0.76)), url(${heroBackgroundImageUrl})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }
                  : {}),
              }
        }
      >
        {!showHeroBackgroundImage && heroBackgroundMediaType === 'video' && heroBackgroundVideoUrl ? (
          <>
            <HeroLoopingVideo
              src={heroBackgroundVideoUrl}
              poster={heroBackgroundImageUrl || undefined}
            />
            <div
              className="hero-card__media-overlay"
              aria-hidden="true"
            />
          </>
        ) : null}

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
                {getConfigValue(bundle.config, 'home_hero_menu_label', 'Browse the menu')}
                <ArrowRight size={16} />
              </Link>
              <Link href="/build" className="button-secondary button-secondary--hero">
                <Wand2 size={16} />
                {getConfigValue(bundle.config, 'home_hero_build_label', 'Build your pizza')}
              </Link>
              <Link href={orderPrimaryHref} className="button-ghost button-ghost--hero">
                <ShoppingBag size={16} />
                {orderPrimaryLabel}
              </Link>
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
                  <Image
                    src={heroImageUrl as string}
                    alt={heroPizza?.name || storeName}
                    fill
                    sizes="(max-width: 768px) 100vw, 36vw"
                    className="hero-showcase__image"
                  />
                ) : (
                  <div className="hero-showcase__image hero-showcase__image--empty">
                    <span>{storeName}</span>
                  </div>
                )}
              </div>
              <div className="hero-showcase__overlay">
                <div className="hero-showcase__eyebrow">
                  <Flame size={13} />
                  {getConfigValue(bundle.config, 'home_feature_eyebrow_label', "Chef's pick")}
                </div>
                <div className="hero-showcase__title">
                  {heroPizza?.name || getConfigValue(bundle.config, 'home_feature_fallback_title', 'Signature pizza')}
                </div>
                <p className="hero-showcase__copy">
                  {heroPizza?.description ||
                    getConfigValue(
                      bundle.config,
                      'home_feature_copy',
                      'Rich, hot, and ready to slide from discovery to order with almost no friction.'
                    )}
                </p>
                <Link
                  href={orderPrimaryHref}
                  className="button-secondary button-secondary--hero hero-showcase__cta"
                >
                  {featurePrimaryLabel}
                  <ArrowRight size={15} />
                </Link>
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
                {pizza.image_url ? (
                  <Image
                    src={pizza.image_url}
                    alt={pizza.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 25vw"
                    className="signature-card__image"
                  />
                ) : null}
              </div>
              <div className="signature-card__body">
                <div className="signature-card__top">
                  <span className="signature-card__tag">
                    {pizza.is_bestseller
                      ? getConfigValue(bundle.config, 'home_signature_tag_bestseller_label', 'Bestseller')
                      : getConfigValue(bundle.config, 'home_signature_tag_signature_label', 'Signature')}
                  </span>
                  <span className="signature-card__price">{money(pizza.price_medium)}</span>
                </div>
                <div className="signature-card__title">{pizza.name}</div>
                <p className="signature-card__copy">
                  {pizza.description ||
                    getConfigValue(
                      bundle.config,
                      'home_signature_fallback_copy',
                      'A crowd-pleasing favorite from the live menu.'
                    )}
                </p>
                <div className="signature-card__actions">
                  <Link href={`/menu/${pizza.slug}`} className="button-secondary button-secondary--hero">
                    {getConfigValue(bundle.config, 'home_signature_details_label', 'Details')}
                  </Link>
                  <Link href={orderPrimaryHref} className="button button--hero">
                    {hasItemsInCart
                      ? getConfigValue(bundle.config, 'home_signature_order_label', 'Order')
                      : getConfigValue(bundle.config, 'home_hero_menu_label', 'Browse the menu')}
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
            <Link href={orderPrimaryHref} className="button button--hero">
              {isOpenNow
                ? hasItemsInCart
                  ? closingPrimary
                  : getConfigValue(bundle.config, 'home_hero_menu_label', 'Browse the menu')
                : isAfterHours
                  ? hasItemsInCart
                    ? getConfigValue(bundle.config, 'home_closing_primary_after_hours_label', 'Schedule order')
                    : getConfigValue(bundle.config, 'home_hero_menu_label', 'Browse the menu')
                  : getConfigValue(bundle.config, 'home_closing_primary_paused_label', 'View live status')}
            </Link>
            <Link href="/build" className="button-secondary button-secondary--hero">
              {isOpenNow
                ? closingSecondary
                : isAfterHours
                  ? getConfigValue(bundle.config, 'home_closing_secondary_after_hours_label', 'Build for later')
                  : getConfigValue(bundle.config, 'home_closing_secondary_paused_label', 'Plan ahead')}
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}

function HeroLoopingVideo({
  src,
  poster,
}: {
  src: string;
  poster?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let idlePauseTimer: number | undefined;
    let isVisible = false;
    let shouldPlayWhenReady = false;
    let introScrollCount = 0;
    let wheelCooldownTimer: number | undefined;
    let touchGestureActive = false;
    let touchLockCounted = false;
    let touchStartY = 0;
    let touchStartX = 0;
    let touchIntentLocked = false;

    const playVideo = () => {
      if (video.readyState < 2) return;
      if (!video.paused) return;

      shouldPlayWhenReady = false;
      const playPromise = video.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {
          // If the browser delays playback, the next scroll event will retry.
        });
      }
    };

    const pauseVideo = () => {
      if (!video.paused) {
        video.pause();
      }
    };

    const registerIntroScroll = () => {
      if (introScrollCount >= 3) return false;
      introScrollCount += 1;
      shouldPlayWhenReady = true;
      playVideo();
      queueIdlePause();
      return true;
    };

    const queueIdlePause = () => {
      if (idlePauseTimer) {
        window.clearTimeout(idlePauseTimer);
      }
      idlePauseTimer = window.setTimeout(() => {
        pauseVideo();
      }, 140);
    };

    const handleScrollActivity = () => {
      if (!isVisible || document.visibilityState !== 'visible') return;
      shouldPlayWhenReady = true;
      playVideo();
      queueIdlePause();
    };

    const handleWheel = (event: WheelEvent) => {
      if (!isVisible || document.visibilityState !== 'visible') return;
      if (introScrollCount < 3) {
        event.preventDefault();
        registerIntroScroll();
        return;
      }

      handleScrollActivity();
    };

    const handleTouchStart = (event: TouchEvent) => {
      if (!isVisible || document.visibilityState !== 'visible') return;
      const touch = event.touches[0];
      if (!touch) return;

      touchGestureActive = true;
      touchLockCounted = false;
      touchStartY = touch.clientY;
      touchStartX = touch.clientX;
      touchIntentLocked = false;
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (!isVisible || document.visibilityState !== 'visible') return;
      if (!touchGestureActive) return;

      const touch = event.touches[0];
      if (!touch) return;

      const deltaY = Math.abs(touch.clientY - touchStartY);
      const deltaX = Math.abs(touch.clientX - touchStartX);
      if (!touchIntentLocked && deltaY < 6 && deltaX < 6) {
        return;
      }

      touchIntentLocked = true;
      if (introScrollCount < 3) {
        event.preventDefault();
        if (!touchLockCounted) {
          touchLockCounted = registerIntroScroll();
        }
        return;
      }

      shouldPlayWhenReady = true;
      playVideo();
      queueIdlePause();
    };

    const handleTouchEnd = () => {
      touchGestureActive = false;
      touchLockCounted = false;
      touchIntentLocked = false;
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') {
        pauseVideo();
        return;
      }

      queueIdlePause();
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = Boolean(entry?.isIntersecting);
        if (!isVisible) {
          shouldPlayWhenReady = false;
          pauseVideo();
          return;
        }

        if (video.readyState >= 2) {
          queueIdlePause();
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(video);
    window.addEventListener('scroll', handleScrollActivity, { passive: true });
    window.addEventListener('wheel', handleWheel, { passive: false, capture: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true, capture: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false, capture: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true, capture: true });
    document.addEventListener('visibilitychange', handleVisibilityChange);

    if (video.readyState >= 2) {
      queueIdlePause();
    } else {
      video.addEventListener(
        'canplay',
        () => {
          if (shouldPlayWhenReady && isVisible && document.visibilityState === 'visible') {
            playVideo();
            queueIdlePause();
          } else {
            queueIdlePause();
          }
        },
        { once: true }
      );
    }

    return () => {
      if (idlePauseTimer) {
        window.clearTimeout(idlePauseTimer);
      }
      if (wheelCooldownTimer) {
        window.clearTimeout(wheelCooldownTimer);
      }
      observer.disconnect();
      window.removeEventListener('scroll', handleScrollActivity);
      window.removeEventListener('wheel', handleWheel, true);
      window.removeEventListener('touchstart', handleTouchStart, true);
      window.removeEventListener('touchmove', handleTouchMove, true);
      window.removeEventListener('touchend', handleTouchEnd, true);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      pauseVideo();
    };
  }, [src]);

  return (
    <video
      ref={videoRef}
      className="hero-card__media-video"
      src={src}
      poster={poster}
      muted
      playsInline
      loop
      preload="auto"
      disablePictureInPicture
      controls={false}
      controlsList="nodownload noplaybackrate noremoteplayback"
      aria-hidden="true"
    />
  );
}
