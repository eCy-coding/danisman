# Phase 24α — Residual Closure Manifesti

> **Durum:** IMPLEMENTATION (3 Mayıs 2026, Cascade autonomous pipeline)
> **Tetikleyen:** `prompts/publish.txt` + `prompts/istek.txt` + Phase 22 Lighthouse/E2E audit kalıntıları
> **Hedef:** Phase 1-17 + Phase 22 audit fail'leri için **sıfır açık uç** beyanı

Bu manifest, Phase 22'nin "Phase 24 backlog" diyerek ertelediği kalıntıları + `istek.txt`'teki paket göçü + premium UI primitives'leri cerrahi kapatır. Manifest önce yazıldı (kullanıcı emri), implementation ardından yapılır.

---

## 1. Kapsam — 10 Aşama / 28 Alt Madde

### Aşama A — A11y Closure (5 madde) — Phase 17.5 R7 + Phase 22 kalıntısı

**Neden:** Lighthouse A11y 85 (5 audit fail). WCAG AA zirve hedefi için kritik.

- **A1 Footer Newsletter form-label** — Form-label tam bağlantı (`htmlFor` + `id` + `aria-label` fallback).
- **A2 Contrast oranı** — WCAG AA ≥4.5:1. `slate-400` üzerinde `text-primary` uyumsuzluklar → `slate-300`/`slate-200`.
- **A3 Heading order** — `h1 → h2 → h3` cascade; atlama yok.
- **A4 Icon-only button accessible-names** — Tüm icon-only trigger'lara `aria-label`.
- **A5 ARIA role children** — Pricing tier cards semantic `<ul>/<li>` veya `role="list"`.

**DoD:** `npx @axe-core/cli http://localhost:4173 --tags wcag2a,wcag2aa` 0 critical.

### Aşama B — Performance Closure (3 madde) — Phase 14 baseline

**Neden:** Lighthouse Perf 62 (LCP 6.8s). Production CDN'de ≥85 hedefi, local ≥70.

- **B1 Hero image preload** — `<link rel="preload" as="image" fetchpriority="high">`.
- **B2 Google Fonts self-host** — `@fontsource/inter` + `@fontsource/playfair-display` npm; `index.html` fonts.googleapis.com kaldır; CSP temizliği.
- **B3 Keystatic chunk lazy** — `React.lazy()` admin/keystatic route.

**DoD:** Lighthouse Perf ≥70 local. LCP ≤4s.

### Aşama C — E2E Selector Migration (4 madde) — Phase 22 kalıntısı

**Neden:** 149 E2E fail'in %70'i selector brittleness.

- **C1 Form components** — `NewsletterForm`, `BookingWizard`, `LoginForm`, `RegisterForm` data-testid.
- **C2 CTA + navigation** — `MagneticButton`, `SmartCTA`, Hero CTA, Header nav.
- **C3 Spec migration** — `api_integration`, `case_studies`, `pricing` spec'leri data-testid'e.
- **C4 Mock-server CI spawn** — Playwright `webServer` array'a mock ekle.

**DoD:** Chromium ana spec %90+ yeşil.

### Aşama D — Recharts Upstream Fix (1 madde) — Phase 14 KPI/charts

**Neden:** Firefox/WebKit `<circle cy="undefined">` 14 spec fail.

- **D1 `<Line dot={false}>` toggle** tüm Recharts kullanımında.

**DoD:** Firefox + WebKit'te 0 `BROWSER ERROR: <circle>`.

### Aşama E — JSON-LD Tamamlama (4 madde) — Phase 20.5 H1 ek

**Neden:** Phase 20.5 H1 6 sayfa kapsadı; diğer major sayfalar düz Helmet.

- **E1 ContactPage Breadcrumb**
- **E2 ServicesPage Breadcrumb + ItemList**
- **E3 IndustriesPage Breadcrumb**
- **E4 ServiceDetailPage Service schema** (kontrol + ekle)

**DoD:** Google Rich Results Test "valid" (manuel).

### Aşama F — Sentry Source-Map CI (1 madde) — Phase 9 enrich

**Neden:** Production debug kapasite.

- **F1 `.github/workflows/release.yml`** — `sentry-cli releases new + upload-sourcemaps`, opt-in `if: env.SENTRY_AUTH_TOKEN != ''`.

**DoD:** Koşullu CI step syntactically valid; env yoksa skip.

### Aşama G — gen:content README (1 madde) — Phase 20.5 R1 follow-up

**Neden:** Content generation pipeline dokümantasyonsuz.

- **G1 README "Content Generation" bölümü** — ENV kurulum + örnek çıktı + freq önerisi.

**DoD:** `README.md` + kopyala-çalıştır komut satırı.

### Aşama I — framer-motion → motion Paket Göçü (3 madde) — istek.txt satır 3

**Neden:** `motion` paketi framer-motion'ın kanonik yeni adı (v11+); `motion/react` tam re-export.

- **I1** `npm remove framer-motion && npm install motion`
- **I2** Codemod: `from 'framer-motion'` → `from 'motion/react'` tüm TS/TSX'de
- **I3** typecheck + lint + test + build doğrulama

**DoD:** `grep -r "framer-motion" src/` → 0 match. Bundle chunk boyutu ≤ önceki + 5 KB.

### Aşama J — 21st.dev Premium UI Primitives (3 madde) — istek.txt satır 7

**Neden:** Premium UI zirvesi; spotlight + animated-beam + number-ticker shadcn-tarzı katalog.

- **J1 Spotlight** — `src/components/ui/spotlight.tsx`; Hero arkaplanında mouse-tracking radial gradient.
- **J2 Animated Beam** — `src/components/ui/animated-beam.tsx`; Services → Insights arasında SVG path data-flow.
- **J3 Number Ticker** — `src/components/ui/number-ticker.tsx`; KPI `useCountUp` entegrasyonu (smoothing + spring).

**DoD:** 3 component entegre; tümünde `useReducedMotion` respect; tsc 0, lint 0.

### Aşama H — Brain + Memory + FV4 (3 madde) — Final

- **H1 FV4 matriksi:** typecheck/lint/test/build/e2e:fast/prisma/lighthouse/axe-core hepsi yeşil.
- **H2 brain artefakt:** `brain/PHASE_24_ALPHA_AUDIT.md`, `brain/skills.md` (A11y Pro MAX + Performance Pro MAX), `brain/memory.md`, `brain/PUBLISH_MASTER_PLAN.md`.
- **H3 Cascade global memory** — closure detay kaydı.

**DoD:** Beyan: "Phase 1-17 + Phase 22 audit fail'leri için sıfır açık uç."

---

## 2. Kapsam Dışı (Phase 25+ ertelenmiş)

- JWT blacklist / email verification — yeni feature.
- Admin panel CRUD — yeni feature.
- SSE Redis pub/sub multi-instance — yeni feature.

---

## 3. Öncelik Sırası (Implementation Order)

1. **M0** (bu manifest) ✅ bu dosya
2. **A1-A5** — a11y audit fail kapatma (en kritik, Lighthouse + WCAG)
3. **I1-I3** — motion göçü (tüm A11y fix'lerinin test edilebilmesi için motion çalışmalı)
4. **B1-B3** — performance
5. **D1** — recharts (E2E unblocker)
6. **C1-C4** — e2e migration
7. **E1-E4** — JSON-LD
8. **F1, G1** — CI + README
9. **J1-J3** — 21st.dev premium primitives
10. **H1-H3** — FV4 + brain + memory

---

## 4. Risk Matrisi

| Risk | Olasılık | Etki | Mitigation |
|---|---|---|---|
| `motion` paket API uyumsuzluğu | Düşük | Yüksek | `motion/react` framer-motion re-export; codemod sonrası typecheck gate. |
| B2 CSP temizliği build kırması | Orta | Orta | Önce test, sonra temizle. Rollback commit. |
| C3 spec migration brittleness | Orta | Düşük | Her spec ayrı commit; spec-by-spec test. |
| J1-J3 motion smoothing 21st.dev kopya sorunu | Düşük | Düşük | Local copy; lisans MIT; reduce-motion respect zorunlu. |

---

## 5. FV4 Kabul Metrikleri

- `npm run typecheck` 0/0
- `npm run lint` 0
- `npm run build` ≥34 sitemap URL
- `npm test -- --run` ≥29/29
- `npm run test:e2e:fast` 6/6
- `npx playwright test --project=chromium` ≥%85 green
- Lighthouse: Perf ≥70 local, A11y ≥95, BP 92+, SEO 100
- `npx @axe-core/cli http://localhost:4173 --tags wcag2a,wcag2aa` 0 critical
- `grep -r "framer-motion" src/` → 0 match

---

## 6. Cascade Pipeline

Cascade autonomous mode:
1. Manifest yazıldı (bu dosya).
2. Aşama sırası uygulanır; her aşama sonu todo_list update + kısa-zincir typecheck.
3. Her aşama commit önerisi (kullanıcı onaylarsa batch commit).
4. Son aşama H'de FV4 tam matriks + brain log + global memory.
5. Kullanıcıya final raporla.

**Son kelime:** Manuel seçim yok. Cascade zirve kalite runtime seçimi otomatik yapar (21st.dev component subset, font paket seçimi, Recharts fix yöntemi, Sentry CI koşul).
