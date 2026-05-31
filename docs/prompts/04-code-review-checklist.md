# EcyPro — Kod İnceleme Kontrol Listesi
# Her değişiklik bu listeyi geçmeden merge edilmez.
# ─────────────────────────────────────────────────────────

## 🔴 Kritik (Tümü Zorunlu)

- [ ] `npm run typecheck` — 0 hata (frontend + server)
- [ ] `npm run lint` — 0 uyarı / hata
- [ ] `npm run build` — Başarılı, sitemap ≥ 40 URL
- [ ] `npm test -- --run` — 29/29 test geçiyor
- [ ] E2E smoke: `npx playwright test e2e/sanity_check.spec.ts --project=chromium`
- [ ] `npx prisma validate` — Schema geçerli

## 🟡 Önemli (≥ 90% uyum)

- [ ] Yeni bileşen: `data-testid` attribute var
- [ ] Yeni sayfa: SEO + JSON-LD var (`<SEO>` + `<JsonLd>`)
- [ ] Yeni API endpoint: Zod validasyon + rate limit
- [ ] Tailwind v4 uyumlu utility sınıfları (`bg-linear-to-r`, `shrink-0`)
- [ ] `motion/react` kullanılmış (framer-motion değil)
- [ ] Yeni icon: lucide-react'ten (tree-shakeable)
- [ ] Bilingual destek: TR + EN için `{ tr: '...', en: '...' }` pattern
- [ ] `aria-label` / `aria-hidden` accessibility attributes

## 🟢 Kalite (Hedeflenen)

- [ ] `whileInView={{ opacity: 1, y: 0 }}` animasyonu var
- [ ] `viewport={{ once: true }}` — tekrar tetiklenmiyor
- [ ] Hover state: `hover:bg-white/5`, `hover:border-white/20`
- [ ] Loading state: Suspense fallback
- [ ] Error state: ErrorBoundary veya try/catch
- [ ] Responsive: `sm:` `md:` `lg:` breakpoint'leri

## TypeScript Standartları

```typescript
// ✅ DOĞRU
const handler = (e: React.MouseEvent<HTMLButtonElement>) => {};
interface Props { label: string; onClick: () => void; }

// ❌ YANLIŞ
const handler = (e: any) => {};
type Props = any;
```

## Tailwind Hızlı Kontrol

```bash
# v3 → v4 dönüşüm gerektiren sınıfları bul
grep -r "bg-gradient-to-\|flex-shrink-0\|flex-grow\|aspect-\[" src/
```

## Performans Kontrol

```bash
# Bundle boyutu analizi
npm run build -- --report
# veya
npx vite-bundle-analyzer dist/

# Lighthouse lokal
npx lighthouse http://localhost:4173 --output=json
```

## A11y Kontrol

```bash
# axe-core CLI
npx @axe-core/cli http://localhost:4173 --tags wcag2a,wcag2aa

# Lighthouse A11y
npx lighthouse http://localhost:4173 --only-categories=accessibility
```

## Commit Mesaj Formatı

```
Phase XX: [Kısa açıklama]

- Yapılan değişiklik 1
- Yapılan değişiklik 2
- typecheck ✅ | lint ✅ | E2E XX/XX ✅
```
