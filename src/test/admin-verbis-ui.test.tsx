/**
 * M5 — VERBİS UI component tests
 *
 * Covers:
 *   1. VERBISStatusCard: PENDING shows "Kayıt Bekleniyor"
 *   2. VERBISStatusCard: REGISTERED shows "Kayıtlı" + sicil no
 *   3. VERBISAnnualReview: overdue=true shows "süresi geçti" text
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { VERBISStatusCard } from '../components/admin/verbis/VERBISStatusCard';
import { VERBISAnnualReview } from '../components/admin/verbis/VERBISAnnualReview';

describe('VERBISStatusCard', () => {
  it('PENDING shows "Kayıt Bekleniyor"', () => {
    render(<VERBISStatusCard status="PENDING" />);
    expect(screen.getByText(/Kayıt Bekleniyor/)).toBeDefined();
  });

  it('REGISTERED shows "Kayıtlı" + sicil no', () => {
    render(
      <VERBISStatusCard
        status="REGISTERED"
        sicilNo="TR-2024-99999"
        registeredAt={new Date().toISOString()}
      />,
    );
    expect(screen.getByText(/Kayıtlı/)).toBeDefined();
    expect(screen.getByText('TR-2024-99999')).toBeDefined();
  });
});

describe('VERBISAnnualReview', () => {
  it('overdue=true shows "süresi geçti" text', () => {
    // A date one year in the past to trigger overdue
    const pastDate = new Date(Date.now() - 400 * 24 * 60 * 60 * 1000).toISOString();
    render(<VERBISAnnualReview nextReviewDue={pastDate} overdue={true} />);
    expect(screen.getByText(/süresi geçti/)).toBeDefined();
  });
});
