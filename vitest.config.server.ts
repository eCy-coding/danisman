import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    environment: 'node',
    include: ['server/**/*.test.ts'],
    exclude: ['node_modules', 'dist', 'e2e'],
    globals: true,
    setupFiles: [],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      include: ['server/**/*.ts'],
      exclude: ['server/**/*.test.ts', 'server/types', 'server/test-utils'],
    },
  },
});
