/**
 * Phase 5.5 — AdminDashboard useT() i18n wiring tests (P6)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const { mockUseTranslation } = vi.hoisted(() => {
  const mockUseTranslation = vi.fn(() => ({
    t: (key: string) => key,
    i18n: { language: 'tr', changeLanguage: vi.fn() },
  }));
  return { mockUseTranslation };
});

vi.mock('react-i18next', () => ({
  useTranslation: mockUseTranslation,
  initReactI18next: { type: '3rdParty', init: vi.fn() },
}));

vi.mock('../../hooks/useSSE', () => ({
  useSSE: vi.fn(() => ({ isConnected: false, reconnect: vi.fn() })),
}));

vi.mock('../../lib/api', () => ({
  apiClient: {
    get: vi.fn().mockResolvedValue({ data: { status: 'ok', data: { items: [] } } }),
  },
}));

vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...rest }: React.HTMLAttributes<HTMLDivElement>) =>
      React.createElement('div', rest, children),
  },
}));

vi.mock('../../components/admin/PromptTaskBoard', () => ({
  PromptTaskBoard: () => React.createElement('div', { 'data-testid': 'prompt-task-board' }),
}));

vi.mock('../../components/dashboard/widgets/SystemHealthWidget', () => ({
  SystemHealthWidget: () => React.createElement('div', { 'data-testid': 'system-health-widget' }),
}));

vi.mock('../../components/dashboard/widgets/HotLeadsWidget', () => ({
  HotLeadsWidget: () => React.createElement('div', { 'data-testid': 'hot-leads-widget' }),
}));

vi.mock('../../components/dashboard/widgets/PipelineWidget', () => ({
  PipelineWidget: () => React.createElement('div', { 'data-testid': 'pipeline-widget' }),
}));

vi.mock('recharts', () => ({
  AreaChart: () => null,
  Area: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', null, children),
  BarChart: () => null,
  Bar: () => null,
}));

import { AdminDashboard } from './AdminDashboard';

const makeQC = () => new QueryClient({ defaultOptions: { queries: { retry: false } } });

const renderDashboard = (qc: QueryClient) =>
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    </QueryClientProvider>,
  );

describe('AdminDashboard — useT() i18n wiring (P6)', () => {
  let qc: QueryClient;

  beforeEach(() => {
    qc = makeQC();
    mockUseTranslation.mockClear();
  });

  it('renders admin dashboard container with testid', () => {
    renderDashboard(qc);
    expect(screen.getByTestId('admin-dashboard')).toBeDefined();
  });

  it('renders page title via t() — i18n key visible in mock', () => {
    renderDashboard(qc);
    // t('dashboard.title') returns 'dashboard.title' in mock
    expect(screen.getByText('dashboard.title')).toBeDefined();
  });

  it('useT hook wired — useTranslation called with admin namespace', () => {
    renderDashboard(qc);
    expect(mockUseTranslation).toHaveBeenCalledWith('admin');
  });
});
