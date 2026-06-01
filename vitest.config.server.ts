import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    environment: 'node',
    include: ['server/**/*.test.ts'],
    exclude: ['node_modules', 'dist', 'e2e'],
    globals: true,
    setupFiles: [],
    // Sprint 6 A1d-a — JWT secret parity for test runs.
    // `auth.test.ts` signs tokens with the literal constant below; the
    // controller verifies against `process.env.JWT_SECRET` (or its insecure
    // dev fallback). Without this env injection the runtime falls back to a
    // different secret, every signed token verifies as invalid, and
    // `GET /auth/me valid JWT` returns 401 instead of 200.
    env: {
      JWT_SECRET: 'test-jwt-secret-not-for-production-32chars!!',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      include: ['server/**/*.ts'],
      exclude: ['server/**/*.test.ts', 'server/types', 'server/test-utils'],
    },
  },
});
