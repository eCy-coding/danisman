# EcyPro — Mimari Kararlar (ADR Log)
# Her önemli karar bu dosyaya ADR formatında eklenir.
# ─────────────────────────────────────────────────────────

## ADR Formatı

```
## ADR-XXX: [Karar Başlığı]
Durum: [Önerildi | Kabul Edildi | Değiştirildi | Reddedildi]
Tarih: YYYY-MM-DD
Karar Veren: [Rol]

### Bağlam
[Neden bu karar gerekli?]

### Karar
[Ne yapılacak?]

### Sonuçlar
- **Pozitif**: ...
- **Negatif**: ...
- **Risk**: ...

### Alternatifler
- [Değerlendirilen seçenekler]
```

## Kabul Edilmiş ADR'ler

### ADR-001: React 19 + Vite (Next.js Değil)
**Durum**: Kabul Edildi | **Tarih**: 2025-10
**Karar**: Next.js yerine Vite + React Router kullan.
**Neden**: Static consulting site için SSR overkill; Vite + SPA daha hızlı dev experience.

### ADR-002: Tailwind v4 (v3'ten Yükseltme)
**Durum**: Kabul Edildi | **Tarih**: 2026-02
**Karar**: Tailwind v3 → v4 göçü.
**Neden**: Daha hızlı build, modern @theme block, JIT auto-purge.
**Migrate**: `bg-gradient-to-*` → `bg-linear-to-*`, `flex-shrink-0` → `shrink-0`.

### ADR-003: motion/react (framer-motion Değil)
**Durum**: Kabul Edildi | **Tarih**: 2026-04
**Karar**: `framer-motion` import'larını `motion/react` olarak migrate et.
**Neden**: `motion` paketi framer-motion'ın kanonik yeni adı (v11+).

### ADR-004: Zustand (Redux Değil)
**Durum**: Kabul Edildi | **Tarih**: 2025-11
**Karar**: State management için Zustand.
**Neden**: Bundle boyutu (~1KB vs 15KB), minimal boilerplate, TypeScript first-class.

### ADR-005: Prisma 7 (Drizzle Değil)
**Durum**: Kabul Edildi | **Tarih**: 2025-11
**Karar**: ORM olarak Prisma.
**Neden**: Type-safety, migration ecosystem, Studio UI.

### ADR-006: Service Worker Block E2E'de
**Durum**: Kabul Edildi | **Tarih**: 2026-05 (Phase 29)
**Karar**: Playwright config'e `serviceWorkers: 'block'`.
**Neden**: SW NetworkFirst `/api/` requests'leri `page.route()` mock'larını bypass ediyor.

### ADR-007: Error Boundary Katmanlı Mimari
**Durum**: Kabul Edildi | **Tarih**: 2026-05 (Phase 30)
**Karar**: Tek kanonik hiyerarşi — main.tsx'te `GlobalErrorBoundary`, App.tsx'te `SovereignBoundary`, AppProviders içinde `ErrorBoundary`.
**Neden**: Duplicate `Toaster` + `OfflineStatus` + `HelmetProvider` Sonner'da `{}` throw'a sebep oluyordu.

### ADR-008: Brotli Compression Serving
**Durum**: Kabul Edildi | **Tarih**: 2026-05 (Phase 27)
**Karar**: Vite preview için özel `compressionServePlugin`.
**Neden**: `vite preview` default'ta pre-compressed Brotli dosyalarını servis etmiyor, Lighthouse BP audit fail.

### ADR-009: App Shell Pre-render (SSR Değil)
**Durum**: Kabul Edildi | **Tarih**: 2026-05 (Phase 26)
**Karar**: `index.html` içine statik hero skeleton yaz (SSR yerine).
**Neden**: SPA için LCP ≤ 1.2s hedefi, Next.js geçişi maliyetli.

### ADR-010: Ollama + Claude Code Local Inference
**Durum**: Kabul Edildi | **Tarih**: 2026-05 (istek2.txt)
**Karar**: Claude Code'u Ollama backend'iyle çalıştıran smart launch script.
**Neden**: 48GB RAM + Apple Silicon'da local LLM inference ekonomik (0 API maliyet).

## Reddedilmiş ADR'ler

### ADR-R001: GraphQL (REST Yerine)
**Durum**: Reddedildi | **Tarih**: 2025-12
**Neden**: Mevcut API yüzeyi küçük, REST daha uygun.

### ADR-R002: Microservices (Monolith Yerine)
**Durum**: Reddedildi | **Tarih**: 2025-12
**Neden**: Bir danışmanlık sitesi için mikroservis ağırlığı gereksiz.

## Açık Sorular

- JWT blacklist için Redis pub/sub kullanımı (Phase 31 değerlendirmede)
- CDN seçimi: Vercel Edge vs Cloudflare Workers (performans testi gerekli)
- Email service: SendGrid vs Resend (pricing + deliverability)
