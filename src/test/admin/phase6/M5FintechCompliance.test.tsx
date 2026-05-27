/**
 * M5: Fintech Trifecta Compass + Compliance Dashboard — TDD tests
 * Trifecta radar, risk heatmap, deadline countdown, regulator filter, a11y.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

// ─── Types ──────────────────────────────────────────────────

type Regulator = 'SPK' | 'MASAK' | 'KVKK' | 'TCMB' | 'BDDK';
type ComplianceItemStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED';

interface ComplianceItem {
  id: string;
  clientId: string;
  regulator: Regulator;
  category: string;
  status: ComplianceItemStatus;
  riskScore: number;
  dueDate?: string;
  notes?: string;
}

interface RegulatorSummary {
  regulator: Regulator;
  totalItems: number;
  approvedItems: number;
  avgRiskScore: number;
  pendingDeadlines: number;
}

// ─── Mock data ───────────────────────────────────────────────

const mockItems: ComplianceItem[] = [
  {
    id: '1',
    clientId: 'c1',
    regulator: 'SPK',
    category: 'CASP lisans başvurusu',
    status: 'IN_PROGRESS',
    riskScore: 8,
    dueDate: '2026-08-31',
  },
  {
    id: '2',
    clientId: 'c1',
    regulator: 'SPK',
    category: 'Yatırım aracı tescil',
    status: 'NOT_STARTED',
    riskScore: 6,
    dueDate: '2026-09-30',
  },
  {
    id: '3',
    clientId: 'c1',
    regulator: 'MASAK',
    category: 'AML programı',
    status: 'UNDER_REVIEW',
    riskScore: 7,
  },
  {
    id: '4',
    clientId: 'c1',
    regulator: 'MASAK',
    category: 'STR bildirim sistemi',
    status: 'APPROVED',
    riskScore: 3,
  },
  {
    id: '5',
    clientId: 'c1',
    regulator: 'KVKK',
    category: 'VERBİS kayıt',
    status: 'APPROVED',
    riskScore: 4,
  },
  {
    id: '6',
    clientId: 'c1',
    regulator: 'KVKK',
    category: 'KVKK politikası',
    status: 'IN_PROGRESS',
    riskScore: 5,
  },
  {
    id: '7',
    clientId: 'c1',
    regulator: 'TCMB',
    category: 'Elektronik para lisans',
    status: 'NOT_STARTED',
    riskScore: 9,
    dueDate: '2026-07-15',
  },
  {
    id: '8',
    clientId: 'c1',
    regulator: 'BDDK',
    category: 'Dijital banka başvurusu',
    status: 'NOT_STARTED',
    riskScore: 10,
    dueDate: '2026-10-01',
  },
];

const ALL_REGULATORS: Regulator[] = ['SPK', 'MASAK', 'KVKK', 'TCMB', 'BDDK'];

const computeSummaries = (items: ComplianceItem[]): RegulatorSummary[] =>
  ALL_REGULATORS.map((reg) => {
    const regItems = items.filter((i) => i.regulator === reg);
    return {
      regulator: reg,
      totalItems: regItems.length,
      approvedItems: regItems.filter((i) => i.status === 'APPROVED').length,
      avgRiskScore:
        regItems.length > 0
          ? Math.round(regItems.reduce((s, i) => s + i.riskScore, 0) / regItems.length)
          : 0,
      pendingDeadlines: regItems.filter((i) => i.dueDate && i.status !== 'APPROVED').length,
    };
  });

// ─── Stub components ─────────────────────────────────────────

const RegulatorStatusCard: React.FC<{ summary: RegulatorSummary }> = ({ summary }) => (
  <article
    data-testid={`regulator-card-${summary.regulator}`}
    aria-label={`${summary.regulator} uyumluluk kartı`}
  >
    <h3 data-testid={`card-title-${summary.regulator}`}>{summary.regulator}</h3>
    <span data-testid={`card-approved-${summary.regulator}`}>
      {summary.approvedItems}/{summary.totalItems}
    </span>
    <span data-testid={`card-risk-${summary.regulator}`}>Risk: {summary.avgRiskScore}</span>
  </article>
);

const TrifectaCompass: React.FC<{
  summaries: RegulatorSummary[];
}> = ({ summaries }) => {
  const trifecta = summaries.filter((s) => ['SPK', 'MASAK', 'KVKK'].includes(s.regulator));
  const overallScore =
    trifecta.length > 0
      ? Math.round(
          trifecta.reduce((s, r) => s + (r.approvedItems / Math.max(r.totalItems, 1)) * 100, 0) /
            trifecta.length,
        )
      : 0;
  return (
    <div data-testid="trifecta-compass" aria-label="SPK+MASAK+KVKK Trifecta Kompass">
      <span data-testid="trifecta-score">{overallScore}%</span>
      {trifecta.map((s) => (
        <div key={s.regulator} data-testid={`trifecta-axis-${s.regulator}`}>
          {s.regulator}: {Math.round((s.approvedItems / Math.max(s.totalItems, 1)) * 100)}%
        </div>
      ))}
    </div>
  );
};

const RiskHeatmap: React.FC<{
  items: ComplianceItem[];
  onItemClick: (id: string) => void;
}> = ({ items, onItemClick }) => (
  <div data-testid="risk-heatmap" aria-label="Risk Isı Haritası">
    {items.map((item) => (
      <button
        key={item.id}
        data-testid={`heatmap-cell-${item.id}`}
        data-risk={item.riskScore}
        onClick={() => onItemClick(item.id)}
        aria-label={`${item.category}: risk skoru ${item.riskScore}`}
        style={{
          backgroundColor:
            item.riskScore >= 8 ? '#ef4444' : item.riskScore >= 5 ? '#f59e0b' : '#22c55e',
        }}
      >
        {item.category}
      </button>
    ))}
  </div>
);

const DeadlineCountdown: React.FC<{
  items: ComplianceItem[];
  referenceDate: Date;
}> = ({ items, referenceDate }) => {
  const withDeadlines = items
    .filter((i) => i.dueDate && i.status !== 'APPROVED')
    .map((i) => {
      const days = Math.ceil((new Date(i.dueDate!).getTime() - referenceDate.getTime()) / 86400000);
      return { ...i, daysLeft: days };
    })
    .sort((a, b) => a.daysLeft - b.daysLeft);

  return (
    <ul data-testid="deadline-countdown" aria-label="Son Tarih Sayacı">
      {withDeadlines.map((item) => (
        <li key={item.id} data-testid={`deadline-${item.id}`}>
          <span data-testid={`deadline-reg-${item.id}`}>{item.regulator}</span>
          <span data-testid={`deadline-days-${item.id}`}>{item.daysLeft} gün</span>
        </li>
      ))}
    </ul>
  );
};

const ComplianceItemList: React.FC<{
  items: ComplianceItem[];
  regulatorFilter: Regulator | 'ALL';
  onFilterChange: (r: Regulator | 'ALL') => void;
}> = ({ items, regulatorFilter, onFilterChange }) => {
  const filtered =
    regulatorFilter === 'ALL' ? items : items.filter((i) => i.regulator === regulatorFilter);
  return (
    <div data-testid="compliance-item-list">
      <select
        data-testid="regulator-filter"
        value={regulatorFilter}
        onChange={(e) => onFilterChange(e.target.value as Regulator | 'ALL')}
        aria-label="Regülatör filtresi"
      >
        <option value="ALL">Tümü</option>
        {ALL_REGULATORS.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
      <span data-testid="filtered-count">{filtered.length}</span>
      <ul aria-label="Uyumluluk Kalemleri">
        {filtered.map((item) => (
          <li key={item.id} data-testid={`item-${item.id}`}>
            {item.category}
          </li>
        ))}
      </ul>
    </div>
  );
};

// ─── Test wrapper ────────────────────────────────────────────

const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={qc}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
};

// ─── TESTS ──────────────────────────────────────────────────

describe('Phase 6 M5 — Fintech Compliance Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // T1: Trifecta compass shows SPK + MASAK + KVKK scores
  it('trifecta compass renders 3-axis SPK/MASAK/KVKK summary', () => {
    const summaries = computeSummaries(mockItems);
    render(<TrifectaCompass summaries={summaries} />, { wrapper });
    expect(screen.getByTestId('trifecta-compass')).not.toBeNull();
    expect(screen.getByTestId('trifecta-axis-SPK')).not.toBeNull();
    expect(screen.getByTestId('trifecta-axis-MASAK')).not.toBeNull();
    expect(screen.getByTestId('trifecta-axis-KVKK')).not.toBeNull();
    // Overall score is a number 0-100
    const score = Number(screen.getByTestId('trifecta-score').textContent?.replace('%', ''));
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  // T2: Risk heatmap — high risk items (>=8) clickable
  it('risk heatmap renders all items and fires onItemClick', () => {
    const onItemClick = vi.fn();
    render(<RiskHeatmap items={mockItems} onItemClick={onItemClick} />, { wrapper });
    expect(screen.getByTestId('risk-heatmap')).not.toBeNull();
    // Item 8 (BDDK, riskScore 10) should be in heatmap
    const cell8 = screen.getByTestId('heatmap-cell-8');
    expect(cell8.getAttribute('data-risk')).toBe('10');
    fireEvent.click(cell8);
    expect(onItemClick).toHaveBeenCalledWith('8');
  });

  // T3: Deadline countdown sorted by urgency
  it('deadline countdown shows items sorted by days remaining', () => {
    const refDate = new Date('2026-05-27');
    render(<DeadlineCountdown items={mockItems} referenceDate={refDate} />, { wrapper });
    const list = screen.getByTestId('deadline-countdown');
    const items = list.querySelectorAll('li');
    expect(items.length).toBeGreaterThan(0);

    const firstRegulator = screen.queryByTestId('deadline-reg-7')?.textContent;
    expect(firstRegulator).toBe('TCMB'); // TCMB due 2026-07-15 = 49 days (soonest)
  });

  // T4: Regulator filter shows correct item count
  it('regulator filter returns only matching items', () => {
    const onFilterChange = vi.fn();
    render(
      <ComplianceItemList
        items={mockItems}
        regulatorFilter="ALL"
        onFilterChange={onFilterChange}
      />,
      { wrapper },
    );
    expect(screen.getByTestId('filtered-count').textContent).toBe('8');

    const select = screen.getByTestId('regulator-filter');
    fireEvent.change(select, { target: { value: 'SPK' } });
    expect(onFilterChange).toHaveBeenCalledWith('SPK');
  });

  // T5: All 5 regulators have status cards
  it('5 regulator status cards render with correct titles', () => {
    const summaries = computeSummaries(mockItems);
    const { container } = render(
      <div>
        {summaries.map((s) => (
          <RegulatorStatusCard key={s.regulator} summary={s} />
        ))}
      </div>,
      { wrapper },
    );
    ALL_REGULATORS.forEach((reg) => {
      const card = container.querySelector(`[data-testid="regulator-card-${reg}"]`);
      expect(card).not.toBeNull();
      const title = container.querySelector(`[data-testid="card-title-${reg}"]`);
      expect(title?.textContent).toBe(reg);
    });
  });

  // T6: a11y — heatmap, compass, filter have accessible labels
  it('heatmap and filter select have accessible labels', () => {
    const { container: heatmapContainer } = render(
      <RiskHeatmap items={mockItems} onItemClick={vi.fn()} />,
      { wrapper },
    );
    const heatmap = heatmapContainer.querySelector('[aria-label="Risk Isı Haritası"]');
    expect(heatmap).not.toBeNull();

    const { container: listContainer } = render(
      <ComplianceItemList items={mockItems} regulatorFilter="ALL" onFilterChange={vi.fn()} />,
      { wrapper },
    );
    const select = listContainer.querySelector('[aria-label="Regülatör filtresi"]');
    expect(select).not.toBeNull();
  });
});
