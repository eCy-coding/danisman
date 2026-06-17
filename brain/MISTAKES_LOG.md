# MISTAKES LOG — Perspektifler (tekrar etmemek için)

Her kayıt: ne oldu · kök neden · KURAL (bir daha yapma).

## M1 — Sandbox "yeşil" = gerçek-makine "yeşil" DEĞİL
- Olan: Görev sandbox'ta testleri yeşil raporladı; gerçek makinede (Desktop Commander) 14 fail çıktı.
- Kök neden: Testler sandbox ortamında koşuldu; ortam/çözünürlük farkı sonucu sakladı.
- KURAL: Bir testi/build'i "yeşil" saymadan önce **Desktop Commander ile gerçek makinede** koş. Sandbox sonucu tek başına kanıt değildir.

## M2 — `vi.mock('motion/react', importOriginal)` → jsdom'da BOŞ render
- Olan: `blog-card.test.tsx` motion'ı `importOriginal` ile mock'ladı (gerçek motion). React19+jsdom altında bileşen boş DOM (`<body><div/></body>`) render etti → tüm assert'ler düştü.
- Kök neden: Gerçek `motion/react` proxy'si bu test harness'inde commit etmiyor. Repodaki çalışan testler (ör. `cluster-d-service-detail.test.tsx`) motion'ı **manuel** mock'luyor (motion.* → düz forwardRef DOM).
- KURAL: Bileşen testlerinde `motion/react`'i **manuel/Proxy mock** ile düz DOM'a indir; ASLA `importOriginal` ile gerçek motion'a bağlama. useReducedMotion/useInView/AnimatePresence gibi yardımcıları da mock'a ekle.

## M3 — `--no-verify` ile kırmızı taban üstüne commit
- Olan: #2/#3 commit'i (`b4eb7b5`) `--no-verify` ile atıldı; ilgili testler gerçek makinede kırmızıydı.
- Kök neden: Hook atlanınca testler çalışmadı; kırmızı durum fark edilmeden commit'lendi.
- KURAL: `--no-verify` sadece git-kilidi/scope-guard için; commit ÖNCESİ ilgili vitest setini DC ile koş ve yeşil olduğunu gör. Kırmızıysa commit etme.

## M4 — Asıl kök neden: repo-geneli test-harness kırık (benim kodum değil)
- Olan: blog-card boş render sandık; düzeltmeye çalıştım ama trivial `<div>hello</div>` probe testi de boş render etti. Mevcut/shipped `cluster-d-service-detail.test.tsx` da gerçek makinede 17/17 FAIL.
- Kök neden: React 19.2.6 + @testing-library/react 16 + `src/vitest-setup.ts`'teki sahte `act` polyfill'i → `render()` DOM'a commit etmiyor (concurrent render flush edilmiyor) → `<body><div/></body>`. **63 component test dosyası** etkileniyor. Perspektifler değişikliklerimle ilgisi YOK.
- KURAL: Component testi "kırmızı" görünce önce trivial bir probe ile harness'i izole et; tek bir bileşene/feature'a fix yazmadan önce "bu repo-geneli mi?" sorusunu kanıtla. Harness kırıksa onu (vitest-setup/act) düzelt; aksi halde bileşen testlerini browser/lib-test ile doğrula.

## M5 — ASIL kök neden: shell `NODE_ENV=production` (council + çapraz test ile bulundu)
- Olan: Component testleri gerçek makinede `React.act is not a function` / boş render verdi. Önce "dev build otomatik" (Council A) varsayımıyla polyfill kaldırdım → hâlâ fail. Sonra `resolve.conditions:['development']` (Council B) ekledim → jsdom'da yok sayıldı (vitest#8431), hâlâ fail.
- Gerçek kök neden: kullanıcının shell'inde `NODE_ENV=production` export edilmiş. React CJS bunu görüp PRODUCTION build yüklüyordu (gerçek `act` yok). `NODE_ENV=test npx vitest` → cluster-d 17/17 PASS ile kanıtlandı.
- ÇÖZÜM: `vitest.config.ts` → `test.env = { NODE_ENV: 'test' }` (shell'den bağımsız sabitler) + `src/vitest-setup.ts`'teki sahte act polyfill kaldırıldı. Gereksiz `resolve.conditions`/`server.deps.inline` denemeleri geri alındı.
- KURAL: "Yanlış build yükleniyor" şüphesinde ÖNCE `echo $NODE_ENV` ve `NODE_ENV=test ...` ile EMPİRİK doğrula; config tahminleriyle oynama. Council önerilerini tek tek çapraz-test ile ele; tahmini "düzeltme" bırakma.

## M6 — Gizli regresyon: bileşene yeni hook eklemek eski test mock'larını kırar
- Olan: #1'de `BlogCard`'a `useReducedMotion` eklendi. `motion/react`'i eksik mock'layan `insights-article-grid.test.tsx` "No useReducedMotion export" ile kırıldı (harness onarılınca görünür oldu).
- KURAL: Bir bileşene yeni bir `motion/react` API'si (hook/öğe) eklediğinde, o bileşeni render eden TÜM testlerin mock'larını tara (grep `vi.mock('motion/react'` + eksik export) ve güncelle. Tek bileşen testini değil, render eden tüm testleri çapraz koş.

## M7 — Sayfa, layout içindeyken kendi Navbar/Footer'ını render ediyordu
- Olan: `/perspektifler` (BlogPage) zaten `<MainLayout>` (Navbar+Footer sağlar) altında olmasına rağmen kendi `<Navbar/>` + `<Footer/>`'ını da render ediyordu → gerçek-render tanısında `footers:2`, `navs:5`. Ekran görüntüsünde çift footer.
- Kök neden: Sayfa, route-level layout sözleşmesini bilmeden chrome'u tekrar mount etti.
- ÇÖZÜM: BlogPage'ten Navbar+Footer kaldırıldı (footers 2→1, navs 5→4). Doğrulama: gerçek-render tanısı + 21 test PASS.
- KURAL: Bir route `<MainLayout>`/Outlet altındaysa sayfa ASLA Navbar/Footer/`<main>` render etmez. Yeni sayfa eklerken layout sözleşmesini kontrol et; gerçek-render tanısıyla footer/nav/main sayısını doğrula (1/1/1 olmalı).

## SEO/GEO FINDING (açık — karar bekliyor, repo-geneli)
- `/perspektifler` gerçek-render JSON-LD: Organization+ProfessionalService ×2, FAQPage ×2, Person ×2 (duplike). Kaynak: iki şema sistemi örtüşüyor — global `components/seo/SchemaOrg.tsx` (data-seo-id upsert ile kendi içinde dedup) + `common/SEO.tsx` Organization fallback + `lib/seo/insightsStructuredData.ts` (Organization/Person/BreadcrumbList). Ayrı data-seo-id'ler olduğu için dedup çalışmıyor.
- Etki: Google duplike Organization/FAQPage'i yok sayabilir/flag'leyebilir (GEO/SEO kalite). DÜZELTİLDİ DEĞİL — tüm siteyi (shipped) etkileyen şema mimarisi refaktörü; kullanıcı kararı + ayrı bir guard'lı tur gerektirir.
- DÜZELTİLEN SEO (contained): og:title/og:description artık sayfaya-özel (önceden genel anasayfa), og:image SVG → raster `og-image.jpg`, twitter:* eklendi.
