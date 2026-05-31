# Admin Panel Kullanım Kılavuzu — eCyPro Premium Consulting

> Bu rehber teknik bilgisi olmayan operatörler için yazılmıştır. Her bölümün başında "ne işe yarar" özeti, ardından adım-adım kullanım vardır.

## Giriş

Admin paneli `https://www.ecypro.com/admin` adresinden erişilir. Erişim için yetkili e-posta + şifre + 2FA kodu gerekir.

### İlk giriş

1. Tarayıcınızda `/admin` adresini açın → otomatik olarak `/admin/login` sayfasına yönlendirilirsiniz.
2. E-posta ve şifrenizi girin.
3. 2FA aktif ise authenticator uygulamanızdan 6 haneli kodu girin.
4. Başarılı giriş → "Operatör Panosu" (`/admin/overview`).

### Yetki seviyeleri

- **ADMIN:** Her şeyi yapabilir (kullanıcı yönetimi, ayarlar, güvenlik)
- **EDITOR:** İçerik düzenleyebilir, lead'lere not ekler — ayar değiştiremez
- **VIEWER:** Sadece görüntüler, mutasyon yapamaz

---

## 1. Operatör Panosu (`/admin/overview`)

**Ne işe yarar:** Son 30 günün hızlı özeti. Sabah açtığınız ilk sayfa.

**Sayfada gördükleriniz:**

- **6 KPI kartı:** Lead sayısı (30g), yeni abone (7g), hot lead, bu ay discovery call, conversion rate, ortalama lead skoru. Her kartın yanında bir önceki periyota göre delta (% yukarı/aşağı).
- **Lead Trendi grafiği:** Son 30 günün günlük lead sayısı.
- **Kaynak Dağılımı:** Organic / direct / referral / paid vb. pie chart.
- **Dönüşüm Hunisi:** Görüntüleme → Etkileşim → Form → Rezervasyon.
- **Son Aktivite:** Son 10 olay (yeni iletişim, yeni abone, yeni rezervasyon).
- **Hızlı Eylemler:** 6 buton — Lead listesi, yeni kampanya, yeni blog vb.
- **Sistem Sağlığı:** Backend / DB / queue durumu + hata oranı + uptime.

**Otomatik yenileme:** Her 60 saniyede bir.

---

## 2. Blog Yönetimi (`/admin/blog`)

**Ne işe yarar:** Blog yazılarını listelemek, yeni yazı eklemek, düzenlemek, silmek.

### Yeni yazı eklemek

1. `/admin/blog` → "Yeni Yazı" düğmesi
2. Slug (URL parçası) girin — küçük harf + tire. Örn: `kvkk-uyum-rehberi`.
3. Yazı oluşturulur → otomatik olarak edit sayfasına yönlendirilir (`/admin/blog/<slug>/edit`).
4. Sağdaki panelden:
   - **Durum:** Taslak (yayında değil) / Zamanlanmış (ileri tarihli) / Yayında.
   - **Kategori, Etiketler, Kapak Görseli, Okuma Süresi.**
5. Soldaki panelden başlık, özet, içerik (Markdown).
6. "Kaydet" düğmesine basın. Taslak'taysanız otomatik 1 dakikada bir kaydedilir.

### Markdown ipuçları

- `# Başlık` → büyük başlık
- `**kalın**` → **kalın**
- `[link metni](https://...)` → link
- `![görsel açıklaması](url)` → görsel
- `> alıntı` → blockquote
- Liste için `- madde` veya `1. madde`

### Yazı silmek

Edit sayfasında "Sil" düğmesi → onay dialog'u → "Evet, sil". Bu işlem **geri alınamaz**.

---

## 3. Hizmet Yönetimi (`/admin/services` → `/admin/services/<slug>/edit`)

**Ne işe yarar:** 21 hizmetin metnini override etmek (build-time data file'a dokunmadan).

### Bir hizmeti düzenlemek

1. `/admin/services` → 21 hizmet listesinden seçin.
2. "Düzenle" → 3 sekme açılır:
   - **Hero:** Başlık, alt başlık, value proposition
   - **İçerik:** Pain points, outcomes, anonim case study
   - **Ticari:** Yatırım aralığı, timeline
3. "Kaydet" → değişiklik 30 saniye içinde site'ta yansır.

**Not:** Bu override'lar build-time data file'ı bypass eder; orijinal değere dönmek için alanı temizleyip kaydedin.

---

## 4. Statik Sayfalar (`/admin/pages`)

**Ne işe yarar:** Anasayfa, Hakkımızda, FAQ, vb. 17 statik sayfanın içeriğini düzenlemek.

Her sayfa için "Düzenle" linkiyle block-based editöre erişirsiniz. (Şu an sandbox stub — block editor P57.10+ rollout.)

---

## 5. Koleksiyonlar (`/admin/collections/<type>`)

**Ne işe yarar:** Tek arayüzden 7 koleksiyonu yönetmek:

- `testimonials` — Müşteri sözleri
- `team` — Ekip üyeleri
- `case-studies` — Vaka analizleri
- `pillars` — Pillar sayfaları
- `industry-reports` — Sektör raporları
- `annual-reports` — Yıllık raporlar
- `faq-items` — SSS maddeleri

### Yeni öğe ekleme

1. İlgili koleksiyona gidin (`/admin/collections/testimonials`)
2. "Yeni Ekle" düğmesi → sağdan drawer açılır
3. Field'ları doldurun → "Kaydet"
4. Liste güncellenir

### Düzenleme / silme

Tablo satırından "Düzenle" / "Sil". Silme onay dialog'u sorar.

---

## 6. Lead Yönetimi (`/admin/contacts`, `/admin/leads/<id>`)

**Ne işe yarar:** Web'den gelen iletişim formlarını yönetmek.

### Liste sayfası

- DataTable: ad, e-posta, şirket, hizmet ilgisi, tarih, okundu/yeni durumu
- Filtreler: durum, kaynak, tarih aralığı
- Bulk action: okundu işaretle, durumu değiştir

### Detay sayfası

- İletişim bilgileri (clickable mailto/tel)
- Mesaj (TR/EN)
- **Notlar:** Bu lead için admin'e özel notlar (müşteri görmez). Tarih + yazar eklenir.
- **Durum değiştir:** "Okundu işaretle" / "Okunmadı işaretle"
- **Score & etkileşim:** Sağda mini stat kartları (P57.10+ scoring genişletme)

---

## 7. Bülten ve Kampanyalar

### Abone listesi (`/admin/newsletter`)

Tüm aktif aboneleri görüntüleyin. Filtre: kaynak, tarih, abonelik durumu.

### Yeni kampanya (`/admin/newsletter/campaigns/new`)

4 adımlı sihirbaz:

1. **Audience:** Kaynak filtresi + sadece çift-onaylı (KVKK) checkbox
2. **İçerik:** Konu + şablon + gövde (Markdown veya HTML)
3. **Önizleme:** E-posta görünümü
4. **Gönder:** Test gönder (kendinize) → onaylarsanız "Taslak Olarak Kaydet"

**Önemli:** "Kaydet" sadece taslak oluşturur. Gerçek gönderim için Kampanyalar listesinden "Gönder" düğmesini kullanın → onay dialog'unda alıcı sayısı görüntülenir.

### Test gönderim

Sihirbaz adım 4'te kendi e-postanıza test atın — gönderim öncesinde son kontrol.

---

## 8. Medya Kütüphanesi (`/admin/media`)

**Ne işe yarar:** Sitede kullanılan görselleri (logo, blog kapakları, takım fotoğrafları) tek noktadan yönetmek.

### Yükleme

- "Yükle" düğmesi VEYA dosyayı sürükle-bırak alanına sürükleyin
- Desteklenen format: JPG, PNG, WebP, AVIF (max 10MB)
- Otomatik thumbnail + AVIF/WebP varyant oluşturulur

### Silme

Görsel kartında "Sil" → onay → kalıcı silme.

---

## 9. Ayarlar (`/admin/settings/tabs`)

7 sekmede tüm site genelinde ayarlar:

1. **Site:** Telefon, e-posta, adres, sosyal medya linkleri, çalışma saatleri
2. **Marka:** Logo URL, primary/secondary/accent renkleri, font ailesi
3. **Entegrasyonlar:** Sentry DSN, GA4 ID, GSC token, Resend API, Telegram bot, Calendly URL
4. **SEO:** Varsayılan title, description, OG image
5. **Yasal:** KVKK, Gizlilik, Kullanım Şartları, Cookie politikası metinleri
6. **Cookie:** Banner başlık, mesaj, buton etiketleri
7. **E-posta:** SMTP ayarları + imza şablonu

Tüm değişiklikler "Kaydet" düğmesiyle uygulanır. Canlıya yansıma süresi: ~30 saniye.

**Not:** Entegrasyon API key'leri buraya yazılsa bile production'da Vercel/Render environment variable'ları öncelikli — burada görüntü amaçlı.

---

## 10. Güvenlik (`/admin/security`)

3 sekme:

1. **API Anahtarları:** Aktif anahtarların listesi + revoke (iptal). Yeni anahtar oluşturmak için `POST /api/auth/api-keys` (CLI / Postman).
2. **IP Beyaz Listesi:** Admin paneline yalnızca bu IP'lerden erişim. Boş bırakılırsa kısıtlama yok. Örnek: `185.45.12.0/24` (CIDR notasyonu desteklenir).
3. **Giriş Geçmişi:** Son 50 admin login eventi (kim, IP, user agent, zaman).

---

## 11. Profil (`/admin/profile`)

Kendi hesap ayarlarınız:

- **Şifre:** En az 12 karakter — harf + rakam + sembol. Mevcut şifre + yeni şifre + tekrar.
- **2FA:** Authenticator uygulamasıyla QR kodu tarayın → 6 haneli kodu doğrulayın. Her girişte kod istenir.
- **Bildirimler:** Yeni lead için e-posta uyarısı, haftalık kampanya özeti, web push.
- **Tema:** Koyu / Açık (beta).

---

## 12. Yardım (`/admin/help`)

- Sık sorulan 10 soru (kategori bazlı arama)
- Klavye kısayolları
- Destek e-posta: `operations@ecypro.com` (1 iş günü yanıt)

---

## Klavye Kısayolları

| Tuş       | İşlev                        |
| --------- | ---------------------------- |
| `?`       | Kısayolları göster           |
| `G` + `D` | Dashboard                    |
| `G` + `L` | Lead yönetimi                |
| `G` + `B` | Blog                         |
| `G` + `C` | Kampanyalar                  |
| `G` + `S` | Ayarlar                      |
| `/`       | Genel arama (CommandPalette) |
| `ESC`     | Modal'ı kapat                |

---

## Sık Karşılaşılan Sorunlar

### "401 Unauthorized" hatası

Oturum süresi dolmuştur → sayfayı yenileyin → otomatik login sayfasına yönlendirilirsiniz.

### "Forbidden" hatası

Yetkiniz yetmiyor → ADMIN rolü gerekiyorsa kullanıcı yöneticisine başvurun.

### Değişiklik canlıya yansımıyor

1. 30 saniye bekleyin (cache).
2. Tarayıcı cache'ini temizleyin (Cmd+Shift+R / Ctrl+Shift+R).
3. Sorun devam ederse `operations@ecypro.com`.

### "Test gönderim" e-posta gelmedi

1. Spam klasörüne bakın.
2. SMTP env vars (Ayarlar → E-posta) doğru mu?
3. Resend dashboard log'una bakın.

### Yanlışlıkla bir kayıt sildim

**Maalesef geri alınamaz.** Silme öncesi onay dialog'u açık sebepledir. Eğer kritik bir kayıt silindiyse `operations@ecypro.com`'a yazın — DB yedeğinden geri alma denenebilir.

---

## Destek

- **E-posta:** operations@ecypro.com
- **Yanıt süresi:** 1 iş günü
- **Acil durumlar:** +90 541 714 30 00 (sadece kritik production hataları)

---

_Bu kılavuz P57 sandbox release'i ile birlikte güncellenir. Son revizyon: 2026-05-18._
