# Perspektifler Vertical — AC-01..12 Durum Denetimi

> **Tarih:** 2026-06-13 · **Branch:** `fix/project-gaps-2026-06-08` (post #222 merge) · **Disiplin:** eCyPro v3.6
> **Yöntem:** QA subagent denetimi (read-only, kanıt-veya-sessizlik) + 2 verdict'in orchestrator
> tarafından deterministik düzeltmesi. Spec: istek.md §AC + PERSPEKTIFLER_REBUILD_SPEC.md §10.

## Özet: 9/12 kanıtlı PASS · 1 owner-gated FAIL · 2 host-only PENDING (docs yeşil)

| AC | Verdict | Kanıt | Not |
|---|---|---|---|
| AC-01 menü closed-default + close | ✅ PASS | Navbar.tsx Esc/route/outside/scroll listener'ları + menu.spec 36 passed (doc) | E2E host re-run önerilir |
| AC-02 nav artefaktları gitti | ✅ PASS | menu-insights.test 7/7 (boş ikon kutusu yok, Sektörler/Hakkımızda kaldırıldı) | — |
| AC-03 panel ≤30 insights-only | ✅ PASS | test "≤30" + canlı 17 link | — |
| AC-04 20 slug ≤3 tık | ✅ PASS | `check-links.ts --all` → 49 makale 0 orphan, hub→facet→card=2 tık | — |
| AC-05 vocab ≤60, 0 dup, 100% 301 | ✅ PASS | taxonomy: 10 cat, 57 tag, 0 dup, 146 redirect 0 chain; vercel.json /blog→/perspektifler permanent | — |
| AC-06 CWV/Lighthouse | ❌ FAIL | committed LH: perf 59-64, LCP 7-10.5s (budget ≥90 / ≤2.5s) | **OWNER**: prod-deploy + host re-measure; SSR/prerender perf işi (PLAN_ssr-prerender-seo.md) |
| AC-07 axe 0 critical/serious | ⏳ PENDING | a11y-perspektifler.spec mevcut, docs yeşil; host Chrome gerekli | **OWNER**: host axe run |
| AC-08 search zero<5% p95<300ms | ✅ PASS | perspektifler-search.test 4/4 — zero 3.3%, p95 0.26ms | — |
| AC-09 URL round-trip | ✅ PASS | perspektifler.test "parse(serialize(f))===f" 10/10 | — |
| AC-10 ≤2 persistent float | ✅ PASS (düzeltme) | Spec §7.3/AC-10: "max 2 persistent (chat + UtilityDock)". Denetim "PARTIAL" dedi ama BackToTop scroll-gated (`return null`), SmartCTA dismissible+/contact-gizli, SocialProofToast geçici toast, MobileStickyCTA mobil-only → hiçbiri persistent DEĞİL. Persistent=2. | screenshot teyidi owner-opsiyonel |
| AC-11 hreflang+schema, crawl | ✅ PASS | structured-data + locale testleri 19/19; audit-canonical 7/7; gate4-rich-results Article+Breadcrumb OK | full 151-sayfa crawl host |
| AC-12 analytics + consent (SHA-256) | ✅ PASS (düzeltme) | Denetim "SHA-256 absent → PARTIAL" dedi. DETERMINISTIK DÜZELTME: `identify()` çağrısı **0** → distinctId hiç set edilmiyor, anonim rastgele UUID kalıyor → hash'lenecek PII YOK → SHA-256 invariant'ı tetiklenmiyor (vacuously satisfied). Ayrıca posthog.ts: `opt_out_by_default:true`, `ip:false`, `autocapture:false`, her capture'da `has_opted_in_capturing()` gate. Events fire ✓ + opt-in baseline ✓. | KVKK-uyumlu |

## İki verdict düzeltmesinin gerekçesi (over-eager action'dan kaçınma)
Denetim 3 "eksik" raporladı; 2'si deterministik incelemede **yanlış-pozitif** çıktı:
- **AC-12:** `grep identify( → 0`. Anonim UUID distinctId'de SHA-256 anlamsız (hash'lenecek PII yok). Körlemesine SHA-256 eklemek = gereksiz kod (skill §1.1.2 meta-orchestration + kullanıcının "gereksiz kod" yasağı). EKLENMEDİ.
- **AC-10:** Spec "persistent" tanımı = always-visible-non-dismissible. 4 ek float conditional/dismissible/toast/mobil → persistent sayılmaz. Float fix gereksiz. YAPILMADI.

## Gerçek kalan tek kod-dışı eksik: AC-06 (perf)
AC-06 host/prod/SSR işi — branch'te tek başına çözülemez (prod-URL ölçümü + SSR planı gerekli). OWNER_TIER3_QUEUE'da.
