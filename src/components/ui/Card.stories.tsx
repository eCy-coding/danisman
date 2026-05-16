/**
 * Card Stories — P18 FE Track 1, Aşama 4.
 *
 * `Card` AI Studio Tech doktrininin omurgasıdır: opak M3 surface, no
 * glassmorphism. Bu stories `flat / elevated / overlay` variant'larını ve
 * `padding` token'larını yan yana koyarak surface drift'i (örn. yanlışlıkla
 * `backdrop-blur` sızması) gözle yakalamayı kolaylaştırır.
 */
import type { Meta, StoryObj } from '@storybook/react';
import { Card } from './Card';

const meta: Meta<typeof Card> = {
  title: 'UI/Card',
  component: Card,
  tags: ['autodocs'],
  parameters: { backgrounds: { default: 'dark' }, layout: 'padded' },
  argTypes: {
    variant: { control: 'select', options: ['flat', 'elevated', 'overlay'] },
    padding: { control: 'select', options: ['none', 'sm', 'md', 'lg'] },
    interactive: { control: 'boolean' },
  },
};
export default meta;

type Story = StoryObj<typeof Card>;

const SampleContent = (
  <>
    <h3 className="text-golden-lg font-semibold text-white mb-2">Premium Consulting</h3>
    <p className="text-slate-300 text-sm">
      Production-grade dashboard with golden-ratio typography and Fibonacci spacing.
    </p>
  </>
);

export const Flat: Story = {
  args: { variant: 'flat', padding: 'md', children: SampleContent },
};

export const Elevated: Story = {
  args: { variant: 'elevated', padding: 'md', children: SampleContent },
};

export const Overlay: Story = {
  args: { variant: 'overlay', padding: 'lg', children: SampleContent },
};

export const Interactive: Story = {
  args: {
    variant: 'elevated',
    padding: 'md',
    interactive: true,
    children: SampleContent,
  },
};

export const VariantGrid: Story = {
  render: () => (
    <div className="grid md:grid-cols-3 gap-6 max-w-5xl">
      <Card variant="flat" padding="md">
        <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">flat</p>
        {SampleContent}
      </Card>
      <Card variant="elevated" padding="md">
        <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">elevated</p>
        {SampleContent}
      </Card>
      <Card variant="overlay" padding="md">
        <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">overlay</p>
        {SampleContent}
      </Card>
    </div>
  ),
};
