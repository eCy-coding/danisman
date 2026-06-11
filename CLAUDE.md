# CLAUDE.md — EcyPro Premium Consulting

> Bu dosya **Claude Code CLI** tarafından her oturumun başında otomatik okunur.
> Proje brief'i, komut kataloğu ve davranış kurallarını içerir.

## Proje Özeti

EcyPro Premium Consulting — yüksek performanslı, premium yönetim panosu + landing site.

- **Frontend**: React 19 + Vite 6 + TypeScript (strict)
- **Styling**: Tailwind CSS v4 (PostCSS) + Golden Ratio (φ) + Fibonacci spacing
- **State**: Zustand + TanStack Query
- **Routing**: React Router DOM v7
- **Forms**: React Hook Form + Zod
- **Backend**: Express 5 + Prisma 7 + Postgres + Redis (ioredis)
- **Auth**: JWT + bcrypt
- **Email**: EmailJS (frontend)
- **Charts**: Recharts
- **Testing**: Vitest (unit) + Playwright (E2E) + axe-core (a11y)
- **Tooling**: ESLint 9 + Prettier + Lefthook + Husky + commitlint + gitleaks
- **Monitoring**: Sentry (frontend + node) + Web Vitals
- **CMS**: Keystatic
- **i18n**: i18next (EN + TR)

## Tasarım Doktrini: "AI Studio Tech"

1. **Solid surfaces** — glassmorphism / blur YOK. Opak M3 surface (`#1E1F20`).
2. **Bilgi yoğunluğu** — IDE / data terminal estetiği.
3. **Tipografi** — `Inter` / `Roboto` sans-serif.
4. **Mikro etkileşim** — `hover:scale`, `active:scale` tarzı, performans-optimal.

## Matematiksel Uyum: Golden Ratio + Fibonacci

- **Tipografi**: `text-golden-base` (16) → `text-golden-lg` (~26) → `text-golden-xl` (~42) → `text-golden-2xl` (~68).
- **Spacing**: `.p-fib-6` (21px), `.gap-fib-7` (34px), `.mb-fib-9` (89px).
- **Magic number YOK**: `20px`, `30px` gibi keyfi değerler kullanılmaz.

## Komut Kataloğu

### Geliştirme

```bash
npm run dev              # vite + server + terminal eşzamanlı
npm run dev:server       # sadece backend (tsx server/index.ts)
npm run server           # alias dev:server
npm run preview          # vite preview --port 4173
```

### Build

```bash
npm run build            # gen:blog + vite build (postbuild: sitemap + rss)
npm run build:server     # tsc -p tsconfig.server.json
npm run build:wp         # WordPress tema bundle
```

### Kalite Kapısı

```bash
npm run lint             # ESLint
npm run format           # Prettier --write
npm run typecheck        # web + server TS (strict)
npm run typecheck:web    # sadece frontend
npm run typecheck:server # sadece backend
```

### Test

```bash
npm run test             # Vitest (watch)
npm run test -- --run    # Vitest tek geçiş (CI modu)
npm run test:e2e         # Playwright tüm suite
npm run test:e2e:fast    # sanity_check (hızlı duman testi)
npm run e2e:local        # mock + preview + e2e zinciri
```

### Veritabanı (Prisma)

```bash
npm run db:push          # şemayı DB'ye uygula (dev)
npm run db:generate      # Prisma client üret
npm run db:studio        # Prisma Studio
npm run db:seed          # seed verisi
```

### Deploy

```bash
npm run deploy           # bash scripts/deploy.sh
npm run deploy:docker    # docker hedefi
npm run deploy:frontend  # frontend hedefi
npm run lh:audit         # Lighthouse budget
```

### Claude Code (bu entegrasyon)

```bash
npm run claude:install   # Claude CLI kur (idempotent, native + npm fallback)
npm run claude:doctor    # Sağlık kontrolü
npm run claude:setup     # install + doctor zinciri
npm run claude:update    # CLI güncelleme
```

## Kod Stili Kuralları

- **TypeScript strict**. `any` minimize, gerekirse `unknown` + type guard.
- **Imports** her zaman dosyanın tepesinde.
- **Tailwind** sınıfları için `clsx` + `tailwind-merge` (`cn()` helper).
- **Magic number** yok → Fibonacci/φ tablosundan seç.
- **Console.log** PR'a girmez → `server/config/logger.ts` (winston) kullan.
- **Yorum** sadece "neden?" sorusunu yanıtlıyorsa eklenir; açıkça anlaşılan koda yorum yok.

## Kaçınılacaklar (Hard Don'ts)

- `pnpm`, `yarn` — proje **npm-only**. `pnpm-lock.yaml` `.gitignore`'da.
- `.env`, `*.log`, `*.db`, `dist/`, `node_modules/` commit etme.
- `git push --force`, `git reset --hard`, `rm -rf` — Lefthook + Cascade doktrin reddeder.
- Glassmorphism / `backdrop-blur` — tasarım doktrinine aykırı.
- Magic number (`20px`, `30px`, `gap-4` gibi keyfi adımlar yerine `gap-fib-*`).
- Inline secret. API key her zaman env üzerinden (`VITE_*` veya server-side).

## Test Disiplini

- Yeni feature → önce test (Vitest unit veya Playwright E2E).
- Test silmek **yasak** (kullanıcı açık talep etmediği sürece).
- `gitleaks` her commit'te çalışır → secret commit edilemez.
- `lefthook` pre-push: `typecheck + build` zorunlu.

## Phase Sistemi (publish hazırlığı)

Proje 17 fazlı publish hazırlık sürecinde. Detay: `brain/PUBLISH_MASTER_PLAN.md`, `brain/FINAL_PUBLISH_ROADMAP.md`. Slash komut: `/phase-status`.

## Dokümantasyon

- **Tek giriş**: [`docs/README.md`](docs/README.md) — tüm `docs/` ağacının index'i (reference · guides · adr · prompts).
- **Çalışma akışı**: [`docs/WORKFLOW.md`](docs/WORKFLOW.md) — Opus-planla → Sonnet-uygula → Opus-doğrula döngüsü + PBVC gate.
- **Arşiv**: `archive/` — superseded/historical, source-of-truth değil ([archive/README.md](archive/README.md)).

## Slash Komutları (.claude/commands/)

| Slash            | Açıklama                                   |
| ---------------- | ------------------------------------------ |
| `/lint-fix`      | ESLint --fix + Prettier --write            |
| `/typecheck`     | Frontend + server tip kontrolü             |
| `/e2e`           | Tam Playwright suite                       |
| `/e2e-fast`      | Sanity duman testi                         |
| `/publish-check` | lint + typecheck + test + build + e2e:fast |
| `/phase-status`  | Mevcut phase durumu                        |
| `/secret-scan`   | gitleaks scan (working tree)               |

## İletişim Dili

- **Türkçe** — kullanıcıyla iletişim ve commit mesajları.
- **İngilizce** — kod, teknik terimler, varsayılan log mesajları.

## Acil Durum

Bir kuralı ihlal ettiğini fark edersen:

1. Dur.
2. Değişikliği geri al (`git restore <file>` veya revert).
3. Kullanıcıya bildir.
4. Talimat bekle.

## PERSPEKTİFLER WORKING PRINCIPLES (eCyPro v3.6 — kalıcı)

> Perspektifler (Insights) rebuild girişimi için bağlayıcı çalışma disiplini.
> Kaynaklar: `brain/PERSPEKTIFLER_REBUILD_SPEC.md`, `SCOPE.md`, `PLAN.md`,
> `brain/PERSPEKTIFLER_PLAN.json`. Skill dosyaları salt-okunurdur; doktrin BURADA yaşar.

1. **Kanıt-veya-sessizlik.** Her path/route/selector iddiası grep/ls/cat/node çıktısından
   gelir. Doğrulanmamış şeyi "inferred/unknown" etiketle; uydurma yok (0 halüsinasyon).
2. **Her gate kendi aracıyla biter.** Build exit kodu / test koşumu / JSON rapor / screenshot
   üret ve kanıtı yapıştır. "Looks done" sinyal değil. "flawless" YASAK — yalnızca §10
   Acceptance Criteria sayılır.
3. **Simülasyon yok.** Her şey gerçek repoda çalıştırılır. Sandbox Firefox/Lighthouse'u tam
   koşturamazsa: komutu ver, kullanıcı koşar; jsdom/unit/build gate'leri burada koşar.
4. **Kullanıcıya soru yok.** Mantıklı default → tek satır gerekçe → devam (R3).
5. **Yalnızca scope içi.** `SCOPE.md` + `.claude/scope-allowlist.txt` tek kaynak; sadece
   Phase-0 kanıtıyla genişlet. Scope dışı bağımlılık → `OUT_OF_SCOPE.md` + devam.
6. **Her gate sonrası:** `PROGRESS.md` güncelle + commit `feat(perspektifler): gate-N — <özet>`.
   Phase N+1'e Gate N kanıtı olmadan başlama.
7. **North Star:** 1.000 makale yorgunluk bütçesi — ≤3 tık / ≤2 facet; ekranda ≤12 seçim;
   tara-önce kartlar; arama birinci sınıf; bugün ~30'da çalışır, 1.000'e lineer ölçeklenir.
8. **UI/UX/3D/animasyon serbest** (yeni tasarımlar eklenebilir) — ama scope yalnızca
   Perspektifler vertical'ı.
