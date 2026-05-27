/**
 * M4 — ROPA UI component tests
 *
 * Covers:
 *   1. ROPAProcessCard: renders processId and retention period with lock indicator
 *   2. ROPAProcessCard: retention period cannot be edited (no input present)
 *   3. ROPALegalBasisDropdown: renders 5 options
 *   4. ROPADataCategoryPicker: renders all 14 categories
 *   5. AdminROPAPage: renders "İşleme Envanteri (ROPA)" heading
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ROPAProcessCard } from '../components/admin/ropa/ROPAProcessCard';
import { ROPALegalBasisDropdown } from '../components/admin/ropa/ROPALegalBasisDropdown';
import { ROPADataCategoryPicker } from '../components/admin/ropa/ROPADataCategoryPicker';
import { AdminROPAPage } from '../pages/admin/AdminROPAPage';
import type { ROPAProcessItem } from '../components/admin/ropa/ROPAProcessCard';

// Mock apiClient so AdminROPAPage doesn't hit the network
vi.mock('../lib/api', () => ({
  apiClient: {
    get: vi.fn().mockResolvedValue({ data: { status: 'ok', data: [] } }),
    post: vi.fn().mockResolvedValue({ data: { status: 'ok', data: { seeded: 8 } } }),
    patch: vi.fn().mockResolvedValue({ data: { status: 'ok' } }),
  },
}));

const MOCK_PROCESS: ROPAProcessItem = {
  id: 'cltest1',
  processId: 'HR-01',
  name: 'Bordro',
  purpose: 'Kanuni yükümlülük — çalışan maaş ve prim ödemeleri',
  legalBasis: 'KVKK m.5/2-a',
  dataCategories: ['KIMLIK', 'FINANSAL'],
  retentionPeriod: '10 yıl',
  retentionPeriodDays: 3650,
  retentionLegalSource: 'VUK + İK m.41',
  transferLocation: 'Yurt içi',
  transferMechanism: null,
  dpoApproved: false,
  lastReviewedAt: new Date().toISOString(),
  nextReviewDue: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
  status: 'ACTIVE',
};

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
}

describe('ROPAProcessCard', () => {
  it('renders processId and retention period with lock indicator', () => {
    render(<ROPAProcessCard process={MOCK_PROCESS} onApprove={vi.fn()} />);

    expect(screen.getByText('HR-01')).toBeDefined();
    expect(screen.getByTestId('retention-period-value').textContent).toBe('10 yıl');
    // Lock badge must be visible
    expect(screen.getByTestId('retention-lock-badge')).toBeDefined();
  });

  it('retention period cannot be edited — no input element for retentionPeriod', () => {
    const { container } = render(<ROPAProcessCard process={MOCK_PROCESS} onApprove={vi.fn()} />);

    // There must be no text input that lets the user type a custom retention value
    const inputs = container.querySelectorAll('input[type="text"], textarea');
    // None of the inputs (if any) should have a value of the retention period
    inputs.forEach((input) => {
      expect((input as HTMLInputElement).value).not.toBe('10 yıl');
      expect((input as HTMLInputElement).value).not.toBe('3650');
    });

    // The retention value is displayed as static text, not in an editable field
    const retentionEl = screen.getByTestId('retention-period-value');
    expect(retentionEl.tagName.toLowerCase()).not.toBe('input');
    expect(retentionEl.tagName.toLowerCase()).not.toBe('textarea');
  });
});

describe('ROPALegalBasisDropdown', () => {
  it('renders 5 KVKK m.5 legal basis options', () => {
    render(<ROPALegalBasisDropdown value="KVKK m.5/1" onChange={vi.fn()} />);

    const select = screen.getByRole('combobox');
    // 5 real options + 1 placeholder = 6 total option elements
    const options = select.querySelectorAll('option');
    // Exclude the placeholder (value="")
    const realOptions = Array.from(options).filter((o) => (o as HTMLOptionElement).value !== '');
    expect(realOptions).toHaveLength(5);
  });
});

describe('ROPADataCategoryPicker', () => {
  it('renders all 14 data categories as buttons', () => {
    render(<ROPADataCategoryPicker value={[]} onChange={vi.fn()} />);

    // Each category is rendered as a button
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(14);
  });
});

describe('AdminROPAPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders "İşleme Envanteri (ROPA)" heading', () => {
    const qc = makeQueryClient();
    render(
      <QueryClientProvider client={qc}>
        <AdminROPAPage />
      </QueryClientProvider>,
    );

    expect(screen.getByText('İşleme Envanteri (ROPA)')).toBeDefined();
  });
});
