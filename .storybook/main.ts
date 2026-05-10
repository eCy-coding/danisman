/**
 * Storybook Configuration — EcyPro Premium
 * istek5.txt Phase 2: UI-Storybook (pane 5)
 *
 * Çalıştır: npm run storybook  (önce: npm i -D @storybook/react @storybook/react-vite @storybook/addon-essentials)
 * Script: package.json "storybook": "storybook dev -p 6006"
 */

import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)', '../src/**/*.story.@(ts|tsx)'],
  addons: ['@storybook/addon-essentials', '@storybook/addon-a11y', '@storybook/addon-interactions'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  docs: { autodocs: 'tag' },
  viteFinalOptions: {},
};

export default config;
