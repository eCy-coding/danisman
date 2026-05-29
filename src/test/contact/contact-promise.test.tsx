import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { ContactPage } from '../../pages/ContactPage';

vi.mock('../../lib/i18n', () => ({
  useTranslation: () => ({ t: (k: string) => k, language: 'tr' }),
  getLang: () => 'Levent, İstanbul 34330',
  MultiLang: {},
  Language: 'tr',
}));
vi.mock('../../data/copy/common', () => ({
  CONTACT_CONFIG: {
    email: 'info@ecypro.com',
    phone: '',
    address: { tr: 'Levent, İstanbul', en: 'Levent, Istanbul' },
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

describe('atom-6-4: Contact Promise + Office Location', () => {
  it('renders contact-promise section', () => {
    renderContact();
    expect(screen.getByTestId('contact-promise')).toBeDefined();
  });

  it('promise section contains "48" text', () => {
    renderContact();
    const section = screen.getByTestId('contact-promise');
    expect(section.textContent).toContain('48');
  });

  it('promise section contains office location', () => {
    renderContact();
    const section = screen.getByTestId('contact-promise');
    expect(section.textContent).toMatch(/İstanbul|Levent/);
  });

  it('renders h2 headings in promise section', () => {
    renderContact();
    const section = screen.getByTestId('contact-promise');
    const headings = section.querySelectorAll('h2');
    expect(headings.length).toBeGreaterThanOrEqual(1);
  });
});
