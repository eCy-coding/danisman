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
import { useAppStore } from '@/store/useAppStore';

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
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
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

  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => authApi.getMe(),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
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
  return useQuery({
    queryKey: ['bookings', page, limit],
    queryFn: () => bookingsApi.list(page, limit),
    staleTime: 30_000, // 30 seconds
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BookingPayload) => bookingsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}

export function useUpdateBookingStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: string; reason?: string }) =>
      bookingsApi.updateStatus(id, status, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}

// ─── Analytics Hooks ─────────────────────────────────────

export function useDashboardSummary() {
  return useQuery({
    queryKey: ['analytics', 'dashboard'],
    queryFn: () => analyticsApi.getDashboard(),
    staleTime: 60_000, // 1 minute
    refetchInterval: 60_000, // Auto-refresh every minute
  });
}

export function useSubmitContact() {
  return useMutation({
    mutationFn: (data: ContactPayload) => analyticsApi.submitContact(data),
  });
}
