/**
 * Button Stories — P18 FE Track 1, Aşama 4.
 *
 * Tüm `variant` + `size` matrisini görsel olarak surface eder, böylece
 * tasarım doktrini (`AI Studio Tech` — opak surface, glassmorphism yok)
 * varyantlara sızmadan kalır. `isLoading` ve `disabled` interaction
 * state'leri de varyant grid'inde gösterilir.
 *
 * npm run storybook  → http://localhost:6006
 */
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: { backgrounds: { default: 'dark' }, layout: 'centered' },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline', 'ghost', 'destructive', 'premium', 'premium-gold'],
    },
    size: { control: 'select', options: ['sm', 'md', 'lg', 'icon'] },
    isLoading: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
};
export default meta;

type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: { variant: 'primary', size: 'md', children: 'Get started' },
};

export const Secondary: Story = {
  args: { variant: 'secondary', size: 'md', children: 'Book a consultation' },
};

export const Outline: Story = {
  args: { variant: 'outline', size: 'md', children: 'Learn more' },
};

export const Ghost: Story = {
  args: { variant: 'ghost', size: 'sm', children: 'Cancel' },
};

export const Destructive: Story = {
  args: { variant: 'destructive', size: 'md', children: 'Delete account' },
};

export const Premium: Story = {
  args: { variant: 'premium', size: 'lg', children: 'Premium consulting' },
};

export const Loading: Story = {
  args: { variant: 'primary', size: 'md', isLoading: true, children: 'Saving…' },
};

export const Disabled: Story = {
  args: { variant: 'primary', size: 'md', disabled: true, children: 'Unavailable' },
};

export const Matrix: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4 p-6 bg-[#1E1F20]">
      <Button variant="primary" size="sm">Primary sm</Button>
      <Button variant="primary" size="lg">Primary lg</Button>
      <Button variant="secondary" size="md">Secondary md</Button>
      <Button variant="outline" size="md">Outline md</Button>
      <Button variant="ghost" size="md">Ghost md</Button>
      <Button variant="destructive" size="md">Destructive md</Button>
      <Button variant="premium" size="md">Premium md</Button>
      <Button variant="premium-gold" size="md">Premium-gold md</Button>
    </div>
  ),
};
