Local E2E guide

1. Install deps

```bash
pnpm install
```

2. Start mock + preview + run e2e (single command)

```bash
pnpm run e2e:local
```

Notes:

- The mock server listens on port 5174 by default.
- AI calls are proxied to `/api/ai/generate` on the mock server when running locally.
- Use `FEATURE_AI=false` in your env to avoid any real AI calls.
