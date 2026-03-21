import Link from 'next/link';
import { Mail, MapPin, PhoneCall, MessageCircle } from 'lucide-react';
import { StorefrontShell } from '../components/storefront-shell';
import { fetchStorefrontBundle } from '../lib/storefront';
import {
  getAddressLine,
  getConfigValue,
  getOpeningWindow,
  getOrderLink,
  getStorePhone,
  getStorefrontState,
  getSupportEmail,
} from '../lib/catalog';

export const dynamic = 'force-dynamic';

export default async function ContactPage() {
  const bundle = await fetchStorefrontBundle();
  const phone = getStorePhone(bundle);
  const storefrontState = getStorefrontState(bundle);

  return (
    <StorefrontShell bundle={bundle}>
      <div className="page-wrap">
        <section className="hero-card reveal">
          <div className="hero-card__grid">
            <div>
              <span className="eyebrow">
                <MessageCircle size={12} />
                {getConfigValue(bundle.config, 'contact_eyebrow', 'Contact')}
              </span>
              <h1 className="hero-title">
                {getConfigValue(bundle.config, 'contact_hero_title', 'Talk to the kitchen directly.')}
              </h1>
              <p className="hero-copy">
                {getConfigValue(
                  bundle.config,
                  'contact_hero_copy',
                  'Orders, delivery questions, and special notes all work best through WhatsApp. This page exists for convenience and trust.'
                )}
              </p>
            </div>
            <div className="hero-aside">
              <div className="content-card">
                <div className="summary-list">
                  <div className="summary-row">
                    <span className="summary-row__label">
                      {getConfigValue(bundle.config, 'contact_whatsapp_label', 'WhatsApp')}
                    </span>
                    <span className="summary-row__value">{phone}</span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-row__label">
                      {getConfigValue(bundle.config, 'contact_address_label', 'Address')}
                    </span>
                    <span className="summary-row__value">{getAddressLine(bundle)}</span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-row__label">
                      {getConfigValue(bundle.config, 'contact_hours_label', 'Hours')}
                    </span>
                    <span className="summary-row__value">{getOpeningWindow(bundle)}</span>
                  </div>
                </div>
                <div className="hero-actions">
                  <Link href={getOrderLink(bundle)} className="button">
                    <PhoneCall size={16} />
                    WhatsApp us
                  </Link>
                  <Link href={storefrontState.primaryAction.href} className="button-secondary">
                    {storefrontState.primaryAction.label}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="info-grid">
          <div className="info-card">
            <div className="info-card__title">{getConfigValue(bundle.config, 'contact_map_title', 'Map')}</div>
            <div className="info-card__body">{getConfigValue(bundle.config, 'contact_map_body', 'Find us easily.')}</div>
            <div className="info-card__copy">
              {bundle.config.google_maps_link ? (
                <Link href={bundle.config.google_maps_link} target="_blank" className="footer__link">
                  Open in Maps
                </Link>
              ) : (
                'Set the maps link from the store settings.'
              )}
            </div>
          </div>
          <div className="info-card">
            <div className="info-card__title">{getConfigValue(bundle.config, 'contact_email_title', 'Email')}</div>
            <div className="info-card__body">
              <Mail size={16} /> {getSupportEmail(bundle)}
            </div>
            <div className="info-card__copy">
              {getConfigValue(
                bundle.config,
                'contact_email_copy',
                'This can be connected later if you want a public inbox on the site.'
              )}
            </div>
          </div>
          <div className="info-card">
            <div className="info-card__title">
              {getConfigValue(bundle.config, 'contact_ordering_title', 'Live ordering')}
            </div>
            <div className="info-card__body">
              {getConfigValue(bundle.config, 'contact_ordering_body', 'WhatsApp-first.')}
            </div>
            <div className="info-card__copy">
              {getConfigValue(
                bundle.config,
                'contact_ordering_copy',
                'The order is stored and then handed off to WhatsApp, which keeps the customer flow low-friction.'
              )}
            </div>
          </div>
        </section>
      </div>
    </StorefrontShell>
  );
}
