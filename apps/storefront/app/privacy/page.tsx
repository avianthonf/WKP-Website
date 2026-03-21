import Link from 'next/link';
import { StorefrontShell } from '../components/storefront-shell';
import { fetchStorefrontBundle } from '../lib/storefront';
import { getConfigValue, getStructuredContent } from '../lib/catalog';

export const dynamic = 'force-dynamic';

export default async function PrivacyPage() {
  const bundle = await fetchStorefrontBundle();
  const sections = getStructuredContent(bundle, 'privacy_sections', [
    {
      title: 'Order storage',
      body: 'Order content is persisted to the database before the handoff step.',
    },
    {
      title: 'Usage',
      body: 'We use the data to fulfill the order and improve service operations.',
    },
    {
      title: 'Retention',
      body: 'Retention policy can be formalized in the admin config or a legal page later.',
    },
  ]);

  return (
    <StorefrontShell bundle={bundle}>
      <div className="page-wrap">
        <section className="hero-card reveal">
          <div className="hero-card__grid">
            <div>
              <span className="eyebrow">{getConfigValue(bundle.config, 'privacy_eyebrow', 'Privacy')}</span>
              <h1 className="hero-title">
                {getConfigValue(
                  bundle.config,
                  'privacy_hero_title',
                  'We only keep what we need to fulfill the order.'
                )}
              </h1>
              <p className="hero-copy">
                {getConfigValue(
                  bundle.config,
                  'privacy_hero_copy',
                  'The storefront stores customer and order details in Supabase so the kitchen can fulfill, track, and review orders.'
                )}
              </p>
            </div>
          </div>
        </section>
        <section className="section">
          <div className="section__grid">
            {sections.map((section) => (
              <article key={section.title} className="info-card">
                <div className="info-card__title">{section.title}</div>
                <div className="info-card__copy">{section.body}</div>
              </article>
            ))}
          </div>
        </section>
        <section className="section">
          <Link href="/menu" className="button-secondary">
            Back to menu
          </Link>
        </section>
      </div>
    </StorefrontShell>
  );
}
