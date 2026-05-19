# Notebook C — eCyPro Legal & Ops Digest

> NotebookLM Source: KVKK + privacy + operational checklist
> Companion sources to upload: `src/pages/PrivacyPage.tsx`, `src/pages/DataRightsPage.tsx`, `src/pages/TermsPage.tsx`, `src/pages/CookiePage.tsx`, `outputs/USER_ACTION_INVENTORY.md`

## 1. KVKK Compliance Framework

### 6698 Sayılı KVKK — Türk Kişisel Verilerin Korunması Kanunu

#### Madde 11 — Veri Sahibi Hakları
Kişisel verisi işlenen kişi:
1. Kişisel verisinin işlenip işlenmediğini öğrenme
2. Kişisel verileri işlenmişse buna ilişkin bilgi talep etme
3. Kişisel verilerin işlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme
4. Yurt içinde veya yurt dışında kişisel verilerin aktarıldığı üçüncü kişileri bilme
5. Kişisel verilerin eksik veya yanlış işlenmiş olması hâlinde bunların düzeltilmesini isteme
6. KVKK Madde 7'de öngörülen şartlar çerçevesinde kişisel verilerin silinmesini veya yok edilmesini isteme
7. 5 ve 6 maddeler uyarınca yapılan işlemlerin, kişisel verilerin aktarıldığı üçüncü kişilere bildirilmesini isteme
8. İşlenen verilerin münhasıran otomatik sistemler vasıtasıyla analiz edilmesi suretiyle kişinin kendisi aleyhine bir sonucun ortaya çıkmasına itiraz etme
9. Kişisel verilerin kanuna aykırı olarak işlenmesi sebebiyle zarara uğraması hâlinde zararın giderilmesini talep etme

#### 5 Veri İşleme Prensibi (Madde 4)
1. **Hukuka ve dürüstlük kurallarına uygun olma**
2. **Doğru ve gerektiğinde güncel olma**
3. **Belirli, açık ve meşru amaçlar için işlenme**
4. **İşlendikleri amaçla bağlantılı, sınırlı ve ölçülü olma**
5. **İlgili mevzuatta öngörülen veya işlendikleri amaç için gerekli olan süre kadar muhafaza edilme**

### eCyPro KVKK İşleme Activity

#### İşlenen Veri Kategorileri
- **Kimlik:** Ad, soyad, email, telefon
- **İletişim:** Şirket, pozisyon, adres
- **Müşteri:** Hizmet talebi, mesaj içeriği, booking time slot
- **Davranışsal:** Sayfa görüntüleme (GA4 + Clarity, consent-gated)
- **Newsletter:** Subscription, unsubscribe history

#### Veri Saklama Süreleri
- **Newsletter sub:** Aktif olduğu sürece + unsubscribe sonrası 1 yıl (anti-abuse)
- **Contact form:** Cevaplandıktan sonra 3 yıl
- **Booking:** Görüşme + 6 ay (follow-up amacı)
- **Analytics:** GA4 default 14 ay
- **Session recording (Clarity):** 30 gün

#### Veri İşleyenler (Processors)
1. **Vercel Inc. (US):** Frontend hosting (DPA imzalı, Standard Contractual Clauses)
2. **Render Inc. (US):** Backend hosting (DPA imzalı, EU adequacy gap)
3. **Neon Inc. (US/Frankfurt):** Postgres DB (EU region tercih)
4. **Upstash Inc. (US/EU):** Redis (EU region tercih)
5. **Sentry.io (US):** Error tracking — PII redacted in code (email → REDACTED, IP → null)

⚠️ **KVKK Risk:** Sentry US region — Türk müşteri error events transit yurt dışı. EU migration P74'te tartışıldı, P79+ scope. Mevcut PII scrubber risk minimize ediyor.

#### Veri Sahibi Talep Süreci
- Email: `kvkk@ecypro.com`
- Talep formatı: KVKK Madde 13 başvuru formu (PDF download)
- Cevap süresi: 30 gün (uzatma 1× 30 gün ek)
- GDPR Article 15-22 paralel haklar (EU customers)

#### VERBİS Kayıt Yükümlülüğü
- Şu an: **Pending** — eCyPro Veri Sorumlusu kayıt henüz yapılmadı
- Yapılması gereken: VERBİS portal başvuru → Veri Sorumlusu kayıt → 30 gün içinde ROPA submit

## 2. Privacy Policy Highlights

### What we collect
- Name, email, phone (contact form, newsletter, booking)
- Page views, click events (GA4 + Clarity, consent-gated)
- Session recordings (Clarity, masked PII)
- Error context (Sentry, PII redacted)

### What we don't collect
- Credit card / financial data
- Government ID numbers (TCKN, passport)
- Health / biometric data
- Children's data (under 18) — site not targeted at minors

### Where data lives
- TR-friendly: Neon Frankfurt (EU), Upstash EU
- US: Vercel, Render, Sentry (DPA + SCC backed)

### Cookies
- **Essential:** session, auth, CSRF (no consent needed)
- **Analytics:** GA4, Clarity (consent required, default deny)
- **Marketing:** future Meta/LinkedIn Pixel (consent required)
- **Cookie banner:** P51.A1, granular consent, KVKK uyumlu

### User rights (KVKK Madde 11 + GDPR)
- Access (data export)
- Rectification (correction)
- Erasure (right to be forgotten)
- Restriction
- Portability
- Objection (automated decisions)

## 3. Operational Checklist — eCyPro Business Foundation

### 🔴 Acil (bu hafta)
- [ ] **Admin password rotation** (S3nsu4lc4n. chat-exposed)
- [ ] **Admin 2FA enable** (/admin/profile)
- [ ] **GA4 conversion goals** mark (contact, newsletter, discovery)
- [ ] **VERBİS Veri Sorumlusu kayıt** (KVKK Kurumu portal)

### 🟡 1-2 hafta
- [ ] **Sentry 2FA + Calendly 2FA + Clarity 2FA**
- [ ] **PAT renew** (~2026-05-26)
- [ ] **Founder portrait** upload (`/public/founder.jpg`)
- [ ] **LinkedIn business page** create

### 🟠 1-2 ay (legal/business)
- [ ] **LLC kurulumu** — "EcyPro Premium Consulting Danışmanlık Ltd. Şti." veya A.Ş.
  - SMMM relationship: vergi numarası, e-fatura, SGK
  - Sermaye: min ₺10,000 (Ltd) veya ₺50,000 (A.Ş.)
- [ ] **Business banka hesabı** (Garanti / İş Bankası / Akbank)
- [ ] **Vergi levhası + e-fatura entegrasyonu**

### 🟢 3-6 ay (IP + finansal)
- [ ] **Trademark TR (Türk Patent)** — ~₺5,000-15,000, 18-24 ay süreç
- [ ] **Trademark EU (EUIPO)** — ~€900, 12-18 ay
- [ ] **Trademark WIPO (Madrid)** — base ~$1,500 + designation fees
- [ ] **Mesleki sorumluluk sigortası** — Allianz/AXA/HDI, ~$1,000-3,000/yıl
- [ ] **iyzico payment gateway** kurumsal başvuru (vergi levhası gerek)
- [ ] **Stripe Atlas** (international clients için, opsiyonel)

### 🔵 6-12 ay (operational maturity)
- [ ] **Engagement Letter template** (avukat draft + revize)
- [ ] **Mutual NDA template** (Türk hukuk + EU equivalence)
- [ ] **IP Assignment template** (founder + future hires)
- [ ] **Sub-processor agreements** (Vercel, Render, Neon, Upstash DPA review)
- [ ] **Legal counsel relationship** (Pekin & Pekin / Hergüner Bilgen Üçer önerilir)
- [ ] **Auditor relationship** (KVKK + finansal denetim için)
- [ ] **6 müşteri NDA müzakeresi → case study** publication

## 4. Cookie Banner Configuration

### Essential (no consent)
- `session_id` — auth
- `csrf_token` — XSRF prevention
- `lang` — i18n preference (Türkçe / English)
- `theme` — dark/light (gelecek için)

### Analytics (consent gated)
- `_ga`, `_ga_*` — Google Analytics 4
- `_clck`, `_clsk` — Microsoft Clarity
- Future: `_fbp` — Meta Pixel (when enabled)

### Marketing (consent gated, opt-in)
- Şu an enabled değil
- LinkedIn Insight Tag eklenince consent gated

### Consent Storage
- `localStorage` key: `ecypro_cookie_consent`
- Format: `{ timestamp, type, preferences: { essential, analytics, marketing } }`
- Expire: 12 ay (re-consent)

## 5. Terms of Service Highlights

### Service Description
- eCyPro Premium Consulting Danışmanlık (TBA LLC formation)
- 21 strategic consulting service
- Discovery Call (free 30min, no commitment)
- Engagement modalities: Starter / Growth / Enterprise tier

### Payment Terms (future, post-iyzico)
- TRY denominated for TR customers
- USD denominated for international
- Net 30 invoice (corporate clients)
- 50% upfront / 50% on milestone (Growth/Enterprise tier)

### Liability
- eCyPro liability cap: Engagement fee paid
- Force majeure exclusion (KVKK breach by Processor outside eCyPro control)
- Indemnification: eCyPro defends against IP claims for delivered content

### Termination
- Either party 30-day written notice
- Pro-rata refund for incomplete milestones
- Data return + deletion within 30 days post-termination

## 6. NotebookLM Queries (Notebook C için)

1. *"Müşteri 'KVKK Madde 11 hakkımı kullanmak istiyorum, verilerimi silin' derse, eCyPro 30 gün içinde tam olarak hangi adımları atmalı? Email reply template + internal checklist."*
2. *"Türk PE fund müşteri ile NDA müzakeresi — mutual confidentiality + 5 yıl term + exclusions list. Türkçe NDA draft."*
3. *"iyzico vs PayTR vs Param karşılaştırması: kurumsal başvuru kolaylığı, fee, settlement süresi, KVKK uyumu. eCyPro için optimal seçim."*
4. *"İlk 6 ay business operations Gantt chart: trademark + LLC + banking + iyzico + sigorta + KVKK kayıt — paralel ve seri bağımlılıklar."*
5. *"Engagement Letter Türkçe template (Growth tier $30K, 6 ay): kapsamı, milestones, payment, IP, confidentiality, termination — 4 sayfa profesyonel format."*
6. *"GDPR Article 28 sub-processor agreement: Vercel + Render + Sentry için review checklist."*
7. *"Türk holding aile şirketinde aile anayasası + governance manual draft (5 madde core): hisse devir, oy hakkı, kâr dağıtımı, kriz mekanizması, hakim ortağın değişimi."*
8. *"VERBİS başvuru için ROPA (Records of Processing Activities) draft: 10 işleme faaliyeti + amaç + hukuki sebep + kategori + saklama + işleyici."*
9. *"Sentry US vs EU karar matrisi: risk skorlama + maliyet + migration süresi + audit defensibility — recommendation."*
10. *"Annual data audit checklist (yıllık 1×): VERBİS güncelle, processor DPA review, retention policy enforce, breach drill, employee KVKK eğitim."*
