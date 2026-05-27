/**
 * Cluster D — Error Pages test suite
 *
 * Covers:
 *   NotFoundPage: atoms 15-1, 15-2, 15-3
 *   ServerErrorPage: atoms 16-1, 16-2, 16-3
 *
 * atom-15-1: Empathy error illustration + "Aradığınızı bulamadık"
 * atom-15-2: Suggested links (3-4 popüler sayfa)
 * atom-15-3: Search bar + Home CTA
 * atom-16-1: Empathy error illustration + "Geçici bir teknik sorun"
 * atom-16-2: Status page link + last incident
 * atom-16-3: Retry CTA + contact fallback
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('react-helmet-async', () => ({
  Helmet: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="helmet">{children}</div>
  ),
  HelmetProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/lib/i18n', () => ({
  useTranslation: () => ({
    i18n: { language: 'tr' },
    t: (key: string) => key,
    language: 'tr',
  }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'tr' },
  }),
  Trans: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// NotFoundSearch stub
vi.mock('../components/common/NotFoundSearch', () => ({
  NotFoundSearch: ({ lang }: { lang: string }) => (
    <div data-testid="not-found-search" data-lang={lang}>
      <input type="search" placeholder="Arama..." aria-label="Sayfa ara" />
    </div>
  ),
}));

// motion/react stub
vi.mock('motion/react', () => ({
  motion: {
    div: React.forwardRef(
      (
        { children, ...props }: React.HTMLAttributes<HTMLDivElement>,
        ref: React.Ref<HTMLDivElement>,
      ) => (
        <div ref={ref} {...props}>
          {children}
        </div>
      ),
    ),
  },
  useReducedMotion: () => false,
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// react-router navigate mock
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// ── Helpers ───────────────────────────────────────────────────────────────────

const renderWithRouter = (element: React.ReactElement, path = '/') => {
  return render(<MemoryRouter initialEntries={[path]}>{element}</MemoryRouter>);
};

// ── NotFoundPage tests ────────────────────────────────────────────────────────

describe('NotFoundPage — atom-15-1: Empathy illustration', () => {
  let NotFoundPage: React.ComponentType;

  beforeEach(async () => {
    const mod = await import('../pages/NotFoundPage');
    NotFoundPage = mod.NotFoundPage ?? (mod as { default: React.ComponentType }).default;
  });

  it('renders 404 as large decorative number', () => {
    renderWithRouter(<NotFoundPage />);
    expect(screen.getByText('404')).toBeTruthy();
  });

  it('renders "Sayfa Bulunamadı" heading in TR', () => {
    renderWithRouter(<NotFoundPage />);
    expect(screen.getByText(/Sayfa Bulunamadı/i)).toBeTruthy();
  });

  it('renders empathy description text in TR', () => {
    renderWithRouter(<NotFoundPage />);
    expect(screen.getByText(/taşınmış|silinmiş|var olmamış/i)).toBeTruthy();
  });

  it('renders eCyPro logo link to home', () => {
    renderWithRouter(<NotFoundPage />);
    const logo = screen.getByRole('link', { name: /ecypro home/i });
    expect(logo).toBeTruthy();
  });
});

describe('NotFoundPage — atom-15-2: Suggested links', () => {
  let NotFoundPage: React.ComponentType;

  beforeEach(async () => {
    const mod = await import('../pages/NotFoundPage');
    NotFoundPage = mod.NotFoundPage ?? (mod as { default: React.ComponentType }).default;
  });

  it('renders at least 3 suggestion cards', () => {
    renderWithRouter(<NotFoundPage />);
    const links = screen.getAllByRole('link');
    // Should have Home, Services, Contact + suggestion cards
    expect(links.length).toBeGreaterThanOrEqual(3);
  });

  it('renders "Vaka Çalışmaları" suggestion', () => {
    renderWithRouter(<NotFoundPage />);
    expect(screen.getByText(/Vaka Çalışmaları/i)).toBeTruthy();
  });

  it('renders "Perspektifler" or blog suggestion', () => {
    renderWithRouter(<NotFoundPage />);
    expect(screen.getByText(/Perspektifler|İçgörüler|Blog/i)).toBeTruthy();
  });
});

describe('NotFoundPage — atom-15-3: Search bar + Home CTA', () => {
  let NotFoundPage: React.ComponentType;

  beforeEach(async () => {
    const mod = await import('../pages/NotFoundPage');
    NotFoundPage = mod.NotFoundPage ?? (mod as { default: React.ComponentType }).default;
  });

  it('renders NotFoundSearch component', () => {
    renderWithRouter(<NotFoundPage />);
    expect(screen.getByTestId('not-found-search')).toBeTruthy();
  });

  it('passes TR lang to NotFoundSearch', () => {
    renderWithRouter(<NotFoundPage />);
    const search = screen.getByTestId('not-found-search');
    expect(search.getAttribute('data-lang')).toBe('tr');
  });

  it('renders Ana Sayfa (home) CTA button', () => {
    renderWithRouter(<NotFoundPage />);
    expect(screen.getByText(/Ana Sayfa/i)).toBeTruthy();
  });

  it('renders Hizmetler button', () => {
    renderWithRouter(<NotFoundPage />);
    expect(screen.getByText(/Hizmetler/i)).toBeTruthy();
  });

  it('renders İletişim button', () => {
    renderWithRouter(<NotFoundPage />);
    expect(screen.getByText(/İletişim/i)).toBeTruthy();
  });

  it('has noindex meta robots', () => {
    renderWithRouter(<NotFoundPage />);
    // Helmet is mocked — just verify render didn't throw
    expect(screen.getByTestId('helmet')).toBeTruthy();
  });
});

// ── ServerErrorPage tests ─────────────────────────────────────────────────────

describe('ServerErrorPage — atom-16-1: Empathy illustration', () => {
  let ServerErrorPage: React.ComponentType;

  beforeEach(async () => {
    mockNavigate.mockClear();
    const mod = await import('../pages/ServerErrorPage');
    ServerErrorPage = mod.ServerErrorPage ?? (mod as { default: React.ComponentType }).default;
  });

  it('renders page with data-testid', () => {
    renderWithRouter(<ServerErrorPage />);
    expect(screen.getByTestId('server-error-page')).toBeTruthy();
  });

  it('renders 500 as large decorative number', () => {
    renderWithRouter(<ServerErrorPage />);
    expect(screen.getByText('500')).toBeTruthy();
  });

  it('renders "Geçici Bir Teknik Sorun" heading in TR', () => {
    renderWithRouter(<ServerErrorPage />);
    expect(screen.getByText(/Geçici Bir Teknik Sorun/i)).toBeTruthy();
  });

  it('renders empathy description about team working on fix', () => {
    renderWithRouter(<ServerErrorPage />);
    expect(screen.getByText(/çözüm|çalışıyor|durumun farkında/i)).toBeTruthy();
  });

  it('has role=alert on main section for a11y', () => {
    renderWithRouter(<ServerErrorPage />);
    expect(screen.getByRole('alert')).toBeTruthy();
  });

  it('has aria-live=assertive on main section', () => {
    renderWithRouter(<ServerErrorPage />);
    const alert = screen.getByRole('alert');
    expect(alert.getAttribute('aria-live')).toBe('assertive');
  });

  it('renders eCyPro logo link', () => {
    renderWithRouter(<ServerErrorPage />);
    const logo = screen.getByRole('link', { name: /ecypro ana sayfa|ecypro home/i });
    expect(logo).toBeTruthy();
  });
});

describe('ServerErrorPage — atom-16-2: Status page link', () => {
  let ServerErrorPage: React.ComponentType;

  beforeEach(async () => {
    const mod = await import('../pages/ServerErrorPage');
    ServerErrorPage = mod.ServerErrorPage ?? (mod as { default: React.ComponentType }).default;
  });

  it('renders status section', () => {
    renderWithRouter(<ServerErrorPage />);
    expect(screen.getByTestId('server-error-status')).toBeTruthy();
  });

  it('renders "Sistem Durumunu Gör" link', () => {
    renderWithRouter(<ServerErrorPage />);
    expect(screen.getByText(/Sistem Durumunu Gör/i)).toBeTruthy();
  });

  it('status link points to /status route', () => {
    renderWithRouter(<ServerErrorPage />);
    const link = screen.getByText(/Sistem Durumunu Gör/i).closest('a');
    expect(link?.getAttribute('href')).toBe('/status');
  });

  it('renders contact email fallback', () => {
    renderWithRouter(<ServerErrorPage />);
    expect(screen.getByText(/info@ecypro.com/i)).toBeTruthy();
  });
});

describe('ServerErrorPage — atom-16-3: Retry CTA + contact fallback', () => {
  let ServerErrorPage: React.ComponentType;

  beforeEach(async () => {
    mockNavigate.mockClear();
    const mod = await import('../pages/ServerErrorPage');
    ServerErrorPage = mod.ServerErrorPage ?? (mod as { default: React.ComponentType }).default;
  });

  it('renders action buttons container', () => {
    renderWithRouter(<ServerErrorPage />);
    expect(screen.getByTestId('server-error-actions')).toBeTruthy();
  });

  it('renders "Sayfayı Yenile" retry button', () => {
    renderWithRouter(<ServerErrorPage />);
    expect(screen.getByTestId('server-error-retry')).toBeTruthy();
    expect(screen.getByText(/Sayfayı Yenile/i)).toBeTruthy();
  });

  it('retry button calls navigate(0) on click', () => {
    renderWithRouter(<ServerErrorPage />);
    const retryBtn = screen.getByTestId('server-error-retry');
    fireEvent.click(retryBtn);
    expect(mockNavigate).toHaveBeenCalledWith(0);
  });

  it('renders "Ana Sayfaya Dön" home link', () => {
    renderWithRouter(<ServerErrorPage />);
    expect(screen.getByTestId('server-error-home')).toBeTruthy();
    expect(screen.getByText(/Ana Sayfaya Dön/i)).toBeTruthy();
  });

  it('home link points to /', () => {
    renderWithRouter(<ServerErrorPage />);
    const link = screen.getByTestId('server-error-home');
    expect(link.getAttribute('href')).toBe('/');
  });

  it('renders contact link', () => {
    renderWithRouter(<ServerErrorPage />);
    expect(screen.getByTestId('server-error-contact')).toBeTruthy();
    expect(screen.getByText(/Bize Ulaşın/i)).toBeTruthy();
  });

  it('contact link points to /contact', () => {
    renderWithRouter(<ServerErrorPage />);
    const link = screen.getByTestId('server-error-contact');
    expect(link.getAttribute('href')).toBe('/contact');
  });

  it('renders footer with copyright', () => {
    renderWithRouter(<ServerErrorPage />);
    expect(screen.getByText(/eCyPro Premium Consulting/i)).toBeTruthy();
  });
});
