/**
 * Input Stories — P18 FE Track 1, Aşama 4.
 *
 * Form primitive. Düzgün `aria-invalid` / `aria-describedby` kullanımı
 * `a11y-ci` gate'in en kolay yakaladığı regression noktası, o yüzden
 * error state'i ayrı story olarak surface ediyoruz.
 */
import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './Input';

const meta: Meta<typeof Input> = {
  title: 'UI/Input',
  component: Input,
  tags: ['autodocs'],
  parameters: { backgrounds: { default: 'dark' }, layout: 'centered' },
  argTypes: {
    label: { control: 'text' },
    placeholder: { control: 'text' },
    error: { control: 'text' },
    disabled: { control: 'boolean' },
  },
};
export default meta;

type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: {
    id: 'email-default',
    label: 'Work email',
    placeholder: 'you@company.com',
  },
};

export const WithValue: Story = {
  args: {
    id: 'email-value',
    label: 'Work email',
    defaultValue: 'emre@ecypro.com',
  },
};

export const Error: Story = {
  args: {
    id: 'email-error',
    label: 'Work email',
    defaultValue: 'not-an-email',
    error: 'Please enter a valid email address.',
  },
};

export const Disabled: Story = {
  args: {
    id: 'email-disabled',
    label: 'Work email',
    defaultValue: 'locked@ecypro.com',
    disabled: true,
  },
};

export const Stack: Story = {
  render: () => (
    <div className="space-y-fib-5 w-80">
      <Input id="s-name" label="Full name" placeholder="Emre Cinyangin" />
      <Input id="s-email" label="Work email" placeholder="you@company.com" />
      <Input
        id="s-pw"
        label="Password"
        type="password"
        defaultValue="weak"
        error="Use at least 12 characters."
      />
    </div>
  ),
};
