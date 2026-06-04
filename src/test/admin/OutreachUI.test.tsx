import { render, screen } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WaveKPICard } from '../../components/admin/outreach/WaveKPICard';
import { ProspectStatusBadge } from '../../components/admin/outreach/ProspectStatusBadge';
import { WaveDetailView } from '../../components/admin/outreach/WaveDetailView';
import type { WaveRow } from '../../types/revenue';

function makeQC() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function withQC(ui: React.ReactElement) {
  return <QueryClientProvider client={makeQC()}>{ui}</QueryClientProvider>;
}

describe('OutreachUI', () => {
  test('1. WaveKPICard shows open/reply/meeting rates as percentages', () => {
    render(
      <div>
        <WaveKPICard label="Açılma Oranı" value={0.42} />
        <WaveKPICard label="Yanıt Oranı" value={0.18} />
        <WaveKPICard label="Görüşme Oranı" value={0.07} />
      </div>,
    );

    expect(screen.getByText('42.0%')).toBeTruthy();
    expect(screen.getByText('18.0%')).toBeTruthy();
    expect(screen.getByText('7.0%')).toBeTruthy();
  });

  test('2. ProspectStatusBadge renders correct label per status', () => {
    const { rerender } = render(<ProspectStatusBadge status="SENT" />);
    expect(screen.getByText('Gönderildi')).toBeTruthy();

    rerender(<ProspectStatusBadge status="OPENED" />);
    expect(screen.getByText('Açıldı')).toBeTruthy();

    rerender(<ProspectStatusBadge status="REPLIED" />);
    expect(screen.getByText('Yanıt Aldı')).toBeTruthy();

    rerender(<ProspectStatusBadge status="MEETING" />);
    expect(screen.getByText('Görüşme')).toBeTruthy();

    rerender(<ProspectStatusBadge status="DISQUALIFIED" />);
    expect(screen.getByText('Elendi')).toBeTruthy();
  });

  test('3. WaveDetailView shows prospect count + status grid', () => {
    const wave: WaveRow = {
      id: 'w1',
      name: 'Q1 Dalga',
      status: 'LIVE',
      prospects: [
        { id: 'p1', companyName: 'Alpha A.Ş.', status: 'OPENED' },
        { id: 'p2', companyName: 'Beta Ltd.', status: 'REPLIED' },
        { id: 'p3', companyName: 'Gamma Inc.', status: 'MEETING' },
      ],
      targetRevenueUsd: 30000,
      realizedRevenueUsd: 12000,
    };
    render(withQC(<WaveDetailView wave={wave} />));

    expect(screen.getByTestId('wave-detail-view')).toBeTruthy();
    expect(screen.getByText('Alpha A.Ş.')).toBeTruthy();
    expect(screen.getByText('Beta Ltd.')).toBeTruthy();
    expect(screen.getByText('Gamma Inc.')).toBeTruthy();
  });

  test('4. Realized revenue progress bar renders (realizedRevenueUsd / targetRevenueUsd)', () => {
    const wave: WaveRow = {
      id: 'w2',
      name: 'Q2 Dalga',
      status: 'LIVE',
      prospects: [],
      targetRevenueUsd: 50000,
      realizedRevenueUsd: 25000,
    };
    render(withQC(<WaveDetailView wave={wave} />));

    const bar = screen.getByTestId('revenue-progress-bar');
    expect(bar).toBeTruthy();
    // 25000/50000 = 50%
    expect(bar.getAttribute('aria-valuenow')).toBe('50');
  });
});
