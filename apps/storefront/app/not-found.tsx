import Link from 'next/link';
import { StorefrontShell } from './components/storefront-shell';
import { fetchStorefrontBundle } from './lib/storefront';
import { getConfigValue } from './lib/catalog';

export const dynamic = 'force-dynamic';

export default async function NotFound() {
  const bundle = await fetchStorefrontBundle();

  return (
    <StorefrontShell bundle={bundle}>
      <div className="page-wrap">
        <section className="hero-card reveal">
          <div className="hero-card__grid">
            <div>
              <span className="eyebrow">{getConfigValue(bundle.config, 'not_found_eyebrow', '404')}</span>
              <h1 className="hero-title">
                {getConfigValue(bundle.config, 'not_found_title', 'We could not find that page.')}
              </h1>
              <p className="hero-copy">
                {getConfigValue(
                  bundle.config,
                  'not_found_copy',
                  'The link may be outdated or the page may not exist yet. The menu and checkout are still ready.'
                )}
              </p>
              <div className="hero-actions">
                <Link href="/menu" className="button">
                  {getConfigValue(bundle.config, 'not_found_primary_cta', 'Back to menu')}
                </Link>
                <Link href="/home" className="button-secondary">
                  {getConfigValue(bundle.config, 'not_found_secondary_cta', 'Go home')}
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </StorefrontShell>
  );
}
