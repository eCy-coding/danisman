/**
 * Storybook Preview Config — EcyPro Premium
 * istek5.txt Phase 2: UI-Storybook
 *
 * - Tailwind CSS import (global styles)
 * - Dark theme (proje dark-mode)
 * - Viewport: mobile, tablet, desktop presets
 * - i18n: tr / en dil desteği (decorator)
 */

import type { Preview } from '@storybook/react';
import '../src/index.css';

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#050810' },
        { name: 'neutral', value: '#080d1a' },
        { name: 'light', value: '#f8fafc' },
      ],
    },
    viewport: {
      viewports: {
        mobile: { name: 'Mobile (375px)', styles: { width: '375px', height: '812px' } },
        tablet: { name: 'Tablet (768px)', styles: { width: '768px', height: '1024px' } },
        desktop: { name: 'Desktop (1280px)', styles: { width: '1280px', height: '800px' } },
        wide: { name: 'Wide (1920px)', styles: { width: '1920px', height: '1080px' } },
      },
      defaultViewport: 'desktop',
    },
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    a11y: { config: { rules: [{ id: 'color-contrast', enabled: true }] } },
  },
};

export default preview;
