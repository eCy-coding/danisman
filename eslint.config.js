import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'dist',
      'node_modules',
      'playwright-report',
      'test-results',
      'coverage',
      'browser-profile',
      // Root-level ad-hoc CJS/JS helpers (not part of the app runtime):
      'check-scores.cjs',
      'fix-ts.cjs',
      'fix-ts.js',
      // Generated or bundled content
      'constants_generated.ts',
    ],
  },

  // ── Frontend (browser) — src/**/*.{ts,tsx} ──────────────
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.browser, ...globals.es2022 },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },

  // ── Node-side code (server, scripts, configs, e2e) ─────
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['server/**/*.{ts,js}', 'scripts/**/*.{ts,js}', 'e2e/**/*.ts', '*.{ts,js,cjs,mjs}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.node, ...globals.es2022 },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      // Server uses Winston; console.* are errors (excluded for scripts/* via override below).
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },

  // ── scripts/* may use console for CLI UX ───────────────
  {
    files: ['scripts/**/*.{ts,js}', 'server/mock-server.js'],
    rules: {
      'no-console': 'off',
    },
  },
);
