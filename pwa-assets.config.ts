import { defineConfig, type Preset } from '@vite-pwa/assets-generator/config';

/** Mid-tone of the logo gradient – fills the transparent corners of full-bleed icons. */
const BRAND_ORANGE = '#fb8c2e';

/**
 * Icons from `public/logo.svg` (`npm run generate-pwa-assets`).
 * Maskable (Android) and Apple touch icons are full-bleed: the OS applies its own shape, and the
 * house stays inside the 80 % safe zone.
 */
const preset: Preset = {
  transparent: { sizes: [64, 192, 512], favicons: [[48, 'favicon.ico']], padding: 0 },
  maskable: { sizes: [512], padding: 0, resizeOptions: { background: BRAND_ORANGE } },
  apple: { sizes: [180], padding: 0, resizeOptions: { background: BRAND_ORANGE } },
};

export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset,
  images: ['public/logo.svg'],
});
