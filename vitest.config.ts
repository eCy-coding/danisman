import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/vitest-setup.ts',
    css: true,
    include: ['**/*.{test,spec}.{ts,tsx}'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      'e2e/**',
      '.claude/**',
      '.claire/**',
      'crowler/**',
      'scripts/**',
      'server/**',
    ],
    alias: {
      '@': path.resolve(__dirname, './src'),
      // P46 C2 mirror — react-helmet-async@2 is incompatible with React 19;
      // production build aliases to the useEffect-based shim in vite.config.ts.
      // Vitest needs the same alias so test source files (and component code
      // imported by tests) can resolve `react-helmet-async` without the npm
      // package. Without this mirror 1230 tests fail to transform on CI.
      'react-helmet-async': path.resolve(__dirname, './src/lib/seo-helmet.tsx'),
    },
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'text-summary', 'json-summary', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.{test,spec}.{ts,tsx}',
        'src/**/*.d.ts',
        'src/main.tsx',
        'src/vite-env.d.ts',
        'src/vitest-setup.ts',
        'src/generated/**',
        'src/types/**',
        'src/**/*.stories.{ts,tsx}',
      ],
      // Phase 109b: regression-trap thresholds.
      // Baseline (2026-05-08): lines 3.62%, statements 3.58%, branches 3.06%,
      // functions 2.84%. Thresholds set to baseline × 0.9 to catch any drop
      // greater than ~10%. Tighten after every wave of test additions.
      thresholds: {
        lines: 3,
        statements: 3,
        branches: 2,
        functions: 2,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'react-helmet-async': path.resolve(__dirname, './src/lib/seo-helmet.tsx'),
    },
  },
});
