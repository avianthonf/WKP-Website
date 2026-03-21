import Link from 'next/link';
import { MapPin, Truck, TimerReset } from 'lucide-react';
import { StorefrontShell } from '../components/storefront-shell';
import { fetchStorefrontBundle } from '../lib/storefront';
import { getAddressLine, getConfigValue, getOpeningWindow, getOrderLink, getStorefrontState } from '../lib/catalog';

export const dynamic = 'force-dynamic';

export default async function DeliveryPage() {
  const bundle = await fetchStorefrontBundle();
  const storefrontState = getStorefrontState(bundle);

  return (
    <StorefrontShell bundle={bundle}>
      <div className="page-wrap">
        <section className="hero-card reveal">
          <div className="hero-card__grid">
            <div>
              <span className="eyebrow">
                <Truck size={12} />
                {getConfigValue(bundle.config, 'delivery_eyebrow', 'Delivery info')}
              </span>
              <h1 className="hero-title">
                {getConfigValue(bundle.config, 'delivery_hero_title', 'Delivery that is clear before the order starts.')}
              </h1>
              <p className="hero-copy">
                {getConfigValue(
                  bundle.config,
                  'delivery_hero_copy',
                  'Hours, address, and minimums are pulled from the store settings.'
                )}
              </p>
              <div className="hero-actions">
                <Link href={storefrontState.primaryAction.href} className="button">
                  {storefrontState.primaryAction.label}
                </Link>
                <Link href={getOrderLink(bundle)} className="button-secondary" target="_blank" rel="noreferrer">
                  WhatsApp now
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="info-grid">
          <div className="info-card">
            <div className="info-card__title">{getConfigValue(bundle.config, 'delivery_hours_title', 'Hours')}</div>
            <div className="info-card__body">
              <TimerReset size={16} /> {getOpeningWindow(bundle)}
            </div>
            <div className="info-card__copy">
              {getConfigValue(
                bundle.config,
                'delivery_hours_copy',
                'If the store is closed, the open/closed state comes from the live settings.'
              )}
            </div>
          </div>
          <div className="info-card">
            <div className="info-card__title">{getConfigValue(bundle.config, 'delivery_address_title', 'Address')}</div>
            <div className="info-card__body">
              <MapPin size={16} /> {getAddressLine(bundle)}
            </div>
            <div className="info-card__copy">
              {bundle.config.google_maps_link ? (
                <a href={bundle.config.google_maps_link} target="_blank" rel="noreferrer" className="footer__link">
                  Open map
                </a>
              ) : (
                'Map link is managed from the store settings.'
              )}
            </div>
          </div>
          <div className="info-card">
            <div className="info-card__title">{getConfigValue(bundle.config, 'delivery_min_title', 'Minimum')}</div>
            <div className="info-card__body">{Number(bundle.config.min_order_amount || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}</div>
            <div className="info-card__copy">
              {getConfigValue(
                bundle.config,
                'delivery_min_copy',
                'Shown in cart before checkout, so there are no surprises.'
              )}
            </div>
          </div>
        </section>
      </div>
    </StorefrontShell>
  );
}
