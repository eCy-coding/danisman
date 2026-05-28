import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

vi.mock('react-router-dom', () => ({
  Link: ({ children, to, ...props }: { children: React.ReactNode; to: string }) =>
    React.createElement('a', { href: to, ...props }, children),
}));
vi.mock('../../lib/i18n', () => ({
  useTranslation: () => ({ i18n: { language: 'tr' }, t: (k: string) => k }),
}));
vi.mock('../../lib/analytics', () => ({ trackEvent: vi.fn() }));
vi.mock('../../i18n/helpers', () => ({
  localizedHref: (path: string, _lang: string) => path,
}));
vi.mock('../../constants', () => ({
  FOOTER_COPY: {
    brand: { tr: 'eCyPro', en: 'eCyPro' },
    tagline: { tr: 'Premium Danışmanlık', en: 'Premium Consulting' },
    privacy: { tr: 'Gizlilik', en: 'Privacy' },
    newsletter: { tr: 'Bülten', en: 'Newsletter' },
    email_placeholder: { tr: 'E-posta', en: 'Email' },
    subscribe: { tr: 'Abone Ol', en: 'Subscribe' },
    consent: { tr: 'Onay', en: 'Consent' },
  },
}));
vi.mock('../../common/CountrySelector', () => ({ CountrySelector: () => null }));
vi.mock('@/components/ui/EcyLogo', () => ({
  EcyLogo: () => <span>eCyPro</span>,
}));

import { Footer } from '../../layout/Footer';

describe('Footer — atom-1-8', () => {
  it('renders footer element', () => {
    render(<Footer />);
    expect(document.querySelector('footer')).toBeTruthy();
  });

  it('has KVKK m.10 link', () => {
    render(<Footer />);
    expect(screen.getByTestId('kvkk-m10')).toBeTruthy();
  });

  it('has KVKK m.11 link', () => {
    render(<Footer />);
    expect(screen.getByTestId('kvkk-m11')).toBeTruthy();
  });

  it('has social share buttons', () => {
    render(<Footer />);
    // Footer social links are rendered as <button> elements (Linkedin/Twitter/Instagram icons)
    const buttons = document.querySelectorAll('button[type="button"]');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('newsletter form renders', () => {
    render(<Footer />);
    expect(screen.getByTestId('newsletter-form')).toBeTruthy();
  });
});
