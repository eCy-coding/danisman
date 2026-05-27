/**
 * M7 — Retention & Independence UI component tests
 *
 * Cases:
 *   1. RetentionPolicyTable: renders resource types and "İmha Uygula" buttons
 *   2. ImhaSertifikasiGenerator: renders sertifika ID
 *   3. IndependenceCheckForm: renders all fields including pureAdvisoryConfirmed checkbox
 *   4. IndependenceCheckForm: shows Big4 conflict warning when clientName contains "KPMG"
 *   5. BagimsizlikBeyaniGenerator: renders "Bağımsızlık Beyanı" heading
 */

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

import {
  RetentionPolicyTable,
  RetentionPolicyItem,
} from '../components/admin/retention/RetentionPolicyTable';
import { ImhaSertifikasiGenerator } from '../components/admin/retention/ImhaSertifikasiGenerator';
import { IndependenceCheckForm } from '../components/admin/clients/IndependenceCheckForm';
import {
  BagimsizlikBeyaniGenerator,
  IndependenceCheckItem,
} from '../components/admin/clients/BagimsizlikBeyaniGenerator';

// ── RetentionPolicyTable ──────────────────────────────────────────────────────

describe('RetentionPolicyTable', () => {
  const mockPolicies: RetentionPolicyItem[] = [
    {
      id: 'p1',
      resourceType: 'INVOICE',
      retentionDays: 3650,
      legalBasis: 'VUK',
      lastEnforced: null,
    },
    {
      id: 'p2',
      resourceType: 'CRM_RECORD',
      retentionDays: 1825,
      legalBasis: 'Meşru menfaat',
      lastEnforced: '2026-01-01T00:00:00.000Z',
    },
  ];

  it('renders resource types and "İmha Uygula" buttons', () => {
    render(<RetentionPolicyTable policies={mockPolicies} onEnforce={() => {}} />);

    // Resource types visible
    expect(screen.getByText('INVOICE')).toBeTruthy();
    expect(screen.getByText('CRM_RECORD')).toBeTruthy();

    // "İmha Uygula" buttons — one per policy
    const buttons = screen.getAllByText(/İmha Uygula/i);
    expect(buttons).toHaveLength(2);
  });
});

// ── ImhaSertifikasiGenerator ──────────────────────────────────────────────────

describe('ImhaSertifikasiGenerator', () => {
  it('renders sertifika ID', () => {
    const sertifikaId = '550e8400-e29b-41d4-a716-446655440000';
    render(
      <ImhaSertifikasiGenerator
        sertifikaId={sertifikaId}
        resourceType="INVOICE"
        enforcedAt="2026-05-26T10:00:00.000Z"
        legalBasis="VUK"
      />,
    );

    expect(screen.getByText(sertifikaId)).toBeTruthy();
    expect(screen.getByText(/Veri İmha Sertifikası/i)).toBeTruthy();
    expect(screen.getByText(/Sertifikayı İndir/i)).toBeTruthy();
  });
});

// ── IndependenceCheckForm ─────────────────────────────────────────────────────

describe('IndependenceCheckForm', () => {
  it('renders all fields including pureAdvisoryConfirmed checkbox', () => {
    render(<IndependenceCheckForm onSubmit={() => {}} loading={false} />);

    // clientId input
    expect(screen.getByPlaceholderText(/client-abc-123/i)).toBeTruthy();
    // clientName input
    expect(screen.getByPlaceholderText(/Şirket adı/i)).toBeTruthy();
    // signatoryUserId input
    expect(screen.getByPlaceholderText(/user-id/i)).toBeTruthy();
    // pureAdvisoryConfirmed checkbox
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeTruthy();
  });

  it('shows Big4 conflict warning when clientName contains "KPMG"', () => {
    render(<IndependenceCheckForm onSubmit={() => {}} loading={false} />);

    const clientNameInput = screen.getByPlaceholderText(/Şirket adı/i);
    fireEvent.change(clientNameInput, { target: { value: 'KPMG Turkey' } });

    expect(screen.getByText(/Big4 Çakışması Tespit Edildi/i)).toBeTruthy();
    expect(screen.getByText(/KPMG/i)).toBeTruthy();
  });
});

// ── BagimsizlikBeyaniGenerator ────────────────────────────────────────────────

describe('BagimsizlikBeyaniGenerator', () => {
  const mockCheck: IndependenceCheckItem = {
    id: 'chk-abc-123',
    clientId: 'client-xyz',
    checkedAt: '2026-05-26T09:00:00.000Z',
    auditFirmConflicts: [],
    pureAdvisoryConfirmed: true,
    signatoryUserId: 'user-admin-1',
    declarationDocUrl: null,
    validUntil: '2027-05-26T09:00:00.000Z',
  };

  it('renders "Bağımsızlık Beyanı" heading', () => {
    render(<BagimsizlikBeyaniGenerator check={mockCheck} />);

    expect(screen.getByText(/Bağımsızlık Beyanı/i)).toBeTruthy();
    expect(screen.getByText(/client-xyz/i)).toBeTruthy();
    expect(screen.getByText(/Beyanı İndir/i)).toBeTruthy();
  });
});
