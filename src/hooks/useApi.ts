import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  authApi,
  apiClient,
  bookingsApi,
  analyticsApi,
  type LoginPayload,
  type RegisterPayload,
  type BookingPayload,
  type ContactPayload,
} from '@/lib/api';
import { useAppStore } from '@/stores/useAppStore';
import { QueryKeys } from '@/lib/query-client';

// ─── Auth Hooks ──────────────────────────────────────────

export function useLogin() {
  const setAuth = useAppStore((s) => s.setAuth);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: LoginPayload) => authApi.login(data),
    onSuccess: (response) => {
      const { user, token, refreshToken } = response.data.data;
      setAuth({
        user: {
          id: user.id,
          email: user.email,
          name: user.name ?? '',
          role: user.role as 'USER' | 'CLIENT' | 'CONSULTANT' | 'ADMIN' | 'PREMIUM',
          avatarUrl: user.avatarUrl ?? undefined,
          totpEnabled: user.totpEnabled ?? false,
        },
        token,
        refreshToken,
        totpRequired: user.totpEnabled ?? false,
      });
      queryClient.invalidateQueries({ queryKey: QueryKeys.auth.me });
    },
  });
}

export function useRegister() {
  const setAuth = useAppStore((s) => s.setAuth);

  return useMutation({
    mutationFn: (data: RegisterPayload) => authApi.register(data),
    onSuccess: (response) => {
      const { user, token, refreshToken } = response.data.data;
      setAuth({
        user: {
          id: user.id,
          email: user.email,
          name: user.name ?? '',
          role: user.role as 'USER' | 'CLIENT' | 'CONSULTANT' | 'ADMIN' | 'PREMIUM',
          avatarUrl: user.avatarUrl ?? undefined,
          totpEnabled: user.totpEnabled ?? false,
        },
        token,
        refreshToken,
      });
    },
  });
}

export function useCurrentUser() {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);

  // P18-FE: query-client.ts merkezi `staleTime: 5 min` + `retry: 3` (4xx
  // short-circuit) zaten uygular. Lokal override'ları kaldırdık ki
  // tüm `auth.me` çağrıları tek davranış kuralına uysun.
  return useQuery({
    queryKey: QueryKeys.auth.me,
    queryFn: () => authApi.getMe(),
    enabled: isAuthenticated,
  });
}

// ─── Admin Auth Hooks ────────────────────────────────────

export function useAdminLogin() {
  const setAuth = useAppStore((s) => s.setAuth);

  return useMutation({
    mutationFn: ({ email, password }: LoginPayload) => authApi.login({ email, password }),
    onSuccess: (response) => {
      const { user, token, refreshToken } = response.data.data;
      setAuth({
        user: {
          id: user.id,
          email: user.email,
          name: user.name ?? '',
          role: user.role as 'USER' | 'CLIENT' | 'CONSULTANT' | 'ADMIN' | 'PREMIUM',
          avatarUrl: user.avatarUrl ?? undefined,
          totpEnabled: user.totpEnabled ?? false,
        },
        token,
        refreshToken,
        totpRequired: user.totpEnabled ?? false,
      });
    },
  });
}

export function useTotpValidate() {
  const setTotpVerified = useAppStore((s) => s.setTotpVerified);

  return useMutation({
    mutationFn: (code: string) => apiClient.post('/totp/validate', { code }),
    onSuccess: () => setTotpVerified(true),
  });
}

// ─── Booking Hooks ───────────────────────────────────────

export function useBookings(page = 1, limit = 10) {
  // P18-FE: bookings listesi yüksek frekanslı; merkezi 5 dk staleTime
  // burada agresif olur. Lokal 30 s override'ını koruyoruz.
  return useQuery({
    queryKey: QueryKeys.bookings.list(page, limit),
    queryFn: () => bookingsApi.list(page, limit),
    staleTime: 30_000,
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BookingPayload) => bookingsApi.create(data),
    onSuccess: () => {
      // Tüm `bookings` root'unu invalide et — sayfa/limit kombosu fark
      // etmeksizin yeni rezervasyon tüm listeleri etkiler.
      queryClient.invalidateQueries({ queryKey: QueryKeys.bookings.all });
    },
  });
}

export function useUpdateBookingStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: string; reason?: string }) =>
      bookingsApi.updateStatus(id, status, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.bookings.all });
    },
  });
}

// ─── Analytics Hooks ─────────────────────────────────────

export function useDashboardSummary() {
  // P18-FE: admin dashboard polling cadence 60 s — global 5 dk default'u
  // burada baskılıyoruz. `refetchInterval` etkin.
  return useQuery({
    queryKey: QueryKeys.analytics.dashboard,
    queryFn: () => analyticsApi.getDashboard(),
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
}

export function useSubmitContact() {
  return useMutation({
    mutationFn: (data: ContactPayload) => analyticsApi.submitContact(data),
  });
}
