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
  ContactForm: () => (
    <form data-testid="contact-form">
      <input name="name" aria-label="Ad Soyad" />
      <input name="email" type="email" aria-label="E-posta" />
      <textarea name="message" aria-label="Mesajınız" />
      <button type="submit">Gönder</button>
    </form>
  ),
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

describe('atom-6-2: Contact Form section', () => {
  it('renders contact-form-section wrapper', () => {
    renderContact();
    expect(screen.getByTestId('contact-form-section')).toBeDefined();
  });

  it('form is inside the contact-form-section', () => {
    renderContact();
    const section = screen.getByTestId('contact-form-section');
    expect(section.querySelector('form')).toBeTruthy();
  });

  it('submit button is accessible', () => {
    renderContact();
    expect(screen.getByRole('button', { name: 'Gönder' })).toBeDefined();
  });
});
