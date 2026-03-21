import Link from 'next/link';
import { StorefrontShell } from '../components/storefront-shell';
import { fetchStorefrontBundle } from '../lib/storefront';
import { getConfigValue, getStructuredContent } from '../lib/catalog';

export const dynamic = 'force-dynamic';

export default async function FaqPage() {
  const bundle = await fetchStorefrontBundle();
  const faqs = getStructuredContent(bundle, 'faq_items', [
    {
      title: 'How do I order?',
      body: 'Build your cart, go to checkout, and complete the handoff. The same order is stored for the kitchen as well.',
    },
    {
      title: 'Can I customize pizzas?',
      body: 'Yes. Use the Build page to choose size, extras, and notes for a custom pizza.',
    },
    {
      title: 'Do you take offline orders?',
      body: 'The storefront uses a lightweight order handoff so the flow stays simple for the kitchen and the customer.',
    },
    {
      title: 'What happens if an item is sold out?',
      body: 'Sold-out items are hidden or marked unavailable based on the live menu state.',
    },
  ]);

  return (
    <StorefrontShell bundle={bundle}>
      <div className="page-wrap">
        <section className="hero-card reveal">
          <div className="hero-card__grid">
            <div>
              <span className="eyebrow">{getConfigValue(bundle.config, 'faq_eyebrow', 'FAQ')}</span>
              <h1 className="hero-title">
                {getConfigValue(bundle.config, 'faq_hero_title', 'Everything customers usually ask.')}
              </h1>
              <p className="hero-copy">
                {getConfigValue(
                  bundle.config,
                  'faq_hero_copy',
                  'Short answers, no noise, and the same live storefront data underneath.'
                )}
              </p>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="section__grid">
            {faqs.map((item) => (
              <article key={item.title} className="info-card">
                <div className="info-card__title">{item.title}</div>
                <div className="info-card__copy">{item.body}</div>
              </article>
            ))}
          </div>
        </section>

        <section className="section">
          <Link href="/menu" className="button">
            Back to menu
          </Link>
        </section>
      </div>
    </StorefrontShell>
  );
}
