/**
 * M6 — Breach Incident UI component tests
 *
 * Cases:
 *   1. BreachCountdownTimer: renders "✓ Kurul'a Bildirildi" when reportedToKurul=true
 *   2. BreachCountdownTimer: renders overdue message when deadline is in the past and not reported
 *   3. BreachDetailForm: renders all form fields
 *   4. BreachReportButton: renders KVKK m.12/5 warning text
 *   5. [Golden] 72h countdown — exactly 48h remaining shows remaining time, not overdue
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { BreachCountdownTimer } from '../components/admin/breach/BreachCountdownTimer';
import { BreachDetailForm } from '../components/admin/breach/BreachDetailForm';
import { BreachReportButton } from '../components/admin/breach/BreachReportButton';

// ── BreachCountdownTimer ──────────────────────────────────────────────────────

describe('BreachCountdownTimer', () => {
  it('renders "✓ Kurul\'a Bildirildi" when reportedToKurul=true', () => {
    const futureDeadline = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    render(<BreachCountdownTimer notificationDeadline={futureDeadline} reportedToKurul={true} />);
    expect(screen.getByText(/Kurul'a Bildirildi/i)).toBeTruthy();
  });

  it('renders overdue message when deadline is in the past and not reported', () => {
    const pastDeadline = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    render(<BreachCountdownTimer notificationDeadline={pastDeadline} reportedToKurul={false} />);
    expect(screen.getByText(/Süre Aşıldı/i)).toBeTruthy();
  });

  it('72h countdown golden test — exactly 48h remaining shows remaining time, not overdue', () => {
    const futureDeadline = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    render(<BreachCountdownTimer notificationDeadline={futureDeadline} reportedToKurul={false} />);
    // Should show hours remaining, not overdue
    expect(screen.queryByText(/Süre Aşıldı/i)).toBeNull();
    // Should show remaining countdown (contains "kaldı")
    expect(screen.getByText(/kaldı/i)).toBeTruthy();
  });
});

// ── BreachDetailForm ──────────────────────────────────────────────────────────

describe('BreachDetailForm', () => {
  it('renders all form fields', () => {
    render(<BreachDetailForm onSubmit={() => {}} loading={false} />);

    // datetime-local input
    expect(screen.getByLabelText(/Tespit Tarihi/i)).toBeTruthy();
    // detectionSource select
    expect(screen.getByLabelText(/Tespit Kaynağı/i)).toBeTruthy();
    // description textarea
    expect(screen.getByLabelText(/İhlal Açıklaması/i)).toBeTruthy();
    // affectedSubjectsCount number input
    expect(screen.getByLabelText(/Etkilenen Kişi Sayısı/i)).toBeTruthy();
    // Data category checkboxes (spot check a few)
    expect(screen.getByLabelText(/Kimlik/i)).toBeTruthy();
    expect(screen.getByLabelText(/Finansal/i)).toBeTruthy();
    expect(screen.getByLabelText(/Çerez/i)).toBeTruthy();
    // Submit button
    expect(screen.getByRole('button', { name: /İhlali Kaydet/i })).toBeTruthy();
  });
});

// ── BreachReportButton ────────────────────────────────────────────────────────

describe('BreachReportButton', () => {
  it('renders KVKK m.12/5 warning text', () => {
    render(<BreachReportButton onClick={() => {}} />);
    expect(screen.getByText(/KVKK m\.12\/5/i)).toBeTruthy();
    expect(screen.getByText(/72 saat içinde Kurul'a bildirim zorunludur/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /Yeni İhlal Bildir/i })).toBeTruthy();
  });
});
