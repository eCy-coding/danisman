/**
 * Shared test helper for the admin CSRF double-submit check
 * (server/middleware/csrf.ts). Any supertest call against a mutation route
 * behind `csrfProtection()` needs BOTH the cookie and the matching header —
 * this centralizes the fixture so route tests don't hand-roll it and drift.
 */

import type { Test } from 'supertest';
import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from '../middleware/csrf';

export const TEST_CSRF_TOKEN = 'test-csrf-token-0123456789abcdef0123456789abcdef';

/** Attach a valid, matching CSRF cookie + header to a supertest request. */
export function withCsrf<T extends Test>(req: T): T {
  return req
    .set('Cookie', `${CSRF_COOKIE_NAME}=${TEST_CSRF_TOKEN}`)
    .set(CSRF_HEADER_NAME, TEST_CSRF_TOKEN);
}
