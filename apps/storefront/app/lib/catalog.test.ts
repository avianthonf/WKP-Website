import { describe, expect, it } from 'vitest';
import {
  getHeroBackgroundImageUrl,
  getHomeHeroBackgroundImageUrl,
  getHomeHeroBackgroundMediaType,
  getHomeHeroBackgroundMediaUrl,
  getHomeHeroBackgroundVideoUrl,
} from './catalog';
import type { StorefrontBundle } from './types';

const baseBundle = {
  categories: [],
  pizzas: [],
  toppings: [],
  extras: [],
  addons: [],
  desserts: [],
  notifications: [],
  config: {},
  isOpen: true,
  maintenanceMode: false,
} satisfies StorefrontBundle;

function makeBundle(config: Record<string, string>): StorefrontBundle {
  return {
    ...baseBundle,
    config,
  };
}

describe('catalog homepage hero media', () => {
  it('defaults to image mode when no media type is set', () => {
    expect(getHomeHeroBackgroundMediaType(makeBundle({}))).toBe('image');
  });

  it('switches to video mode when the media type is video', () => {
    expect(
      getHomeHeroBackgroundMediaType(
        makeBundle({
          home_hero_background_media_type: 'video',
          home_hero_background_video_url: 'https://cdn.example.com/hero.mp4',
        })
      )
    ).toBe('video');
  });

  it('keeps the selected video mode even when the video URL is missing', () => {
    expect(
      getHomeHeroBackgroundMediaType(
        makeBundle({
          home_hero_background_media_type: 'video',
        })
      )
    ).toBe('video');
    expect(getHomeHeroBackgroundVideoUrl(makeBundle({ home_hero_background_media_type: 'video' }))).toBeNull();
    expect(
      getHomeHeroBackgroundMediaUrl(
        makeBundle({
          home_hero_background_media_type: 'video',
          home_hero_background_image_url: 'https://cdn.example.com/hero.jpg',
        })
      )
    ).toBe('https://cdn.example.com/hero.jpg');
  });

  it('resolves the active background media url from the selected mode', () => {
    expect(
      getHomeHeroBackgroundMediaUrl(
        makeBundle({
          home_hero_background_media_type: 'image',
          home_hero_background_image_url: 'https://cdn.example.com/hero.jpg',
        })
      )
    ).toBe('https://cdn.example.com/hero.jpg');

    expect(
      getHomeHeroBackgroundMediaUrl(
        makeBundle({
          home_hero_background_media_type: 'video',
          home_hero_background_video_url: 'https://cdn.example.com/hero.mp4',
        })
      )
    ).toBe('https://cdn.example.com/hero.mp4');
  });

  it('keeps legacy hero background compatibility in place', () => {
    expect(
      getHomeHeroBackgroundImageUrl(
        makeBundle({
          hero_bg_url: 'https://cdn.example.com/legacy-hero.jpg',
        })
      )
    ).toBe('https://cdn.example.com/legacy-hero.jpg');

    expect(
      getHeroBackgroundImageUrl(
        makeBundle({
          hero_bg_url: 'https://cdn.example.com/legacy-hero.jpg',
        })
      )
    ).toBe('https://cdn.example.com/legacy-hero.jpg');
  });
});
