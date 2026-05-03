import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/Button';
import { describe, it, expect } from 'vitest';
import React from 'react';

describe('Button', () => {
  it('renders correctly with default props', () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeDefined();
    expect(button.className).toContain('bg-[var(--color-primary)]');
  });

  it('renders loading state', () => {
    render(<Button isLoading>Click me</Button>);
    const button = screen.getByRole('button');
    expect(button.hasAttribute('disabled')).toBe(true);
    // The button text "Click me" is still present
    expect(screen.getByText('Click me')).toBeDefined();   
  });

  it('renders variants correctly', () => {
    render(<Button variant="outline">Outline</Button>);
    const button = screen.getByRole('button', { name: /outline/i });
    expect(button.className).toContain('border-white/20');
  });
});
