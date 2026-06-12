#!/usr/bin/env node
/**
 * Fixture notebooklm-mcp — speaks just enough JSON-RPC for bridge.mjs to run
 * end-to-end without real NotebookLM. Used by the bridge self-test
 * (scripts/nlm-bridge/selftest.mjs) and CI. NOT a runtime dependency.
 */
import { writeFileSync } from 'node:fs';
import process from 'node:process';

// FAKE_EMPTY_REPORT=1 → research_status completes WITHOUT report text, which
// drives the bridge through grace re-polls into the Studio report fallback
// (studio_create → studio_status → download_artifact writes a real file).
const EMPTY_REPORT = process.env.FAKE_EMPTY_REPORT === '1';

const STUDIO_REPORT_TEXT = [
  '# Fixture Studio Raporu',
  '',
  'Bu rapor, köprünün zengin draft şablonunu uçtan uca kanıtlamak için fixture tarafından üretilmiştir. Dek bu ilk paragraftan türetilir ve yüz karakterden uzun bir açılış cümlesi içerir.',
  '',
  '## Stratejik Görünüm',
  '',
  'Aile işletmelerinde dijital dönüşüm artık bir tercih değil hayatta kalma koşuludur. Bu bölüm fixture senaryosunda ilk çıkarım cümlesini sağlar ve yeterince uzundur.',
  '',
  '## Yapay Zekâ Entegrasyonu',
  '',
  'Yapay zekâ araçları kurumsallaşma sürecindeki öznel kararları veriye bağlayarak kuşak çatışmasını azaltır. İkinci çıkarım bu cümleden gelir.',
  '',
  '## Evrelere Göre Yolculuk',
  '',
  'Kurumsallaşma sürecini üç ana evrede incelemek mümkün: 2016 - 2019: Mevzuatın Doğuşu döneminde ilk adımlar atılmış ve sınırlı bir kabul görmüştür. 2016 - 2019: Mevzuatın Doğuşu ve sınırlı kabul evresi bu başlık satırı olarak veriye sızmamalıdır.',
  '',
  '## Halefiyet Planlaması',
  '',
  'Halefiyet planı olmayan şirketlerde nesil geçişi krizle sonuçlanma eğilimindedir. Üçüncü çıkarım cümlesi de budur.',
  '',
  '## Sayısal Görünüm',
  '',
  'TÜİK verilerine göre dijitalleşen aile şirketlerinde verimlilik 2024 yılında %23,5 artmıştır [12]. Yapay zekâ yatırımı yapan KOBİ sayısı son üç yılda 48 binden 112 bine çıkmıştır [3-5]. Bu rapor, halefiyet planı olan şirketlerin oranının kapsamlı bir şekilde yalnızca %18 düzeyinde olduğunu göstermektedir [13, 14].',
  '',
  '## Kirli Markdown Senaryosu',
  '',
  '| Adım | İşlem | İçerik |',
  '| --- | --- | --- |',
  '| 1 | Analiz | Veri |',
  '> **"Yetki çizelgesinde neyi yapay zekâya vereceğinize göre değişebilir; birçok şeyi otomatikleştirmek imkânsız değildir."** > — Fixture Uzmanı > Bu blockquote satırı sanitize testidir ve tablo satırlarından sonra gelir.',
  '',
  '## Liste Tuzağı',
  '',
  'Analiz edilen kaynaklar, dönüşümde üç ana zorluk alanını öne çıkarmaktadır: 1. Kültürel direnç her zaman ilk sıradadır ve ayrıntısı aşağıdadır.',
].join('\n');

let buf = '';
process.stdin.on('data', (c) => {
  buf += c.toString('utf8');
  let i;
  while ((i = buf.indexOf('\n')) >= 0) {
    const line = buf.slice(0, i).trim();
    buf = buf.slice(i + 1);
    if (line) handle(line);
  }
});

function send(obj) {
  process.stdout.write(JSON.stringify(obj) + '\n');
}
function ok(id, payload) {
  send({ jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: JSON.stringify(payload) }] } });
}

function handle(line) {
  let msg;
  try {
    msg = JSON.parse(line);
  } catch {
    return;
  }
  const { id, method, params } = msg;
  if (method === 'initialize') {
    send({ jsonrpc: '2.0', id, result: { protocolVersion: '2024-11-05', capabilities: {}, serverInfo: { name: 'fake-mcp', version: '0.0.0' } } });
    return;
  }
  if (method === 'notifications/initialized') return;
  if (method !== 'tools/call') {
    if (id !== undefined) send({ jsonrpc: '2.0', id, result: {} });
    return;
  }
  const name = params?.name;
  const a = params?.arguments ?? {};
  switch (name) {
    case 'server_info':
      return ok(id, { version: '0.0.0-fixture', auth_status: 'configured' });
    case 'notebook_list':
      return ok(id, { notebooks: [{ id: 'fake-nb-1', title: 'eCyPro Content Studio' }] });
    case 'notebook_create':
      return ok(id, { notebook_id: 'fake-nb-1' });
    case 'research_start':
      return ok(id, { status: 'success', task_id: 'start-task-AAA' });
    case 'research_status':
      // task_id deliberately DIFFERS from research_start (drift gotcha).
      return ok(id, {
        status: 'completed',
        task_id: 'status-task-BBB',
        sources_found: 9,
        report: EMPTY_REPORT
          ? ''
          : '# Fixture Araştırma Raporu\n\nBu fixture raporu, eCyPro araştırma köprüsünün uçtan uca çalıştığını kanıtlamak için üretilmiştir. Köprü bu metni alıp admin paneline taslak makale olarak teslim eder; gövde en az yüz karakter uzunluğundadır ve Zod şemasını geçer.',
        sources: [
          { title: 'Fixture kaynak 1 — strateji belgesi', url: 'https://example.com/1' },
          { title: 'Request Rejected', url: 'https://example.com/junk' },
          { title: 'Fixture kaynak 2 — TÜİK verisi' },
        ],
      });
    case 'studio_create':
      return ok(id, { status: 'success', artifact_id: 'fake-art-1' });
    case 'studio_status':
      return ok(id, {
        artifacts: [
          { id: 'fake-art-1', type: 'report', status: 'completed', title: 'Fixture Studio Raporu' },
        ],
      });
    case 'download_artifact':
      // The real tool writes the artifact to output_path; the bridge then
      // reads that file. Mirror the contract.
      try {
        writeFileSync(String(a.output_path), STUDIO_REPORT_TEXT, 'utf8');
        return ok(id, { status: 'success', path: a.output_path });
      } catch (err) {
        return ok(id, { status: 'error', error: String(err) });
      }
    case 'research_import':
      // Simulate the proven false-negative: error, but the import "landed".
      send({ jsonrpc: '2.0', id, result: { isError: true, content: [{ type: 'text', text: '{"error":"API error (code 9): unknown"}' }] } });
      return;
    case 'notebook_get':
      return ok(id, { notebook: { id: 'fake-nb-1', source_count: 9 } });
    case 'note':
      return ok(id, { status: 'success', note_id: 'fake-note-1' });
    default:
      return ok(id, { status: 'success' });
  }
}
