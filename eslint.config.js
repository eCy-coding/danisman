import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import jsxA11y from 'eslint-plugin-jsx-a11y';
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
      // Claude Code worktrees + MCP managed directories
      '.claude',
      // Python venv + Scrapling crawler (third-party)
      'crowler/.venv',
      'crowler/Scrapling-main',
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
      'jsx-a11y': jsxA11y,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      // Phase 101: TypeScript strict contract — no implicit/explicit any
      '@typescript-eslint/no-explicit-any': 'error',
      // Phase 103: Logger is the single console sink — frontend code must use Logger.*
      'no-console': 'error',
      // Phase 106a: a11y enforcement.
      // Critical rules stay at error (gates new code).
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/aria-props': 'error',
      'jsx-a11y/aria-role': 'error',
      'jsx-a11y/role-has-required-aria-props': 'error',
      'jsx-a11y/role-supports-aria-props': 'error',
      // Recommended-set rules with existing baseline violations are downgraded
      // to warn so CI stays green; they will be tightened to error in P114
      // after their respective fixes land.
      'jsx-a11y/anchor-is-valid': 'warn',
      'jsx-a11y/click-events-have-key-events': 'warn',
      'jsx-a11y/heading-has-content': 'warn',
      'jsx-a11y/label-has-associated-control': 'warn',
      'jsx-a11y/no-autofocus': 'warn',
      'jsx-a11y/no-static-element-interactions': 'warn',
      'jsx-a11y/no-redundant-roles': 'warn',
    },
  },

  // ── Phase 103: Logger module is the single console sink ──
  {
    files: ['src/lib/logger.ts'],
    rules: {
      'no-console': 'off',
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
      // Phase 101: TypeScript strict contract — no implicit/explicit any
      '@typescript-eslint/no-explicit-any': 'error',
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
