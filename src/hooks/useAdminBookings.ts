/**
 * P44-T07 (extension) — Admin bookings data hook.
 *
 * The AdminBookingsPage previously rendered MOCK_BOOKINGS (Ahmet/Sarah/Mehmet
 * placeholder entries). Backend `/api/bookings` (controller: listBookings)
 * already returns admin-scoped real bookings with pagination, so this hook
 * adapts the Prisma `Booking + user + service` shape into the UI's
 * lightweight `Booking` interface (date/time strings, lowercase status,
 * message string, company-on-best-effort).
 *
 * Status update is wired through `PATCH /api/bookings/:id/status` (requires
 * ADMIN role server-side). UI works in lowercase tokens but the backend Zod
 * schema enforces UPPERCASE; the mutation translates.
 *
 * Auth: apiClient — admin auth header via Zustand → axios interceptor — so
 * we use `apiClient` rather than `adminFetch` to stay consistent with the
 * other admin React Query hooks in this file family.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';

export type AdminBookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface AdminBookingRow {
  id: string;
  name: string;
  email: string;
  company: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  message: string;
  status: AdminBookingStatus;
  createdAt: string; // YYYY-MM-DD
}

interface ApiUser {
  id: string;
  name: string | null;
  email: string;
}

interface ApiService {
  id: string;
  slug?: string | null;
  titleTr?: string | null;
  titleEn?: string | null;
}

interface ApiBooking {
  id: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  scheduledAt: string;
  durationMin: number;
  notesTr?: string | null;
  notesEn?: string | null;
  createdAt: string;
  user: ApiUser;
  service?: ApiService | null;
}

interface ApiEnvelope {
  status: string;
  data: {
    bookings: ApiBooking[];
    pagination: { page: number; limit: number; total: number; pages: number };
  };
}

function statusToUi(s: ApiBooking['status']): AdminBookingStatus {
  // PENDING/CONFIRMED/COMPLETED/CANCELLED → lowercase.
  // NO_SHOW collapses to 'cancelled' for the UI's 4-state badge model — the
  // table doesn't need a 5th column for the rare no-show case.
  if (s === 'NO_SHOW') return 'cancelled';
  return s.toLowerCase() as AdminBookingStatus;
}

function statusToApi(s: AdminBookingStatus): 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' {
  // Backend Zod rejects 'PENDING' transitions (PENDING is the default state).
  // UI guards against sending pending → backend, but we still default to
  // CANCELLED to fail loudly rather than silently no-op.
  switch (s) {
    case 'confirmed':
      return 'CONFIRMED';
    case 'completed':
      return 'COMPLETED';
    case 'cancelled':
    case 'pending':
    default:
      return 'CANCELLED';
  }
}

function adapt(b: ApiBooking): AdminBookingRow {
  const scheduled = new Date(b.scheduledAt);
  const created = new Date(b.createdAt);
  // Locale-stable formatting: ISO slice avoids timezone-display drift across
  // admins working from different TZs. UI fields are display-only strings.
  const date = Number.isFinite(scheduled.getTime()) ? scheduled.toISOString().slice(0, 10) : '';
  const time = Number.isFinite(scheduled.getTime()) ? scheduled.toISOString().slice(11, 16) : '';
  return {
    id: b.id,
    name: b.user?.name ?? '(isimsiz)',
    email: b.user?.email ?? '',
    // The Prisma User model has no `company` column today — leave blank.
    // If a future migration adds it, replace with `b.user?.company ?? ''`.
    company: '',
    date,
    time,
    message: b.notesTr ?? b.notesEn ?? '',
    status: statusToUi(b.status),
    createdAt: Number.isFinite(created.getTime()) ? created.toISOString().slice(0, 10) : '',
  };
}

export function useAdminBookings() {
  return useQuery<AdminBookingRow[]>({
    queryKey: ['admin', 'bookings'],
    queryFn: async () => {
      // apiClient baseURL is `/api`; call `/bookings` (already mounted at
      // `/api/bookings` in server/routes/index.ts). limit=50 is the server cap.
      const res = await apiClient.get<ApiEnvelope>('/bookings', { params: { limit: 50 } });
      return (res.data?.data?.bookings ?? []).map(adapt);
    },
    staleTime: 30_000,
  });
}

export function useUpdateBookingStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: AdminBookingStatus }) => {
      const res = await apiClient.patch(`/bookings/${id}/status`, {
        status: statusToApi(status),
      });
      return res.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'bookings'] });
    },
  });
}
