# Research Bridge — E2E Evidence (2026-06-12, local)

Komut çıktılarıyla doğrulanmış uçtan uca kanıt. Ortam: dev API (:3001) + dev
Postgres (docker `ecypro_dev`) + fixture/real bridge.

## 1. Server route suite — 19/19 PASS
`npx vitest run --config vitest.server.config.ts server/routes/admin-research.test.ts`
→ `Test Files 1 passed (1) · Tests 19 passed (19)`.
Kapsam: RBAC iki düzlem (JWT admin vs ApiKey bridge), payload 400/401/403,
atomik claim (yarış → tek kazanan), stage PATCH, DONE→BlogPost(DRAFT)
materyalizasyonu, P2002 slug çakışma retry, terminal-state 409, Türkçe slug fold.

## 2. Canlı API pipeline (curl, gerçek :3001 + Postgres)
- `POST /api/v1/admin/research/jobs` (JWT admin) → **201**, `status:QUEUED`.
- `POST /bridge/claim` (ApiKey scope research:bridge) → **200**, `QUEUED→CLAIMED`.
- `PATCH /bridge/jobs/:id status=DRAFTING` → **200**.
- `PATCH /bridge/jobs/:id status=DONE + draft` → **200**, sunucu BlogPost(DRAFT)
  yarattı, `postId` linklendi.
- Doğrulama (`GET /admin/insights/posts/:postId`): `status:DRAFT`,
  `slug:ecypro-arastirma-koprusu-uctan-uca-dogrulama`, `## Kaynaklar` bölümü TRUE,
  BDDK linki TRUE, `authorId` = founder author.
- `GET /admin/research/jobs`: `total:1, bridgeAlive:true`, job `DONE → postId`.
- Anonim `GET /admin/research/jobs` → **401**; bridge claim JWT'siz → **401**.

## 3. Canlı bridge.mjs + fixture MCP (tüm gotcha'lar)
`NLM_MCP_CMD="node scripts/nlm-bridge/__fixtures__/fake-mcp.mjs" BRIDGE_ONCE=1 npm run nlm:bridge`
→ log: `notebooklm-mcp v0.0.0-fixture auth=configured` → `claimed job …` →
`job … DONE → draft "Fixture Araştırma Raporu"`.
Doğrulanan gotcha'lar (fixture bunları kasten üretir, bridge doğru işledi):
- **research task_id drift**: `research_start` → `start-task-AAA`,
  `research_status` → `status-task-BBB`; import status'unkini kullandı.
- **import false-negative**: `research_import` `isError:"API error (code 9)"`
  döndü; bridge **verify-after-mutation** ile `notebook_get` sayımından
  (`sourceCount:9`) başarıyı doğruladı, retry yapmadı.
- **junk filtresi**: "Request Rejected" kaynağı draft'tan elendi; linksiz kaynak
  (TÜİK) korundu — teslim edilen draft'ta doğrulandı (`Request Rejected` YOK,
  `TÜİK verisi` VAR, `## Kaynaklar` VAR).

## 4. Playwright auth-guard spec — PASS
`npx playwright test e2e/research-pipeline.spec.ts` → `1 passed (auth-guard
redirect) · 1 skipped (authed, PREVIEW_AUTH_COOKIE gerektirir)`.

## 5. UI canlı render (doğrulandı, ekran metni)
İlk başarılı harness koşusunda (`/admin/research`, gerçek JWT) sayfa metni
şunları içeriyordu (regex doğrulamalı): **NotebookLM Araştırma** başlığı,
**Araştırmayı başlat** formu (Dil/Ana alan select'leri), 2 **Tamamlandı** job
satırı (sourceCount 9/7, fast·tr), **Editörde aç** butonları, **Köprü
çevrimdışı** rozeti, sol menüde **NotebookLM Araştırma** nav öğesi.

NOT: Tekrarlı ekran görüntüsü `npm run preview`'in build-zamanı sabit
VITE_API_URL ile stale dist serve etmesi yüzünden flaky oldu (serve-zamanı env
override etkisiz) — bu harness kısıtı feature'la ilgisiz; üretim build'i doğru
VITE_API_URL ile derlenir. Fonksiyonel kanıt §1-4 ile tam.

## 6. Canlı Chrome demosu — GERÇEK NotebookLM, kullanıcı izlerken (2026-06-12)

Akış: kullanıcı `/admin/research`'te kendi konusuyla ("Türkiye'deki aile
şirketleri, kuşak çatışmaları", mode=deep) **Araştırmayı başlat**'a bizzat
tıkladı → köprü gerçek NotebookLM'i sürdü → 38 sn'de DONE → draft admin
editöründe açıldı → başlık canlı düzenlenip kaydedildi → DB doğrulandı.
Kareler: `live-demo-3-research-done-bridge-online.png`,
`live-demo-4-editor-saved-title.png`.

Canlıda yakalanan ve AYNI oturumda kök nedenden düzeltilen 5 kusur:

1. **Yanlış MCP binary** — venv'deki `notebooklm-mcp` farklı paket (FastMCP,
   `server` subcommand ister); doğrusu `~/.local/bin/notebooklm-mcp`
   (pipx, argsız stdio). `NLM_MCP_CMD` ile düzeltildi.
2. **Google code 8 (deep reddi)** — `research_start mode=deep` quota hatası;
   bridge'e **deep→fast otomatik fallback** eklendi (`bridge.mjs`), canlıda
   tetiklenip log'a düştü: `deep → fast fallback (code 8)`.
3. **429 fırtınası** — tier limiter `x-api-key` HEADER'ına bakıyor;
   yalnız `Authorization: Bearer` gönderen bridge "anonymous" (60/15dk)
   sayılıyordu. Bridge artık aynı key'i iki header'da yolluyor. Ayrıca UI'nin
   5 sn poll'u tek başına generalLimiter'ı (100/15dk) aşıyor — dev'de
   `RATE_LIMIT_MAX` env'i; prod değerlendirmesi PR notunda.
4. **Editör PATCH 400** — GET hydration null kolonları form'a kopyalıyor,
   `optionalKeys` strip listesi 5 alanı (slugEn, seriesOrder, videoEmbedUrl,
   canonicalUrl, featureOrder) kaçırıyordu → her kayıtlı post düzenlemesi
   400'dü. XHR hook ile yanıt gövdesi yakalandı, liste + PostDetail tipi
   tamamlandı → PATCH 200 + DB'de yeni başlık (`updatedAt 11:28:40Z`).
5. **Sahte "Köprü çevrimdışı" rozeti** — `bridgeAlive` yalnız job satırı
   dokunuşuna bakıyordu; boş kuyrukta köprü 15 sn'de bir 204 alırken rozet
   2 dk sonra söndü. Claim endpoint'i artık `app.locals` heartbeat yazıyor
   (test izolasyonu için modül değişkeni değil); idle'da rozet yeşil.
   Yeni test: `bridgeAlive=true after an idle claim poll` → suite **20/20**.

Single-writer doğrulaması: köprü DONE sonrası posta bir daha dokunmadı;
admin düzenlemesi tek yazar olarak DB'ye işlendi.

## 7. Kusursuzluk Koşusu — başlangıç→YAYIN tam zincir (2026-06-12, v3)

Talep: "tüm adımların kusursuz olduğunu ispatla; yeteri kadar kaynakta yeteri
kadar bilgi". Önceki koşunun iki eksiği kapatıldı: (a) rapor-garantisi
(fast modda boş gelen rapor → Studio sentez fallback), (b) bitiş artık
DRAFT değil **PUBLISHED + anonim public API servis**.

### Zincir (job `cmqaw…v3`, tek koşu, saatler UTC)
12:45:38 claim (deep) → 12:45:39 deep→fast fallback (code 8, 3/3 tutarlı)
→ grace re-poll ("Kaynaklar toplandı — rapor metni bekleniyor") → IMPORTING
(10 kaynak; notebook toplam 50) → DRAFTING ("Studio report sentezleniyor"
→ onTick: "(in_progress, 0 dk)") → 12:47:27 **DONE — 1 dk 49 sn**.
Draft: `len(bodyTrMdx)=8160`, şablon-string YOK (`has_template=f`),
reportTitle = "Aile İşletmelerinde Dönüşüm, Yapay Zekâ ve Gelecek
Stratejileri: Brifing Belgesi" (NLM'in kendi sentez başlığı), `## Kaynaklar`
listesi VAR. Editörde başlık düzenlendi → "Taslak Kaydet" → PATCH **200** +
"Kaydedildi" + DB `updatedAt 12:51:46`. Yayın zinciri UI'dan:
IN_REVIEW → COPY_EDIT → SEO_REVIEW → SCHEDULED → **PUBLISHED** (her adım
"Durum güncellendi"; publishedAt 12:54:44 otomatik). Public kanıt çifti:
yayın ÖNCESİ anonim `GET /api/v1/insights/posts/<slug>` → **404**; yayın
SONRASI → **200** (status PUBLISHED, author Emre Can Yalçın, Kaynaklar
TRUE); liste ucu `GET /insights/posts` count:1 ilk slug bizimki.
Kareler: `proof-run-1..10*.png`.

### Bu koşuda yakalanan + kapatılan kusurlar (kök neden)
1. **studio_create sessiz error** — MCP wrapper hata payload'ını throw
   etmeden döndürür; helper `status` kontrol etmiyordu → kota penceresinde
   sessiz boş poll + şablon draft. Fix: yanıt doğrulama + 30 sn retry +
   tam-metin log (`bridge.mjs`). Hata artık log'da okunur:
   "studio_create attempt 1 rejected: …auth is not valid (reason: expired)".
2. **MCP binary/auth nesil uyuşmazlığı** — `~/.local/bin/notebooklm-mcp`
   0.6.15'e işaret ediyordu; auth deposu eski formatta → `auth=stale`,
   studio reddi. Fix: `uv tool upgrade notebooklm-mcp-cli` (0.7.2,
   `auth=configured`) + köprüye boot'ta otomatik `refresh_auth` + işletim
   notu: `nlm login --force` cookie tazeler (44 cookie + CSRF).
3. **Studio poll kör pencereleri** — 6 dk bütçe kısa (factory 20 dk poll
   eder) + poll sırasında job satırı dokunulmuyor → rozet 120 sn sonra
   yanlış "çevrimdışı". Fix: 12 dk bütçe + **onTick** her turda stage
   yeniler (UI canlı ilerleme + updatedAt heartbeat). v3'te ekranda aktı.
4. **id-hedefli artifact poll** — paylaşılan notebook'ta önceden kalan
   report artifact'larıyla karışmayı önlemek için poll yalnız
   `created.artifact_id`'yi izler.
5. **Chat widget popup'ı kaydet butonunu örtüyor** (Tier-3 UX/a11y,
   kod-dışı bulgu): "Welcome Back" popup'ı "Taslak Kaydet"in üstüne
   açılıyor, tıklamaları yutuyor; erişilebilirlik ağacında kapatma butonu
   YOK. Demo'da butonun açık kalan soluna koordinatla tıklanarak aşıldı;
   ayrı iş olarak işaretlendi.

### Fixture kanıtı (regression)
`FAKE_EMPTY_REPORT=1 RESEARCH_GRACE_MS=200 BRIDGE_ONCE=1` + fake-mcp:
research_status raporsuz biter → grace → studio_create/studio_status/
download_artifact (fixture gerçek dosya yazar) → draft gövdesi "Fixture
Studio Raporu" (`has_template=f, has_studio=t`). İki kez koşuldu (helper v1
+ yanıt-doğrulamalı v2), ikisi de PASS.

## 8. Zengin Yayın Hattı — global-standart draft → public sitede render (2026-06-12)

Talep: araştırma çıktısı "global standartlarda post" olarak editörde otomatik
oluşsun; onay sonrası web sayfasının ilgili bölümünde kusursuz görünsün.
Beş fazla kapatıldı (P1-P5), canlı koşuyla kanıtlandı (P6, kareler
`rich-run-1..5*.png`):

**Otomasyon standardı (bridge buildDraft v2 + server eşleme):** italik
dek/standfirst → `## Önemli Çıkarımlar` (3-5 madde, rapordan türetilir) →
raporun kendi bölüm hiyerarşisi (H1'ler demote) → `## Metodoloji`
(kaynak sayısı, mod, tarih, insan-onayı şeffaflığı) → `## Kaynaklar`.
SEO: `metaTitleTr` ≤60 kelime-sınırı clamp (canlıda 49/60), `metaDescTr`
160/160; kapak: 4 domain × 2 deterministik webp (programatik SVG→sharp,
8-13KB; `scripts/generate-insight-covers.mjs` ile yeniden üretilebilir) +
`ogImageUrl` ayna + ≤125 kr alt; `categoryId` domain-lookup (null-safe).

**Canlı koşu:** "Aile şirketlerinde yapay zekâ destekli kurumsallaşma…"
(deep→fast fallback yine code 8; studio sentez onTick'le aktı) → DONE →
draft `len=9873`, dek+çıkarımlar+metodoloji+kaynaklar ✓, kapak
`/insights-covers/aile-sirketi-1.webp` ✓ → editör SEO sekmesi OTOMASYONLA
dolu (kare rich-run-2) → onay zinciri UI'dan PUBLISHED → **public**:
`/perspektifler` hub kartı (İnsan & Organizasyon · Rapor · 6 dk · nesil-ağacı
kapağı; kare rich-run-3) + `/perspektifler/<slug>` detay sayfası
react-markdown ile render (hero + çıkarımlar + blockquote; kareler
rich-run-4/5); anonim detay API 200; liste ucu select-daraltılmış
(`hasBody:false`, 10 alan).

**Gate'ler:** server suite 23/23 · web unit 24/24 (published-post 2 +
perspektifler 13 dahil) · typecheck web+server temiz · fixture A/B PASS.

**Koşuda yakalanan + düzeltilen:** (a) form_input login parolasını React
state'ine geçirmedi → 401; gerçek klavye olaylarıyla çözüldü (UI otomasyon
notu); (b) 5 sn'lik poll re-render'ı click-type arasında focus düşürdü →
form akışları tek atomik batch + koordinatla; (c) API süreci P5'ten önce
başladığından select-daraltma yüklü değildi → restart sonrası doğrulandı
(tsx watch'sız dev API'de kod değişimi = restart şart, işletim notu).

## 9. Kalibrasyon Turu — sahibin hesabıyla kullanıcı-sürüşlü canlı test (2026-06-12)

Kurulum: `emrecnyn@gmail.com` dev DB'de ADMIN (kimlik notu repo-dışı
`~/.ecypro-tokens.env`); yığın **:3002**'ye taşındı çünkü :3001'i BAŞKA
worktree'nin API'si tutuyordu (`lsof` cwd kanıtı — önceki 401'lerin gerçek
kaynağı; yeni infra-gotcha README'de).

### Ön-sıkılaştırma (K1-K5, kullanıcı sürüşünden önce)
- Director pazarlama toast'ları `/admin`'de bastırıldı (kök: kendi
  personalization sistemimiz; popup "Taslak Kaydet"i örtüyordu) + 2 test.
- Bridge `sanitizeInline`: takeaway/dek'ten `> **` kalıntısı, `| tablo |`
  satırları, "…şunlardır: 1." yarım cümleleri temizlenir — kirli-markdown
  fixture'ıyla DB-assert PASS.
- Research poll 5s→15s (tek sekme, env'siz limiter bütçesine sığar).
- Toplu gate: typecheck'ler ✓, server 883 (1 paralellik-flake izole PASS),
  web 327 ✓.

### Kullanıcı-sürüşlü koşu + İKİ kök-neden daha
Kullanıcı kendi görevini verdi: "türkiyede 2015-2025 yılları arasında
enflasyon" (deep). Job DONE — ama draft "Aile İşletmelerinde Yapay Zekâ…"
çıktı: **KONU SAPMASI** (paylaşılan tek notebook'ta önceki 60 kaynak;
Studio fallback TÜM notebook'u sentezler, report custom_prompt yoksayar).
Aynı pencerede köprü claim'leri **429** yemeye başladı (per-IP genel
limiter, localhost'ta tarayıcıyla aynı kova — çifte sayım).

Kök fix'ler:
1. **Notebook izolasyonu**: her job kendi notebook'u
   (`eCyPro Content Studio — <konu40> [<id6>]`); `NLM_NOTEBOOK_ID` ile
   sabitleme korunur. Kanıt: yeni koşuda `created isolated notebook …
   [6mwkj2]`, sourceCount 10 (70 değil), draft teması ENFLASYON.
2. **Limiter çifte-sayım**: `isResearchBridge` muafiyeti (dar: bridge path
   + x-api-key varlığı; auth apiKeyAuth'ta, tier 600/15dk bütçesi devrede —
   Calendly webhook emsali) + health-probe suite 21/21.
3. **Bridge 429 backoff**: claim 429 `retryAfter`'ına uyur.

### Profesyonel danışman yayını
Drift'li eski draft **ARCHIVED** (yayın kirliliği temizliği). Doğru-konu
draft'a danışman rötuşu: başlık "Türkiye'de Enflasyonun On Yılı
(2015-2025): Endüstriyel Kapasite, Kur Politikaları ve Ekonomik Direnç"
(+uyumlu metaTitle). Onay zinciri UI'dan → **PUBLISHED 15:34** → anonim
API 200 (author Emre Can Yalçın) → hub'da FİNANS & EKONOMİ·RAPOR kartı
(amber trend kapağı) → detay sayfası render. Admin ekranlarının hiçbirinde
pazarlama popup'ı görünmedi (K1 canlı kanıt). 429 sayısı: 0.
Kareler: `calib-run-1..4*.png`.
