import { StorefrontShell } from '../components/storefront-shell';
import { ImmersiveHome } from '../components/immersive-home';
import { fetchStorefrontBundle } from '../lib/storefront';
import { getAnnouncement, getConfigValue, getHeroSubtitle, getHeroTitle, getStoreName } from '../lib/catalog';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const bundle = await fetchStorefrontBundle();
  const storeName = getStoreName(bundle);

  return (
    <StorefrontShell bundle={bundle}>
      <ImmersiveHome
        bundle={bundle}
        storeName={storeName}
        heroTitle={getConfigValue(bundle.config, 'home_hero_title', getHeroTitle(bundle))}
        heroSubtitle={getConfigValue(bundle.config, 'home_hero_subtitle', getHeroSubtitle(bundle))}
        announcement={getConfigValue(bundle.config, 'home_announcement', getAnnouncement(bundle))}
      />
    </StorefrontShell>
  );
}
