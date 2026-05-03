import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi, bookingsApi, analyticsApi, type LoginPayload, type RegisterPayload, type BookingPayload, type ContactPayload } from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';

// ─── Auth Hooks ──────────────────────────────────────────

export function useLogin() {
  const login = useAppStore((s) => s.login);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: LoginPayload) => authApi.login(data),
    onSuccess: (response) => {
      const { user } = response.data.data;
      login({
        id: user.id,
        email: user.email,
        name: user.name ?? '',
        role: user.role as 'admin' | 'consultant' | 'client' | 'premium',
        avatarUrl: user.avatarUrl,
      });
      // Store token separately for API interceptor
      const stored = localStorage.getItem('ecypro-app-storage');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          parsed.state = { ...parsed.state, token: response.data.data.token };
          localStorage.setItem('ecypro-app-storage', JSON.stringify(parsed));
        } catch { /* ignore */ }
      }
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });
}

export function useRegister() {
  const login = useAppStore((s) => s.login);

  return useMutation({
    mutationFn: (data: RegisterPayload) => authApi.register(data),
    onSuccess: (response) => {
      const { user } = response.data.data;
      login({
        id: user.id,
        email: user.email,
        name: user.name ?? '',
        role: user.role as 'admin' | 'consultant' | 'client' | 'premium',
        avatarUrl: user.avatarUrl,
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
