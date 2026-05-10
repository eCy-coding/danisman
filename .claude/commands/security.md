---
description: P35 Security audit — OWASP Top 10 + headers + JWT + rate limit
allowed-tools: Read, Bash, Glob
---

# /security

roadmap_50.md P35 T41-T50 güvenlik denetimi.

1. `npx playwright test e2e/crawl_security_headers.spec.ts --project=chromium --reporter=dot`
2. `npm audit --audit-level=high`
3. `grep -rn "eval(\|innerHTML\|dangerouslySetInnerHTML" src/ | head -5`
4. `grep -rn "process.env\." src/ | grep -v "VITE_\|NODE_ENV" | head -5`
5. `cat server/middleware/auth.ts | head -40` — JWT verify middleware
6. CSP header: `curl -I http://localhost:4173 | grep -i "content-security"`
7. Rate limit: `ls server/middleware/ | grep -i "rate\|limit"`

Referans: prompts2/06-security-hardening.md
Hedef: 0 HIGH severity, CSP nonce-based production
