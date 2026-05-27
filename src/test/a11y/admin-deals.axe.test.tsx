import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

// Mirror the exact same mock as DealKanban.test.tsx
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
import { RetainerListTable } from '../../components/admin/retainer/RetainerListTable';
import type { DealRow } from '../../../types/deal';
import type { RetainerRow } from '../../../types/revenue';

function wrap(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

const discoveryDeal: DealRow = {
  id: 'd1',
  name: 'Test A.Ş.',
  type: 'SELL_SIDE',
  stage: 'DISCOVERY',
  transactionValueUsd: 50_000_000,
  successFeePct: 0.02,
  ownerId: 'user-1',
};

describe('A11y: Admin Deals (Phase 2.5)', () => {
  // Test 1: Board region landmark
  test('DealKanbanBoard has role="region" with aria-label', () => {
    wrap(<DealKanbanBoard deals={[]} onStageChange={vi.fn()} />);
    expect(screen.getByRole('region', { name: /süreç panosu/i })).toBeTruthy();
  });

  // Test 2: DealCard accessible name contains deal name and Turkish stage label
  test('DealCard has accessible aria-label with name and Turkish stage label', () => {
    wrap(<DealCard deal={discoveryDeal} onStageChange={vi.fn()} />);
    // aria-label is "Test A.Ş. — Keşif"
    const card = screen.getByRole('button', { name: /Test A\.Ş\./i });
    expect(card).toBeTruthy();
    const label = card.getAttribute('aria-label') ?? '';
    expect(label).toContain('Test A.Ş.');
    // 'Keşif' is the Turkish label for DISCOVERY
    expect(label).toContain('Keşif');
  });

  // Test 3: Keyboard Enter advances stage
  test('DealCard: Enter key calls onStageChange with next stage (DISCOVERY → DD)', () => {
    const onStageChange = vi.fn();
    wrap(<DealCard deal={discoveryDeal} onStageChange={onStageChange} />);
    const card = screen.getByTestId('deal-card-d1');
    fireEvent.keyDown(card, { key: 'Enter', code: 'Enter' });
    expect(onStageChange).toHaveBeenCalledWith('d1', 'DD');
  });

  // Test 4: aria-live announcement after keyboard stage change
  test('Stage change via keyboard sets aria-live status announcement', () => {
    wrap(<DealCard deal={discoveryDeal} onStageChange={vi.fn()} />);
    const card = screen.getByTestId('deal-card-d1');
    fireEvent.keyDown(card, { key: 'Enter', code: 'Enter' });
    const liveRegion = screen.getByRole('status');
    expect(liveRegion).toBeTruthy();
    expect(liveRegion.textContent).toContain('taşındı');
  });

  // Test 5: Retainer table buttons have accessible names (text content)
  test('RetainerListTable buttons have accessible text content', () => {
    const retainers: RetainerRow[] = [
      {
        id: 'r1',
        dealName: 'Omega Danışmanlık',
        currency: 'USD',
        monthlyAmount: 10_000,
        status: 'ACTIVE',
      },
      {
        id: 'r2',
        dealName: 'Beta Holding',
        currency: 'TRY',
        monthlyAmount: 50_000,
        status: 'PAUSED',
      },
    ];
    wrap(<RetainerListTable retainers={retainers} onSelectRetainer={vi.fn()} />);

    // Every button must have non-empty accessible text
    const buttons = screen.getAllByRole('button');
    for (const btn of buttons) {
      const accessibleName = (btn.textContent ?? '').trim();
      expect(accessibleName.length).toBeGreaterThan(0);
    }

    // The deal-name buttons have text content matching deal names
    expect(screen.getByRole('button', { name: 'Omega Danışmanlık' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Beta Holding' })).toBeTruthy();

    // The action buttons have "Yeni Fatura" text
    const actionButtons = screen.getAllByRole('button', { name: 'Yeni Fatura' });
    expect(actionButtons.length).toBe(2);
  });
});
