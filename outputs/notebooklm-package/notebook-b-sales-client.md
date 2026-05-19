# Notebook B — eCyPro Sales & Client Digest

> NotebookLM Source: Personas + discovery playbook + pricing + competitor
> Companion sources to upload: `src/data/copy/pages.ts`, `src/pages/PricingPage.tsx`, `outputs/P50_GAP_ANALYSIS.md`, `outputs/P74_SWOT_POST_P72.md`

## 1. Client Personas (4 archetype)

### Persona A — Aile Şirketi CFO (40-55 yaş)
- **Demografik:** Türk holding, 2-3. nesil, $50M-500M revenue
- **Pain points:**
  - Babadan kalan iş modeli + yeni nesil dijital vizyonu çatışıyor
  - Kurumsallaşma + governance sorunları (aile anayasası yok veya eski)
  - 2026 ESG/CSRD compliance pressure (export-led şirketler)
  - Halefiyet planı belirsizliği
- **Decision criteria:** Geçmiş referans (Big4 + boutique mix), founder ile direkt iletişim, hızlı concrete output
- **Budget:** $50K-200K/proje (12-18 ay engagement)
- **Servis match:** family-business, esg-strategy, strategic-transformation, mergers-acquisitions
- **Discovery Call ipucu:** "Aile anayasası ne kadar güncel?" sorusunu sor; varsa son güncelleme tarihi; yoksa pain çok büyük.

### Persona B — Scale-up Founder (32-45 yaş)
- **Demografik:** Türk tech/D2C scale-up, $5M-50M revenue, growth %30-100/yıl
- **Pain points:**
  - Operasyonel debt (manuel process, ad-hoc tooling)
  - Talent shortage + retention (Türk pazar)
  - International expansion belirsizliği (Avrupa? GCC? US?)
  - Series B/C öncesi due diligence hazırlığı
- **Decision criteria:** Hız, modern stack, AI-savvy, fixed-price preferred
- **Budget:** $30K-150K/proje (6-12 ay)
- **Servis match:** operational-excellence, ai-analytics, market-entry, digital-strategy, hr-transformation, employer-branding
- **Discovery Call ipucu:** "Son 12 ayda hangi sürecin manuel kalması seni en çok yorduğu?" → operational debt'i ortaya çıkarır.

### Persona C — ESG/Compliance Officer (45-60 yaş)
- **Demografik:** Türk corporate, EU export %20+, CSRD/SFDR scope yaklaşan
- **Pain points:**
  - Scope 1/2/3 emission baseline yok
  - Double materiality assessment hazırlanmamış
  - ESRS template'ler iç ekibi paniğe sokuyor
  - Big4 ESG fiyatı $200K+ — bütçe yok
- **Decision criteria:** Sektör derinliği (otomotiv, beyaz eşya, gıda farklı), regulatory know-how, defensible methodology
- **Budget:** $40K-120K (CSRD readiness 6 ay)
- **Servis match:** esg-strategy, data-governance, macro-risk
- **Discovery Call ipucu:** "EU müşterilerinizden CSRD evidence ne zaman isteniyor?" → urgency belirler.

### Persona D — Mid-market M&A Principal (35-50 yaş)
- **Demografik:** Türk/regional PE fund associate-VP, deal size $10M-100M
- **Pain points:**
  - Target'lar quality of earnings analysis için Big4 bekleyemez (timeline + fiyat)
  - Sector-specific commercial DD lazım (otomotiv ≠ FMCG ≠ tech)
  - Synergy modeling + 100-day integration planı genelde post-deal ihmal
  - LP reporting için ESG due diligence required
- **Decision criteria:** Deal velocity (2-4 hafta turnaround), sektör expertise, founder direct accountability
- **Budget:** $30K-80K per DD engagement
- **Servis match:** mergers-acquisitions, operational-excellence (post-close), esg-strategy, macro-risk
- **Discovery Call ipucu:** "Şu an açık deal pipeline'da kaç target var?" → engagement volume sinyali.

## 2. Pricing Tiers (Türk pazar kalibre)

> Detay: `src/data/copy/pages.ts` upload edilecek

### Starter — Stratejik Değerlendirme ($5K-15K)
- 30 gün, 1 servis odaklı
- Diagnostic + opportunity map + 90-day action plan
- 1× founder workshop
- Hedef müşteri: Persona A/B ilk engagement

### Growth — Stratejik Dönüşüm ($15K-60K)
- 6 ay, multi-service
- Diagnostic + implementation + 4× milestone review
- Monthly C-suite alignment
- Hedef müşteri: Persona B/C ana paket

### Enterprise — Tam Dönüşüm ($60K-300K)
- 12-24 ay, all-services available
- Embedded transformation team
- Weekly cadence + quarterly board readout
- Hedef müşteri: Persona A holding-level + Persona D PE-backed companies

### Add-ons
- Discovery Call: **Ücretsiz** (30 dk, lead qualification)
- Workshop facilitation: $3K-8K/gün
- Board readout deck: $5K
- Audio Overview / video presentation: $2K-5K

## 3. Discovery Call Playbook (30 dk structure)

### Phase 1 — Rapport + Context (5 dk)
- "Şirketinizi 90 saniyede anlatır mısınız?"
- "Şu an en çok zorlanan başlık nedir?"
- "Eğer bu 90 günde 1 sorunu çözebilecek olsaydık, hangisi olurdu?"

### Phase 2 — Diagnose (15 dk)
12 sorudan en uygun 5-6'yı sor:
1. *"Son strateji belgenizi ne zaman güncellediniz?"* (strategic-transformation lead)
2. *"Aile anayasası varsa son güncelleme tarihi?"* (family-business lead)
3. *"M&A pipeline'da şu an aktif target var mı?"* (mergers lead)
4. *"AI/ML için iç ekipte uzman var mı, dışarıdan vendor mı?"* (ai-analytics lead)
5. *"CSRD/SFDR scope'da mısınız? Hangi yıl yürürlük?"* (esg lead)
6. *"Yıllık personel turnover yüzde kaç?"* (hr lead)
7. *"Son 3 yılda operasyonel verimliliği nasıl ölçtünüz?"* (operational lead)
8. *"Türkiye dışında satış var mı? Hangi pazarlar?"* (market-entry lead)
9. *"Krize hazırlık planınız (BCP) var mı? Test edildi mi?"* (crisis-management lead)
10. *"Müşteri verilerini hangi platformda tutuyorsunuz?"* (data-governance lead)
11. *"Marka strateji + müşteri davranış araştırması son ne zaman yapıldı?"* (neuromarketing lead)
12. *"Şirketinizin 5 yıllık aspirasyonu nedir?"* (open-ended bonus)

### Phase 3 — Risk flags (5 dk)
🔴 Don't engage:
- Müşteri "ucuza istiyorum" diye agresif → premium positioning kaybeder
- Decision-maker tanımsız ("biz değerlendirip döneriz" 2+ kez)
- Eski Big4 ilişkisinin tortusu var ("McKinsey ile aynı methodology mi?")
- Beklenti unrealistic ("3 ayda %50 büyürüm")

🟢 Strong fit signals:
- Founder/CEO call'a katılmış (decision proximity)
- Concrete pain point + timeline urgency (CSRD, IPO, M&A)
- Daha önce consulting kullanmış, "Big4 yaşadık, boutique arıyoruz" diyor

### Phase 4 — Next steps (5 dk)
- Discovery Call summary email (24h içinde)
- Tailored proposal (3 gün içinde) veya tier şablon (Starter/Growth/Enterprise)
- Reference call müşteri varsa (Q3 sonrası)
- Decision timeline expectation (2-4 hafta)

## 4. Proposal Template Skeleton

```
1. Executive Summary (1 sayfa)
   - Müşteri durumu, çözüm önerisi, beklenen outcome, yatırım

2. Diagnose Edilen Sorunlar (Discovery Call findings, 1-2 sayfa)

3. Önerilen Yaklaşım (eCyPro methodology, sektörel adaptation, 2-3 sayfa)

4. Deliverables (concrete output list, 1 sayfa)

5. Timeline + Milestones (Gantt, 1 sayfa)

6. Yatırım + Ödeme Planı (TRY/USD, faz bazlı, 1 sayfa)

7. eCyPro Hakkında (founder, brand, 21 servis snapshot, 1 sayfa)

8. Referanslar (Q3 sonrası 5 case study, NDA permitting)

9. Sözleşme Şartları (engagement letter referans, 1 sayfa)
```

## 5. Competitor Snapshot

### Big4 (Deloitte, EY, PwC, KPMG) Türkiye
- **Avantajlar:** Brand awareness, global reach, sector benchmarks
- **Dezavantajlar:** Fiyat 3-5×, junior-heavy team, methodology rigid, regulatory conflict (audit + advisory same firm)
- **eCyPro pozisyon:** Boutique alternative, founder-led, sector deep, 70% indirimli premium kalite

### Boutique Competitors
- **Sigma Insight, BiR Consulting, AT Kearney TR:** Niche'lerini büyütüyor — kaliteli rakip
- **eCyPro fark:** 21 service-specific interactive widget moat + Türkçe content depth + KVKK-first compliance

### AI Consulting Platforms (McKinsey QuantumBlack, BCG Gamma)
- **Avantajlar:** AI-driven insights, scale
- **Dezavantajlar:** Türk pazara low penetration, KVKK adaptation eksik, cultural friction
- **eCyPro pozisyon:** Türk pazar AI consulting niche — ai-analytics + data-governance bundle

### Strateji startup'ları (Strateji Hub, Mentor.AI, Bayer)
- **Avantajlar:** Modern UX, young talent, AI-native
- **Dezavantajlar:** Senior expertise yok, brand awareness düşük
- **eCyPro pozisyon:** Founder seniority + 10+ yıl deneyim premium kart

## 6. NotebookLM Queries (Notebook B için)

1. *"Aile şirketi CFO'su Discovery Call'da en sık ne sorar? Top 10 soru + 2 cümlelik ideal cevap her biri."*
2. *"Persona D (PE M&A principal) için tailored 6-slide proposal slide deck hazırla."*
3. *"3 tier pricing'in (Starter/Growth/Enterprise) ROI'sini hesapla: 6 ay sonra her tier müşterinin net kazanç (TRY ve USD)."*
4. *"Big4 vs eCyPro karşılaştırma tablosu — 8 axis: brand, fiyat, hız, sektör depth, junior/senior mix, methodology, KVKK, referans."*
5. *"Müşteri 'Big4 ile karşılaştırıyorum' derse 3-cümlelik counter-pitch."*
6. *"Müşteri 'Şu an bütçe yok, ileride dönerim' derse 2-cümlelik low-friction follow-up (drip campaign'a düşür)."*
7. *"Q3 2026 sektör hedefleme: hangi 3 sektör en yüksek conversion + en az sales friction? Reasoning ile."*
8. *"İlk 6 müşteri için NDA'lı testimonial collection email template (TR)."*
9. *"Referans yokken pitch ediyorum, what's the 1-sentence credibility hook? (founder background, 21 widget moat, vb.)."*
10. *"Sales objection bank: en sık 10 itiraz + her birine 2-cümlelik counter (no overpromise)."*
