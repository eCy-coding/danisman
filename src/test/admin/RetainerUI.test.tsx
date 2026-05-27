import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import { CurrencyToggle } from '../../components/admin/retainer/CurrencyToggle';
import { InvoiceTimeline } from '../../components/admin/retainer/InvoiceTimeline';
import { RetainerListTable } from '../../components/admin/retainer/RetainerListTable';
import type { RetainerRow, MilestoneRow } from '../../types/revenue';

describe('RetainerUI', () => {
  test('1. Currency toggle changes display USD→TRY→EUR', () => {
    const onChange = vi.fn();
    const { rerender } = render(<CurrencyToggle value="USD" onChange={onChange} />);

    fireEvent.click(screen.getByTestId('currency-btn-TRY'));
    expect(onChange).toHaveBeenCalledWith('TRY');

    rerender(<CurrencyToggle value="TRY" onChange={onChange} />);
    fireEvent.click(screen.getByTestId('currency-btn-EUR'));
    expect(onChange).toHaveBeenCalledWith('EUR');
  });

  test('2. Invoice timeline shows Avans / Ara / Final progress', () => {
    const milestones: MilestoneRow[] = [
      { id: '1', name: 'Avans %30', pct: 30, status: 'PAID' },
      { id: '2', name: 'Ara', pct: 55, status: 'INVOICED' },
      { id: '3', name: 'Final %15', pct: 15, status: 'PENDING' },
    ];
    render(<InvoiceTimeline milestones={milestones} />);

    expect(screen.getByTestId('invoice-timeline')).toBeTruthy();
    expect(screen.getByText('Avans %30')).toBeTruthy();
    expect(screen.getByText('Ara')).toBeTruthy();
    expect(screen.getByText('Final %15')).toBeTruthy();
  });

  test('3. Overdue invoice shows red badge + "gün gecikme" text', () => {
    const retainers: RetainerRow[] = [
      {
        id: 'r1',
        dealName: 'Acme Corp',
        currency: 'USD',
        monthlyAmount: 5000,
        status: 'ACTIVE',
        daysOverdue: 14,
      },
    ];
    render(<RetainerListTable retainers={retainers} />);

    expect(screen.getByText(/14 gün gecikme/i)).toBeTruthy();
  });

  test('4. Retainer status PAUSED → "Yeni Fatura" button disabled', () => {
    const retainers: RetainerRow[] = [
      {
        id: 'r2',
        dealName: 'Paused Client',
        currency: 'TRY',
        monthlyAmount: 25000,
        status: 'PAUSED',
      },
    ];
    render(<RetainerListTable retainers={retainers} />);

    const btn = screen.getByRole('button', { name: /Yeni Fatura/i });
    expect(btn).toBeTruthy();
    expect((btn as HTMLButtonElement).disabled).toBe(true);
  });

  test('5. CurrencyToggle renders all 3 currency options', () => {
    render(<CurrencyToggle value="USD" onChange={vi.fn()} />);

    expect(screen.getByTestId('currency-btn-USD')).toBeTruthy();
    expect(screen.getByTestId('currency-btn-TRY')).toBeTruthy();
    expect(screen.getByTestId('currency-btn-EUR')).toBeTruthy();
  });
});
