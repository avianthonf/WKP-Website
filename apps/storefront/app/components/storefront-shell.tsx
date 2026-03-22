'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Bell, Menu, PhoneCall, Power, ShoppingBag, X } from 'lucide-react';
import { useCart } from './cart-provider';
import {
  getAddressLine,
  getBrandLogoUrl,
  getFooterCopy,
  getConfigValue,
  getHeroTitle,
  getHeroSubtitle,
  getDashboardLiveMode,
  getOpeningWindow,
  getNavLinks,
  getStoreName,
  getStorePhone,
  getStorefrontState,
  getShellCopy,
} from '../lib/catalog';
import type { StorefrontBundle } from '../lib/types';

export function StorefrontShell({
  bundle,
  children,
}: {
  bundle: StorefrontBundle;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { totalItems } = useCart();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const notification = bundle.notifications[0];
  const navLinks = getNavLinks(bundle);
  const storefrontState = getStorefrontState(bundle);
  const shellCopy = getShellCopy(bundle);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [drawerOpen]);

  useEffect(() => {
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDrawerOpen(false);
    };

    window.addEventListener('keydown', onEscape);
    return () => window.removeEventListener('keydown', onEscape);
  }, []);

  const currentHref = useMemo(() => {
    const active = navLinks.find((item) => pathname === item.href || pathname?.startsWith(`${item.href}/`));
    return active?.href || '/home';
  }, [navLinks, pathname]);

  const storeName = getStoreName(bundle);
  const storePhone = getStorePhone(bundle);
  const brandLogoUrl = getBrandLogoUrl(bundle);
  const dashboardLiveMode = getDashboardLiveMode(bundle);
  const shellPrimaryHref = totalItems > 0 ? storefrontState.primaryAction.href : '/menu';
  const shellPrimaryLabel = totalItems > 0 ? storefrontState.primaryAction.label : getConfigValue(bundle.config, 'menu_browse_label', 'Browse the menu');

  return (
    <div className="site-shell">
      <div className="site-shell__ambient" aria-hidden="true">
        <motion.span
          className="site-shell__orb site-shell__orb--one"
          animate={
            prefersReducedMotion
              ? {}
              : {
                  x: [0, 18, 0],
                  y: [0, -12, 0],
                  scale: [1, 1.05, 1],
                }
          }
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.span
          className="site-shell__orb site-shell__orb--two"
          animate={
            prefersReducedMotion
              ? {}
              : {
                  x: [0, -14, 0],
                  y: [0, 16, 0],
                  scale: [1, 0.96, 1],
                }
          }
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
        />
        {/* Third smaller orb for depth */}
        <motion.span
          className="site-shell__orb site-shell__orb--three"
          animate={
            prefersReducedMotion
              ? {}
              : {
                  x: [0, 20, 0],
                  y: [0, -20, 0],
                  scale: [0.7, 0.85, 0.7],
                }
          }
          transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
        />
      </div>
      <header className="site-shell__topbar">
        <div className="site-shell__topbar-inner">
          <Link href="/home" className="brand" aria-label={storeName}>
            <span className="brand__mark" data-has-logo={brandLogoUrl ? 'true' : 'false'}>
              {brandLogoUrl ? (
                <Image src={brandLogoUrl} alt="" aria-hidden="true" fill className="brand__logo" sizes="80px" />
              ) : (
                'W'
              )}
            </span>
            <span>
              <span className="brand__name">{storeName}</span>
              <span className="brand__tag">{getConfigValue(bundle.config, 'brand_tagline', getHeroSubtitle(bundle))}</span>
            </span>
          </Link>

          <nav className="site-nav" aria-label={shellCopy.primaryNavLabel}>
            {navLinks.map((item) => (
              <Link key={item.href} href={item.href} className="site-nav__link" data-active={currentHref === item.href}>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="shell-actions">
            <span className="pill" data-tone={storefrontState.tone}>
              <Power size={14} />
              {storefrontState.label}
            </span>
            <Link
              href="/cart"
              className="shell-cart"
              data-has-items={totalItems > 0 ? "true" : "false"}
              aria-label={shellCopy.cartAriaLabelTemplate.replace('{count}', String(totalItems))}
            >
              <ShoppingBag size={17} />
              {totalItems > 0 ? <span className="shell-cart__count">{totalItems}</span> : null}
            </Link>
            <button
              type="button"
              className="pill shell-cta menu-toggle"
              onClick={() => setDrawerOpen(true)}
              aria-label={shellCopy.openNavigationLabel}
            >
              <Menu size={16} />
            </button>
            <Link href={shellPrimaryHref} className="pill shell-cta">
              <span>{shellPrimaryLabel}</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        {notification ? (
          <div className="site-shell__announcement">
            <div
              className="notice site-shell__announcement-note"
              data-tone={notification.type === 'warning' ? 'warning' : 'success'}
            >
              <Bell size={16} />
              <span>
                {notification.title}
                {notification.body ? ` - ${notification.body}` : ''}
              </span>
            </div>
          </div>
        ) : null}

      </header>

      {totalItems > 0 ? (
        <Link href="/cart" className="shell-cart-fab" aria-label={shellCopy.cartAriaLabelTemplate.replace('{count}', String(totalItems))}>
          <ShoppingBag size={16} />
          <span>Go to cart</span>
          <strong>{totalItems}</strong>
        </Link>
      ) : null}

      <AnimatePresence>
        {drawerOpen ? (
          <>
            <motion.button
              type="button"
              className="drawer-backdrop"
              onClick={() => setDrawerOpen(false)}
              aria-label={shellCopy.closeNavigationLabel}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.24 }}
            />
            <motion.aside
              className="site-shell__drawer"
              initial={{ x: -64, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -96, opacity: 0 }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="site-shell__drawer-header">
                <Link href="/home" className="brand" onClick={() => setDrawerOpen(false)}>
                  <span className="brand__mark" data-has-logo={brandLogoUrl ? 'true' : 'false'}>
                    {brandLogoUrl ? (
                      <Image src={brandLogoUrl} alt="" aria-hidden="true" fill className="brand__logo" sizes="80px" />
                    ) : (
                      'W'
                    )}
                  </span>
                  <span>
                    <span className="brand__name">{getHeroTitle(bundle)}</span>
                    <span className="brand__tag">{getConfigValue(bundle.config, 'brand_tagline', getHeroSubtitle(bundle))}</span>
                  </span>
                </Link>
                <button
                  type="button"
                  className="shell-cart"
                  onClick={() => setDrawerOpen(false)}
                  aria-label={shellCopy.closeNavigationLabel}
                >
                  <X size={17} />
                </button>
              </div>

              <nav className="site-shell__drawer-nav" aria-label={shellCopy.mobileNavigationLabel}>
                {navLinks.map((item, index) => (
                  <motion.nav
                    key={item.href}
                    initial={drawerOpen ? {} : { opacity: 0, x: -20 }}
                    animate={drawerOpen ? { opacity: 1, x: 0, transition: { delay: index * 0.08, ease: [0.16, 1, 0.3, 1] } } : { opacity: 0 }}
                    exit={drawerOpen ? {} : { opacity: 0 }}
                  >
                    <Link
                      href={item.href}
                      className="drawer-link"
                      data-active={pathname === item.href || pathname?.startsWith(`${item.href}/`)}
                      onClick={() => setDrawerOpen(false)}
                    >
                      <span>{item.label}</span>
                      <ArrowRight size={14} />
                    </Link>
                  </motion.nav>
                ))}
              </nav>

              <div className="drawer-footer">
                <div className="drawer-card">
                  <div className="stack">
                    <span className="section__eyebrow">{shellCopy.orderChatLabel}</span>
                    <strong>{storePhone}</strong>
                    <span className="muted">{getOpeningWindow(bundle)}</span>
                  </div>
                </div>
                <div className="drawer-card">
                  <div className="stack">
                    <span className="section__eyebrow">{shellCopy.locationLabel}</span>
                    <strong>{getAddressLine(bundle)}</strong>
                  </div>
                </div>
                <Link href={storefrontState.primaryAction.href} className="button" onClick={() => setDrawerOpen(false)}>
                  <PhoneCall size={16} />
                  {storefrontState.primaryAction.label}
                </Link>
              </div>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>

      <AnimatePresence mode="wait" initial={false}>
        <motion.main
          key={pathname}
          className="site-shell__content"
          initial={
            prefersReducedMotion
              ? false
              : {
                  opacity: 0,
                  y: 20,
                  scale: 0.98,
                  filter: 'blur(4px)',
                }
          }
          animate={
            prefersReducedMotion
              ? {}
              : {
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  filter: 'blur(0px)',
                }
          }
          exit={
            prefersReducedMotion
              ? {}
              : {
                  opacity: 0,
                  y: -10,
                  scale: 0.99,
                  filter: 'blur(2px)',
                }
          }
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          {children}
        </motion.main>
      </AnimatePresence>

      <footer className="footer">
        <div className="footer__inner">
          <div className="footer__grid">
            <div>
              <div className="footer__title">{storeName}</div>
              <p className="footer__copy">{getFooterCopy(bundle)}</p>
            </div>
            <div>
              <p className="section__eyebrow">{shellCopy.hoursLabel}</p>
              <p className="footer__copy">{getOpeningWindow(bundle)}</p>
            </div>
            <div>
              <p className="section__eyebrow">{shellCopy.orderLabel}</p>
              <p className="footer__copy">{storePhone}</p>
              <Link href={storefrontState.primaryAction.href} className="footer__link">
                {storefrontState.primaryAction.label}
              </Link>
              <p className="footer__copy">
                {shellCopy.syncLabel}: {dashboardLiveMode ? shellCopy.liveLabel : shellCopy.pausedLabel}
              </p>
            </div>
            <div>
              <p className="section__eyebrow">{shellCopy.locationLabel}</p>
              <p className="footer__copy">{getAddressLine(bundle)}</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
