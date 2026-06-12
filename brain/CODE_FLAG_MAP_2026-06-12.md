# CODE FLAG MAP — eCyPro E2E Kod Tabanı Bayrak Haritası

> **Tarih:** 2026-06-12 · **Branch:** `fix/project-gaps-2026-06-08` @ `2c25c07` · **Disiplin:** eCyPro v3.6
> **Bayraklar:** 🔴 hatalı/ölü/çöp (aksiyon şart) · 🟡 riskli/iyileştirme adayı · 🟢 sağlıklı/verimli kullanımda
> **Yöntem:** Tüm bayraklar deterministik araç çıktısına dayanır (eslint, tsc, vitest, size-limit,
> grep, git ls-files, ts-prune+manuel doğrulama). Doğrulanamayan tek kalem `inferred:` etiketli.
> Kardeş dosyalar: IMPROVE_BASELINE.json (metrikler) · IMPROVE_BACKLOG.json (skorlu aksiyonlar).

---

## 1. DOSYA KONUM EŞLEŞTİRMESİ (verified, find/wc)

| Konum | İçerik | Dosya | Durum |
|---|---|---|---|
| `src/components/` | UI bileşenleri | 342 | 🟢 |
| `src/pages/` | Route sayfaları (admin dahil) | 124 | 🟢 |
| `src/lib/` | Yardımcılar, logger, context | 116 | 🟢 |
| `src/hooks/` | Custom hooks | 35 | 🟢 (+1 🔴 .bak) |
| `src/data/` | İçerik/taxonomy verisi | 19 | 🟢 |
| `src/stores/` + `src/services/` | Zustand + servisler | 5+5 | 🟢 |
| `server/` | Express 5 + Prisma 7 backend | — | 🟢 (tsc 0) |
| `e2e/` | Playwright suite | 395 toplam test dosyası (157 src unit) | 🟢 |
| Kök: `index.css`, `admin.html`, `constants_generated.ts` | bkz. §2/§4 | 3 | 🔴/🟢/🟢 |

## 2. 🔴 KIRMIZI BAYRAKLAR (hatalı/çöp — kanıtlı)

| # | Bulgu | Kanıt | Aksiyon (backlog) |
|---|---|---|---|
| R1 | **index.css ÇİFT YÜKLEME** — aynı CSS hem statik link hem bundle'da | `index.html:209-210` (`<link rel="preload/stylesheet" href="/index.css">`) **VE** `src/main.tsx:11` (`import '../index.css'`) | BL-01: research-bridge fix'ini porta al (branch'te hazır, 2026-06-12) |
| R2 | **Tracked .bak çöpü** | `git ls-files`: `src/hooks/useFounderLetter.ts.bak`, `src/lib/view-as-context.tsx.bak` | BL-02: `git rm` (lock sonrası) |
| R3 | **Stale `.git/index.lock`** — commit'leri bloklar | `test -f` → VAR (11:07 UTC); sandbox silemiyor | BL-03: owner `rm -f .git/index.lock*` |
| R4 | **+6 unpushed commit** (gate-0/1/2 + mega-menü) | `git log @{u}..HEAD` → 6 | BL-03: READY_TO_PUSH + push |

## 3. 🟡 SARI BAYRAKLAR (riskli/iyileştirme adayı — kanıtlı)

| # | Bulgu | Kanıt | Not |
|---|---|---|---|
| Y1 | `eslint-disable` ×76 | grep sayımı | BL-04 kademeli azaltma |
| Y2 | `@ts-ignore/@ts-expect-error` ×9 | grep | BL-05 |
| Y3 | `: any` ×5 | grep | strict doktrine aykırı kalıntı |
| Y4 | TODO ×2: `HomeServicePreview.tsx:72` (i18n thread), `server/routes/search.ts:244` (P18) | grep tam satır | BL-10 |
| Y5 | Vitest stderr gürültüsü: `ERR_INVALID_URL '/api/insights/posts/'` (useInsightArticle, jsdom relative fetch) — testler GEÇİYOR | vitest çıktısı | BL-08 |
| Y6 | Dev dosyalar: `App.tsx` 1858 · `service-content.ts` 4750 · 3 admin sayfası 897-1082 satır | wc -l top-8 | BL-06/07/12 |
| Y7 | `server/lib/storage/types.ts` grep'te binary algılanıyor (içerik geçerli TS + UTF-8 TR yorum; tsc geçiyor) | `file`→data, `od` başlangıç temiz | BL-11 kozmetik |
| Y8 | ts-prune 410 ölü-export adayı — **inferred: düşük güven** (örneklem: MEGA_MENUS "dead" dedi, gerçekte 13× kullanımda) | ts-prune + grep çapraz | BL-09: host'ta knip ile gerçek analiz |
| Y9 | console.log ×13 (test hariç) — çoğu meşru bağlam: `src/lib/logger.ts` (wrapper), `server/terminal/`, `server/scripts/seed-admin.ts` | grep + dosya listesi | sadece wrapper-dışı kullanım PR'a girmesin |

## 4. 🟢 YEŞİL BAYRAKLAR (çalışan, verimli, standartlara uygun — kanıtlı)

| # | Alan | Kanıt |
|---|---|---|
| G1 | **ESLint 0 hata** (tüm repo, --quiet) | exit 0 |
| G2 | **TypeScript strict 0 hata** — web + server ayrı ayrı | exit 0 + 0 |
| G3 | **Vitest unit suite PASS** | exit 0 |
| G4 | **Bundle bütçeleri içinde**: Initial JS 100.43/105 kB brotli · 123.67/130 kB gzip · landing chunk 11.26/80 kB (CACHED dist) | size-limit exit 0 |
| G5 | **Code-splitting güçlü**: 140 lazy chunk / 174 route | grep |
| G6 | **Görsel disiplini**: public'te >300KB görsel **0** | find |
| G7 | Test kültürü: 395 test dosyası (157 src + e2e + server) | find |
| G8 | `admin.html` orphan DEĞİL — vite.config keystatic girdisi (`vite.config:490`) | grep |
| G9 | `constants_generated.ts` kullanımda (content.ts, AdminBlogPage, generate-sitemap) | grep 3 referans |
| G10 | `src/lib/logger.ts` console wrapper — doktrine uygun loglama | dosya |
| G11 | Hook'lar/gate'ler aktif: lefthook pre-push typecheck+build, gitleaks per-commit | lefthook.yml |

## 5. PERFORMANS NOTLARI (yapılacaklar — skorlu sıra IMPROVE_BACKLOG.json'da)

1. **BL-01 çift CSS yüklemesini kaldır** → render-blocking azalır, FCP/LCP kazancı (yüksek etki, 1 saatlik iş).
2. BL-07 `service-content.ts` (4750 satır) initial graph'tan çıkarılırsa entry brotli ~%3-5 düşer (inferred: dosya içeriği data-only).
3. BL-06 App.tsx route manifest bölme → TS derleme + HMR hızı, okunabilirlik.
4. Lighthouse + tam e2e + axe yalnız host'ta koşar (Chrome) → her kalibrasyon iterasyonunda owner-side `npm run lh:audit` ile ratchet beslenir.
5. Dead-code: knip host koşumu (BL-09) sonrası gerçek silme listesi bu haritaya işlenir — ts-prune çıktısıyla silme YAPILMAZ (false-positive kanıtlı).

## 6. OTURUM KARARI (L4 Complete-or-Revert gereği)

`index.lock` commit'i blokladığından bu oturumda **kod mutasyonu yapılmadı** — yarım/commitlenemez
değişiklik bırakmak yasak. Kalibrasyon iterasyonları, owner BL-03'ü kapattığı anda BL-01'den
başlayarak `MAKRO_PROMPT_AUTONOMOUS_IMPROVEMENT.md` döngüsüyle yürütülür.

**Owner kuyruğu (sıralı):**
```bash
rm -f ~/Desktop/ecypro/.git/index.lock ~/Desktop/ecypro/.git/index.lock.*   # BL-03a
cd ~/Desktop/ecypro && git restore .husky/ public/ src/data/blog-posts.json # hook sızıntısı + regen churn
git add istek.md MAKRO_PROMPT*.md brain/ && git commit -m "docs(brain): audit + flag map + improve-loop state"
bash READY_TO_PUSH.command && git push origin fix/project-gaps-2026-06-08   # BL-03b
npm run lh:audit && npm run test:e2e:fast                                    # host-only ratchet metrikleri
```
