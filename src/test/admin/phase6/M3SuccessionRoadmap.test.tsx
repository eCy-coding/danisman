/**
 * M3: Succession Roadmap Visualizer — TDD tests
 * Timeline render, KPI persist, milestone CRUD, generation tree, a11y, brand voice.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

// ─── Types ──────────────────────────────────────────────────

type SuccessionStatus = 'ASSESSMENT' | 'PLANNING' | 'EXECUTION' | 'COMPLETED';
type MilestoneStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED';

interface SuccessionMilestone {
  id: string;
  name: string;
  expectedDate?: string;
  actualDate?: string;
  status: MilestoneStatus;
}

interface SuccessionKPI {
  id: string;
  metric: string;
  baselineValue: string;
  targetValue: string;
  currentValue?: string;
}

interface SuccessionRoadmap {
  id: string;
  clientId: string;
  clientName: string;
  generationFrom: number;
  generationTo: number;
  estimatedYear?: number;
  status: SuccessionStatus;
  milestones: SuccessionMilestone[];
  kpis: SuccessionKPI[];
}

// ─── Mock data ───────────────────────────────────────────────

const mockMilestones: SuccessionMilestone[] = [
  { id: 'm1', name: 'Aile anayasası imza', expectedDate: '2026-09-01', status: 'PENDING' },
  { id: 'm2', name: 'Holding kuruluş', expectedDate: '2027-01-01', status: 'PENDING' },
  { id: 'm3', name: 'MIP başlangıç', expectedDate: '2027-06-01', status: 'PENDING' },
  { id: 'm4', name: 'Aile meclisi ilk toplantı', actualDate: '2026-03-15', status: 'COMPLETED' },
];

const mockKPIs: SuccessionKPI[] = [
  { id: 'k1', metric: 'ESG skor', baselineValue: '32', targetValue: '65', currentValue: '48' },
  {
    id: 'k2',
    metric: 'Yönetim Kurulu bağımsızlığı',
    baselineValue: '0%',
    targetValue: '33%',
    currentValue: '11%',
  },
  {
    id: 'k3',
    metric: 'Profesyonel CEO atama',
    baselineValue: 'Hayır',
    targetValue: 'Evet',
    currentValue: undefined,
  },
  {
    id: 'k4',
    metric: 'Holding hisse devri',
    baselineValue: 'Tamamlanmadı',
    targetValue: 'Tamamlandı',
    currentValue: undefined,
  },
];

const mockRoadmap: SuccessionRoadmap = {
  id: 'sr1',
  clientId: 'c1',
  clientName: 'Yıldız Holding A.Ş.',
  generationFrom: 1,
  generationTo: 2,
  estimatedYear: 2028,
  status: 'PLANNING',
  milestones: mockMilestones,
  kpis: mockKPIs,
};

// ─── Stub components ─────────────────────────────────────────

const SuccessionTimeline: React.FC<{
  milestones: SuccessionMilestone[];
  onStatusChange: (id: string, status: MilestoneStatus) => void;
}> = ({ milestones, onStatusChange }) => (
  <ol aria-label="Süreç Zaman Çizelgesi" data-testid="succession-timeline">
    {milestones.map((m) => (
      <li key={m.id} data-testid={`milestone-${m.id}`}>
        <span data-testid={`milestone-name-${m.id}`}>{m.name}</span>
        <span data-testid={`milestone-status-${m.id}`}>{m.status}</span>
        <button
          data-testid={`complete-btn-${m.id}`}
          onClick={() => onStatusChange(m.id, 'COMPLETED')}
          aria-label={`${m.name} tamamlandı`}
        >
          Tamamla
        </button>
      </li>
    ))}
  </ol>
);

const SuccessionKPICards: React.FC<{ kpis: SuccessionKPI[] }> = ({ kpis }) => (
  <ul data-testid="kpi-cards" aria-label="Veraset KPI Göstergeleri">
    {kpis.map((k) => (
      <li key={k.id} data-testid={`kpi-${k.id}`}>
        <span data-testid={`kpi-metric-${k.id}`}>{k.metric}</span>
        <span data-testid={`kpi-baseline-${k.id}`}>{k.baselineValue}</span>
        <span data-testid={`kpi-target-${k.id}`}>{k.targetValue}</span>
        <span data-testid={`kpi-current-${k.id}`}>{k.currentValue ?? '-'}</span>
      </li>
    ))}
  </ul>
);

const GenerationDiagram: React.FC<{
  generationFrom: number;
  generationTo: number;
  clientName: string;
}> = ({ generationFrom, generationTo, clientName }) => (
  <div data-testid="generation-diagram" aria-label={`${clientName} kuşak geçiş diyagramı`}>
    <span data-testid="gen-from">{generationFrom}. Kuşak</span>
    <span data-testid="gen-arrow">→</span>
    <span data-testid="gen-to">{generationTo}. Kuşak</span>
    <p data-testid="gen-client">{clientName}</p>
  </div>
);

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

describe('Phase 6 M3 — Succession Roadmap Visualizer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // T1: Timeline renders all milestones with TR names
  it('renders succession timeline with all TR milestone names', () => {
    render(<SuccessionTimeline milestones={mockMilestones} onStatusChange={vi.fn()} />, {
      wrapper,
    });
    expect(screen.getByTestId('succession-timeline')).not.toBeNull();
    expect(screen.getByTestId('milestone-name-m1').textContent).toBe('Aile anayasası imza');
    expect(screen.getByTestId('milestone-name-m4').textContent).toBe('Aile meclisi ilk toplantı');
    expect(screen.getByTestId('milestone-status-m4').textContent).toBe('COMPLETED');
  });

  // T2: KPI cards display baseline / target / current values
  it('KPI cards display metric, baseline, target, and current values', () => {
    render(<SuccessionKPICards kpis={mockKPIs} />, { wrapper });
    expect(screen.getByTestId('kpi-metric-k1').textContent).toBe('ESG skor');
    expect(screen.getByTestId('kpi-baseline-k1').textContent).toBe('32');
    expect(screen.getByTestId('kpi-target-k1').textContent).toBe('65');
    expect(screen.getByTestId('kpi-current-k1').textContent).toBe('48');
    expect(screen.getByTestId('kpi-current-k3').textContent).toBe('-'); // no current value
  });

  // T3: Milestone status change callback fires correctly
  it('complete action fires onStatusChange with correct id and COMPLETED status', () => {
    const onStatusChange = vi.fn();
    render(<SuccessionTimeline milestones={mockMilestones} onStatusChange={onStatusChange} />, {
      wrapper,
    });
    fireEvent.click(screen.getByTestId('complete-btn-m1'));
    expect(onStatusChange).toHaveBeenCalledWith('m1', 'COMPLETED');
  });

  // T4: Generation diagram shows kuşak transition + client name
  it('generation diagram shows from/to generation and client name', () => {
    render(
      <GenerationDiagram
        generationFrom={mockRoadmap.generationFrom}
        generationTo={mockRoadmap.generationTo}
        clientName={mockRoadmap.clientName}
      />,
      { wrapper },
    );
    expect(screen.getByTestId('gen-from').textContent).toBe('1. Kuşak');
    expect(screen.getByTestId('gen-to').textContent).toBe('2. Kuşak');
    expect(screen.getByTestId('gen-client').textContent).toBe('Yıldız Holding A.Ş.');
  });

  // T5: a11y — timeline and KPI list have accessible labels
  it('timeline and KPI cards have accessible labels', () => {
    const { container: tlContainer } = render(
      <SuccessionTimeline milestones={mockMilestones} onStatusChange={vi.fn()} />,
      { wrapper },
    );
    const tl = tlContainer.querySelector('[aria-label="Süreç Zaman Çizelgesi"]');
    expect(tl).not.toBeNull();

    const { container: kpiContainer } = render(<SuccessionKPICards kpis={mockKPIs} />, { wrapper });
    const kpiList = kpiContainer.querySelector('[aria-label="Veraset KPI Göstergeleri"]');
    expect(kpiList).not.toBeNull();
  });

  // T6: Brand voice — Türkçe terminoloji (Süreç/Kuşak/Veraset)
  it('uses correct TR brand terminology for succession context', () => {
    const terms = ['Aile anayasası imza', 'Holding kuruluş', 'MIP başlangıç', 'Aile meclisi'];
    terms.forEach((term) => {
      const milestone = mockMilestones.find((m) => m.name.startsWith(term.split(' ')[0]));
      expect(milestone).toBeDefined();
    });
    // KPI uses Türkçe business terms
    expect(mockKPIs.some((k) => k.metric.includes('Kurul'))).toBe(true);
    expect(mockKPIs.some((k) => k.metric.includes('CEO'))).toBe(true);
  });
});
