/**
 * adminFetch — central wrapper for admin-only `fetch` calls.
 *
 * Purpose:
 *   Admin pages historically used raw `fetch('/api/admin/...')` which bypasses
 *   the `apiClient` axios interceptor that attaches `Authorization: Bearer <jwt>`.
 *   Result: 401 on every admin data fetch, "Veri yüklenemedi" UX state even
 *   though the user is logged in.
 *
 * What this does:
 *   - Reads the persisted Zustand auth token from localStorage
 *     (key `ecypro-app-storage`, same format apiClient interceptor uses)
 *   - Attaches `Authorization: Bearer <token>` header (if available)
 *   - Defaults `credentials: 'include'` so HttpOnly refresh cookies travel too
 *   - Returns the native `Response` — callers keep using `.json()` / `.text()` etc.
 *
 * Why a thin wrapper instead of moving to `apiClient`:
 *   - Many admin pages stream large lists with custom URL params + query strings;
 *     migrating each to axios `apiClient.get(...)` is a larger refactor
 *   - This helper is a drop-in replacement for `fetch()` — minimal blast radius
 *   - Logout / refresh handling still happens via axios `apiClient` on the
 *     centralized endpoints (auth, refresh) so token expiry is recovered
 *     through that path even when adminFetch is the read surface
 *
 * Usage:
 *   import { adminFetch } from '@/lib/admin-fetch';
 *   const res = await adminFetch('/api/admin/dsar?status=OPEN');
 *   if (!res.ok) throw new Error(`status=${res.status}`);
 *   const data = await res.json();
 *
 * Migration scope (Sprint 11 P44-T07):
 *   Replaces raw `fetch('/api/admin/...')` in:
 *     - src/pages/admin/AdminDSARPage.tsx
 *     - src/pages/admin/AdminBreachPage.tsx
 *     - src/components/admin/dsar/DSARDetailDrawer.tsx
 *     - src/lib/view-as-context.tsx          (admin-scoped)
 *     - src/hooks/useFounderLetter.ts        (admin-scoped fetches)
 */

const STORE_KEY = 'ecypro-app-storage';

interface PersistedAuthState {
  state?: {
    token?: string;
  };
}

function readAdminToken(): string | undefined {
  if (typeof window === 'undefined' || !window.localStorage) return undefined;
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as PersistedAuthState;
    return parsed?.state?.token;
  } catch {
    return undefined;
  }
}

/**
 * Drop-in replacement for `fetch()` for admin-scoped API calls.
 *
 * Adds:
 *   - Authorization: Bearer <jwt>   (if persisted token available)
 *   - credentials: 'include'         (so HttpOnly refresh cookies travel)
 *
 * Caller-supplied headers and options take precedence — pass them in `init`.
 */
export function adminFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const token = readAdminToken();

  // Merge headers without clobbering caller-supplied values
  const headers = new Headers(init.headers);
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return fetch(input, {
    credentials: 'include',
    ...init,
    headers,
  });
}

/**
 * Optional helper: throws if the response is not OK, otherwise returns parsed JSON.
 *
 * Use when you want a single-line "GET this admin endpoint and give me the body":
 *
 *   const dsars = await adminFetchJson<DSARListResponse>('/api/admin/dsar');
 */
export async function adminFetchJson<T = unknown>(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<T> {
  const res = await adminFetch(input, init);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    const preview = body.length > 200 ? body.slice(0, 200) + '…' : body;
    throw new Error(`adminFetch ${res.status}: ${preview || res.statusText}`);
  }
  return (await res.json()) as T;
}
