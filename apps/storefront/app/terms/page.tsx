import Link from 'next/link';
import { StorefrontShell } from '../components/storefront-shell';
import { fetchStorefrontBundle } from '../lib/storefront';
import { getConfigValue, getStructuredContent } from '../lib/catalog';

export const dynamic = 'force-dynamic';

export default async function TermsPage() {
  const bundle = await fetchStorefrontBundle();
  const sections = getStructuredContent(bundle, 'terms_sections', [
    {
      title: 'Order confirmation',
      body: 'The handoff channel is the primary confirmation path for all orders.',
    },
    {
      title: 'Accuracy',
      body: 'Please check address, phone, and item details before sending.',
    },
    {
      title: 'Availability',
      body: 'All menu availability and prices are controlled from the store settings.',
    },
  ]);

  return (
    <StorefrontShell bundle={bundle}>
      <div className="page-wrap">
        <section className="hero-card reveal">
          <div className="hero-card__grid">
            <div>
              <span className="eyebrow">{getConfigValue(bundle.config, 'terms_eyebrow', 'Terms')}</span>
              <h1 className="hero-title">
                {getConfigValue(bundle.config, 'terms_hero_title', 'Plain terms for a straightforward order flow.')}
              </h1>
                <p className="hero-copy">
                {getConfigValue(
                  bundle.config,
                  'terms_hero_copy',
                  'Placing an order means the kitchen may contact you through the selected handoff channel to confirm details or delivery timing.'
                )}
              </p>
            </div>
          </div>
        </section>
        <section className="info-grid">
          {sections.map((section) => (
            <div key={section.title} className="info-card">
              <div className="info-card__title">{section.title}</div>
              <div className="info-card__copy">{section.body}</div>
            </div>
          ))}
        </section>
        <section className="section">
          <Link href="/contact" className="button-secondary">
            {getConfigValue(bundle.config, 'terms_contact_us_label', 'Contact us')}
          </Link>
        </section>
      </div>
    </StorefrontShell>
  );
}
