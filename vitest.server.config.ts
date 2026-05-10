import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['server/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    setupFiles: ['server/test-utils/setup.ts'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
