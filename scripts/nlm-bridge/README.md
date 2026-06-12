# eCyPro Research Bridge (P82)

NotebookLM → eCyPro admin draft pipeline'ının **lokal worker**'ı. NotebookLM'in
public API'si yoktur; kimlik doğrulama sahibin makinesindeki `nlm` CLI
token'larında yaşar. Bu yüzden köprü sunucuda DEĞİL, sahibin Mac'inde çalışır:
eCyPro API'sini poll eder, lokal `notebooklm-mcp` sürecini stdio JSON-RPC ile
sürer, sonucu draft olarak teslim eder. İçerik metni %100 NotebookLM kaynaklıdır
(deep-research raporu); köprü metin yazmaz.

## Kurulum

1. NotebookLM auth: `nlm login` (bir kez) — `notebooklm-mcp` binary'si PATH'te
   olmalı (örn. `~/local-llm/venv/bin/notebooklm-mcp`).
2. API anahtarı bas (DB env'li ortamda, değer BİR KEZ gösterilir):

   ```bash
   node --env-file=.env scripts/nlm-bridge/mint-key.mjs
   ```

3. Köprüyü başlat:

   ```bash
   ECYPRO_API_URL=http://localhost:3001/api/v1 \
   RESEARCH_BRIDGE_KEY=<mint-key çıktısı> \
   NLM_MCP_CMD=$HOME/local-llm/venv/bin/notebooklm-mcp \
   npm run nlm:bridge
   ```

   Üretime karşı: `ECYPRO_API_URL=https://api.ecypro.com/api/v1` (anahtar prod
   DB'de basılmış olmalı).

## Env değişkenleri

| Değişken | Varsayılan | Açıklama |
|---|---|---|
| `ECYPRO_API_URL` | `http://localhost:3001/api/v1` | API tabanı |
| `RESEARCH_BRIDGE_KEY` | — (zorunlu) | `research:bridge` scope'lu ApiKey (raw) |
| `NLM_MCP_CMD` | `notebooklm-mcp` | MCP server komutu |
| `NLM_NOTEBOOK_ID` | — | Sabit notebook; boşsa "eCyPro Content Studio" bulunur/yaratılır |
| `BRIDGE_POLL_MS` | `15000` | Kuyruk poll aralığı |
| `BRIDGE_ONCE` | — | `1` → tek iş işle ve çık (test) |
| `BRIDGE_EN` | — | `1` → opt-in EN bacağı: İKİNCİ Studio raporu `language:'en'` ile sentezlenir, draft'a `titleEn/excerptEn/bodyEnMdx` eklenir → sunucu post'u `language: BOTH` yaratır. Kapalıyken davranış birebir bugünkü TR akışı. Maliyet: iş başına +dakikalar ve ek NotebookLM kotası; EN sentezi başarısızsa iş FAIL olmaz, TR-only teslim edilir |

## Akış

claim → RESEARCHING (`research_start` + poll; status'un döndürdüğü `task_id`
kullanılır — start'ınkinden kayabilir) → IMPORTING (`research_import
cited_only`; yanıt hatalı olsa bile `notebook_get` sayımıyla doğrulanır —
bilinen false-negative) → DRAFTING (rapor → draft payload) → DONE (sunucu
BlogPost(DRAFT) yaratır; köprü posta bir daha dokunmaz) → notebook'a izi notu.
Hata → FAILED + mesaj (anahtar değerleri asla loglanmaz).

## Self-test (fixture, NotebookLM'siz)

```bash
npm run nlm:selftest
```

`BRIDGE_ONCE=1` ile köprüyü fixture MCP + stub API'ye karşı uçtan uca 3 kez
koşturur: (1) TR-only regresyon, (2) `BRIDGE_EN=1` bilingual draft,
(3) `BRIDGE_EN=1` + boş status raporu (iki bacak da Studio sentezi). Sıfır
bağımlılık; CI'da koşturulabilir.

## launchd (opsiyonel, otomatik başlatma)

`~/Library/LaunchAgents/com.ecypro.nlm-bridge.plist` içine standart bir
`ProgramArguments=[node, <repo>/scripts/nlm-bridge/bridge.mjs]` +
`EnvironmentVariables` bloğu; `launchctl load` ile etkinleştir. Köprü kapalıyken
işler QUEUED bekler — admin panelde "Köprü çevrimdışı" rozeti görünür.

## Sorun giderme

| Belirti | Neden / Çözüm |
|---|---|
| `auth_status: not_configured` | `nlm login` çalıştır |
| Claim 401 | Anahtar yanlış/iptal; yeniden mint et |
| Job FAILED "research did not complete" | Mod bütçesi aşıldı; deep için NotebookLM tarafı yavaş olabilir — yeni iş aç |
| Draft 422 "No Author row" | DB'de en az bir Author kaydı olmalı (admin → Yazarlar) |
