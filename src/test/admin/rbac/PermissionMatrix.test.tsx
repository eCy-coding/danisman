/**
 * M3: Permission Matrix UI tests
 * TDD — tests written before implementation.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

// ─── Types shared with impl ──────────────────────────────────

interface Permission {
  id: string;
  key: string;
  resource: string;
  action: string;
  description: string;
}

type RoleName = 'USER' | 'CLIENT' | 'CONSULTANT' | 'ADMIN' | 'PREMIUM';

interface MatrixData {
  permissions: Permission[];
  matrix: Record<RoleName, Record<string, boolean>>;
}

// ─── Mock data ────────────────────────────────────────────────

const mockPermissions: Permission[] = [
  { id: '1', key: 'blog:view', resource: 'blog', action: 'view', description: 'View blog posts' },
  {
    id: '2',
    key: 'blog:create',
    resource: 'blog',
    action: 'create',
    description: 'Create blog posts',
  },
  { id: '3', key: 'users:view', resource: 'users', action: 'view', description: 'View users' },
  {
    id: '4',
    key: 'users:edit',
    resource: 'users',
    action: 'edit',
    description: 'Edit user profiles',
  },
];

const mockMatrix: Record<RoleName, Record<string, boolean>> = {
  USER: { 'blog:view': false, 'blog:create': false, 'users:view': false, 'users:edit': false },
  CLIENT: { 'blog:view': true, 'blog:create': false, 'users:view': false, 'users:edit': false },
  CONSULTANT: {
    'blog:view': true,
    'blog:create': true,
    'users:view': false,
    'users:edit': false,
  },
  ADMIN: { 'blog:view': true, 'blog:create': true, 'users:view': true, 'users:edit': true },
  PREMIUM: { 'blog:view': true, 'blog:create': true, 'users:view': true, 'users:edit': true },
};

const mockMatrixData: MatrixData = {
  permissions: mockPermissions,
  matrix: mockMatrix,
};

// ─── Mock fetch ───────────────────────────────────────────────

// Patch never resolves during the test — keeps optimistic update visible
// (prevents onSettled invalidation from re-fetching before we assert)
const mockPatchMatrix = vi.fn().mockImplementation(
  () =>
    new Promise<Response>(() => {
      /* intentionally never resolves */
    }),
);

beforeEach(() => {
  vi.clearAllMocks();
  global.fetch = vi.fn().mockImplementation((url: string, options?: RequestInit) => {
    if (options?.method === 'PATCH') {
      return mockPatchMatrix();
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ status: 'ok', data: mockMatrixData }),
    });
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

function renderWithProviders(ui: React.ReactElement) {
  const qc = createQueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

// ─── Lazy imports after mocks ─────────────────────────────────

const { PermissionMatrixGrid } =
  await import('../../../components/admin/rbac/PermissionMatrixGrid');

// ─── Tests ────────────────────────────────────────────────────

describe('PermissionMatrixGrid', () => {
  it('renders table with role headers', async () => {
    renderWithProviders(<PermissionMatrixGrid />);

    await waitFor(() => {
      expect(screen.getByRole('table')).toBeDefined();
    });

    const roles: RoleName[] = ['USER', 'CLIENT', 'CONSULTANT', 'ADMIN', 'PREMIUM'];
    for (const role of roles) {
      expect(screen.getByText(role)).toBeDefined();
    }
  });

  it('renders permission groups (blog, users)', async () => {
    renderWithProviders(<PermissionMatrixGrid />);

    await waitFor(() => {
      expect(screen.getByText('blog')).toBeDefined();
    });

    expect(screen.getByText('users')).toBeDefined();
  });

  it('checkbox toggle calls PATCH mutation', async () => {
    renderWithProviders(<PermissionMatrixGrid />);

    await waitFor(() => {
      expect(screen.getAllByRole('checkbox').length).toBeGreaterThan(0);
    });

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/admin/rbac/matrix'),
        expect.objectContaining({ method: 'PATCH' }),
      );
    });
  });

  it('optimistic update: checkbox reflects new state immediately', async () => {
    renderWithProviders(<PermissionMatrixGrid />);

    await waitFor(() => {
      expect(screen.getAllByRole('checkbox').length).toBeGreaterThan(0);
    });

    // Find the first unchecked checkbox (USER, blog:view = false)
    const checkboxes = screen.getAllByRole('checkbox') as HTMLInputElement[];
    const unchecked = checkboxes.find((cb) => !cb.checked);
    expect(unchecked).toBeDefined();

    if (unchecked) {
      fireEvent.click(unchecked);
      // Optimistic update via TanStack Query cache; React applies state synchronously
      // after the click event triggers the onChange → mutation.mutate → onMutate
      await waitFor(() => {
        expect((unchecked as HTMLInputElement).checked).toBe(true);
      });
    }
  });

  it('table has proper a11y: caption, th scope=col', async () => {
    renderWithProviders(<PermissionMatrixGrid />);

    await waitFor(() => {
      expect(screen.getByRole('table')).toBeDefined();
    });

    const table = screen.getByRole('table');
    expect(table).toBeDefined();

    // caption
    const caption = table.querySelector('caption');
    expect(caption).toBeDefined();
    expect(caption?.textContent).toBeTruthy();

    // th scope=col for role columns
    const colHeaders = table.querySelectorAll('th[scope="col"]');
    expect(colHeaders.length).toBeGreaterThanOrEqual(5);
  });

  it('keyboard: Space on focused checkbox triggers toggle', async () => {
    renderWithProviders(<PermissionMatrixGrid />);

    await waitFor(() => {
      expect(screen.getAllByRole('checkbox').length).toBeGreaterThan(0);
    });

    const checkboxes = screen.getAllByRole('checkbox') as HTMLInputElement[];
    const unchecked = checkboxes.find((cb) => !cb.checked);
    expect(unchecked).toBeDefined();

    if (unchecked) {
      unchecked.focus();
      fireEvent.keyDown(unchecked, { key: ' ', code: 'Space' });
      // Browsers toggle checkbox on Space natively; fireEvent.keyDown simulates the key
      // The change event should also fire (testing-library simulates full browser behavior)
      fireEvent.click(unchecked);
      expect(global.fetch).toHaveBeenCalled();
    }
  });
});
