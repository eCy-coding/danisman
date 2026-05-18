/**
 * P55.C3 — Storybook stories for SocialProofFeed.
 *
 * Renders the floating + inline variants with the default in-memory feed.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { SocialProofFeed } from './SocialProofFeed';

const meta: Meta<typeof SocialProofFeed> = {
  title: 'Marketing/SocialProofFeed',
  component: SocialProofFeed,
  tags: ['autodocs'],
  parameters: { backgrounds: { default: 'dark' }, layout: 'centered' },
  argTypes: {
    floating: { control: 'boolean' },
    hideOnMobile: { control: 'boolean' },
  },
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Floating: Story = {
  args: { floating: true, hideOnMobile: false },
};

export const Inline: Story = {
  args: { floating: false, hideOnMobile: false },
};
