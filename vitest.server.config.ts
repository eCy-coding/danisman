import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // Server integration tests spawn subprocesses (`prisma validate` ~6s) and run
    // timing-sensitive rate-limit checks; the 5s default flakes run-to-run.
    testTimeout: 30000,
    hookTimeout: 30000,
    // Files share external resources (mock port, rate-limit store, audit DB);
    // running them in parallel races → flaky assertions. Serialize for isolation.
    fileParallelism: false,
    include: ['server/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    setupFiles: ['server/test-utils/setup.ts'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
