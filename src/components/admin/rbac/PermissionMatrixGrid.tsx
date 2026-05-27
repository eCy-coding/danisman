/**
 * M3: PermissionMatrixGrid — 5 role × N permission table.
 *
 * Data: GET /api/admin/rbac/matrix → { permissions, matrix }
 * Mutations: PATCH /api/admin/rbac/matrix with optimistic update + rollback.
 *
 * A11y:
 *   - Semantic <table> with <caption>, <thead>, <th scope="col">, <th scope="rowgroup">
 *   - Every checkbox has aria-label
 *   - Tab + Space work natively on <input type="checkbox">
 *
 * Spacing: Fibonacci (gap-8 = ~fib close, p-5 = Tailwind standard aligned to fib-6 ~21px)
 */

import React, { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, ShieldCheck } from 'lucide-react';
import { RoleHeader } from './RoleHeader';
import { PermissionGroupCollapse } from './PermissionGroupCollapse';
import type { UserRole } from '../../../lib/rbac';

// ─── Types ────────────────────────────────────────────────────

interface Permission {
  id: string;
  key: string;
  resource: string;
  action: string;
  description: string;
}

interface MatrixData {
  permissions: Permission[];
  matrix: Record<UserRole, Record<string, boolean>>;
}

interface ApiResponse {
  status: string;
  data: MatrixData;
}

interface PatchPayload {
  role: UserRole;
  permissionKey: string;
  granted: boolean;
}

// ─── Constants ────────────────────────────────────────────────

const ALL_ROLES: UserRole[] = ['USER', 'CLIENT', 'CONSULTANT', 'ADMIN', 'PREMIUM'];
const QUERY_KEY = ['admin', 'rbac', 'matrix'] as const;

// ─── API functions ────────────────────────────────────────────

async function fetchMatrix(): Promise<MatrixData> {
  const res = await fetch('/api/admin/rbac/matrix');
  if (!res.ok) throw new Error('Failed to fetch permission matrix');
  const json = (await res.json()) as ApiResponse;
  return json.data;
}

async function patchMatrix(payload: PatchPayload): Promise<void> {
  const res = await fetch('/api/admin/rbac/matrix', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to update permission');
}

// ─── Component ────────────────────────────────────────────────

export const PermissionMatrixGrid: React.FC = () => {
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery<MatrixData>({
    queryKey: QUERY_KEY,
    queryFn: fetchMatrix,
    staleTime: 60_000,
  });

  const mutation = useMutation<void, Error, PatchPayload, { previous: MatrixData | undefined }>({
    mutationFn: patchMatrix,

    // Optimistic update
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previous = queryClient.getQueryData<MatrixData>(QUERY_KEY);

      queryClient.setQueryData<MatrixData>(QUERY_KEY, (old) => {
        if (!old) return old;
        return {
          ...old,
          matrix: {
            ...old.matrix,
            [payload.role]: {
              ...old.matrix[payload.role],
              [payload.permissionKey]: payload.granted,
            },
          },
        };
      });

      return { previous };
    },

    // Rollback on error
    onError: (_err, _payload, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData<MatrixData>(QUERY_KEY, context.previous);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  const handleToggle = useCallback(
    (role: UserRole, permissionKey: string, newGranted: boolean) => {
      mutation.mutate({ role, permissionKey, granted: newGranted });
    },
    [mutation],
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-12" aria-busy="true" aria-label="Yükleniyor">
        <Loader2 size={28} className="text-secondary animate-spin" aria-hidden="true" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div role="alert" className="text-red-400 text-sm py-8 text-center">
        Yetki matrisi yüklenemedi.
      </div>
    );
  }

  // Group permissions by resource
  const groupedPermissions = data.permissions.reduce<Record<string, Permission[]>>((acc, perm) => {
    (acc[perm.resource] ??= []).push(perm);
    return acc;
  }, {});

  const resources = Object.keys(groupedPermissions).sort();

  return (
    <div className="overflow-x-auto rounded-2xl border border-white/5 bg-white/3">
      <table className="w-full border-collapse text-sm" role="table">
        <caption className="sr-only">
          Yetki Matrisi — 5 rol ve {data.permissions.length} izin. Yetki vermek veya kaldırmak için
          onay kutularını kullanın.
        </caption>

        <thead>
          <tr className="border-b border-white/10">
            {/* First column: permission label */}
            <th
              scope="col"
              className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest border-b border-white/10"
            >
              <span className="flex items-center gap-2">
                <ShieldCheck size={14} aria-hidden="true" />
                İzin
              </span>
            </th>

            {ALL_ROLES.map((role) => (
              <RoleHeader key={role} role={role} />
            ))}
          </tr>
        </thead>

        {resources.map((resource) => (
          <PermissionGroupCollapse
            key={resource}
            resource={resource}
            permissions={groupedPermissions[resource] ?? []}
            roles={ALL_ROLES}
            matrix={data.matrix}
            onToggle={handleToggle}
          />
        ))}
      </table>
    </div>
  );
};
