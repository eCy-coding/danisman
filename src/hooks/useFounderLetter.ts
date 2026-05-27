import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export type LetterStatus = 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'ARCHIVED';

export interface FounderLetter {
  id: string;
  slug: string;
  titleTr: string;
  titleEn?: string;
  contentMdTr: string;
  contentMdEn?: string;
  status: LetterStatus;
  publishedAt?: string;
  scheduledFor?: string;
  emailSent: boolean;
  subscriberCount: number;
  openRate?: number;
  clickRate?: number;
  createdAt: string;
  updatedAt: string;
}

export interface FounderLetterInput {
  slug?: string;
  titleTr: string;
  titleEn?: string;
  contentMdTr: string;
  contentMdEn?: string;
  status?: LetterStatus;
  scheduledFor?: string;
}

const QUERY_KEY = 'founder-letters';

export function useFounderLetter() {
  const qc = useQueryClient();

  const { data: letters = [], isLoading } = useQuery<FounderLetter[]>({
    queryKey: [QUERY_KEY],
    queryFn: async () => {
      const res = await fetch('/api/admin/founder-letters');
      if (!res.ok) throw new Error('Failed to fetch founder letters');
      const json = (await res.json()) as { data: FounderLetter[] };
      return json.data;
    },
  });

  const createLetter = useMutation({
    mutationFn: async (input: FounderLetterInput) => {
      const res = await fetch('/api/admin/founder-letters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error('Create failed');
      return res.json() as Promise<{ data: FounderLetter }>;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });

  const updateLetter = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<FounderLetterInput> }) => {
      const res = await fetch(`/api/admin/founder-letters/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error('Update failed');
      return res.json() as Promise<{ data: FounderLetter }>;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });

  const publishLetter = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/founder-letters/${id}/publish`, { method: 'POST' });
      if (!res.ok) throw new Error('Publish failed');
      return res.json() as Promise<{ data: FounderLetter }>;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });

  const scheduleLetter = useMutation({
    mutationFn: async ({
      id,
      scheduledFor,
      sendEmail,
    }: {
      id: string;
      scheduledFor: string;
      sendEmail: boolean;
    }) => {
      const res = await fetch(`/api/admin/founder-letters/${id}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduledFor, sendEmail }),
      });
      if (!res.ok) throw new Error('Schedule failed');
      return res.json() as Promise<{ data: FounderLetter }>;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });

  const archiveLetter = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/founder-letters/${id}/archive`, { method: 'POST' });
      if (!res.ok) throw new Error('Archive failed');
      return res.json() as Promise<{ data: FounderLetter }>;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });

  const sendEmail = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/founder-letters/${id}/send-email`, { method: 'POST' });
      if (!res.ok) throw new Error('Send email failed');
      return res.json() as Promise<{ data: FounderLetter }>;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });

  return {
    letters,
    isLoading,
    createLetter,
    updateLetter,
    publishLetter,
    scheduleLetter,
    archiveLetter,
    sendEmail,
  };
}
