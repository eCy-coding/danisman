import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

vi.mock('../../lib/i18n', () => ({
  useTranslation: () => ({ i18n: { language: 'tr' } }),
}));
vi.mock('../../lib/analytics', () => ({ trackEvent: vi.fn() }));

import { NewsletterSection } from '../NewsletterSection';

describe('NewsletterSection — atom-1-6 KVKKBadge', () => {
  it('renders KVKK badge in newsletter section', () => {
    render(<NewsletterSection />);
    expect(screen.getByTestId('kvkk-badge-newsletter')).toBeTruthy();
  });

  it('kvkk badge links to /kvkk', () => {
    render(<NewsletterSection />);
    const badge = screen.getByTestId('kvkk-badge-newsletter');
    const link = badge.querySelector('a[href*="kvkk"]');
    expect(link).toBeTruthy();
  });
});
