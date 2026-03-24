import Link from 'next/link';
import { BadgeCheck, MapPin, Sprout, Star } from 'lucide-react';
import { StorefrontShell } from '../components/storefront-shell';
import { fetchStorefrontBundle, money } from '../lib/storefront';
import { getAddressLine, getConfigValue, getOpeningWindow, getStoreName } from '../lib/catalog';

export const dynamic = 'force-dynamic';

const reviewSourceUrl = 'https://maps.app.goo.gl/7LdezW6stsNshqVg7';
const reviewHighlights = [
  {
    title: 'Generous toppings',
    body: 'Guests consistently mention the toppings, freshness, and the feeling that every pizza arrives properly loaded.',
  },
  {
    title: 'Prompt service',
    body: 'Public review summaries call out polite staff and quick delivery, which keeps the whole ordering experience easy.',
  },
  {
    title: 'Worth the sweet finish',
    body: 'Desserts and brownies get special praise too, so the menu lands as more than just a pizza stop.',
  },
] as const;

export default async function AboutPage() {
  const bundle = await fetchStorefrontBundle();

  return (
    <StorefrontShell bundle={bundle}>
      <div className="page-wrap">
        <section className="hero-card reveal" style={{ order: -1 }}>
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
                    <span className="summary-row__value">
                      {money(Number(getConfigValue(bundle.config, 'min_order_amount', '0')))}
                    </span>
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

        <section className="section">
          <div className="content-card" style={{ overflow: 'hidden' }}>
            <div className="grid gap-6 xl:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] xl:items-start">
              <div className="rounded-[1.5rem] border border-[rgba(232,84,10,0.14)] bg-[linear-gradient(135deg,rgba(232,84,10,0.10),rgba(255,255,255,0.92))] p-5 shadow-[0_18px_42px_rgba(26,23,18,0.06)]">
                <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(232,84,10,0.16)] bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--ember)] shadow-sm">
                  <Star size={12} className="fill-[currentColor]" />
                  Public praise
                </div>
                <div className="mt-4 space-y-3">
                  <div className="flex items-end gap-3">
                    <div className="text-5xl font-semibold leading-none text-[var(--ink)]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                      4.8
                    </div>
                    <div className="pb-1 text-sm text-[var(--stone)]">/ 5 average from public review listings</div>
                  </div>
                  <div className="flex items-center gap-1 text-[var(--ember)]">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star key={index} size={15} className={index < 5 ? 'fill-[currentColor]' : 'opacity-25'} />
                    ))}
                  </div>
                  <p className="text-sm leading-6 text-[var(--stone)]">
                    Customers repeatedly highlight the toppings, the friendly service, and the fact that the pizzas feel generous rather than sparse.
                  </p>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="badge">197+ public ratings</span>
                  <span className="badge">Fast delivery praise</span>
                  <span className="badge">Brownie favorite</span>
                </div>
              </div>

              <div className="grid gap-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="mono-label text-[10px]">Selected reviews</p>
                    <h2 className="mt-1 text-xl font-semibold text-[var(--ink)]">What people keep saying</h2>
                  </div>
                  <Link href={reviewSourceUrl} target="_blank" rel="noreferrer" className="button-secondary">
                    Read on Maps
                  </Link>
                </div>

                <div className="grid gap-3 lg:grid-cols-3">
                  {reviewHighlights.map((item) => (
                    <article
                      key={item.title}
                      className="rounded-[1.35rem] border border-[var(--border-default)] bg-white p-4 shadow-[0_12px_30px_rgba(26,23,18,0.05)]"
                    >
                      <div className="flex items-center gap-2 text-[var(--ember)]">
                        <Star size={14} className="fill-[currentColor]" />
                        <Star size={14} className="fill-[currentColor]" />
                        <Star size={14} className="fill-[currentColor]" />
                        <Star size={14} className="fill-[currentColor]" />
                        <Star size={14} className="fill-[currentColor]" />
                      </div>
                      <h3 className="mt-3 text-base font-semibold text-[var(--ink)]">{item.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-[var(--stone)]">{item.body}</p>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="info-grid"  style={{ display: 'flex', justifyContent: 'center' }}>
          <div className="info-card" style={{ flex: '0 1 40%' }}>
            <div className="info-card__title">
              {getConfigValue(bundle.config, 'about_location_title', 'Location')}
            </div>
            <div className="info-card__body">
              <MapPin size={16} /> {getAddressLine(bundle)}
            </div>
              <div className="info-card__copy">
                {getConfigValue(bundle.config, 'google_maps_link', '') ? (
                  <Link href={getConfigValue(bundle.config, 'google_maps_link', '')} className="footer__link" target="_blank">
                  {getConfigValue(bundle.config, 'about_map_action_label', 'Open map')}
                  </Link>
                ) : (
                  getConfigValue(
                    bundle.config,
                    'about_map_missing_copy',
                    'Map link is set in the store settings.'
                  )
                )}
              </div>
          </div>
        </section>
      </div>
    </StorefrontShell>
  );
}
