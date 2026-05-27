/**
 * M4: View-As Simulation UI tests
 * TDD — tests written before implementation.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

// ─── Mock fetch ───────────────────────────────────────────────

const mockStartViewAs = vi.fn().mockResolvedValue({
  ok: true,
  json: () =>
    Promise.resolve({ status: 'ok', data: { sessionId: 'sess-123', viewingAsRole: 'EDITOR' } }),
});
const mockEndViewAs = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });

beforeEach(() => {
  vi.clearAllMocks();
  global.fetch = vi.fn().mockImplementation((url: string, options?: RequestInit) => {
    if (typeof url === 'string' && url.includes('/view-as') && options?.method === 'POST') {
      return mockStartViewAs();
    }
    if (typeof url === 'string' && url.includes('/view-as/') && options?.method === 'DELETE') {
      return mockEndViewAs();
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve({ status: 'ok' }) });
  }) as unknown as typeof fetch;
});

// ─── Helpers ──────────────────────────────────────────────────

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

// ─── Lazy imports after mocks are set up ─────────────────────

const { ViewAsProvider, useViewAs } = await import('../../../lib/view-as-context');
const { ViewAsBanner } = await import('../../../components/admin/rbac/ViewAsBanner');

// ─── Test consumer component ──────────────────────────────────

const ViewAsConsumer: React.FC = () => {
  const { activeRole, isViewAsMode } = useViewAs();
  return (
    <div>
      <span data-testid="active-role">{activeRole ?? 'none'}</span>
      <span data-testid="is-view-as-mode">{String(isViewAsMode)}</span>
    </div>
  );
};

function renderWithAll(ui: React.ReactElement) {
  const qc = createQueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <ViewAsProvider>{ui}</ViewAsProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

// ─── Tests ────────────────────────────────────────────────────

describe('ViewAs Context', () => {
  it('provides { activeRole, isViewAsMode } with defaults', () => {
    renderWithAll(<ViewAsConsumer />);

    expect(screen.getByTestId('active-role').textContent).toBe('none');
    expect(screen.getByTestId('is-view-as-mode').textContent).toBe('false');
  });

  it('start View-As sets activeRole in context', async () => {
    const Starter: React.FC = () => {
      const { startViewAs, activeRole } = useViewAs();
      return (
        <div>
          <button onClick={() => startViewAs('CONSULTANT')}>Start</button>
          <span data-testid="role">{activeRole ?? 'none'}</span>
        </div>
      );
    };

    renderWithAll(<Starter />);

    await act(async () => {
      fireEvent.click(screen.getByText('Start'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('role').textContent).toBe('CONSULTANT');
    });
  });

  it('banner renders when activeRole is set', async () => {
    const BannerTest: React.FC = () => {
      const { startViewAs } = useViewAs();
      return (
        <div>
          <button onClick={() => startViewAs('ADMIN')}>Start ADMIN</button>
          <ViewAsBanner />
        </div>
      );
    };

    renderWithAll(<BannerTest />);

    // Before: banner not visible
    expect(screen.queryByText(/olarak görüntülüyorsunuz/i)).toBeNull();

    await act(async () => {
      fireEvent.click(screen.getByText('Start ADMIN'));
    });

    await waitFor(() => {
      const banner = screen.getByRole('status');
      expect(banner.textContent).toContain('ADMIN olarak görüntülüyorsunuz');
    });
  });

  it('isViewAsMode is true when activeRole set, mutations should be blocked', async () => {
    const ModeChecker: React.FC = () => {
      const { startViewAs, isViewAsMode } = useViewAs();
      return (
        <div>
          <button onClick={() => startViewAs('CLIENT')}>Activate</button>
          <span data-testid="mode">{String(isViewAsMode)}</span>
        </div>
      );
    };

    renderWithAll(<ModeChecker />);
    expect(screen.getByTestId('mode').textContent).toBe('false');

    await act(async () => {
      fireEvent.click(screen.getByText('Activate'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('mode').textContent).toBe('true');
    });
  });

  it('end View-As clears activeRole', async () => {
    const FullCycle: React.FC = () => {
      const { startViewAs, endViewAs, activeRole } = useViewAs();
      return (
        <div>
          <button onClick={() => startViewAs('PREMIUM')}>Start</button>
          <button onClick={() => endViewAs()}>End</button>
          <span data-testid="role">{activeRole ?? 'none'}</span>
        </div>
      );
    };

    renderWithAll(<FullCycle />);

    await act(async () => {
      fireEvent.click(screen.getByText('Start'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('role').textContent).toBe('PREMIUM');
    });

    await act(async () => {
      fireEvent.click(screen.getByText('End'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('role').textContent).toBe('none');
    });
  });
});
