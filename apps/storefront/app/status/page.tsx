import { StorefrontShell } from '../components/storefront-shell';
import { fetchStorefrontBundle } from '../lib/storefront';
import { getConfigValue, getOpeningWindow, getStorefrontState } from '../lib/catalog';

export const dynamic = 'force-dynamic';

export default async function StatusPage() {
  const bundle = await fetchStorefrontBundle();
  const storefrontState = getStorefrontState(bundle);

  return (
    <StorefrontShell bundle={bundle}>
      <div className="page-wrap">
        <section className="hero-card reveal">
          <div className="hero-card__grid">
            <div>
              <span className="eyebrow">{getConfigValue(bundle.config, 'status_eyebrow', 'Live status')}</span>
              <h1 className="hero-title">
                {storefrontState.mode === 'maintenance'
                  ? getConfigValue(bundle.config, 'status_title_maintenance', 'Maintenance mode is active.')
                  : storefrontState.mode === 'open'
                  ? getConfigValue(bundle.config, 'status_title_open', 'We are open.')
                  : storefrontState.mode === 'after_hours'
                    ? getConfigValue(bundle.config, 'status_title_after_hours', 'We are closed right now, but scheduling is open.')
                  : getConfigValue(bundle.config, 'status_title_closed', 'We are closed right now.')}
              </h1>
              <p className="hero-copy">
                {getConfigValue(
                  bundle.config,
                  'status_hero_copy',
                  'This status follows the live settings and is what the storefront will show before checkout.'
                )}
              </p>
            </div>
          </div>
        </section>
        <section className="info-grid">
          <div className="info-card">
            <div className="info-card__title">{getConfigValue(bundle.config, 'status_state_title', 'State')}</div>
            <div className="info-card__body">
              {storefrontState.mode === 'maintenance'
                ? getConfigValue(bundle.config, 'status_state_maintenance_label', 'Maintenance')
                : storefrontState.mode === 'open'
                ? getConfigValue(bundle.config, 'status_state_open_label', 'Open')
                : storefrontState.mode === 'after_hours'
                  ? getConfigValue(bundle.config, 'status_state_after_hours_label', 'Scheduling')
                : getConfigValue(bundle.config, 'status_state_closed_label', 'Closed')}
            </div>
            <div className="info-card__copy">
              {getConfigValue(bundle.config, 'status_state_copy', 'The state is live from the store settings.')}
            </div>
          </div>
          <div className="info-card">
            <div className="info-card__title">{getConfigValue(bundle.config, 'status_hours_title', 'Hours')}</div>
            <div className="info-card__body">{getOpeningWindow(bundle)}</div>
            <div className="info-card__copy">
              {getConfigValue(bundle.config, 'status_hours_copy', 'Update hours in the store settings.')}
            </div>
          </div>
          <div className="info-card">
            <div className="info-card__title">{getConfigValue(bundle.config, 'status_path_title', 'Order path')}</div>
            <div className="info-card__copy">
              {getConfigValue(bundle.config, 'status_path_copy', 'Menu -> cart -> handoff.')}
            </div>
          </div>
        </section>
      </div>
    </StorefrontShell>
  );
}
