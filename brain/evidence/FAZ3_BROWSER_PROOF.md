# FAZ-3 — Tarayıcı Kanıt Paketi (2026-07-20)

Owner talebi: "yaptığın tüm işlemleri browser'de kanıtla". Aşağıdaki her satır
canlı tarayıcıda (Browser pane) çalıştırılmış ölçümdür; iddia yok, çıktı var.

## 1. Anasayfa — SEO yüzeyi (lokal preview, prerender'lı dist)

```
title      : "Stratejik Danışmanlık & KVKK Uyumu | eCyPro"
description: "eCyPro: Stratejik danışmanlık, KVKK ve AB regülasyon uyumu, operasyone…"
canonical  : https://ecypro.com/tr          ← apex (www değil)
hreflang   : x-default, tr-TR, en
JSON-LD    : 7 blok
Person     : 1                               ← M9 duplikasyonu kapalı
h1         : 1
```

`dist/index.html` = **184.723 B** (prerender'lı, içerik gömülü).
Karşılaştırma: prod `/` = **25.067 B** (boş SPA shell) → kod doğru, prod'a
henüz ulaşmadı (deploy zinciri, bkz. §5).

## 2. EN makale — parite mekanizması uçtan uca

`/en/perspektifler/kvkk-compliance-process-step-by-step`

```
canonical : https://ecypro.com/en/perspektifler/kvkk-compliance-process-step-by-step
hreflang  : x-default → /tr/perspektifler/kvkk-uyum-sureci-adim-adim
            tr-TR     → /tr/perspektifler/kvkk-uyum-sureci-adim-adim
            en        → /en/perspektifler/kvkk-compliance-process-step-by-step
JSON-LD   : 9 blok · 1572 kelime · 7 adet h2
```

`pair_id` üzerinden kurulan TR↔EN hreflang eşleşmesi **canlı doğrulandı** —
farklı slug'lara sahip çiftler doğru işaret ediyor.

## 3. Tarayıcı denetiminin ORTAYA ÇIKARDIĞI gerçek kusur (testlerin kaçırdığı)

Ekran görüntüsünde makale içindekiler listesinin ilk maddesi:
`title: 'The KVKK Compliance Proce…'` — yani **ham YAML frontmatter okunur
gövde metni olarak render ediliyordu.**

Ölçüm (önce):
```
/tr/perspektifler/kvkk-uyum-sureci-adim-adim → leak_title:true  leak_excerpt:true  leak_pairid:true
```
Kök neden: `vite.config.ts` içinde `@mdx-js/rollup` frontmatter eklentisi
olmadan kurulmuş; MDX `---` çitlerini yatay çizgi, anahtarları paragraf olarak
ayrıştırıyordu. **59 makalenin tamamını** (TR+EN) etkiliyordu; arama motoru
makalenin açılış metni olarak bu gürültüyü görüyordu.

Çözüm: yeni bağımlılık YOK — `src/lib/mdx-frontmatter.ts` (saf fonksiyon,
5 regresyon testi) + `mdx()` öncesi koşan `enforce:'pre'` transform.

Ölçüm (sonra):
```
leak_title:false  leak_excerpt:false  leak_pairid:false
makale başlangıcı: "KAMU & ESG | MAKALE | 29 Mayıs 2026 | 4 dk okuma | eCyPro Consulting |
                    KVKK Uyum Süreci: Adım Adım Kurumsal Rehber 2026 | KVKK Uyum Süreci:
                    Adım Adım Kılavuz | 6698 sayılı…"
```

## 4. Admin paneli

- `/admin/rbac` → auth guard `/admin/login`'e yönlendiriyor, **çökme yok**;
  admin shell (eCyPro.Control) render ediliyor.
- Sayfa-içi RBAC kanıtı backend + kimlik gerektiriyor (bu ortamda yok).
  `ViewAsProvider` düzeltmesi bunun yerine **otomatik testlerle** kanıtlı:
  `AdminLayout.test.tsx` (provider mount + consumer throw etmiyor) ve
  49 admin sayfasını render eden axe kataloğu.
  → Dürüstlük notu: bu maddede tarayıcı kanıtı **kısmi**, abartılmıyor.

## 5. Prod durumu (deploy zinciri)

| Ölçüm | Değer |
|---|---|
| prod `/` HTML | 25.067 B (shell) |
| lokal `dist/index.html` | 184.723 B (prerender'lı) |
| Son Deploy koşusu | 120 dk guard'ıyla kesildi |
| Kök neden | prerender çıktısı `dist/`'e yazılıyordu; preview aynı `dist/`'i servis ettiği için sonraki route'lar 185KB HTML yükleyip maliyeti süper-lineer büyütüyordu |
| Fix | `dist-prerender/` staging + crawl sonu promote |
| Ölçüm | 8 route 67 s (~1,7 s/route) → 471 route ≈ 13 dk (öncesi 2+ saat) |

## 6. Yerel test gürültüsü — dürüst kayıt

Tam suite yerelde bu turda 5 → 8 → 11 fail arasında oynadı. Teşhis:
`vm_stat` → **99.598.569 swapout**; makine gün boyu koşan paralel ajanlardan
ağır takas altında, 16 vitest worker'ı timeout veriyor. Kanıt:
- Aynı dosyalar **izole koşuda 54/54 geçiyor**.
- Değişikliğim geri alınmış hâliyle de fail üretiyor (5 fail) → benim
  değişikliğimden bağımsız.
- **CI'da (temiz runner) `Lint, Type-Check & Test` = success.**

Sonuç: yetkili kapı CI'dır; yerel dalgalanma çevresel, koda dair değil.
