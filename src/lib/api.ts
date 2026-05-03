import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Request Interceptor: Attach JWT ─────────────────────

apiClient.interceptors.request.use((config) => {
  const stored = localStorage.getItem('ecypro-app-storage');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      const token = parsed?.state?.token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // Silently ignore parse errors
    }
  }
  return config;
});

// ─── Response Interceptor: Handle 401 ────────────────────

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear stored auth state on 401
      localStorage.removeItem('ecypro-app-storage');
      window.location.href = '/login';
    }
    return Promise.reject(error);
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
    user: {
      id: string;
      email: string;
      name: string | null;
      role: string;
      avatarUrl?: string;
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
