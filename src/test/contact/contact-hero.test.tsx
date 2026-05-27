import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { ContactPage } from '../../pages/ContactPage';

vi.mock('../../lib/i18n', () => ({
  useTranslation: () => ({ t: (k: string) => k, language: 'tr' }),
  getLang: (_ml: unknown, _l: unknown) => 'İstanbul, Türkiye',
  MultiLang: {},
  Language: 'tr',
}));
vi.mock('../../data/copy/common', () => ({
  CONTACT_CONFIG: {
    email: 'info@ecypro.com',
    phone: '',
    address: { tr: 'İstanbul', en: 'Istanbul' },
  },
}));
vi.mock('../../components/forms/ContactForm', () => ({
  ContactForm: () => <form data-testid="mock-contact-form" />,
}));
vi.mock('../../components/booking/CalendlyEmbed', () => ({
  CalendlyEmbed: () => <div data-testid="mock-calendly" />,
}));
vi.mock('../../components/seo/JsonLd', () => ({ JsonLd: () => null }));
vi.mock('../../lib/structured-data', () => ({ buildBreadcrumbSchema: () => ({}) }));
vi.mock('../../i18n/canonical', () => ({
  buildCanonical: (_p: string, _l: string) => `https://ecypro.com${_p}`,
}));

function renderContact() {
  return render(
    <HelmetProvider>
      <MemoryRouter>
        <ContactPage />
      </MemoryRouter>
    </HelmetProvider>,
  );
}

describe('atom-6-1: Contact Hero', () => {
  it('renders contact-hero section', () => {
    renderContact();
    expect(screen.getByTestId('contact-hero')).toBeDefined();
  });

  it('renders eyebrow with "doğrudan" text', () => {
    renderContact();
    const hero = screen.getByTestId('contact-hero');
    expect(hero.textContent?.toLowerCase()).toContain('doğrudan');
  });

  it('renders value prop paragraph with "48" reference', () => {
    renderContact();
    const hero = screen.getByTestId('contact-hero');
    expect(hero.textContent).toContain('48');
  });

  it('renders h1 in hero section', () => {
    renderContact();
    const hero = screen.getByTestId('contact-hero');
    expect(hero.querySelector('h1')).toBeTruthy();
  });
});
