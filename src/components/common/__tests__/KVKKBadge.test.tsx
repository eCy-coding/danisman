import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { KVKKBadge } from '../KVKKBadge';

describe('KVKKBadge', () => {
  it('renders newsletter variant with KVKK text', () => {
    render(<KVKKBadge variant="newsletter" />);
    expect(screen.getByTestId('kvkk-badge-newsletter')).toBeTruthy();
    expect(screen.getAllByText(/KVKK/i).length).toBeGreaterThan(0);
  });

  it('renders discovery variant with GDPR text', () => {
    render(<KVKKBadge variant="discovery" />);
    expect(screen.getByTestId('kvkk-badge-discovery')).toBeTruthy();
    expect(screen.getAllByText(/KVKK|GDPR/i).length).toBeGreaterThan(0);
  });

  it('has ShieldCheck icon accessible aria-hidden', () => {
    render(<KVKKBadge variant="newsletter" />);
    const icons = document.querySelectorAll('[aria-hidden="true"]');
    expect(icons.length).toBeGreaterThan(0);
  });

  it('links to KVKK policy page', () => {
    render(<KVKKBadge variant="newsletter" />);
    const link = screen.getByRole('link');
    expect(link.getAttribute('href')).toMatch(/kvkk|privacy/i);
  });
});

describe('DataResidencyBadge', () => {
  it('renders EU region badge', async () => {
    const { DataResidencyBadge } = await import('../KVKKBadge');
    render(<DataResidencyBadge region="EU" />);
    expect(screen.getByTestId('data-residency-badge')).toBeTruthy();
    expect(screen.getByText(/EU|Avrupa/i)).toBeTruthy();
  });
});
