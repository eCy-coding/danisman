# ADR-005: Monitoring — Sentry RUM + Web Vitals

- Status: accepted
- Date: 2026-05-15
- Decider(s): @emre

## Context

We need three layers of monitoring:

1. **Backend errors** — every uncaught exception, with stack traces,
   environment, release, and request context.
2. **Frontend errors** — RUM (real user monitoring) coverage for
   JavaScript errors, unhandled promise rejections, route-level error
   boundaries.
3. **Performance** — Core Web Vitals (LCP, FID/INP, CLS, TTFB), traced
   per route and per geography, so a regression in LCP on
   `/pricing` from Türkiye is visible without sampling 100% of traffic.

Forces:

- Anthropic-style aesthetic: minimum vendor surface. We do not want a
  separate APM + RUM + log-aggregator subscription stack.
- Sentry already covers errors end-to-end and offers Performance
  product that ingests Web Vitals natively.
- Budget: $26/mo team plan is acceptable; $300+/mo Datadog APM is not.

## Decision

Use **Sentry** as the single error and performance monitoring tool:

- `@sentry/node` on the backend with `tracesSampleRate=0.1` (10%) and
  `profilesSampleRate=0.1`.
- `@sentry/react` on the frontend with `BrowserTracing` integration
  + `replayIntegration` (5% session, 100% error sessions).
- `@sentry/vite-plugin` uploads sourcemaps on `npm run build`.
- Web Vitals captured via `web-vitals` package and forwarded to Sentry
  Performance via `setMeasurement`. NOT sent to Google Analytics.
- Release tagging via `RELEASE_VERSION` env (set in CI from
  `npm_package_version` + Render commit SHA).
- Alert rules: P95 LCP > 4s on `/`, route-error boundary triggered > 5
  events / 5min, backend p95 latency > 1s on `/api/contact`.

## Consequences

**Easier:**

- Single dashboard for errors + perf + replays.
- Source-map upload makes prod stack traces map back to TypeScript
  source.
- Release health view shows error-free session % per deploy.

**Harder:**

- Sampling means we miss some events. We accept this trade-off —
  10% trace sampling is plenty for our traffic class and quota.
- Sentry's free tier event quota is tight (5k errors / 10k perf
  events). We are on the paid plan and have an alert at 80% of quota.

**Risks accepted:**

- All eggs in Sentry's basket. If Sentry has an outage, we lose
  observability. Mitigation: backend errors also flow to winston
  rotating files (`logs/ecypro-*.log`), so post-incident triage is
  still possible from the VPS.

## Alternatives considered

- **Datadog APM + LogManagement** — feature-rich but ~10x our budget
  for current scale.
- **OpenTelemetry + self-hosted Grafana stack** — would require us to
  operate the storage and alerting infrastructure. The toil cost
  outweighs the savings at our headcount.
- **Bugsnag** — comparable to Sentry on errors but weaker performance
  product; we'd still need a second tool for RUM.
- **Honeycomb** — excellent tracing but no error-grouping product
  comparable to Sentry's; we'd run two tools.
