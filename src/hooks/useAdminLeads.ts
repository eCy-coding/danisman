import { useMutation, useInfiniteQuery } from '@tanstack/react-query';
import type { AdayInput } from '../lib/aday-schema';
import { adminFetch } from '../lib/admin-fetch';

export function useCreateAday() {
  return useMutation({
    mutationFn: async (data: AdayInput) => {
      const res = await adminFetch('/api/admin/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error((json as { message?: string }).message ?? 'Hata oluştu');
      }
      return res.json() as Promise<{ status: string; data: { id: string; status: string } }>;
    },
  });
}

export function useAdaylar() {
  return useInfiniteQuery({
    queryKey: ['adaylar'],
    queryFn: async ({ pageParam }: { pageParam: string | undefined }) => {
      const url = pageParam
        ? `/api/admin/leads?cursor=${encodeURIComponent(pageParam)}`
        : '/api/admin/leads';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Liste yüklenemedi');
      return res.json() as Promise<{
        data: { results: AdaySummary[]; hasMore: boolean; nextCursor: string | null };
      }>;
    },
    getNextPageParam: (lastPage) => lastPage?.data?.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
  });
}

interface AdaySummary {
  id: string;
  name: string;
  company: string;
  status: string;
}
