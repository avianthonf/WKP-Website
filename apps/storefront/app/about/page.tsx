import Link from 'next/link';
import { BadgeCheck, MapPin, Sprout } from 'lucide-react';
import { StorefrontShell } from '../components/storefront-shell';
import { fetchStorefrontBundle, money } from '../lib/storefront';
import { getAddressLine, getConfigValue, getOpeningWindow, getStoreName } from '../lib/catalog';

export const dynamic = 'force-dynamic';

export default async function AboutPage() {
  const bundle = await fetchStorefrontBundle();

  return (
    <StorefrontShell bundle={bundle}>
      <div className="page-wrap">
        <section className="hero-card reveal">
          <div className="hero-card__grid">
            <div>
              <span className="eyebrow">
                <BadgeCheck size={12} />
                {getConfigValue(bundle.config, 'about_eyebrow', 'About the kitchen')}
              </span>
              <h1 className="hero-title">{getStoreName(bundle)}</h1>
              <p className="hero-copy">
                {getConfigValue(
                  bundle.config,
                  'about_hero_copy',
                  'A warm, editorial storefront for a pizzeria that wants the ordering experience to feel premium and easy.'
                )}
              </p>
            </div>
            <div className="hero-aside">
              <div className="content-card">
                <div className="notice">
                  <Sprout size={16} />
                  {getConfigValue(
                    bundle.config,
                    'about_notice',
                    'Fresh ingredients, live data, and a simple order handoff.'
                  )}
                </div>
                <div className="summary-list">
                  <div className="summary-row">
                    <span className="summary-row__label">{getConfigValue(bundle.config, 'about_hours_label', 'Hours')}</span>
                    <span className="summary-row__value">{getOpeningWindow(bundle)}</span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-row__label">
                      {getConfigValue(bundle.config, 'about_min_order_label', 'Min order')}
                    </span>
                    <span className="summary-row__value">{money(Number(bundle.config.min_order_amount || 0))}</span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-row__label">
                      {getConfigValue(bundle.config, 'about_address_label', 'Address')}
                    </span>
                    <span className="summary-row__value">{getAddressLine(bundle)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="info-grid">
          <div className="info-card">
            <div className="info-card__title">
              {getConfigValue(bundle.config, 'about_recipe_title', 'Recipe')}
            </div>
            <div className="info-card__body">
              {getConfigValue(bundle.config, 'about_recipe_body', 'Built for real operations.')}
            </div>
            <div className="info-card__copy">
              {getConfigValue(
                bundle.config,
                'about_recipe_copy',
                'The storefront reads categories, pizzas, toppings, extras, addons, desserts, notifications, and site config live from the database.'
              )}
            </div>
          </div>
          <div className="info-card">
            <div className="info-card__title">
              {getConfigValue(bundle.config, 'about_workflow_title', 'Workflow')}
            </div>
            <div className="info-card__body">
              {getConfigValue(bundle.config, 'about_workflow_body', 'Primary order path is a quick mobile handoff.')}
            </div>
            <div className="info-card__copy">
              {getConfigValue(
                bundle.config,
                'about_workflow_copy',
                'The order is stored in the database first, then the customer is given the next step to complete the send.'
              )}
            </div>
          </div>
          <div className="info-card">
            <div className="info-card__title">
              {getConfigValue(bundle.config, 'about_location_title', 'Location')}
            </div>
            <div className="info-card__body">
              <MapPin size={16} /> {getAddressLine(bundle)}
            </div>
            <div className="info-card__copy">
              {bundle.config.google_maps_link ? (
                <Link href={bundle.config.google_maps_link} className="footer__link" target="_blank">
                  Open map
                </Link>
              ) : (
                'Map link is set in the store settings.'
              )}
            </div>
          </div>
        </section>
      </div>
    </StorefrontShell>
  );
}
