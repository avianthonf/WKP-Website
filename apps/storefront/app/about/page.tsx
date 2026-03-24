import Link from 'next/link';
import { BadgeCheck, MapPin, Quote, Sprout, Star } from 'lucide-react';
import { StorefrontShell } from '../components/storefront-shell';
import { fetchStorefrontBundle, money } from '../lib/storefront';
import { getAddressLine, getConfigValue, getOpeningWindow, getStoreName } from '../lib/catalog';

export const dynamic = 'force-dynamic';

const reviewSourceUrl = 'https://maps.app.goo.gl/7LdezW6stsNshqVg7';
const reviewHighlights = [
  {
    title: 'Alyque Pinto',
    body: 'Yummy is what I would say. Much better than Dominos and Pizza Hut. ',
  },
  {
    title: 'Luv Jasuja',
    body: 'Excellent pizza and loaded with toppings.We ordered two vegetarian pizzas and both were great.',
  },
  {
    title: 'Meghna Unhawane',
    body: ' If you’re a pizza lover, you need to check this place out. I’ll definitely be back for more!',
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

        <section className="hero-card reveal review-hero-card">
          <div className="review-hero__grid">
            <div className="review-hero__copy">
              <span className="eyebrow eyebrow--hero">
                <Star size={12} />
                What Our Customers Say
              </span>
              <h2 className="hero-title hero-title--review">A local favorite people recommend</h2>
              <p className="hero-copy hero-copy--review">
                We are thrilled to recieve so much much love from our customers!
              </p>

              <div className="review-rating">
                <div className="review-rating__score">
                  <span className="review-rating__value">4.8</span>
                  <span className="review-rating__meta">/ 5 average from public review listings</span>
                </div>
                <div className="review-rating__stars" aria-label="Five star rating">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star key={index} size={16} className="fill-[currentColor]" />
                  ))}
                </div>
              </div>

              <div className="review-hero__tags">
                <span className="badge">Frequently recommended</span>
                <span className="badge">Friendly, fast handoff</span>
                <span className="badge">Desserts get love too</span>
              </div>

              <div className="review-hero__actions">
                <div className="review-hero__microcopy">
                  <Quote size={14} />
                  Curated from public review listings on Google Maps
                </div>
              </div>
            </div>

            <div className="review-hero__stack">
              <article className="review-spotlight">
                <div className="review-spotlight__kicker">
                  <Quote size={14} />
                  What people keep saying
                </div>
                <p className="review-spotlight__quote">
                  "The best homemade pizza with the freshest of ingredients one could ask for!"
                </p>
              </article>

              <div className="review-grid">
                {reviewHighlights.map((item) => (
                  <article key={item.title} className="review-card">
                    <div className="review-card__stars" aria-hidden="true">
                      <Star size={14} className="fill-[currentColor]" />
                      <Star size={14} className="fill-[currentColor]" />
                      <Star size={14} className="fill-[currentColor]" />
                      <Star size={14} className="fill-[currentColor]" />
                      <Star size={14} className="fill-[currentColor]" />
                    </div>
                    <h3 className="review-card__title">{item.title}</h3>
                    <p className="review-card__body">{item.body}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="info-grid"  style={{ display: 'flex', justifyContent: 'center', order: 100 }}>
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
                  {'Open Google Maps and Reviews'}
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
