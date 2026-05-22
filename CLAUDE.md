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
