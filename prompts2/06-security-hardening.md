# EcyPro — Güvenlik Sertleştirme Denetimi
# Hedef: OWASP Top 10 uyumu + Lighthouse Best Practices 100
# ─────────────────────────────────────────────────────────

## Tehdit Modeli (STRIDE)

| Kategori | Kontrol |
|----------|---------|
| **Spoofing** (Kimlik Taklit) | JWT + refresh token, rate limit auth |
| **Tampering** (Veri Değiştirme) | Zod validasyon, Prisma type-safe |
| **Repudiation** (İnkar) | Sentry breadcrumb + audit log |
| **Information Disclosure** | HTTPS, CSP, no secrets in client |
| **Denial of Service** | express-rate-limit, Redis cache |
| **Elevation of Privilege** | RBAC (ADMIN/CONSULTANT/USER), JWT claims |

## Sertleştirme Adımları

### 1. Frontend Güvenlik

```typescript
// ✅ DOĞRU — Env değişkeni
const apiUrl = import.meta.env.VITE_API_URL;

// ❌ YANLIŞ — Gizli anahtar
const apiKey = "sk-1234567890";
```

#### CSP Headers (nginx.conf / netlify.toml)
```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'wasm-unsafe-eval';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https: blob:;
  font-src 'self' data:;
  connect-src 'self' https://api.ecypro.com wss://api.ecypro.com
    https://*.sentry.io https://www.google-analytics.com;
  frame-ancestors 'none';
  form-action 'self';
  base-uri 'self';
  object-src 'none';
```

### 2. Backend Güvenlik

```typescript
// server/middleware/security.ts
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

app.use(helmet({
  contentSecurityPolicy: false, // Nginx handles
  crossOriginEmbedderPolicy: false,
}));

app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
}));

app.use('/api/auth/', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // Brute-force koruması
}));
```

### 3. Veritabanı Güvenlik

```typescript
// ✅ DOĞRU — Prisma parametrized query
await prisma.user.findUnique({ where: { email } });

// ❌ YANLIŞ — String concat (SQL injection)
await db.$executeRaw`SELECT * FROM users WHERE email = ${email}`;
```

### 4. Auth Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client  │────▶│   API    │────▶│  Redis   │
└──────────┘     └──────────┘     └──────────┘
      │               │                 │
      │  POST /auth   │                 │
      │   /login      │                 │
      │──────────────▶│                 │
      │               │ bcrypt.compare │
      │               │                 │
      │               │ JWT.sign(...)   │
      │               │                 │
      │  access_token │                 │
      │  refresh_token│                 │
      │◀──────────────│                 │
      │               │                 │
      │               │ store refresh   │
      │               │─────────────────▶│
```

## Güvenlik Kontrol Listesi

### Secrets Yönetimi
- [ ] `.env` .gitignore'da
- [ ] `.env.example` placeholder değerlerle
- [ ] `gitleaks` pre-commit hook
- [ ] GitHub secrets production için
- [ ] Vercel/Render environment variables

### HTTPS & Headers
- [ ] SSL sertifikası (Let's Encrypt / Cloudflare)
- [ ] HSTS: `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- [ ] X-Frame-Options: DENY
- [ ] X-Content-Type-Options: nosniff
- [ ] Referrer-Policy: strict-origin-when-cross-origin

### Input Validasyon
- [ ] Her endpoint Zod schema ile
- [ ] Max body size limit (1MB default)
- [ ] File upload: MIME type + magic number kontrol
- [ ] SQL injection: Prisma parametrized
- [ ] XSS: React otomatik escape + DOMPurify gerekliyse

### Monitoring
- [ ] Sentry error tracking
- [ ] Rate limit alerts
- [ ] Failed auth attempts log
- [ ] Unusual API patterns (Sentry/Datadog)

## Periyodik Güvenlik Denetimi

```bash
# Her hafta
npm audit --audit-level=high
npm run lint
git log --all --pretty=format:'%H' | xargs -I {} git show {} -- '.env*' 2>/dev/null | grep -i "api_key\|secret\|password"

# Her ay
npx snyk test
npx osv-scanner .

# Her çeyrek
# Manual penetration test
# OWASP ZAP automated scan
```
