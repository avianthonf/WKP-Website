import { ImageResponse } from 'next/og';
import { fetchStorefrontConfig } from './lib/storefront';
import { getConfigValue } from './lib/catalog';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const size = {
  width: 64,
  height: 64,
};
export const contentType = 'image/png';

function getInitials(value: string) {
  const parts = value.split(/\s+/).map((part) => part.trim()).filter(Boolean);
  const letters = parts.length > 1 ? parts.map((part) => part[0]).join('') : value.slice(0, 2);
  return letters.toUpperCase().slice(0, 3) || 'WP';
}

export default async function Icon() {
  const config = await fetchStorefrontConfig();
  const storeName = getConfigValue(config, 'store_name', getConfigValue(config, 'hero_title', 'We Knead Pizza'));
  const logoUrl = getConfigValue(config, 'brand_logo_image_url', '').trim();
  const initials = getInitials(storeName);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          borderRadius: 18,
          background: '#f5f0e8',
          border: '1px solid rgba(108, 88, 63, 0.16)',
          boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.8)',
        }}
      >
        {logoUrl ? (
          <div
            style={{
              width: '100%',
              height: '100%',
              backgroundImage: `url(${logoUrl})`,
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center',
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #e8540a, #c98b2f)',
              color: '#fff',
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: -1,
              fontFamily: 'Cormorant Garamond, serif',
            }}
          >
            {initials}
          </div>
        )}
      </div>
    ),
    size
  );
}
