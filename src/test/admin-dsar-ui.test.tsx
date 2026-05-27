/**
 * DSAR UI component tests
 *
 * Cases:
 *   1. DSARCountdownBadge: green for 10 days remaining
 *   2. DSARCountdownBadge: yellow for 5 days remaining
 *   3. DSARCountdownBadge: red for ~0.5 days remaining
 *   4. DSARCountdownBadge: overdue (past deadline) shows "SLA Aşıldı"
 *   5. DSARRequestList: renders table with correct column headers
 *   6. DSARRequestForm: renders all required fields
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { DSARCountdownBadge } from '../components/admin/dsar/DSARCountdownBadge';
import { DSARRequestList, type DSARListItem } from '../components/admin/dsar/DSARRequestList';
import { DSARRequestForm } from '../components/admin/dsar/DSARRequestForm';

// ── Helpers ───────────────────────────────────────────────────────────────────

function daysFromNow(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

// ── DSARCountdownBadge ────────────────────────────────────────────────────────

describe('DSARCountdownBadge', () => {
  it('renders green text for 10 days remaining', () => {
    const { container } = render(
      <DSARCountdownBadge deadlineAt={daysFromNow(10)} extended={false} />,
    );
    const span = container.querySelector('.text-green-400');
    expect(span).not.toBeNull();
    expect(span?.textContent).toMatch(/10/);
  });

  it('renders yellow text for 5 days remaining', () => {
    const { container } = render(
      <DSARCountdownBadge deadlineAt={daysFromNow(5)} extended={false} />,
    );
    const span = container.querySelector('.text-yellow-400');
    expect(span).not.toBeNull();
    expect(span?.textContent).toMatch(/5/);
  });

  it('renders red text for ~0.5 days (12h) remaining', () => {
    const halfDay = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();
    const { container } = render(<DSARCountdownBadge deadlineAt={halfDay} extended={false} />);
    const span = container.querySelector('.text-red-400');
    expect(span).not.toBeNull();
  });

  it('renders "SLA Aşıldı" and line-through for overdue deadline', () => {
    const pastDeadline = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { container } = render(<DSARCountdownBadge deadlineAt={pastDeadline} extended={false} />);
    const span = container.querySelector('.line-through');
    expect(span).not.toBeNull();
    expect(span?.textContent).toContain('SLA Aşıldı');
  });
});

// ── DSARRequestList ───────────────────────────────────────────────────────────

describe('DSARRequestList', () => {
  const sampleRequests: DSARListItem[] = [
    {
      id: 'req-1',
      requesterEmail: 'ali@ornek.com',
      requesterName: 'Ali Yılmaz',
      requestType: 'ACCESS',
      receivedAt: new Date().toISOString(),
      slaDeadline: daysFromNow(20),
      extendedOnce: false,
      status: 'RECEIVED',
    },
  ];

  it('renders table with correct column headers', () => {
    render(<DSARRequestList requests={sampleRequests} onSelect={() => undefined} />);

    expect(screen.getByText('Başvuru Sahibi')).toBeTruthy();
    expect(screen.getByText('Tür')).toBeTruthy();
    // "Alındı" appears in both the header <th> and the status badge — use getAllByText
    expect(screen.getAllByText('Alındı').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('SLA')).toBeTruthy();
    expect(screen.getByText('Durum')).toBeTruthy();
  });
});

// ── DSARRequestForm ───────────────────────────────────────────────────────────

describe('DSARRequestForm', () => {
  it('renders all required fields', () => {
    render(<DSARRequestForm onSubmit={() => undefined} />);

    // Name field
    expect(screen.getByPlaceholderText('Ad Soyad')).toBeTruthy();
    // Email field
    expect(screen.getByPlaceholderText('ilgili@ornek.com')).toBeTruthy();
    // Type select — look for the label
    expect(screen.getByText(/Başvuru Türü/)).toBeTruthy();
    // Description textarea
    expect(screen.getByPlaceholderText('Başvuru detayları...')).toBeTruthy();
    // Submit button
    expect(screen.getByRole('button', { name: /Başvuruyu Kaydet/i })).toBeTruthy();
  });
});
