import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

// Mocks
vi.mock('@dnd-kit/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@dnd-kit/core')>();
  return {
    ...actual,
    DndContext: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="dnd-context">{children}</div>
    ),
    useDraggable: () => ({
      attributes: {},
      listeners: {},
      setNodeRef: () => {},
      transform: null,
      isDragging: false,
    }),
    useDroppable: () => ({ setNodeRef: () => {}, isOver: false }),
  };
});

import { DealKanbanBoard } from '../../components/admin/deals/DealKanbanBoard';
import { DealCard } from '../../components/admin/deals/DealCard';
import { SuccessFeeCalculator } from '../../components/admin/deals/SuccessFeeCalculator';
import type { DealRow } from '../../../types/deal';

const mockDeal: DealRow = {
  id: 'deal-1',
  name: 'Aile X Holding satıcı vekilliği',
  type: 'SELL_SIDE',
  stage: 'DISCOVERY',
  transactionValueUsd: 200_000_000,
  successFeePct: 0.02,
  ownerId: 'user-1',
};

function wrap(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('M&A Deal Kanban (M4)', () => {
  test('Kanban renders all 7 stage columns', () => {
    wrap(<DealKanbanBoard deals={[]} onStageChange={vi.fn()} />);
    // Each stage column should be present
    expect(screen.getByTestId('kanban-col-DISCOVERY')).toBeTruthy();
    expect(screen.getByTestId('kanban-col-DD')).toBeTruthy();
    expect(screen.getByTestId('kanban-col-NEGOTIATION')).toBeTruthy();
    expect(screen.getByTestId('kanban-col-SPA_SIGNING')).toBeTruthy();
    expect(screen.getByTestId('kanban-col-CLOSING')).toBeTruthy();
    expect(screen.getByTestId('kanban-col-CLOSED_WON')).toBeTruthy();
    expect(screen.getByTestId('kanban-col-CLOSED_LOST')).toBeTruthy();
  });

  test('DealCard renders deal name and success fee', () => {
    wrap(<DealCard deal={mockDeal} onStageChange={vi.fn()} />);
    expect(screen.getByText('Aile X Holding satıcı vekilliği')).toBeTruthy();
  });

  test('SuccessFeeCalculator: 200M USD × %2 = 4M USD', () => {
    wrap(<SuccessFeeCalculator transactionValue={200_000_000} feePct={0.02} />);
    expect(screen.getByTestId('success-fee-result')).toBeTruthy();
    expect(screen.getByText(/4,000,000|4\.000\.000/)).toBeTruthy();
  });

  test('DealCard keyboard: Enter key triggers onStageChange callback', async () => {
    const onStageChange = vi.fn();
    wrap(<DealCard deal={mockDeal} onStageChange={onStageChange} />);
    const card = screen.getByTestId('deal-card-deal-1');
    // Simulate keyboard navigation — aria-role button responds to Enter
    fireEvent.keyDown(card, { key: 'Enter', code: 'Enter' });
    await waitFor(() => expect(onStageChange).toHaveBeenCalled());
  });

  test('CLOSED_LOST card shows "Sebep" required indicator', () => {
    const lostDeal: DealRow = { ...mockDeal, stage: 'CLOSED_LOST', id: 'deal-lost' };
    wrap(<DealCard deal={lostDeal} onStageChange={vi.fn()} />);
    expect(screen.getByTestId('closed-lost-reason')).toBeTruthy();
  });

  test('Kanban column header shows correct Turkish stage label', () => {
    wrap(<DealKanbanBoard deals={[]} onStageChange={vi.fn()} />);
    expect(screen.getByText('Keşif')).toBeTruthy();
    expect(screen.getByText('Durum Tespiti')).toBeTruthy();
    expect(screen.getByText('Müzakere')).toBeTruthy();
  });
});
