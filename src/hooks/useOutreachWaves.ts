/**
 * P44-T07 — Outreach waves data hook (Wave-1 sales pipeline).
 *
 * Pulls from `/api/v1/admin/outreach` and adapts Prisma's `OutreachWave +
 * prospects` shape to the existing `WaveRow` type so the page UI (table +
 * detail) doesn't need to change. Decimal fields arrive over JSON as strings
 * (Prisma serializes Decimal → string for safety) — we coerce them to numbers
 * here. The hook respects the project's authenticated-admin fetch contract
 * (Authorization: Bearer <token>) by going through `adminFetchJson`.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminFetch, adminFetchJson } from '../lib/admin-fetch';
import type { ProspectRow, ProspectStatus, WaveRow, WaveStatus } from '../types/revenue';

interface ApiProspect {
  id: string;
  waveId: string;
  companyName: string;
  contactName?: string | null;
  status: ProspectStatus;
  estimatedValueUsd?: string | number | null;
}

interface ApiWave {
  id: string;
  name: string;
  status: WaveStatus;
  startDate: string;
  endDate?: string | null;
  targetRevenueUsd?: string | number | null;
  realizedRevenueUsd?: string | number | null;
  prospects: ApiProspect[];
}

interface ApiEnvelope {
  data: ApiWave[];
}

function toNumberOrUndefined(v: string | number | null | undefined): number | undefined {
  if (v == null || v === '') return undefined;
  const n = typeof v === 'string' ? Number.parseFloat(v) : v;
  return Number.isFinite(n) ? n : undefined;
}

function toNumberOrZero(v: string | number | null | undefined): number {
  return toNumberOrUndefined(v) ?? 0;
}

function mapProspect(p: ApiProspect): ProspectRow {
  return {
    id: p.id,
    companyName: p.companyName,
    contactName: p.contactName ?? undefined,
    status: p.status,
    estimatedValueUsd: toNumberOrUndefined(p.estimatedValueUsd),
  };
}

function mapWave(w: ApiWave): WaveRow {
  return {
    id: w.id,
    name: w.name,
    status: w.status,
    prospects: (w.prospects ?? []).map(mapProspect),
    targetRevenueUsd: toNumberOrUndefined(w.targetRevenueUsd),
    realizedRevenueUsd: toNumberOrZero(w.realizedRevenueUsd),
  };
}

export function useOutreachWaves() {
  return useQuery<WaveRow[]>({
    queryKey: ['admin', 'outreach', 'waves'],
    queryFn: async () => {
      const json = await adminFetchJson<ApiEnvelope>('/api/v1/admin/outreach');
      return (json.data ?? []).map(mapWave);
    },
    staleTime: 30_000,
  });
}

/**
 * R8-P1 — Outreach prospect status mutation hook.
 *
 * Calls `PATCH /api/v1/admin/outreach/prospects/:id/status` (backend
 * `admin-outreach.ts`). Invalidates the parent waves query so the table
 * re-renders with the new status + auto-stamped openedAt/repliedAt
 * timestamps. The backend writes an audit log entry for every transition.
 */
export function useUpdateProspectStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ProspectStatus }) => {
      const res = await adminFetch(`/api/v1/admin/outreach/prospects/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? 'Status güncellenemedi');
      }
      return res.json() as Promise<{ data: { id: string; status: ProspectStatus } }>;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'outreach', 'waves'] });
    },
  });
}
