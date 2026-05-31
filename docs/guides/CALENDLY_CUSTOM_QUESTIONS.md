# Calendly Custom Questions — eCyPro Premium Consulting

> **Bağlam:** Pzt 2026-05-25 09:00 (TRT) launch — Wave-1 VIP outreach Calendly randevu formu.
> **Amaç:** Qualified meeting filtresi + bağımsızlık çatışması (independence conflict) pre-screen + KVKK katmanlı aydınlatma.
> **Kaynak konsensüs:** NotebookLM "Wave-1 Discovery Call Design" (3 zorunlu soru + 1 onay checkbox).
> **Calendly Event Type:** `eCyPro Discovery Call — 30 min`
> **URL slug önerisi:** `ecypro/discovery-vip`

---

## 1. Genel İlke

- **Tüm sorular zorunlu (`required: true`).** Boş bırakılması randevu oluşturmayı engellemeli.
- **Cevaplar Resend / Notion CRM webhook'una otomatik akmalı** (`Calendly → Zapier/Make → Notion DB`).
- **Asansör konusu yasak:** ücret bandı, danışmanlık fiyatı, NDA detayı sorularda yer almaz — bu konular discovery call içinde ele alınır.
- **Dil:** Türkçe; formal **Siz** dili. Yanıt opsiyonları kısa, kategorik.

---

## 2. Zorunlu Sorular

### Soru 1 — Ciro Bandı (Kalifikasyon Filtresi)

| Özellik            | Değer                                                                        |
| ------------------ | ---------------------------------------------------------------------------- |
| **Calendly tip**   | Multiple Choice (single select)                                              |
| **Required**       | Yes                                                                          |
| **Soru metni**     | Şirketinizin 2025 konsolide cirosu hangi bandda?                             |
| **Yardımcı metin** | Bu bilgi engagement scope ve ekip ölçeklendirmesi için kullanılır.           |
| **Seçenekler**     | `$20M-$50M` · `$50M-$150M` · `$150M+` · `$20M altı (uygun değil)`            |
| **Routing kuralı** | `$20M altı` seçilirse otomatik "qualified=false" tag'i + nazik decline mail. |

---

### Soru 2 — Stratejik Odak (Service Slug Eşleme)

| Özellik                   | Değer                                                                                                                                                                                           |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Calendly tip**          | Multiple Choice (single select)                                                                                                                                                                 |
| **Required**              | Yes                                                                                                                                                                                             |
| **Soru metni**            | Önümüzdeki 6 ayda en kritik odak noktanız hangisidir?                                                                                                                                           |
| **Yardımcı metin**        | Bu seçim discovery call gündemini şekillendirir.                                                                                                                                                |
| **Seçenekler**            | `M&A Danışmanlığı (alım/satım hazırlığı)` · `Nesil Geçişi & Kurumsallaşma` · `AB Regülatif Uyum (CSRD / CSDDD / CBAM)` · `IFRS Geçişi / Konsolidasyon` · `İç Denetim & Risk Yönetimi` · `Diğer` |
| **Service slug eşlemesi** | M&A → `ma-advisory` · Nesil → `succession-planning` · CSRD → `csrd-eu-compliance` · IFRS → `ifrs-conversion` · İç Denetim → `internal-audit` · Diğer → manuel triaj                             |

---

### Soru 3 — Bağımsız Denetim Firması (Independence Conflict Pre-Screen)

| Özellik            | Değer                                                                                                                                                                                                                                           |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Calendly tip**   | Multiple Choice (single select)                                                                                                                                                                                                                 |
| **Required**       | Yes                                                                                                                                                                                                                                             |
| **Soru metni**     | Şirketinizin mevcut bağımsız denetim firması hangisidir?                                                                                                                                                                                        |
| **Yardımcı metin** | **Big4 olup olmadığını bağımsızlık çatışması (independence conflict) analizi için soruyoruz.** Mevcut denetçinizin kim olduğu engagement kabul kararını etkileyebilir; bu standart bir mesleki yükümlülüktür (IESBA Code of Ethics, Bölüm 290). |
| **Seçenekler**     | `PwC` · `EY` · `Deloitte` · `KPMG` · `Big4 dışı yerli firma` · `Henüz bağımsız denetim yapılmıyor` · `Belirtmek istemiyorum`                                                                                                                    |
| **Routing kuralı** | Big4 seçilirse engagement kabul öncesi içsel independence check tetikler. `Belirtmek istemiyorum` qualified kalır; discovery call'da ele alınır.                                                                                                |

---

## 3. KVKK Katmanlı Aydınlatma — Onay Checkbox

### Spec

| Özellik                   | Değer                                                                                                                                                                                                                                                                                                                                                                                      |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Calendly tip**          | Single Checkbox (Yes/No), **default unchecked**                                                                                                                                                                                                                                                                                                                                            |
| **Required**              | Yes (onay alınmadan submit edilemez)                                                                                                                                                                                                                                                                                                                                                       |
| **Etiket metni**          | Verilerimin eCyPro Gizlilik Politikası uyarınca işlenmesini kabul ediyorum (KVKK m.10 + GDPR Art.13).                                                                                                                                                                                                                                                                                      |
| **Yardımcı metin (kısa)** | Bu randevu formundaki bilgileriniz; potansiyel iş görüşmesi yürütülmesi amacıyla, **KVKK m.5/2-f (meşru menfaat hukuki sebebi)** ile işlenir. Detaylı aydınlatma için [Gizlilik Politikası](https://www.ecypro.com/legal/kvkk) sayfasını okuyunuz. Verileriniz Big4 veya 3. kişilerle paylaşılmaz; AB/ABD transferi yapılmaz; iletişim talebiniz kalmazsa **kvkk@ecypro.com** ile silinir. |

### Katmanlı aydınlatma seviyeleri

1. **Layer 1 (form üstü kısa banner):**
   > "Bu form bilgileriniz iş geliştirme amacıyla işlenir. KVKK m.10 detay: [Gizlilik Politikası]"
2. **Layer 2 (yardımcı metin, yukarıda):** veri sorumlusu, hukuki sebep, paylaşım, transfer, saklama, silme hakkı.
3. **Layer 3 (link):** `/legal/kvkk` — tam aydınlatma metni; veri sorumlusu kimliği, irtibat, başvuru hakları (m.11), VERBİS kaydı.

---

## 4. Calendly Confirmation Email Add-on

Onay e-postasının altında **zorunlu** ek metin:

```
Randevu öncesi 3 hatırlatma:
1. Görüşme Türkçe / İngilizce yapılabilir; tercihinizi yanıtla iletmeniz yeterlidir.
2. NDA gerektiren detaylar görüşme öncesi paylaşılmamalıdır; ilk 30 dk genel kapsam tespitidir.
3. Randevuyu iptal/yeniden planlama için bu e-postadaki linki kullanınız.

Verilerinizin işlenmesi: KVKK m.5/2-f meşru menfaat — silme talebi için kvkk@ecypro.com
```

---

## 5. Webhook Payload Eşleşmesi (Notion CRM)

Calendly webhook event `invitee.created` payload alanları → Notion property eşleşmesi:

| Calendly alan                               | Notion property                      | Tip                        |
| ------------------------------------------- | ------------------------------------ | -------------------------- |
| `questions_and_answers[0].answer` (Ciro)    | `Tahmini_Butce_USD`                  | select                     |
| `questions_and_answers[1].answer` (Odak)    | `Service_Slug`                       | select (eşleme tablosu §2) |
| `questions_and_answers[2].answer` (Denetçi) | `Big4_Denetci`                       | select                     |
| `name`                                      | `Sirket` (parse) + `Notes` (raw)     | title + rich_text          |
| `email`                                     | `Contact_Email`                      | email                      |
| `event.start_time`                          | `Meeting_Booked_At`                  | date                       |
| `tracking.utm_source`                       | `Labels` (UTM tag)                   | multi_select               |
| Default                                     | `Outreach_Status` = "Meeting Booked" | status                     |

---

## 6. QA Checklist (launch öncesi)

- [ ] Tüm 3 soru zorunlu işaretli (Calendly UI'da kırmızı yıldız görünür)
- [ ] KVKK checkbox **default unchecked** — submit edilemiyor test edildi
- [ ] Yardımcı metin Türkçe imla + Siz dili
- [ ] Gizlilik Politikası link `https://www.ecypro.com/legal/kvkk` → 200 OK
- [ ] Confirmation e-posta footer 3 hatırlatma + KVKK satırı içeriyor
- [ ] Webhook test — Make/Zapier → Notion staging DB başarılı
- [ ] UTM parametre koruma test (utm_source, utm_campaign payload'a düşüyor)

---

**Sürüm:** v1.0 — 2026-05-21
**Sahip:** Emre C. Yalcin
**İmza onayı:** launch öncesi `/publish-check` gate
