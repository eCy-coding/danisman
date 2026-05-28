# Roadmap 40 — PHASE 34: Conversion Optimization + Analytics

**Tier:** 2 (YÜKSEK) · **Skor:** 5.4 · **Süre:** 1 hafta · **Todo:** T31-T40

**Stratejik Hedef:** Site'ı conversion machine'e çevir. Visitor → Lead → Customer funnel her adımı ölçülür + optimize edilebilir olsun. Hedef: %2+ lead conversion rate.

**İstek3.txt Eşleşmesi:** "ROI aracı GA4 ile izleyip kullanıcı davranışlarını ölçmek büyük avantaj sağlar, bu araçlar sadece reklamlar için değil organik gelen ziyaretçinin sitende nasıl davrandığını anlamak ve dönüşümü artırmak için de önemli."

---

## ⬜ P34-T01 (T31): GA4 Conversion Goals (Booking, Contact, Newsletter)

- **NEDEN:** GA4'te "conversion" olarak işaretlenen event'ler primary KPI. Şu an event tracking var (P31-T05) ama conversion marking yok → GA4 Reports'ta "Conversions" sekmesi boş.
- **ÖNEM:** P0 — Conversion rate optimization'ın önkoşulu. Reklama dönüş durumunda bile ROAS ölçümü için kritik.
- **YÖNTEM:** GA4 → Admin → Events → 5 event'i "Mark as conversion": `booking_submit`, `contact_form_submit`, `newsletter_signup`, `roi_calc_complete`, `pricing_page_scroll_75`. Her biri için conversion value (TRY): booking=500, contact=100, newsletter=10, ROI=50, pricing=20. Attribution model: data-driven (default).
- **TEST:** GA4 → Reports → Engagement → Conversions → 5 event görünür. 7 gün sonra "Conversion" count > 0 (kendi test submission'ların).

## ✅ P34-T02 (T32): ROI Calculator GA4 Detailed Event Tracking

- **NEDEN:** ROI Calculator ana conversion tool (P31-T05'te temel track eklendi). Her adımda hangi değeri girdiler, hangi noktada abandon ettiler bilinmeli. İstek3'te özellikle "ROI aracı GA4 ile izlemek büyük avantaj" vurgusu.
- **ÖNEM:** P1 — Product analytics. Hangi use case'in en çok kullanıldığı → ürün/pazarlama stratejisi.
- **YÖNTEM:** `src/components/features/interactive/ROICalculator.tsx` → her field onChange'de `trackROICalc({field, value, step})` event (500ms debounce). Adımlar: `company_size`, `annual_revenue`, `transformation_scope`, `timeline`, `calculated_result`. GA4 custom dimensions: `roi_company_size`, `roi_revenue_band`. Funnel steps: step_1_start → step_2_inputs → step_3_results → step_4_cta.
- **TEST:** GA4 DebugView → 1 tam ROI calc completion → 4 funnel event + 1 conversion. Explorations → Funnel Analysis → drop-off rate görülür.

## ⬜ P34-T03 (T33): Funnel Analysis Report + Weekly Dashboard

- **NEDEN:** Event tracking var ama funnel analysis yapılmadan darboğaz bilinmez. "Hangi adımda user abandon ediyor?" sorusunun cevabı CRO'nun temeli.
- **ÖNEM:** P1 — Optimization priority order bu rapordan çıkar.
- **YÖNTEM:** GA4 → Explorations → Funnel Exploration → 4 funnel: (a) Visitor → Hero CTA → Services page → Contact, (b) Visitor → Pricing → Booking flow, (c) Visitor → Blog → Newsletter, (d) ROI Calc funnel. Her hafta CSV export → `brain/analytics/funnel-weekly-{date}.csv`. Python/Node script ile WoW delta rapor.
- **TEST:** 4 funnel dashboard'da kayıtlı. `scripts/generate-weekly-funnel-report.ts` → Markdown rapor otomatik. Her funnel için drop-off % görünür.

## ✅ P34-T04 (T34): A/B Testing Infrastructure (GrowthBook veya PostHog)

- **NEDEN:** CRO için hipotez test etmek şart. "Hero CTA 'Görüşme Planla' vs 'Ücretsiz Danışmanlık' hangisi daha çok click alır?" tipi soruların deneysel cevabı.
- **ÖNEM:** P1 — Veri-driven optimization. İmza atmadan değişiklik yapmamak.
- **YÖNTEM:** **GrowthBook OSS** (self-hosted, ücretsiz, PostgreSQL backend — mevcut DB kullanabilir) veya **PostHog Cloud Free** (1M events/ay). GrowthBook tercih edilir (data sovereignty + zaten PostgreSQL var). `@growthbook/growthbook-react` npm → `FeatureFlagProvider` App.tsx içinde → `useFeature('hero-cta-variant')`.
- **TEST:** 1 aktif A/B test (örn: Hero CTA). 100+ visitor split → istatistiksel confidence (95%) hesap. Winner implementation merge.

## ✅ P34-T05 (T35): Microsoft Clarity Heatmap (Ücretsiz)

- **NEDEN:** Heatmap + session recording user behavior'ı görsel anlamak için kritik. Microsoft Clarity %100 ücretsiz, GDPR-compliant, GA4 integration. Hotjar'ın ücretsiz alternatifi.
- **ÖNEM:** P1 — CRO decision support. Analytics'in gösteremediği "kullanıcı burada takıldı" anlarını gösterir.
- **YÖNTEM:** `clarity.microsoft.com` → project create → Tracking code (`clarity.js`). `index.html` `<head>` async yükle veya `src/lib/clarity.ts` consent-gated loader (GDPR). GA4 integration aktif.
- **TEST:** Clarity dashboard → 7 gün sonra: heatmap + session recordings mevcut. "Dead clicks" (tıklanabilir gibi görünen ama tıklanmayan) → UX fix backlog.

## ✅ P34-T06 (T36): Form Abandonment Tracking

- **NEDEN:** Contact form + Newsletter form + Booking form'da user hangi alanda abandone ediyor bilinmeden form UX optimize edilemez.
- **ÖNEM:** P1 — Yüksek intent traffic loss noktası. Form optimization ROI yüksek.
- **YÖNTEM:** `src/hooks/useFormAnalytics.ts` — form onFocus/onBlur/onSubmit track. Field-level timing: "start" event ilk field focus, "complete" onSubmit, "abandon" 60s inactivity. GA4 event: `form_field_abandonment` + custom dim `field_name`. `ContactForm.tsx`, `NewsletterForm.tsx`, `BookingModal.tsx` entegre.
- **TEST:** GA4 DebugView → form başlat → 60s sonra sayfa terk et → `form_abandonment` event görülür. Dashboard'da form completion rate görülür.

## ✅ P34-T07 (T37): Scroll Depth + Engagement Score

- **NEDEN:** Bounce rate GA4'te deprecated. "Engaged session" (10s+ veya 2+ page view veya 1+ conversion) yeni metrik. Scroll depth content engagement proxy.
- **ÖNEM:** P2 — Content performance metric. Hangi blog post'un gerçekten okunduğu ölçülür.
- **YÖNTEM:** `src/hooks/useScrollDepth.ts` (zaten var veya yaz): 25%, 50%, 75%, 100% milestone'larda GA4 event `scroll_depth` + `page_path`. Blog post'lar için özel: reading time tracking (time visible × scroll %).
- **TEST:** GA4 → Reports → Engagement → Pages → scroll depth metric sütunu. Blog post'un 75%+ scroll rate'i "okundu" kabul.

## ⬜ P34-T08 (T38): Session Recordings (Privacy-Safe)

- **NEDEN:** Aggregate analytics'in gösteremediği individual user journey'leri session recording gösterir. UX bug tespit için kritik.
- **ÖNEM:** P2 — Microsoft Clarity (T35) zaten içerir ama ek tool (opsiyonel) olabilir.
- **YÖNTEM:** Clarity built-in (T35 ile tamamlanır). Privacy: PII masking (email, phone, password field'ları otomatik redact). Clarity default privacy-safe. Keyboard input redact. Custom redact selector: `data-clarity-mask="True"` sensitive element'lere ekle.
- **TEST:** Clarity dashboard → session recording → form fields "****" (masked). GDPR cookie consent'e entegre (denied → no recording).

## ✅ P34-T09 (T39): CRO (Conversion Rate Optimization) Playbook

- **NEDEN:** Data var ama sistematik optimization process yok. Playbook = "şu veri gördüğünde, şu testi başlat" karar ağacı.
- **ÖNEM:** P2 — Uzun vadeli optimization disiplini.
- **YÖNTEM:** `docs/CRO_PLAYBOOK.md` (yeni): (a) Weekly review ritüeli (Funnel Analysis T33'ten). (b) Hypothesis formulation template: "Observation → Hypothesis → Test → Metric → Success Criteria". (c) Prioritization framework: ICE score (Impact/Confidence/Ease, 1-10). (d) Winner implementation checklist. (e) 10+ örnek test (hero CTA, pricing page, form fields).
- **TEST:** Playbook dokümanı mevcut + ilk 3 hipotez tanımlı + ICE score hesaplı. 1 ay sonra: 4 test tamamlanmış (5 hipotez/ay pace).

## ✅ P34-T10 (T40): Lead Scoring System

- **NEDEN:** Tüm lead'ler eşit değil. Enterprise company visit > SMB blog reader. Lead scoring ile satış takımı (şimdilik Emre) zamanını doğru allocate eder.
- **ÖNEM:** P2 — Sales efficiency. B2B consulting için kritik.
- **YÖNTEM:** `server/lib/lead-scoring.ts`: behavioral score (pricing page visit: +30, ROI calc complete: +50, 3+ page visit: +20, blog single read: +5, contact form submit: +100). Firmographic score (email domain corporate: +20, enterprise tier company: +40). Total score → A (>100), B (50-99), C (<50) tier. Admin Panel'de lead list tier badge'i (P36-T05).
- **TEST:** `POST /api/leads/score` endpoint → mock lead data → score response. Admin dashboard'da tier dağılım grafiği (Recharts pie chart).

---

## Phase 34 Kapatma Kriterleri

- [ ] 10/10 todo `✅`
- [ ] GA4 Conversions sekmesinde 5 event marked
- [ ] ROI Calculator funnel tracking 4 step
- [ ] Weekly funnel report script çalışıyor
- [ ] GrowthBook (veya alternatif) A/B test infrastructure
- [ ] Microsoft Clarity heatmap aktif + 1 hafta data
- [ ] Form abandonment tracking 3 form'da aktif
- [ ] Scroll depth milestone events
- [ ] CRO playbook dokümanı + 3 hipotez
- [ ] Lead scoring API + admin dashboard tier badge
- [ ] Tag: `git tag phase-34-closed`

**Bir Sonraki:** `roadmap_50.md` — Phase 35 Auth + Security Hardening.
