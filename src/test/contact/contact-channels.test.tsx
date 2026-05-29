import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { ContactPage } from '../../pages/ContactPage';

vi.mock('../../lib/i18n', () => ({
  useTranslation: () => ({ t: (k: string) => k, language: 'tr' }),
  getLang: () => 'İstanbul, Türkiye',
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
  ContactForm: () => <form data-testid="mock-form" />,
}));
vi.mock('../../components/booking/CalendlyEmbed', () => ({
  CalendlyEmbed: () => <div data-testid="mock-calendly" />,
}));
vi.mock('../../components/seo/JsonLd', () => ({ JsonLd: () => null }));
vi.mock('../../lib/structured-data', () => ({ buildBreadcrumbSchema: () => ({}) }));
vi.mock('../../i18n/canonical', () => ({
  buildCanonical: (_p: string) => `https://ecypro.com${_p}`,
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

describe('atom-6-3: Contact Channels Grid', () => {
  it('renders contact-channels section', () => {
    renderContact();
    expect(screen.getByTestId('contact-channels')).toBeDefined();
  });

  it('renders WhatsApp channel', () => {
    renderContact();
    const channels = screen.getByTestId('contact-channels');
    expect(channels.textContent).toContain('WhatsApp');
  });

  it('renders LinkedIn channel', () => {
    renderContact();
    const channels = screen.getByTestId('contact-channels');
    expect(channels.textContent?.toLowerCase()).toContain('linkedin');
  });

  it('renders Discovery Call / Calendly channel', () => {
    renderContact();
    const channels = screen.getByTestId('contact-channels');
    expect(channels.textContent).toMatch(/Discovery|Calendly|Randevu/i);
  });

  it('WhatsApp link points to wa.me', () => {
    renderContact();
    const channels = screen.getByTestId('contact-channels');
    const waLink = channels.querySelector('a[href*="wa.me"]');
    expect(waLink).toBeTruthy();
  });
});
