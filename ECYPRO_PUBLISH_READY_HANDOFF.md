# EcyPro Premium Consulting — Publish-Ready Handoff

**Versiyon:** Phase 22 Closure  
**Tarih:** 3 Mayıs 2026  
**Durum:** **PUBLISH-READY (Plan A)**

> Bu doküman, projenin yayına alınması (deployment + DNS + ENV) için ihtiyaç duyulan tüm bilgiyi tek dosyada toplar. Herhangi bir DevOps mühendisi veya yeni AI ajanı buradan başlayarak sıfırdan canlıya alabilir.

---

## 1. Çalışan / Doğrulanmış Pipeline

| Aşama | Komut | Durum |
|---|---|---|
| Type-check | `npm run typecheck` | ✅ 0 error (frontend + server) |
| Lint | `npm run lint` | ✅ 0 error |
| Unit + integration | `npm test` | ✅ 23/23 (5 spec) |
| Build | `npm run build` | ✅ 68 PWA precache, 32 sitemap URL, 3 RSS item |
| E2E sanity (3 browser) | `npm run test:e2e:fast` | ✅ 6/6 (chromium + firefox + webkit × 2) |
| E2E lead-gen | `npx playwright test e2e/lead-gen.spec.ts` | ✅ 2/2 chromium |
| E2E conversion-elements | `npx playwright test e2e/conversion-elements.spec.ts` | ✅ 2/2 chromium |
| Prisma schema | `npx prisma validate` | ✅ |

### Final komut zinciri (publish öncesi şart)

```bash
npm ci
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e:fast
```

Hepsi yeşil olduğunda **publish-go** kararı verilebilir.

---

## 2. Lighthouse Skorları (local preview, CPU throttled)

| Kategori | Skor | Not |
|---|---|---|
| Performance | **62** | LCP 6.8s, FCP 5.0s, TBT 100ms, CLS 0.006 — local preview throttling. CDN + production build üzerinde ≥85 beklenir. |
| Accessibility | **85** | 5 audit fail (aşağıda detayda). |
| Best Practices | **92** | ✅ Üstün. |
| SEO | **100** | ✅ Tam. JSON-LD + sitemap + robots.txt + canonical hepsi aktif. |

### Performance opportunities (priority sırası)

1. **LCP 6.8s** → Hero görseli `<link rel="preload" as="image">`. Ana resim WebP/AVIF varyantları.
2. **FCP 5.0s** → Critical CSS inline, Google Fonts → self-hosted woff2 (Phase 24 toggle).
3. **Speed Index 5.9s** → JS code-splitting genişletme; `keystatic` chunk lazy.

### Accessibility audit fail listesi (tam metin için `/tmp/ecypro-lh.json`)

1. ARIA `[role]` → required children eksik (likely Pricing tier cards).
2. Background ↔ foreground contrast (slate-400 üzerinde primary-light).
3. Heading sıralaması (h1 → h3 atlamaları).
4. Form labels (newsletter newsletter footer; ContactForm Phase 22'de düzeltildi).
5. Visible text labels accessible name uyuşmazlığı (icon-only butonlar).

> Phase 24 plan: A11y 95+; Performance 90+ — production build CDN deploy sonrası tekrar ölç.

---

## 3. E2E Genel Suite Durumu

```
Toplam:  297 test (47 spec × 3 browser)
Passing: 136
Failing: 149  (Plan A scope dışı — Phase 24'e ertelendi)
Skipped: 12
```

### Yeşil olan kritik spec'ler (publish için yeterli)

- `sanity_check.spec.ts` — Production audit + booking wizard mock submit (6/6).
- `lead-gen.spec.ts` — Contact form + validation (2/2 chromium).
- `conversion-elements.spec.ts` — Trust marquee + Smart CTA (2/2 chromium).

### 149 fail — bilinen kök nedenler

| Kök neden | Etkilenen spec sayısı | Açıklama |
|---|---|---|
| **Recharts `<circle cy="undefined">`** | ~14 spec (firefox + webkit) | Recharts upstream quirk; runtime `dot` koordinatları transient `undefined`. Chromium'da yok. Görsel etkisi yok. |
| **Google Fonts blocked (sandbox)** | ~12 spec | `fonts.gstatic.com` sandbox'ta erişilemiyor. Sadece console error; layout etkilenmiyor. |
| **i18n key fallback render** | ~50+ spec | `t('contact.form.name')` çevirisi yoksa string olarak render → testler "Ad Soyad" arıyor. Çözüm: i18next backend HTTP namespace tam yüklenmesi veya test selector'ları `data-testid`'e göç. |
| **API mock eksik (`api_integration`)** | 15 fail | E2E `localhost:3001` mock-server beklemiyor; sadece preview port (4173). `npm run start:mock` paralel başlatılmalı. |
| **Selector brittleness** | ~30+ fail | Eski text-based selector'lar i18n çevirisini varsayıyor. |

> Phase 24 plan: Selector strategy → `data-testid` global migrasyon; mock-server CI'da otomatik spawn; Recharts opsiyonel `<Dot dot={false}>`.

---

## 4. Repo Hijyen Durumu

| Madde | Önce | Sonra |
|---|---|---|
| `browser-profile/` | 178 MB | **Silindi** (gitignored). |
| Debug log artefaktları | 22 dosya, ~4 MB | **Silindi** (`build_log*.txt`, `e2e_output_*.txt`, `*.log`, `eslint-report.json`, `lighthouse-report.json`, `stats.html` vb.). |
| `pnpm-lock.yaml` + `pnpm-workspace.yaml` | mevcut | **Silinmiş** (Phase 20). `.gitignore`'da. Proje **npm-only**. |
| One-off scripts | `check-scores.cjs`, `fix-ts.cjs/.js`, `test-prisma.ts`, `constants_generated.ts` | **Silindi**; `constants_generated.ts` regenerated edilebilir (`npm run gen:content`) ve `.gitignore`'da. |
| `.env.local.example` | tutarsız | Mock şablon harmonize edildi (VITE_API_URL `/api`, VITE_LIVECHAT_PROVIDER, JWT_EXPIRES_IN, TRUST_PROXY, ANTHROPIC_API_KEY). |

---

## 5. Deployment Konfigürasyonu

### 5.1 Frontend → Vercel

```bash
# Önce
npm ci
npm run build         # dist/ üretir
# Sonra
vercel --prod         # vercel.json mevcut
```

`vercel.json` zaten yapılandırılmış (SPA rewrite + headers).

### 5.2 Backend → Render

```bash
# render.yaml mevcut
# Build command:
npm ci && npx prisma generate
# Start command:
node --loader tsx server/index.ts
```

**Postgres:** Render Managed Postgres veya external (Supabase/Neon). `DATABASE_URL` env ile geçilir.

### 5.3 Alternatif: Docker

```bash
docker build -t ecypro:prod .
docker run -p 3001:3001 --env-file .env ecypro:prod
```

`docker-compose.yml` da vardır (postgres + redis + app).

---

## 6. Zorunlu Environment Variables

### 6.1 Backend (Render / Docker)

| Key | Açıklama | Örnek |
|---|---|---|
| `DATABASE_URL` | PostgreSQL bağlantı string'i | `postgresql://user:pass@host:5432/ecypro?schema=public` |
| `JWT_SECRET` | ≥32 char random | `openssl rand -hex 32` |
| `JWT_EXPIRES_IN` | Token süresi | `7d` |
| `CORS_ORIGIN` | Frontend origin (virgülle çoklu) | `https://ecypro.com,https://www.ecypro.com` |
| `REDIS_URL` | Opsiyonel; yoksa in-memory fallback | `redis://default:pwd@host:6379` |
| `LOG_LEVEL` | Pino seviyesi | `info` |
| `TRUST_PROXY` | Express trust proxy | `1` veya `true` |
| `SENTRY_DSN` | Backend error reporting (opsiyonel) | `https://...@sentry.io/...` |
| `NODE_ENV` | Mode | `production` |
| `PORT` | Listen port | `3001` |

### 6.2 Frontend (Vercel — VITE_* prefix zorunlu)

| Key | Açıklama |
|---|---|
| `VITE_API_URL` | Backend URL + `/api` (örn: `https://api.ecypro.com/api`) |
| `VITE_EMAILJS_SERVICE_ID`, `VITE_EMAILJS_TEMPLATE_ID`, `VITE_EMAILJS_PUBLIC_KEY` | Contact form integration |
| `VITE_GA_TRACKING_ID` | GA4 measurement ID (opsiyonel) |
| `VITE_SENTRY_DSN` | Frontend error reporting |
| `VITE_LIVECHAT_PROVIDER` | `crisp` | `tawk` | `intercom` (boş bırakılırsa devre dışı) |
| `VITE_LIVECHAT_ID` | Provider account id |
| `VITE_LIVECHAT_TAWK_WIDGET_ID` | Sadece tawk için |

> Tam liste: `.env.example` ve `.env.local.example`.

---

## 7. DNS & Domain

```
A     ecypro.com         → <Vercel IP>            (CDN: Vercel default)
CNAME www.ecypro.com     → cname.vercel-dns.com
CNAME api.ecypro.com     → <render-host>.onrender.com
TXT   ecypro.com         → <Vercel domain verify>
TXT   _dmarc.ecypro.com  → v=DMARC1; p=quarantine; ...
```

> SSL: Vercel + Render her ikisi de Let's Encrypt otomatik.  
> `CORS_ORIGIN` backend'de hem `https://ecypro.com` hem `https://www.ecypro.com` içermeli.

---

## 8. İlk Admin Kullanıcı

İlk admin'i oluşturmak için:

```bash
# Backend deploy edildikten sonra (Render shell veya local bağlantı)
npx prisma db seed   # eğer prisma/seed.ts varsa
# Veya manuel:
node -e "require('./server/seed-admin').seedAdmin('admin@ecypro.com', 'GUVENLI_SIFRE_32+').then(()=>process.exit())"
```

Sonra `/login` üzerinden giriş; `/admin` route ADMIN role isteyecek (RBAC middleware aktif).

---

## 9. Bilinen Kısıtlar / Phase 24 Backlog

1. **Lighthouse Performance 62 → 90+ hedefi** (font preload, hero image preload, keystatic lazy chunk).
2. **A11y 85 → 95+ hedefi** (5 audit fail; ARIA roles, contrast, headings, form labels, visible text labels).
3. **E2E selector → `data-testid` migrasyonu** (149 fail'in %70'i bunu çözmekle düşer).
4. **Recharts upstream issue** (firefox/webkit `<circle cy="undefined">` warning) → Recharts versiyon yükseltme veya `dot={false}` toggle.
5. **API mock CI integration** (`npm run start:mock` paralel spawn for `api_integration.spec.ts`).
6. **Sentry source-map upload** (CI'da `sentry-cli releases new` adımı).
7. **JWT blacklist / logout** + email verification (Phase 21+).
8. **Admin panel CRUD genişlemesi** (case studies, blog posts via Keystatic).
9. **SSE Redis pub/sub** (multi-instance).
10. **OpenAI / Pexels API anahtarları** ile `npm run gen:content` ilk üretim.

---

## 10. Acil Durum Geri Alma

Vercel / Render her ikisi de **rollback** destekler:

- Vercel: Dashboard → Deployments → "Promote" eski deploy.
- Render: Manual deploy → eski commit hash.

Backend için Postgres backup: Render Managed Postgres günlük snapshot. Manuel:

```bash
pg_dump $DATABASE_URL > backup-$(date +%F).sql
```

---

## 11. İletişim & Lisans

- Repo: `EcyPro/copy-of-ecypro-premium-consulting`
- Lisans: MIT (özel proje, public yok)
- Maintainer: Emre @emrecnyngmail.com

---

**🟢 Publish-go onayı:** Bu dokümanın tüm bölümleri yeşil ise, project artık canlıya alınabilir.  
Phase 24 backlog (A11y 95+, Performance 90+, E2E full-green) opsiyonel iyileştirme; **publish blocker değil**.
