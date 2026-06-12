#!/usr/bin/env node
/**
 * Fixture notebooklm-mcp — speaks just enough JSON-RPC for bridge.mjs to run
 * end-to-end without real NotebookLM. Used by the bridge self-test
 * (scripts/nlm-bridge/selftest.mjs) and CI. NOT a runtime dependency.
 */
import process from 'node:process';

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
        report:
          '# Fixture Araştırma Raporu\n\nBu fixture raporu, eCyPro araştırma köprüsünün uçtan uca çalıştığını kanıtlamak için üretilmiştir. Köprü bu metni alıp admin paneline taslak makale olarak teslim eder; gövde en az yüz karakter uzunluğundadır ve Zod şemasını geçer.',
        sources: [
          { title: 'Fixture kaynak 1 — strateji belgesi', url: 'https://example.com/1' },
          { title: 'Request Rejected', url: 'https://example.com/junk' },
          { title: 'Fixture kaynak 2 — TÜİK verisi' },
        ],
      });
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
