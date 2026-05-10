# EcyPro CRO Playbook — Conversion Rate Optimization

**Versiyon:** 1.0 · **Tarih:** Mayıs 2026 · **Sahip:** EcyPro Growth Team

---

## 1. Haftalık Review Ritüeli

Her Pazartesi 09:00'da 30 dakika:

```
□ GA4 → Reports → Funnel (son 7 gün)
□ Microsoft Clarity → "Dead Clicks" ve "Rage Clicks" raporu
□ Form tamamlanma oranı (ContactForm, BookingModal)
□ LeadScore dağılımı (Admin Panel → Contacts → Tier badge)
□ Aktif A/B test sonuçları (GrowthBook dashboard)
□ Yeni hipotez belirleme (ICE scoring tablosu güncelle)
```

---

## 2. Hipotez Formülasyon Şablonu

```
GÖZLEM   : [GA4/Clarity datasından gözlemlenen sorun]
HİPOTEZ  : "[Değişkeni] değiştirirsek [kullanıcı grubu] için [metrik] [artış/azalış]ı bekliyoruz"
TEST EDİN: [A/B test, Multivariate, URL split, Kullanıcı araştırması]
METRİK   : [Birincil KPI] / [İkincil KPI]
BAŞARI   : [%X relative artış] / [%95 istatistiksel güven / n=X örneklem]
```

**Örnek:**
```
GÖZLEM   : Hero CTA "Görüşme Planla" → scroll heatmap'te %40 görünüm oranı, %2.1 CTR
HİPOTEZ  : CTA metnini "Ücretsiz Strateji Görüşmesi Al" olarak değiştirirsek CTR %15 artacak
TEST      : A/B test (GrowthBook: hero-cta-variant)
METRİK   : hero_cta_click event / booking_modal_open event
BAŞARI   : CTR ≥ %2.4 (15% relative lift) / %95 CI / n ≥ 385 per variant
```

---

## 3. ICE Önceliklendirme Sistemi

**ICE Score = (Impact × Confidence × Ease) / 3**

| Boyut | Tanım | Ölçek |
|-------|-------|-------|
| **Impact** | Birincil KPI üzerindeki beklenen etki | 1-10 |
| **Confidence** | Hipotezin doğru olma olasılığı | 1-10 |
| **Ease** | Uygulama zorluğunun tersi (kolay=10) | 1-10 |

**ICE Eşiği:**
- ≥ 6.0 → Sprint'e dahil et
- 4.0-5.9 → Backlog
- < 4.0 → Şimdilik reddedildi

---

## 4. Aktif Hipotezler (ICE Sıralı)

| # | Hipotez | Impact | Confidence | Ease | ICE | Durum |
|---|---------|--------|------------|------|-----|-------|
| H1 | Hero CTA: "Görüşme Planla" → "Ücretsiz Strateji Görüşmesi Al" | 8 | 7 | 9 | **8.0** | 🟡 Test |
| H2 | Pricing page: Fiyat kartı → Karşılaştırma tablosu | 7 | 6 | 7 | **6.7** | ⬜ Beklemede |
| H3 | Contact form: 6 alan → 3 alan (name, email, message) | 9 | 8 | 8 | **8.3** | 🟡 Test |
| H4 | Hero: Video background yerine statik + animasyon | 6 | 5 | 6 | **5.7** | 📦 Backlog |
| H5 | ROI Calculator: "Potansiyel Tasarruf" başlığı görünürlüğü artırma | 7 | 7 | 9 | **7.7** | ⬜ Beklemede |
| H6 | Trust bar: Logo sırasını değiştir (tanınan markalar önce) | 5 | 6 | 9 | **6.7** | ⬜ Beklemede |
| H7 | Booking modal: 3 adım → 2 adım (takvim+form birleşik) | 8 | 6 | 5 | **6.3** | 📦 Backlog |
| H8 | Blog post: Her post'ta sticky CTA sidebar | 7 | 6 | 7 | **6.7** | ⬜ Beklemede |
| H9 | Exit-intent popup: %10 indirim kuponu | 5 | 4 | 7 | **5.3** | 📦 Backlog |
| H10 | Mobile: Floating "Görüşme Planla" button (sticky bottom) | 8 | 7 | 8 | **7.7** | ⬜ Beklemede |

---

## 5. Örneklem Boyutu Hesaplama

İstatistiksel geçerliliği olan test için minimum örneklem boyutu:

```
Formül (Two-proportion z-test, iki kuyruklu):
  n = [z_α/2 × √(2 × p̄ × (1 - p̄)) + z_β × √(p₁(1-p₁) + p₂(1-p₂))]² / (p₁ - p₂)²

Standart değerler:
  α = 0.05  → z_α/2 = 1.96  (95% güven)
  β = 0.20  → z_β  = 0.84   (80% güç)
  p₁ = temel dönüşüm oranı (örn. %2)
  p₂ = p₁ × (1 + MDE)       (örn. %2.3 — MDE=15%)

Pratik tablo:
  Temel %2.0, MDE %15 → n ≈ 5,400 per variant
  Temel %5.0, MDE %10 → n ≈   770 per variant
  Temel %5.0, MDE %15 → n ≈   385 per variant
  Temel %10.0, MDE %10 → n ≈  320 per variant
```

**EcyPro gerçekçi örneklem süresi:**
Günlük ~150 unik ziyaretçi → n=385 per variant → ~5 gün. **Minimum test süresi: 7 gün** (hafta günü etkisi).

---

## 6. İstatistiksel Anlamlılık Hesaplama

Test sonunda p-değeri hesapla:

```
Gözlemlenen dönüşümler:
  Kontrol (A): n_A ziyaretçi, c_A dönüşüm → p_A = c_A / n_A
  Varyant (B): n_B ziyaretçi, c_B dönüşüm → p_B = c_B / n_B

Havuzlanmış oran:
  p̂ = (c_A + c_B) / (n_A + n_B)

Z-istatistiği:
  SE = √(p̂ × (1-p̂) × (1/n_A + 1/n_B))
  z  = (p_B - p_A) / SE

p-değeri (iki kuyruklu):
  p = 2 × (1 - Φ(|z|))

Karar:
  p < 0.05 → istatistiksel olarak anlamlı → Varyant uygula
  p ≥ 0.05 → yetersiz kanıt → Devam et veya iptal et
```

**Erken durdurma:** Yalnızca p < 0.001 (Bonferroni düzeltmesi) durumunda erken karar.

---

## 7. Test Yaşam Döngüsü

```
Hipotez → ICE Puanla → Tasarım → GrowthBook setup → Çalıştır → Analiz → Karar
```

| Aşama | Eylem | Sorumluluk |
|-------|-------|-----------|
| **Hipotez** | Gözlem + ICE puanla | Growth Lead |
| **Tasarım** | Kontrol/Varyant fark tanımla | UI/UX |
| **Uygulama** | GrowthBook feature flag + `useABVariant` | Dev |
| **Çalıştır** | Min 7 gün, min n örneklem | Otomatik |
| **Analiz** | Z-test p-değeri + relative lift | Data |
| **Karar** | p<0.05 → uygula; p≥0.05 → devam/iptal | Growth Lead |
| **Uygulama** | Kazanan variant kalıcı hale getirilir | Dev |
| **Belge** | Bu dokümana test sonucu eklenir | Growth Lead |

---

## 8. Test Sonuçları (Tamamlananlar)

*Henüz tamamlanmış test yok. İlk test tamamlandığında buraya eklenecek.*

| # | Hipotez | Süre | p-değeri | Lift | Karar |
|---|---------|------|----------|------|-------|
| - | - | - | - | - | - |

---

## 9. Anahtar Metrikler Dashboard

GA4 → Reports → Custom → Funnel:

| Huni Adımı | Event | Beklenen Oran |
|-----------|-------|---------------|
| Ziyaretçi | `page_view` (/) | %100 |
| Hero → CTA | `cta_click` (hero) | %5-10 |
| Modal açık | `booking_modal_open` | %3-7 |
| Takvim adım | `booking_step_2` | %60-80 |
| Görüşme tamamlandı | `booking_completed` | %40-70 |
| **End-to-End** | Ziyaret → Booking | **%1-3** |

Haftalık hedef: Funnel conversion ≥ %1.5 (6 aylık hedef: %3)

---

## 10. Kaçınılacaklar (Anti-Patterns)

- ❌ **Peek problem:** Günlük sonuç kontrol edip erken karar verme
- ❌ **Multiple metrics:** Test başına tek birincil KPI. Diğerleri gözlem amaçlı
- ❌ **Küçük değişiklik + büyük beklenti:** MDE gerçekçi tut (%10-20 arası)
- ❌ **Mevsimsel çarpıklık:** Bayram, tatil dönemlerinde test başlatma
- ❌ **İmplementasyon farkı:** A/B testi harici değişken olmadığından emin ol
- ❌ **HiPPO (Highest Paid Person's Opinion):** Veriyi sezgiye üstün tut
