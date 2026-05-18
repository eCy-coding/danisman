/**
 * P55.C3 — Storybook stories for ResponsiveImage.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { ResponsiveImage } from './ResponsiveImage';

const meta: Meta<typeof ResponsiveImage> = {
  title: 'Common/ResponsiveImage',
  component: ResponsiveImage,
  tags: ['autodocs'],
  parameters: { backgrounds: { default: 'light' }, layout: 'centered' },
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    src: '/images/founder-portrait.jpg',
    alt: 'Founder portrait',
    width: 480,
    height: 640,
    sizes: '(max-width: 768px) 100vw, 480px',
  },
};

export const Retina: Story = {
  args: {
    src: '/images/founder-portrait.jpg',
    alt: 'Founder portrait',
    width: 240,
    height: 320,
    retina: true,
  },
};

export const Eager: Story = {
  args: {
    src: '/images/founder-portrait.jpg',
    alt: 'Founder portrait',
    width: 480,
    height: 640,
    loading: 'eager',
    fetchPriority: 'high',
  },
};
