---
description: P35 Security Hardening — OWASP Top 10 denetim + CSP/HSTS/Rate Limit
---

# /security-hardening

roadmap_50.md P35-T45-T50 doğrulama + fix workflow.

## Adım 1: Security headers E2E

```bash
npx playwright test e2e/crawl_security_headers.spec.ts --project=chromium --reporter=list
```

## Adım 2: Python OWASP denetimi

```bash
cd crowler && .venv/bin/python3 scripts/12_security_headers_audit.py --base http://localhost:4173 --output json
```

## Adım 3: npm audit

// turbo
```bash
npm audit --audit-level=high 2>&1 | tail -10
```

## Adım 4: Eksik header varsa

Express `server/middleware/security-headers.ts` düzenle:
```typescript
res.setHeader('X-Content-Type-Options', 'nosniff');
res.setHeader('X-Frame-Options', 'SAMEORIGIN');
res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
```

## Adım 5: CSP (P35-T45)

Production'da nonce-based CSP ekle — prompts2/06-security-hardening.md'yi oku.

## Adım 6: Rate limiting kontrol (P35-T47)

```bash
curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"wrong"}'
```

## Adım 7: HIBP check (P35-T48)

Test: `server/lib/hibp.ts` mevcut mu?
```bash
ls server/lib/hibp.ts 2>/dev/null && echo "MEVCUT" || echo "EKSİK — P35-T48 yapılmadı"
```

## Notlar
- Referans: prompts2/06-security-hardening.md
- Hedef: 0 HIGH severity, CSP nonce-based
- roadmap_50.md T41-T50 checklist'i kontrol et
