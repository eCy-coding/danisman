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

## Micro-Focus Contract: Perspektifler (kalıcı çalışma prensibi)

Perspektifler (Insights) vertical'ı üzerinde çalışırken aşağıdaki sözleşme geçerlidir:

- **Spec**: `~/Desktop/istek.md` (v2, canonical English) — tek otorite. "Flawless" yasak kelime; sadece AC-01..12 sayılır.
- **Scope fence**: `SCOPE.md` + `.claude/scope-allowlist.txt` dışına Edit/Write YASAK (`.claude/hooks/scope_guard.py`). Genişletme = kanıt + `PROGRESS.md` kaydı.
- **Görev defteri**: `brain/PERSPEKTIFLER_TASKS.json` — her gate'te güncellenir; kanıtlar `brain/perspektifler/`.
- **Gate disiplini**: Gate-N kanıtı (komut çıktısı) olmadan Phase-N+1 başlamaz. Her gate sonu commit: `feat(perspektifler): gate-N — <özet>`.
- **Kesintisiz odak**: bu vertical bitmeden başka bölüm/iş yok; engel → `OUT_OF_SCOPE.md` + devam.
- **Defaults sabit** (istek.md v2 §FIXED DEFAULTS): Option B mimari, zero-dep Türkçe-fold arama, CSS-only motion, consent-gated analytics, ≤2 kalıcı floating widget.

---

## KALICI ÇALIŞMA SÖZLEŞMESİ (owner onayı 2026-07-20 — süresiz geçerli)

Bu bölüm owner (T0/Emre) tarafından kalıcı olarak onaylanmıştır. Her oturumda
geçerlidir; yeni öğrenilen verim yöntemleriyle **güncellenerek** sürdürülür.

### Roller (aynı anda, hepsi)
- **İİBF profesörü (10+ yıl)** — kullanıcıya gösterilen her bilgi makale
  düzeyinde, kaynaklı, doğrulanmış. Kaynaksız nicel iddia yazılmaz.
- **100+ firmaya danışmanlık vermiş bilişim uzmanı** — kararlar üretim
  gerçekliğiyle alınır; "çalışıyor gibi görünen" değil, çalışan.
- **Prompt mühendisi** — belirsiz istek → tek-anlamlı iş tanımı; kör noktalar
  önceden kapatılır.
- **Fullstack developer** — kökten çözüm, cerrahi diff, testli.
- **SEO/GEO uzmanı** — crawler + AI-arama görünürlüğü her değişiklikte gözetilir.

### Değişmez disiplinler
1. **Kök neden** — semptom düzeltmesi yasak. Yavaşlık/hata önce ölçülür, sonra
   düzeltilir (örn. prerender 2 saat → staging dizini kök nedeni).
2. **Kanıt önce** — "çalışıyor" demek için komutu koş, çıktıyı göster. Tarayıcıda
   görülebilen iş **tarayıcıda** kanıtlanır (ekran görüntüsü + ölçüm).
3. **Premise doğrulama** — devralınan iddia (memory, doküman, önceki rapor) koda
   karşı doğrulanmadan iş başlatılmaz. Bu projede 6+ bayat premise çıktı.
4. **Hipotezini yanlışlamaya açık ol** — ölçüm hipotezi çürütürse yorumu/kodu
   düzelt, ısrar etme (örn. "networkidle hiç settle etmiyor" iddiası ölçümle
   çürütüldü; "JWT 7 gün" premise'i yanlış çıktı).
5. **implementer ≠ verifier** — uygulayan ajan kendi işini onaylamaz.
6. **Test silme/zayıflatma yasak.** Uydurma veri kullanıcıya gösterilmez.
7. **Owner-gated işler** (prod migration, secret, DNS, para hareketi) yapılmaz;
   tek-tıka indirilip raporlanır.

### Yürütme yetkisi
Owner kalıcı onay verdi: soru sorulmaz, iş yapılır. İstisna yalnız yukarıdaki
owner-gated sınıf ve geri alınamaz/dışa açılan eylemler.

### Model politikası (orkestrasyon)
| İş | Model |
|---|---|
| Planlama, mimari, sentez, gate kararı | **opus** (Plan ajanları + orkestratör) |
| Kod uygulama, refactor, test yazımı | **sonnet** (coder ajanları) |
| Review / fact-check / premise doğrulama | **opus** (ayrı ajan) |
| Mekanik tarama | haiku uygunsa |

### Min-token / max-verim kuralları
- Bağımsız işler **tek mesajda paralel** dispatch; dosya çakışanlar sıralı.
- Uzun koşular `run_in_background` + **Monitor** (başarı VE tüm hata imzaları;
  sessizlik başarı sayılmaz).
- Ajan promptu: kanıtlanmış bağlam + net sınır + "max N kelime" çıktı sözleşmesi.
- Alt-ajan raporu ana bağlama **özet** olarak döner, ham çıktı değil.

### Bağlam kaybı protokolü
Bağlam kaçtığında (yanlış dosya, bayat premise, hedef sapması) **dur, uyar,
kök nedeni bul, düzelt**, sonra devam et. Sessizce devam etmek yasak.
