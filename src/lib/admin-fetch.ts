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
    refreshToken?: string;
    user?: unknown;
  };
  version?: number;
}

function readPersistedAuth(): PersistedAuthState['state'] | undefined {
  if (typeof window === 'undefined' || !window.localStorage) return undefined;
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as PersistedAuthState;
    return parsed?.state;
  } catch {
    return undefined;
  }
}

function readAdminToken(): string | undefined {
  return readPersistedAuth()?.token;
}

function writeAdminTokens(newAccess: string, newRefresh?: string): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as PersistedAuthState;
    if (!parsed.state) parsed.state = {};
    parsed.state.token = newAccess;
    if (newRefresh) parsed.state.refreshToken = newRefresh;
    window.localStorage.setItem(STORE_KEY, JSON.stringify(parsed));
  } catch {
    /* never let storage corruption crash the app */
  }
}

// S14 R14 — In-flight refresh deduplication. Multiple parallel 401s during a
// burst of admin requests would otherwise fire N parallel /auth/refresh calls;
// only the first one rotates the refresh token, the others fail with "token
// reuse detected" and force re-login. Single shared promise = single rotation.
let inflightRefresh: Promise<string | null> | null = null;

const API_BASE =
  (typeof window !== 'undefined' &&
    (window as unknown as { __ECYPRO_API_URL?: string }).__ECYPRO_API_URL) ||
  (typeof import.meta !== 'undefined' &&
    (import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_API_URL) ||
  '';

async function performRefresh(): Promise<string | null> {
  const persisted = readPersistedAuth();
  const refreshToken = persisted?.refreshToken;
  if (!refreshToken) return null;

  try {
    // The refresh endpoint lives under the same VITE_API_URL prefix that
    // apiClient (axios) uses. No Authorization header — refresh proves identity
    // via the refresh token in the body.
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      data?: { token?: string; refreshToken?: string };
    };
    const newAccess = json.data?.token;
    const newRefresh = json.data?.refreshToken;
    if (!newAccess) return null;
    writeAdminTokens(newAccess, newRefresh);
    return newAccess;
  } catch {
    return null;
  }
}

function refreshOnce(): Promise<string | null> {
  if (inflightRefresh) return inflightRefresh;
  inflightRefresh = performRefresh().finally(() => {
    // Reset so the *next* 401 (after the new access token also ages out)
    // triggers a fresh refresh round instead of returning the cached result.
    inflightRefresh = null;
  });
  return inflightRefresh;
}

/**
 * Drop-in replacement for `fetch()` for admin-scoped API calls.
 *
 * Adds:
 *   - Authorization: Bearer <jwt>   (if persisted token available)
 *   - credentials: 'include'         (so HttpOnly refresh cookies travel)
 *   - S14 R14 — On 401, attempts ONE refresh round via /auth/refresh and
 *     retries the original request with the new access token. Concurrent 401s
 *     dedupe to a single refresh promise. If refresh also fails, the original
 *     401 response is returned so callers can render their own auth-expired
 *     UI / trigger logout. SSE endpoints (text/event-stream) are skipped —
 *     they manage their own reconnect with fresh tokens.
 *
 * Caller-supplied headers and options take precedence — pass them in `init`.
 */
export async function adminFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const token = readAdminToken();

  const headers = new Headers(init.headers);
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const opts: RequestInit = { credentials: 'include', ...init, headers };
  let res = await fetch(input, opts);

  // Skip the refresh-retry dance for SSE / streaming requests — the EventSource
  // wrapper handles reconnect on its own with a fresh token, and replaying the
  // GET would just open a doomed second stream.
  const acceptsStream = headers.get('Accept')?.includes('text/event-stream');
  if (res.status !== 401 || acceptsStream) return res;

  const newAccess = await refreshOnce();
  if (!newAccess) return res;

  // Retry once with the new access token.
  const retryHeaders = new Headers(init.headers);
  retryHeaders.set('Authorization', `Bearer ${newAccess}`);
  res = await fetch(input, { credentials: 'include', ...init, headers: retryHeaders });
  return res;
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
