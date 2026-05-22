# Backend launch readiness — H5 (stress + email + headers)

Track 2 / H5, pre-launch 2026-05-25.

## 1. Pricing-calculator latency stress — PASS

`scripts/chaos/pricing-stress.ts` — boots the real pricing router, resets the
limiter per request (points Redis at a dead port so the in-memory fallback is
used), leaves RESEND/NOTION unset so side-effects no-op, and times 1000 POSTs.

Run: `npx tsx scripts/chaos/pricing-stress.ts`

| metric | ms |
|---|---|
| min | 0.076 |
| p50 | 0.123 |
| p95 | **0.269** |
| p99 | 0.423 |
| max | 6.621 |

1000/1000 → 200. P95 is ~1800× under the 500ms target. The endpoint is
compute-bound (zod parse → `recommendPaket` heuristic → HTML build); Notion/Resend
are fire-and-forget, so there is no synchronous IO on the request path. Throughput
is intentionally capped by `contactLimiter` (3/hr/IP), so a real concurrency flood
just yields 429s — see the H3 chaos report.

## 2. Resend email deliverability — CRITICAL, NOT launch-ready

`GET https://api.resend.com/domains/6d804dd4-a684-42a3-84d8-734da7760caf`
→ **domain `ecypro.com` status = `failed`** (region eu-west-1).

DNS reality (via `dig`):

| Record | Resend expects | In DNS now | OK? |
|---|---|---|---|
| DKIM `resend._domainkey` TXT | `p=MIGf…` | present, matches | ✅ |
| SPF `send.ecypro.com` TXT | `v=spf1 include:amazonses.com ~all` | **missing** | ❌ |
| SPF `send.ecypro.com` MX | `feedback-smtp.eu-west-1.amazonses.com` | **missing** | ❌ |
| root `ecypro.com` TXT (SPF) | — | `v=spf1 include:amazonses.com ~all` (present) | ℹ️ on root, not `send` |
| `_dmarc.ecypro.com` TXT | — | `v=DMARC1; p=quarantine; rua=…` (present) | ✅ |

**Root cause:** the two `send` sub-domain records (SPF TXT + feedback MX) were never
added, so Resend's verification fails. With the domain unverified, the Quick-Check
and Pricing result emails will be rejected or land in spam at launch.

**Launch action (owner: Emre — DNS change, NOT auto-applied):** add to Cloudflare DNS
for `ecypro.com`, then re-verify (`POST /domains/{id}/verify` or the Resend dashboard):

```
send         MX   10 feedback-smtp.eu-west-1.amazonses.com
send         TXT  "v=spf1 include:amazonses.com ~all"
```

(DKIM + DMARC are already correct.)

## 3. Security headers — configured, tested

`server/middleware/security.ts` sets, on every response:
- `X-Frame-Options: DENY`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` (prod)
- `Content-Security-Policy: default-src 'none'; frame-ancestors 'none'` (API default;
  the HTML CSP with nonce is applied separately via `cspNonce.ts`)

`server/middleware/security.test.ts` → **9/9 pass**. Edge headers also configured in
`vercel.json` and `public/.htaccess`. Verify the live `Strict-Transport-Security` /
`X-Frame-Options` / CSP headers on the deployed origin once DNS cuts over (the
api host was not reachable from this sprint to curl directly).
