# prompts1/ — EcyPro Proje Geliştirme Talepleri

Bu klasör, EcyPro projesinin 10 ana geliştirme aşamasını yapılandırılmış formatta içerir.

## 📋 Talep Listesi

| Dosya | Konu | Durum | Faz |
|-------|------|-------|-----|
| `talep1.txt` | Erişilebilirlik (A11y) & WCAG 2.2 AAA | ✅ Tamamlandı | 24α-A |
| `talep2.txt` | Performans & Core Web Vitals | ✅ Tamamlandı | 26-27 |
| `talep3.txt` | E2E Test Stabilitesi (285/285) | ✅ Tamamlandı | 29 |
| `talep4.txt` | Premium Navigation & UI | ✅ Tamamlandı | 28 |
| `talep5.txt` | İçerik Derinliği (Case + Blog) | ✅ Tamamlandı | 28 |
| `talep6.txt` | Admin Panel & CRUD | ✅ Temellendi | 28-30 |
| `talep7.txt` | PWA Offline & SW Stratejisi | ✅ Tamamlandı | 28-29 |
| `talep8.txt` | SEO & JSON-LD | ✅ Tamamlandı | 20.5 + 24α-E |
| `talep9.txt` | Güvenlik Sertleştirme | ✅ Tamamlandı | 7 + 9 |
| `talep10.txt` | Production Deployment | ⚡ Hazır | 4 + 31 |

## 🎯 Kullanım

Her talep dosyası aşağıdaki bölümleri içerir:
1. **Hedef** — Ne yapılacak
2. **Tamamlanan Görevler** — Gerçekleştirilen işler
3. **Teknik Detaylar** — Kod örnekleri, kararlar
4. **Doğrulama Komutları** — Test etme yolları
5. **Sıradaki Adımlar** — Gelecek faz önerileri

## 🔄 Güncelleme Politikası

- **Yasak**: `prompts/` klasöründeki orijinal talepleri değiştirmek
- **Serbest**: `prompts1/` dosyalarını güncellemek (durum değişimi)
- **Serbest**: `prompts2/` klasöründe yeni prompt engineering dokümanları

## 🔗 İlişkili Dosyalar

- `brain/memory.md` — Proje kalıcı hafızası
- `brain/PUBLISH_MASTER_PLAN.md` — Yayın ana planı
- `prompts2/` — İleri düzey prompt engineering

## 📊 Proje Durumu (4 Mayıs 2026)

```
TypeCheck   : 0/0 ✅
Lint        : 0 ✅
Unit Test   : 29/29 ✅
Build       : 41 sitemap URL ✅
E2E         : 285/285 (3 browser) ✅
Lighthouse  : BP 100, A11y 100, SEO 100 ✅
Deployment  : Vercel + Render hazır
```
