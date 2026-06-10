---
doc: ECYPRO_PROJECT_GAPS
title: "eCyPro.com — Proje Eksik Analizi & Remediation Roadmap"
source_path: /Users/emrecnyngmail.com/Desktop/ecypro
audit_date: 2026-06-08
methodology: "3 paralel kod-denetçi ajanı + dosya:satır spot-check doğrulama (5/5 teyit)"
scope: "Bitmemiş iş (kanıtlı) + best-practice should-have"
language: "Türkçe (kod/id/dosya/route İngilizce)"
priority_legend:
  P0: "Launch-blocker — canlıya çıkmadan önce zorunlu"
  P1: "Launch öncesi — kalite/güven/uyum için gerekli"
  P2: "İçerik/sonradan — ship sonrası iyileştirme"
counts:
  P0: 5
  P1: 6
  P2: 4
  best_practice_domains: 7
---

# eCyPro.com — Proje Eksik Analizi & Remediation Roadmap

> **Bu doküman ne işe yarar?**
> Projenin (`/Users/emrecnyngmail.com/Desktop/ecypro`) **neyi eksik kaldığını** ve **ideal durumda neyin olması gerektiğini** kanıta dayalı listeler. 3 paralel kod-denetçi ajanının bulguları, iddia edilen `dosya:satır` referanslarının gerçek dosyalarla spot-check'iyle doğrulandı. Önceliklendirilmiştir (P0/P1/P2). Bu, kategorizasyon dokümanının (`ECYPRO_SITE_CATEGORIZATION.md`) tamamlayıcısıdır: o "ne var" der, bu "ne eksik" der.

---

## Yönetici Özeti

Proje **olgun ve büyük oranda tamamlanmış** bir full-stack danışmanlık platformu (60 Prisma modeli, 69 API route, 19 CI/CD workflow, 49 blog yazısı). Mimari ve altyapı sağlam. Ancak **canlıya çıkışı bloklayan 5 kritik açık** + **launch öncesi 6 önemli eksik** + **birkaç bilinçli içerik stub'ı** var. Ek olarak premium bir danışmanlık sitesi için **olması gereken** bazı best-practice özellikler henüz yok.

| Öncelik | Adet | Özet |
|---------|------|------|
| 🔴 **P0** | 5 | Sahte case study, çalışmayan GDPR export, düşük performans, prerender/snapshot eksik, env placeholder |
| 🟡 **P1** | 6 | %42 test coverage, 2 orphan sayfa, yarım Notion sync, ham IP (KVKK), 51 faz-marker, auto-deploy yok |
| 🟠 **P2** | 4 | Bilinçli içerik stub'ları, kırık asset ref, stub post'lar, skipped testler |
| 🔵 **Best-practice** | 7 domain | İçerik / SEO-Perf / Güvenlik / Test / Observability / DevOps / Ürün |

---

# Bölüm 1 — Bitmemiş İş (Kanıtlı)

## 🔴 P0 — Launch-Blocker

| # | Başlık | Kanıt (dosya:satır) | Etki | Önerilen Aksiyon | Efor |
|---|--------|---------------------|------|------------------|------|
| P0-1 | **Case study'ler sahte/mock** | `src/data/mockCaseStudies.ts` (8 mock); `src/content/case-studies/` yalnız 1 gerçek (`atlas-freight`); `CaseStudiesPage.tsx` mock'tan render | Premium danışmanlıkta sosyal kanıt = satış. Mock vaka güven kırar, yanıltıcı olabilir | Gerçek (anonimleştirilmiş) müşteri vakaları yaz; mock'u kaldır veya açıkça "örnek senaryo" etiketle | Yüksek |
| P0-2 | **GDPR/DSAR export çalışmıyor** | `server/workers/gdpr-export-worker.ts:79` `TODO(P18): persist to object storage`; satır ~92 kullanıcıya **placeholder** `downloadUrl` gönderiyor | KVKK/GDPR yasal yükümlülük. Kullanıcı verisini indiremiyor; sahte link = uyum ihlali | Object storage (S3/MinIO) bağla, signed 7-gün URL üret, gerçek artifact persist et | Yüksek |
| P0-3 | **Performans bütçe altında** | `docs/PERFORMANCE_REPORT.md`: `LandingPage` 62/100 (hedef ≥85); tüm sayfalar Best Practices 73/100 (hedef ≥90) | Düşük Lighthouse = SEO sıralaması + dönüşüm kaybı; CI Lighthouse gate fail | LandingPage LCP/CLS + bundle audit (image optim, JS split); BP sorunlarını tam rapordan çöz | Orta |
| P0-4 | **Prerender kapalı + visual snapshot commit'siz** | `docs/FC_V37_HANDOFF.md` (C+D pending): `PRERENDER=1` Vercel'de set değil; `e2e/snapshots/` git'te yok | Non-home route'lar homepage meta'sı servis ediyor → SEO <100; visual-regression CI ilk run'da fail | Vercel Production'a `PRERENDER=1` ekle + redeploy; `e2e/snapshots/` baseline'larını commit'le | Düşük |
| P0-5 | **Üretim env eksik** | `.env.production.example`: **9** placeholder (`__FILL_ME__`/`__GENERATE__`): `JWT_SECRET`, `VITE_SENTRY_DSN`, `VITE_GA_TRACKING_ID`, `SENTRY_AUTH_TOKEN/ORG/PROJECT` | JWT_SECRET üretilmezse auth güvensiz; analytics/error-tracking ölü | `openssl rand -base64 32` ile JWT_SECRET; Sentry+GA4 değerlerini Vercel/Render dashboard'a gir; deploy öncesi `grep __FILL_ME__` = 0 | Düşük |

## 🟡 P1 — Launch Öncesi

| # | Başlık | Kanıt | Etki | Önerilen Aksiyon | Efor |
|---|--------|-------|------|------------------|------|
| P1-1 | **Test coverage ~%42** | `server/routes/` 69 route, ~29 testsiz: `sessions.ts`, `totp.ts`, `dsar-comments.ts`, `admin-security/dashboard/deals/content/webhooks/integrations` | Auth/MFA/GDPR gibi kritik yollar testsiz = regresyon riski | Kritik route'lara test ekle; hedef ≥%70 (özellikle auth, RBAC, DSAR, billing) | Orta |
| P1-2 | **2 orphan admin sayfası** | `src/pages/admin/AdminFounderLetterPage.tsx` + `AdminRBACPage.tsx` — `src/App.tsx`'te **0** referans (grep teyit) | UI yazılmış ama erişilemiyor; ya route eksik ya ölü kod | Route ekle (kullanılacaksa) veya sil (kullanılmayacaksa) — CLAUDE.md "unused code sil" kuralı | Düşük |
| P1-3 | **Notion lead write-back yarım** | `server/routes/admin-leads.ts:155` — PATCH echo + bus publish yapıyor, remote Notion PATCH yok (`R7-P1.2` yorumu) | Admin'de lead güncellemesi Notion'a yansımıyor; veri tutarsızlığı | `lib/notion-leads-client` remote PATCH'i tamamla; contract değişmez | Orta |
| P1-4 | **KVKK: ham IP sızıntısı** | `server/routes/contact.ts:159` `IP: req.ip ?? 'unknown'` → Telegram/Notion'a ham IP; tarihsel `NewsletterSubscriber.ip` ham satırlar (`KVKK_BREACH_ALERT.md`) | Kişisel veri minimizasyonu ihlali (KVKK/GDPR) | IP son okteti maskele veya `hashIp()` uygula (newsletter'da zaten var); tarihsel satırlar için hash migration | Düşük |
| P1-5 | **51 faz-marker (P18/P26) bitmemiş** | Kod genelinde `TODO(P18)`/`P26`: Prometheus metrics, Bull-Board queue dashboard, object storage adapter, BlogPost/CaseStudy full-text search, query-key dedup | Observability + arama + ölçeklenme eksik; "yarım" altyapı | P18/P26 backlog'unu önceliklendir; object storage + metrics ilk (P0-2 ile örtüşür) | Yüksek |
| P1-6 | **Auto-deploy yok** | `.github/workflows/` 19 workflow ama main push'ta Vercel/Render tetikleyen yok; manuel promote (`docs/guides/.../DEPLOY_RUNBOOK.md`) | Deploy gecikmesi + insan hatası riski | main→production auto-deploy workflow ekle (Vercel + Render) | Düşük |

## 🟠 P2 — İçerik / Sonradan

| # | Başlık | Kanıt | Etki | Önerilen Aksiyon |
|---|--------|-------|------|------------------|
| P2-1 | **Bilinçli içerik stub'ları** | `PartnersPage.tsx` "Coming Soon" (P45); `src/data/copy/pages.ts:134` tek placeholder ofis; `CareersPage.tsx` "no openings" | Sayfalar boş görünüyor; tasarımca kabul edilmiş | Gerçek partner/ofis/pozisyon eklendikçe doldur (bloklamaz) |
| ~~P2-2~~ | **FALSE-POSITIVE** — `icon-mark.svg` mevcut | `public/brand/icon-mark.svg` (2.0k, 64×64 valid) GERÇEKTE VAR; denetçi yanlış raporlamış | Yok | — (kapatıldı, fix gereksiz) |
| P2-3 | **Stub içerik & taksonomi tutarsızlığı** | `src/data/insights-stub-posts.json` 5 yayımlanmamış post; blog kategori adları TR/EN karışık ("Finance"/"Finans"); series frontmatter yok | Karışık kategori UX; stub'lar yanlışlıkla yayımlanabilir | Kategori adlarını normalize et; stub'ları yayımla veya kaldır; series metadata tanımla |
| P2-4 | **15 skipped test** | `src/test/pages/about-page.test.tsx` (8), `founder-page.test.tsx` (6), `pricing-faq.test.tsx` (1) — "feature not yet implemented" | Test güvencesi yok; feature yarım (About manifesto, Founder letter kartları) | İlgili feature'ları tamamla → testleri aç (`.skip` kaldır) |

---

# Bölüm 2 — Best-Practice / Should-Have (İdeal Durum)

Premium bir danışmanlık platformunda **olması gereken** ama henüz olmayan/eksik özellikler, domaine göre:

## 🔵 İçerik & Sosyal Kanıt
- **Gerçek case study + testimonial/referans sistemi** (şu an mock; P0-1).
- **Müşteri logoları** — `public/clients/` var ama gerçek/anonim logo seti netleşmeli.
- **Insight series taksonomisi** — UI bileşeni (`InsightSeries.tsx`) var, frontmatter veri yok.
- **Video/podcast içerik** (NotebookLM podcast altyapısı ekosistemde mevcut — entegre edilebilir).

## 🔵 SEO & Performans
- **Per-page meta description** — şu an homepage meta'sı her route'ta (`FC_V37_HANDOFF.md:174`).
- **Schema.org genişletme** — `components/seo/SchemaOrg` var; Organization/Service/Article/FAQ/BreadcrumbList tam kapsama.
- **LCP/CLS bütçe** — image CDN, responsive `srcset`, font preload, kritik CSS inline.
- **Otomatik sitemap/RSS regen** deploy'da (`indexnow-on-deploy.yml` var, sitemap regen tetiği teyit edilmeli).

## 🔵 Güvenlik & Uyum
- **Çalışan GDPR/DSAR export** (P0-2) + **cookie consent banner UI** (Consent modeli var, kullanıcı-tarafı banner teyit edilmeli).
- **IP maskeleme her yerde** standardize (contact + telegram + analytics).
- **Rate-limit tüm public endpoint** (tier middleware var; kapsama denetimi).
- **Secret rotation politikası** + `SECURITY.md` disclosure SLA (mevcut) — periyodik rotation eksik.

## 🔵 Test & QA
- **Kritik funnel E2E** — booking / contact / discovery / pricing-quiz uçtan uca.
- **Route coverage ≥%70** (P1-1).
- **Mutation testing** (tob-mutation-testing) kritik iş mantığında (billing-calculator, lead-scoring).

## 🔵 Observability & Altyapı
- **Prometheus + Grafana** dashboard (P18 marker).
- **Object storage (S3/MinIO)** — GDPR export + media + image-resize worker için (P0-2/P1-5).
- **DB backup otomasyonu + restore drill** — `scripts/backup-db.sh`/`restore-db.sh` var, otomatik schedule + periyodik restore testi eksik.
- **Staging ortamı** — prod-benzeri pre-prod env.
- **Error budget / alerting** (Sentry var; alert kuralları + on-call eksik).

## 🔵 DevOps
- **Auto-deploy CI** (P1-6) + **blue-green canlı** (`blue-green-switch.sh` var, pipeline'a bağlama).
- **IaC** (Terraform/Pulumi) — altyapı kod olarak yönetimi.
- **SBOM + supply-chain audit** (gitleaks/Snyk var; `tob-supply-chain-risk-auditor` ile derinleştirme).

## 🔵 Ürün Özellikleri
- **Client portal derinleştirme** — `/app/*` dashboard var, müşteri-teslim alanı (deliverables, fatura, retainer durumu) genişletilebilir.
- **Blog yorum moderasyonu** — `Comment`/`CommentStatus` modeli var, moderasyon UI/akışı teyit/tamamlanmalı.
- **Newsletter double opt-in** — onay akışı (`newsletter-lifecycle.ts`) var, double opt-in doğrulanmalı.

---

# Bölüm 3 — Önceliklendirilmiş Aksiyon Sırası (Launch-Critical Path)

```
1. P0-5  Env doldur (JWT_SECRET üret, Sentry/GA4)        ← deploy'un ön-koşulu
2. P0-4  PRERENDER=1 + snapshot commit                   ← SEO + CI yeşil
3. P0-2  GDPR export → object storage (S3/MinIO)         ← KVKK yasal (P1-5 ile birlikte)
4. P0-1  Gerçek case study içeriği (mock kaldır)         ← satış/güven
5. P0-3  LandingPage perf 62→85, BP 73→90               ← SEO/dönüşüm
─── canlıya çıkış eşiği ───
6. P1-4  IP maskeleme (KVKK)                             ← uyum
7. P1-1  Kritik route test coverage ≥%70
8. P1-2  Orphan sayfa route/sil · P1-3 Notion sync
9. P1-6  Auto-deploy CI
10. P2 + Best-practice (ship sonrası iterasyon)
```

---

# Makine-Okunur Özet (JSON)

```json
{
  "audit_date": "2026-06-08",
  "source": "/Users/emrecnyngmail.com/Desktop/ecypro",
  "P0_launch_blockers": [
    {"id": "P0-1", "title": "Mock case studies", "evidence": "src/data/mockCaseStudies.ts + CaseStudiesPage.tsx", "domain": "content"},
    {"id": "P0-2", "title": "GDPR export non-functional", "evidence": "server/workers/gdpr-export-worker.ts:79", "domain": "compliance"},
    {"id": "P0-3", "title": "Performance below budget", "evidence": "docs/PERFORMANCE_REPORT.md (LandingPage 62, BP 73)", "domain": "perf"},
    {"id": "P0-4", "title": "Prerender off + snapshots uncommitted", "evidence": "docs/FC_V37_HANDOFF.md C+D", "domain": "seo_ci"},
    {"id": "P0-5", "title": "9 env placeholders", "evidence": ".env.production.example __FILL_ME__", "domain": "config"}
  ],
  "P1_pre_launch": [
    {"id": "P1-1", "title": "Test coverage ~42%", "evidence": "server/routes 29/69 untested"},
    {"id": "P1-2", "title": "2 orphan admin pages", "evidence": "AdminFounderLetterPage + AdminRBACPage not in App.tsx"},
    {"id": "P1-3", "title": "Notion lead write-back missing", "evidence": "server/routes/admin-leads.ts:155"},
    {"id": "P1-4", "title": "Raw IP to Telegram (KVKK)", "evidence": "server/routes/contact.ts:159"},
    {"id": "P1-5", "title": "51 P18/P26 markers", "evidence": "Prometheus, Bull-Board, object storage, full-text search"},
    {"id": "P1-6", "title": "No auto-deploy", "evidence": ".github/workflows (manual promote)"}
  ],
  "P2_content_later": [
    {"id": "P2-1", "title": "Intentional content stubs (Partners/Locations/Careers)"},
    {"id": "P2-2", "title": "Broken asset ref icon-mark.svg", "evidence": "PressKitPage.tsx:114"},
    {"id": "P2-3", "title": "Stub posts + inconsistent taxonomy", "evidence": "src/data/insights-stub-posts.json"},
    {"id": "P2-4", "title": "15 skipped tests", "evidence": "src/test/pages/*.test.tsx"}
  ],
  "best_practice_domains": ["content_social_proof", "seo_perf", "security_compliance", "test_qa", "observability_infra", "devops", "product_features"],
  "launch_critical_order": ["P0-5", "P0-4", "P0-2", "P0-1", "P0-3", "P1-4", "P1-1", "P1-2", "P1-3", "P1-6"]
}
```

---

## Doğrulama Notu
Bu denetim `2026-06-08`'de 3 paralel kod-denetçi ajanıyla yapıldı; iddialar `dosya:satır` spot-check ile teyit edildi (gdpr-export-worker:79 ✓, mockCaseStudies.ts ✓, .env 9 placeholder ✓, orphan sayfalar App.tsx'te 0 referans ✓, contact.ts:159 ham IP ✓). Kaynak: `/Users/emrecnyngmail.com/Desktop/ecypro`. Detaylı yapı için → `docs/ECYPRO_SITE_CATEGORIZATION.md`.
