import axios, { type InternalAxiosRequestConfig } from 'axios';
import { Logger } from './logger';

/**
 * Resolve the API base URL in priority order:
 *   1. VITE_API_URL — Plan C hybrid (e.g. https://api.ecypro.com/api).
 *   2. Empty string  — Plan A static-only / simulation mode (client falls back
 *      to in-memory mocks via `axios` 404 paths).
 *   3. Localhost dev — only when nothing is provided AND DEV mode is active.
 */
const RAW_BASE_URL = import.meta.env.VITE_API_URL;
const IS_DEV = import.meta.env.DEV === true;
const API_BASE_URL =
  typeof RAW_BASE_URL === 'string' && RAW_BASE_URL.trim().length > 0
    ? RAW_BASE_URL.trim()
    : IS_DEV
      ? 'http://localhost:3001/api'
      : '';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Indicates the client is running in simulation mode (no backend reachable
 * from the browser bundle). Consumers can branch on this to mount mock
 * adapters instead of hitting a non-existent endpoint.
 */
export const IS_SIMULATION_MODE = API_BASE_URL === '';

/**
 * Production startup health-check probe. Fires once shortly after hydration
 * when a real backend is wired (Plan C). Result is logged but never thrown —
 * a failing health check downgrades the UI to simulation mode without
 * blocking initial render.
 */
let healthCheckScheduled = false;
export function scheduleHealthCheck(): void {
  if (healthCheckScheduled) return;
  healthCheckScheduled = true;
  if (IS_SIMULATION_MODE) return; // nothing to probe
  if (IS_DEV) return; // dev server has its own log surface
  if (typeof window === 'undefined') return; // SSR / build context

  const run = () => {
    apiClient
      .get('/health', { timeout: 3_000 })
      .then((res) => {
        Logger.info('[api] health-check ok', { status: res.status, baseURL: API_BASE_URL });
      })
      .catch((err: unknown) => {
        // Treat as soft-fail — the UI keeps working from cache/simulation
        // adapters; the operator is alerted via Sentry breadcrumb.
        Logger.warn('[api] health-check failed', { baseURL: API_BASE_URL, err });
      });
  };

  // Defer to idle to avoid contending with hydration.
  const idle = (
    window as typeof window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout?: number }) => number;
    }
  ).requestIdleCallback;
  if (idle) {
    idle(run, { timeout: 5_000 });
  } else {
    window.setTimeout(run, 2_000);
  }
}

// ─── Request Interceptor: Attach JWT ─────────────────────
// Read token from Zustand persisted storage (avoids circular import by reading
// localStorage directly — same store key, same format)

apiClient.interceptors.request.use((config) => {
  try {
    const stored = localStorage.getItem('ecypro-app-storage');
    if (stored) {
      const token = (JSON.parse(stored) as { state?: { token?: string } })?.state?.token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
  } catch {
    // ignore parse errors
  }
  return config;
});

// ─── Response Interceptor: 401 → refresh → retry once ────

interface RetryConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

let isRefreshing = false;
let failedQueue: Array<{ resolve: () => void; reject: (err: unknown) => void }> = [];

function processQueue(err: unknown) {
  failedQueue.forEach((p) => (err ? p.reject(err) : p.resolve()));
  failedQueue = [];
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: { config?: RetryConfig; response?: { status?: number } }) => {
    const original = error.config;

    if (error.response?.status !== 401 || !original || original._retry) {
      return Promise.reject(error);
    }

    // If a refresh is already in flight, queue this request
    if (isRefreshing) {
      return new Promise<void>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(() => apiClient(original));
    }

    original._retry = true;
    isRefreshing = true;

    try {
      // Dynamically import store to avoid circular reference at module init
      const { useAppStore } = await import('@/store/useAppStore');
      const { refreshToken, setAuth, logout } = useAppStore.getState();

      if (!refreshToken) {
        logout();
        window.location.href = '/admin/login';
        return Promise.reject(error);
      }

      const { data } = await axios.post<AuthResponse>(`${API_BASE_URL}/auth/refresh`, {
        refreshToken,
      });

      const { user, token: newToken, refreshToken: newRefresh } = data.data;
      setAuth({
        user: {
          id: user.id,
          email: user.email,
          name: user.name ?? '',
          role: user.role as 'USER' | 'CLIENT' | 'CONSULTANT' | 'ADMIN' | 'PREMIUM',
          avatarUrl: user.avatarUrl ?? undefined,
          totpEnabled: user.totpEnabled ?? false,
        },
        token: newToken,
        refreshToken: newRefresh,
      });

      // Update the Authorization header on the original request before retrying
      original.headers = original.headers ?? {};
      original.headers.Authorization = `Bearer ${newToken}`;

      processQueue(null);
      return apiClient(original);
    } catch (refreshErr) {
      processQueue(refreshErr);
      const { useAppStore } = await import('@/store/useAppStore');
      useAppStore.getState().logout();
      window.location.href = '/admin/login';
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  },
);

// ─── API Functions ───────────────────────────────────────

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  name?: string;
}

export interface AuthResponse {
  status: string;
  data: {
    token: string;
    refreshToken: string;
    user: {
      id: string;
      email: string;
      name: string | null;
      role: string;
      avatarUrl?: string;
      totpEnabled?: boolean;
    };
  };
}

export interface BookingPayload {
  serviceId?: string;
  scheduledAt: string;
  durationMin?: number;
  notes?: string;
}

export interface TrackingPayload {
  sessionId: string;
  page?: string;
  type?: string;
  target?: string;
  metadata?: Record<string, unknown>;
}

export interface ContactPayload {
  fullName: string;
  email: string;
  company?: string;
  phone?: string;
  service?: string;
  message?: string;
  source?: string;
}

// Auth
export const authApi = {
  login: (data: LoginPayload) => apiClient.post<AuthResponse>('/auth/login', data),
  register: (data: RegisterPayload) => apiClient.post<AuthResponse>('/auth/register', data),
  getMe: () => apiClient.get<AuthResponse>('/auth/me'),
  logout: () => apiClient.post('/auth/logout'),
  refresh: (refreshToken: string) =>
    apiClient.post<AuthResponse>('/auth/refresh', { refreshToken }),
};

// Bookings
export const bookingsApi = {
  create: (data: BookingPayload) => apiClient.post('/bookings', data),
  list: (page = 1, limit = 10) => apiClient.get(`/bookings?page=${page}&limit=${limit}`),
  updateStatus: (id: string, status: string, reason?: string) =>
    apiClient.patch(`/bookings/${id}/status`, { status, cancellationReason: reason }),
};

// Analytics (fire-and-forget — no error handling needed)
export const analyticsApi = {
  trackPageView: (data: Omit<TrackingPayload, 'type' | 'target'> & { page: string }) =>
    apiClient.post('/analytics/pageview', data).catch(() => {}),
  trackInteraction: (data: TrackingPayload & { type: string; target: string }) =>
    apiClient.post('/analytics/interaction', data).catch(() => {}),
  submitContact: (data: ContactPayload) => apiClient.post('/analytics/contact', data),
  getDashboard: () => apiClient.get('/analytics/dashboard'),
};
