# Contributing — eCyPro Premium Consulting

Bu rehber projeye katkı sağlayacak geliştiriciler içindir. **Türkçe** ana
iletişim dili, **İngilizce** kod + teknik terimler.

> ⚠️ Hard don'ts (Lefthook + Cascade doktrini reddeder):
> `git push --force`, `git reset --hard`, `rm -rf`, glassmorphism /
> `backdrop-blur`, magic number (`20px`, `gap-4` gibi), inline secret,
> `.env`-`*.log`-`*.db`-`dist/`-`node_modules/` commit.

---

## 1. Branch Stratejisi

| Branch            | Amaç                                                                |
| ----------------- | ------------------------------------------------------------------- |
| `main`            | Üretim. Sadece reviewed PR ile merge edilir, doğrudan push **yok**. |
| `feature/<slug>`  | Yeni özellik (`feature/sse-pubsub`, `feature/services-perf`).       |
| `fix/<slug>`      | Bug fix (`fix/services-page-hung`).                                 |
| `chore/<slug>`    | Bağımlılık güncelleme, lint, doc (`chore/bump-vite-6.1`).           |
| `docs/<slug>`     | Sadece doküman değişikliği.                                         |
| `perf/<slug>`     | Performans regresyonu çözümü.                                       |
| `refactor/<slug>` | Davranış değişmeden yapı düzeltmesi.                                |

`main` daima yeşil: lint + typecheck + test + build geçer.

---

## 2. Commit Convention — Conventional Commits

Format:

```
<type>(<scope>): <kısa açıklama, lowercase, max ~72 char>

[opsiyonel body — neden? bağlam]

[opsiyonel footer — BREAKING CHANGE / Closes #123]
```

### Type tablosu

| Type       | Kullanım                                                   |
| ---------- | ---------------------------------------------------------- |
| `feat`     | Kullanıcıya görünen yeni özellik                           |
| `fix`      | Bug çözümü                                                 |
| `perf`     | Performans iyileştirme (davranış değişmez)                 |
| `refactor` | Davranış değişmeden yapı düzeltmesi                        |
| `test`     | Test ekleme/düzeltme                                       |
| `docs`     | Sadece dokümantasyon                                       |
| `chore`    | Bağımlılık, config, build, repo bakımı                     |
| `style`    | Format (Prettier), kod davranışına etki etmeyen değişiklik |
| `ci`       | CI/CD pipeline değişiklikleri                              |
| `build`    | Build sistemine etki eden değişiklik (Vite, tsconfig)      |
| `revert`   | Daha önceki commit'i geri alma                             |

### Scope örnekleri

`services`, `analytics`, `director`, `monitor`, `sse`, `auth`, `prisma`,
`sentry`, `i18n`, `seo`, `cms`, `realtime`, `jobs`, `rate-limit`,
`api-contract`, `e2e`, `lighthouse`, `cli`, `release`.

### Türkçe açıklama serbest

Kısa açıklama Türkçe olabilir, ama type/scope İngilizce kalır:

```
feat(services): synthetic-monitor opt-out + INTEREST_TAGS hoist
fix(services): ROICalculator'ı flex container'dan çıkar
perf(director): park Scheduler when idle to release main thread
```

### Atomik commit prensibi

- Bir commit = bir mantıksal değişiklik.
- Test eklemek istiyorsan `test(...)` ile ayrı commit.
- `feat(...) + chore(...)` karışık commit yapma.

`commitlint` her commit'te konvansiyona uyumu doğrular.

---

## 3. Pull Request Template

```markdown
## Özet

<bir-iki cümle ile ne yaptın + neden>

## Değişen davranış

- [ ] Kullanıcıya görünen değişiklik (varsa ekran görüntüsü ekle)
- [ ] API kontratı değişti (varsa endpoint + payload örneği)
- [ ] DB şeması değişti (varsa migration adı)

## Test edildi mi?

- [ ] `npm run typecheck` ✅
- [ ] `npm run lint` ✅
- [ ] `npm test -- --run` ✅
- [ ] `npm run test:server` ✅
- [ ] `npm run test:e2e:fast` ✅ (smoke)
- [ ] Lighthouse regresyon kontrol (varsa)

## Ekran görüntüsü / video

<UI değişikliği varsa zorunlu>

## İlgili issue / phase

Closes #...
Refs outputs/P##\_\*.md
```

PR başlığı da Conventional Commits formatında (`fix(realtime): SSE
reconnection backoff`).

---

## 4. Kod Stili

### TypeScript

- **strict** mod. `any` minimize. Gerekirse `unknown` + type guard.
- Imports dosyanın en tepesinde. Dinamik import sadece code-splitting için.
- Public API'lerde explicit return type tercih edilir.

### React

- Functional component + hook. Class component yok.
- Memoization (`useMemo`, `useCallback`) sadece **ölçülmüş** perf darboğazında.
- `key` prop'unu index ile değil stable id ile ver.
- Zustand slice'larından **dilim** seç, full store'u subscribe etme:
  ```ts
  const open = useUiStore((s) => s.modalOpen); // ✅
  const store = useUiStore(); // ❌ tüm değişiklikte re-render
  ```

### Tailwind

- Sınıf birleştirme için `cn()` helper (clsx + tailwind-merge).
- **Magic number yok** → Fibonacci/φ tablosundan seç:
  ```tsx
  <div className="p-fib-6 gap-fib-7 mb-fib-9 text-golden-lg" />
  ```
- `backdrop-blur`, `bg-white/10` glassmorphism kullanma → opak M3 surface
  (`#1E1F20`).
- Tailwind v4 PostCSS modunda config azaltıldı — yeni token önce
  `tailwind.config.js`/CSS'de tanımlanır.

### Backend

- `console.log` PR'a girmez → `server/config/logger.ts` (winston) kullan.
- Tüm endpoint Zod ile validate edilir.
- Rate limit + auth middleware atlanmaz (testlerde hariç).
- Prisma query'leri repo katmanında (`server/lib/db/` ya da route'a yakın
  helper). Inline Prisma çağrıları sadece basit case'lerde.

### Yorum

Sadece **neden?** sorusunu yanıtlayan yorum yazılır. Ne yaptığı koddan
okunan satırlara yorum eklenmez:

```ts
// ❌ // user'ı bul
const user = await prisma.user.findUnique({ where: { id } });

// ✅ // P26-BE: cascade delete trigger'ı için raw SQL kullanıyoruz, Prisma 7'de
//    onDelete: Cascade audit_log tablosunda partition'a saygı göstermiyor.
await prisma.$executeRaw`...`;
```

---

## 5. Test Disiplini

- Yeni özellik için **önce test** (Vitest unit veya Playwright E2E).
- Mevcut testi silmek **yasak** — kullanıcı açıkça istemediği sürece.
- Bug fix → regresyon testi zorunlu.
- E2E'de `sanity_check` her zaman 30 sn altında kalmalı.
- Vitest server testlerinde `vi.mock` hoisting kuralına dikkat
  (`vi.hoisted(() => ...)`).

---

## 6. Lefthook + Husky Pre-Push Zinciri

```
pre-commit:  lint-staged (eslint --fix + prettier --write)
commit-msg:  commitlint (Conventional Commits)
pre-push:    typecheck + build
```

Atlamak için `--no-verify` **yasak**. Acil durumda ekiple konuş.

---

## 7. Secret Yönetimi

- `.env`, `.env.local`, `.env.production` **commit edilmez** (`.gitignore`).
- Tüm anahtarlar `.env.example` ve `.env.production.example`'da
  `FILL_ME` placeholder ile listelenir.
- Frontend env: `VITE_*` prefix.
- Server-side env: prefix yok, Zod ile `server/config/env.ts`'de validate.
- `gitleaks` her commit'te çalışır → secret commit edilemez.
- Eğer yanlışlıkla secret push edersen: **derhal rotate et + ekibe bildir**,
  `git filter-repo` ile geçmişten temizleme süreci başlat.

---

## 8. Subagent (Claude Code) Doctrine

P9–P27 sprintlerinde Claude Code subagent çağrıları belirli kalıplara
oturdu:

| Sprint sınıfı           | Subagent kullanımı                                   |
| ----------------------- | ---------------------------------------------------- |
| Atomic edit + commit    | **Direct file ops** (Write/Edit/Bash). Subagent yok. |
| Çoklu paralel keşif     | `general-purpose` subagent (read-only)               |
| Plan + impact analysis  | `Plan` subagent                                      |
| Kod arama (>3 round)    | `Explore` subagent                                   |
| Phase recipe çalıştırma | Direct bash, subagent yok                            |

P28 ve sonrası: pre-deploy sprintlerinde **subagent yasak**, çünkü her
değişiklik atomik commit gerektiriyor ve subagent commit'leri görünmez
oluyor. Phase brief'inde aksi belirtilmedikçe direct ops.

---

## 9. Phase Sistemi (publish hazırlığı)

Proje 17 fazlı publish hazırlık sürecinde. Aktif faz:
[`outputs/P27_EXEC_FINAL.md`](outputs/P27_EXEC_FINAL.md). Master plan:
[`brain/PUBLISH_MASTER_PLAN.md`](brain/PUBLISH_MASTER_PLAN.md).

Phase brief'i her zaman:

1. Aşamalı plan (~30–70 dk tavan)
2. Atomik commit listesi
3. Kısıtlar (push yok, force yok, vs.)
4. Final validation komutu
5. `APPLY_*.command` recipe (host'ta çift-tıkla)

---

## 10. Acil Durum

Bir kuralı ihlal ettiğini fark edersen:

1. **Dur.** Yeni değişiklik yapma.
2. Değişikliği geri al: `git restore <file>` veya `git revert <sha>`.
3. Ekibe bildir (issue açabilirsin).
4. Talimat bekle.

---

## İletişim

- **GitHub Issues:** bug + feature request
- **Email:** info@ecypro.com (gizli güvenlik açığı için)
- **Slack:** `#ecypro-dev` (internal)
