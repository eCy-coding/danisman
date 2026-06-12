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
