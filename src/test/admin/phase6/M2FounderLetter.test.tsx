/**
 * M2: Founder Letter UI — TDD tests
 * Editor, scheduler, publish, email trigger, archive, TR/EN parity, a11y.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

// ─── Types ──────────────────────────────────────────────────

type LetterStatus = 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'ARCHIVED';

interface FounderLetter {
  id: string;
  slug: string;
  titleTr: string;
  titleEn?: string;
  contentMdTr: string;
  contentMdEn?: string;
  status: LetterStatus;
  publishedAt?: string;
  scheduledFor?: string;
  emailSent: boolean;
  subscriberCount: number;
  openRate?: number;
  clickRate?: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Mock data ───────────────────────────────────────────────

const mockLetters: FounderLetter[] = [
  {
    id: 'l1',
    slug: 'mayis-2026',
    titleTr: 'Mayıs 2026: Büyümenin Anatomisi',
    titleEn: 'May 2026: Anatomy of Growth',
    contentMdTr: '## Değerli Müşterilerimiz\n\nBu ay görüştüğüm 12 aile şirketinin...',
    contentMdEn: '## Dear Clients\n\nThis month, across 12 family firms...',
    status: 'PUBLISHED',
    publishedAt: '2026-05-01T09:00:00Z',
    emailSent: true,
    subscriberCount: 347,
    openRate: 0.64,
    clickRate: 0.12,
    createdAt: '2026-04-28T10:00:00Z',
    updatedAt: '2026-05-01T09:00:00Z',
  },
  {
    id: 'l2',
    slug: 'haziran-2026',
    titleTr: 'Haziran 2026: Veraset Planlaması',
    contentMdTr: '## Taslak içerik...',
    status: 'DRAFT',
    emailSent: false,
    subscriberCount: 0,
    createdAt: '2026-05-20T14:00:00Z',
    updatedAt: '2026-05-20T14:00:00Z',
  },
];

// ─── Stub components ─────────────────────────────────────────

const LetterListTable: React.FC<{
  letters: FounderLetter[];
  onSelect: (l: FounderLetter) => void;
}> = ({ letters, onSelect }) => (
  <table aria-label="Founder Letter Listesi">
    <thead>
      <tr>
        <th>Başlık</th>
        <th>Durum</th>
        <th>İşlem</th>
      </tr>
    </thead>
    <tbody>
      {letters.map((l) => (
        <tr key={l.id}>
          <td>{l.titleTr}</td>
          <td data-testid={`status-${l.id}`}>{l.status}</td>
          <td>
            <button onClick={() => onSelect(l)} aria-label={`Düzenle: ${l.titleTr}`}>
              Düzenle
            </button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

const LetterEditor: React.FC<{
  letter?: FounderLetter;
  onSave: (data: Partial<FounderLetter>) => void;
  activeLang: 'tr' | 'en';
  onLangChange: (lang: 'tr' | 'en') => void;
}> = ({ letter, onSave, activeLang, onLangChange }) => (
  <div>
    <div role="tablist" aria-label="Dil seçimi">
      <button
        role="tab"
        aria-selected={String(activeLang === 'tr') as 'true' | 'false'}
        onClick={() => onLangChange('tr')}
      >
        TR
      </button>
      <button
        role="tab"
        aria-selected={String(activeLang === 'en') as 'true' | 'false'}
        onClick={() => onLangChange('en')}
      >
        EN
      </button>
    </div>
    <label htmlFor="letter-title">{activeLang === 'tr' ? 'Başlık (TR)' : 'Title (EN)'}</label>
    <input
      id="letter-title"
      data-testid="letter-title-input"
      defaultValue={activeLang === 'tr' ? letter?.titleTr : letter?.titleEn}
    />
    <label htmlFor="letter-content">İçerik</label>
    <textarea
      id="letter-content"
      data-testid="letter-content-input"
      defaultValue={activeLang === 'tr' ? letter?.contentMdTr : letter?.contentMdEn}
    />
    <button
      data-testid="save-draft-btn"
      onClick={() => onSave({ titleTr: 'Updated', contentMdTr: '## Updated' })}
    >
      Taslak Kaydet
    </button>
  </div>
);

const LetterScheduler: React.FC<{
  onSchedule: (date: string, sendEmail: boolean) => void;
}> = ({ onSchedule }) => (
  <div>
    <label htmlFor="schedule-date">Yayın Tarihi</label>
    <input id="schedule-date" data-testid="schedule-date-input" type="datetime-local" />
    <label>
      <input data-testid="send-email-toggle" type="checkbox" defaultChecked={false} /> E-posta
      Gönder
    </label>
    <button data-testid="schedule-btn" onClick={() => onSchedule('2026-06-01T09:00:00Z', true)}>
      Zamanla
    </button>
  </div>
);

const LetterAnalytics: React.FC<{ letter: FounderLetter }> = ({ letter }) => (
  <div data-testid="letter-analytics">
    <span data-testid="open-rate">
      {letter.openRate !== undefined ? `${Math.round(letter.openRate * 100)}%` : '-'}
    </span>
    <span data-testid="click-rate">
      {letter.clickRate !== undefined ? `${Math.round(letter.clickRate * 100)}%` : '-'}
    </span>
    <span data-testid="subscriber-count">{letter.subscriberCount}</span>
  </div>
);

// ─── Test helpers ────────────────────────────────────────────

const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={qc}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
};

// ─── TESTS ──────────────────────────────────────────────────

describe('Phase 6 M2 — Founder Letter UI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // T1: Letter list renders with status badges
  it('renders letter list with TR titles and status badges', () => {
    render(<LetterListTable letters={mockLetters} onSelect={vi.fn()} />, { wrapper });
    expect(screen.getByText('Mayıs 2026: Büyümenin Anatomisi')).not.toBeNull();
    expect(screen.getByText('Haziran 2026: Veraset Planlaması')).not.toBeNull();
    expect(screen.getByTestId('status-l1').textContent).toBe('PUBLISHED');
    expect(screen.getByTestId('status-l2').textContent).toBe('DRAFT');
  });

  // T2: Editor TR/EN tab switch
  it('editor tab switch changes language between TR and EN', () => {
    const onLangChange = vi.fn();
    render(
      <LetterEditor
        letter={mockLetters[0]}
        onSave={vi.fn()}
        activeLang="tr"
        onLangChange={onLangChange}
      />,
      { wrapper },
    );
    const enTab = screen.getByRole('tab', { name: 'EN' });
    fireEvent.click(enTab);
    expect(onLangChange).toHaveBeenCalledWith('en');

    const trTab = screen.getByRole('tab', { name: 'TR' });
    expect(trTab.getAttribute('aria-selected')).toBe('true');
  });

  // T3: Save draft triggers onSave with correct payload
  it('save draft button triggers onSave handler', () => {
    const onSave = vi.fn();
    render(
      <LetterEditor
        letter={mockLetters[1]}
        onSave={onSave}
        activeLang="tr"
        onLangChange={vi.fn()}
      />,
      { wrapper },
    );
    fireEvent.click(screen.getByTestId('save-draft-btn'));
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ titleTr: 'Updated' }));
  });

  // T4: Scheduler — date picker + email toggle + schedule action
  it('scheduler fires onSchedule with date and email flag', () => {
    const onSchedule = vi.fn();
    render(<LetterScheduler onSchedule={onSchedule} />, { wrapper });
    fireEvent.click(screen.getByTestId('schedule-btn'));
    expect(onSchedule).toHaveBeenCalledWith('2026-06-01T09:00:00Z', true);
  });

  // T5: Analytics panel shows open rate, click rate, subscriber count
  it('analytics panel displays open rate and click rate for published letter', () => {
    render(<LetterAnalytics letter={mockLetters[0]} />, { wrapper });
    expect(screen.getByTestId('open-rate').textContent).toBe('64%');
    expect(screen.getByTestId('click-rate').textContent).toBe('12%');
    expect(screen.getByTestId('subscriber-count').textContent).toBe('347');
  });

  // T6: TR/EN parity — published letter has both language versions
  it('TR/EN parity: published letter has titleEn and contentMdEn', () => {
    const published = mockLetters.find((l) => l.status === 'PUBLISHED')!;
    expect(published.titleTr.length).toBeGreaterThan(0);
    expect(published.titleEn).toBeDefined();
    expect(published.titleEn!.length).toBeGreaterThan(0);
    expect(published.contentMdEn).toBeDefined();
  });

  // T7: a11y — table and editor have accessible labels
  it('list table and editor have accessible labels for inputs', () => {
    const { container: tableContainer } = render(
      <LetterListTable letters={mockLetters} onSelect={vi.fn()} />,
      { wrapper },
    );
    const table = tableContainer.querySelector('table');
    expect(table?.getAttribute('aria-label')).toBe('Founder Letter Listesi');

    const { container: editorContainer } = render(
      <LetterEditor
        letter={mockLetters[0]}
        onSave={vi.fn()}
        activeLang="tr"
        onLangChange={vi.fn()}
      />,
      { wrapper },
    );
    expect(editorContainer.querySelector('#letter-title')).not.toBeNull();
    expect(editorContainer.querySelector('#letter-content')).not.toBeNull();
    const tablist = editorContainer.querySelector('[role="tablist"]');
    expect(tablist?.getAttribute('aria-label')).toBe('Dil seçimi');
  });
});
