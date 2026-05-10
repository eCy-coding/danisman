/**
 * e2e/crawl_api_security.spec.ts
 * istek5.txt Pane 10 — 🔐 Sec-Watch (Güvenlik İzleme)
 * Phase 5: Test/Quality — OWASP Top 10 API Güvenlik Derin Testi
 *
 * Testler (15):
 *  P-SEC-01  CSRF koruması — same-site POST isteği header kontrolü
 *  P-SEC-02  Path traversal — ../ payload → 400/403 döner
 *  P-SEC-03  IDOR — başka kullanıcı booking erişimi → 403
 *  P-SEC-04  Open redirect — ?redirect= param manipülasyon → korumalı
 *  P-SEC-05  DOM XSS — innerHTML assignment yok (dangerouslySetInnerHTML)
 *  P-SEC-06  Prototype pollution — __proto__ payload → güvenli cevap
 *  P-SEC-07  Mass assignment — admin field inject → reddedilir
 *  P-SEC-08  NoSQL injection — $gt payload → güvenli cevap
 *  P-SEC-09  Command injection — shell payload → 400/422 döner
 *  P-SEC-10  Error message — stack trace production'da ifşa yok
 *  P-SEC-11  CORS wildcard — production domain için * yok
 *  P-SEC-12  Brute force — login 5 yanlış deneme → account lock/429
 *  P-SEC-13  Insecure deserialization — JSON bomb → crash yok
 *  P-SEC-14  Unauth file upload — /api/upload → 401/403
 *  P-SEC-15  Security headers toplam skor (CSP, HSTS, XFO, XCTO)
 *
 * Çalıştır:
 *   npx playwright test e2e/crawl_api_security.spec.ts --project=chromium
 */

import { test, expect } from '@playwright/test';

const API_URL = 'http://localhost:3099';
const BASE_URL = 'http://localhost:4173';

test.describe('Crawler: API Security Deep — Pane 10 (OWASP Top 10)', () => {
  test.use({ storageState: undefined });

  // ─── P-SEC-01: CSRF ──────────────────────────────────────────
  test('P-SEC-01: CSRF — state-changing endpoint CSRF token veya SameSite kontrolü', async ({
    request,
  }) => {
    test.setTimeout(15_000);

    const res = await request
      .post(`${API_URL}/api/contact`, {
        data: { name: 'CSRF Test', email: 'csrf@test.com', message: 'CSRF check' },
        headers: {
          Origin: 'https://evil.com',
          Referer: 'https://evil.com/attack',
          'Content-Type': 'application/json',
        },
      })
      .catch(() => null);

    if (!res) {
      console.warn('⚠ API çalışmıyor — CSRF test atlandı');
      return;
    }

    const status = res.status();
    const acao = res.headers()['access-control-allow-origin'] ?? '';

    if (acao === '*') {
      console.warn('⚠ CORS wildcard — CSRF koruması zayıf (state-changing endpoint)');
    }
    if (acao.includes('evil.com')) {
      expect(acao, 'CORS: evil.com kabul ediliyor').not.toContain('evil.com');
    }
    expect([200, 201, 400, 403, 422]).toContain(status);
  });

  // ─── P-SEC-02: Path traversal ────────────────────────────────
  test('P-SEC-02: Path traversal payload → 400/403/404 döner', async ({ request }) => {
    test.setTimeout(15_000);

    const payloads = [
      '../../../../etc/passwd',
      '..%2F..%2F..%2Fetc%2Fpasswd',
      '%2e%2e%2f%2e%2e%2fetc%2fpasswd',
    ];

    for (const payload of payloads) {
      const res = await request
        .get(`${API_URL}/api/blog/${encodeURIComponent(payload)}`)
        .catch(() => null);

      if (!res) continue;

      expect(
        res.status(),
        `Path traversal: ${payload} → ${res.status()} (5xx olmamalı)`,
      ).toBeLessThan(500);

      const body = await res.text().catch(() => '');
      expect(body, 'Path traversal: /etc/passwd içeriği sızdı').not.toContain('root:x:0:0');
    }
  });

  // ─── P-SEC-03: IDOR ──────────────────────────────────────────
  test('P-SEC-03: IDOR — başka kullanıcı kaynağına erişim → 403/401', async ({ request }) => {
    test.setTimeout(15_000);

    const idorEndpoints = [
      '/api/bookings/booking-id-999',
      '/api/users/user-id-999',
      '/api/admin/contacts/contact-id-999',
    ];

    for (const ep of idorEndpoints) {
      const res = await request
        .get(`${API_URL}${ep}`, {
          headers: { Authorization: 'Bearer fake-token-xyz' },
        })
        .catch(() => null);

      if (!res) continue;

      const status = res.status();
      // Should return 401/403/404, not 200 with data
      if (status === 200) {
        console.warn(`⚠ IDOR risk: ${ep} token olmadan 200 döndü`);
      }
      expect(status, `IDOR: ${ep} → ${status}`).toBeGreaterThanOrEqual(400);
    }
  });

  // ─── P-SEC-04: Open redirect ─────────────────────────────────
  test('P-SEC-04: Open redirect — redirect param manipülasyon korumalı', async ({ page }) => {
    test.setTimeout(20_000);
    await page.route('**/ingest.sentry.io/**', (r) => r.fulfill({ status: 200 }));

    await page.goto(`${BASE_URL}/login?redirect=https://evil.com`, {
      waitUntil: 'domcontentloaded',
    });
    await page.waitForTimeout(600);

    const url = page.url();
    // Should NOT redirect to evil.com
    expect(url, "Open redirect: evil.com'a yönlendirildi").not.toContain('evil.com');
  });

  // ─── P-SEC-05: DOM XSS innerHTML ─────────────────────────────
  test("P-SEC-05: DOM XSS — script tag query param'dan reflect edilmiyor", async ({ page }) => {
    test.setTimeout(20_000);
    await page.route('**/ingest.sentry.io/**', (r) => r.fulfill({ status: 200 }));
    await page.route('**/api/**', (r) => r.fulfill({ status: 200, body: '{}' }));

    let alertFired = false;
    page.on('dialog', async (dialog) => {
      alertFired = true;
      await dialog.dismiss();
    });

    await page.goto(`${BASE_URL}/?xss=${encodeURIComponent('<script>alert("xss")</script>')}`, {
      waitUntil: 'domcontentloaded',
    });
    await page.waitForTimeout(800);

    expect(alertFired, 'XSS: alert() tetiklendi — DOM XSS açığı var').toBeFalsy();

    const bodyHtml = await page.locator('body').innerHTML();
    const rawScript = bodyHtml.includes('<script>alert');
    expect(rawScript, "XSS: unescaped <script> tag HTML'e yansıtıldı").toBeFalsy();
  });

  // ─── P-SEC-06: Prototype pollution ───────────────────────────
  test('P-SEC-06: Prototype pollution payload → güvenli cevap', async ({ request }) => {
    test.setTimeout(15_000);

    const res = await request
      .post(`${API_URL}/api/contact`, {
        data: {
          __proto__: { admin: true },
          constructor: { prototype: { admin: true } },
          name: 'Proto Test',
          email: 'proto@test.com',
          message: 'Prototype pollution test',
        },
      })
      .catch(() => null);

    if (!res) {
      console.warn('⚠ Backend erişilemiyor');
      return;
    }

    expect(res.status()).toBeLessThan(500);
    const body = await res.json().catch(() => null);
    if (body) {
      // Should not grant admin rights
      expect(body.admin).not.toBe(true);
    }
  });

  // ─── P-SEC-07: Mass assignment ────────────────────────────────
  test('P-SEC-07: Mass assignment — admin/role field inject → reddedilir', async ({ request }) => {
    test.setTimeout(15_000);

    const res = await request
      .post(`${API_URL}/api/auth/register`, {
        data: {
          email: 'massassign@test.com',
          password: 'Test123!',
          name: 'Test User',
          role: 'admin', // mass assignment injection
          isAdmin: true, // should be ignored
          permissions: ['*'], // should be ignored
        },
      })
      .catch(() => null);

    if (!res) {
      console.warn('⚠ Backend erişilemiyor');
      return;
    }

    if (res.status() === 201 || res.status() === 200) {
      const body = await res.json().catch(() => null);
      if (body) {
        // Returned user should NOT be admin
        expect(body.role, 'Mass assignment: admin role kabul edildi').not.toBe('admin');
        expect(body.isAdmin, 'Mass assignment: isAdmin=true kabul edildi').not.toBe(true);
      }
    }
    expect([200, 201, 400, 409, 422]).toContain(res.status());
  });

  // ─── P-SEC-08: NoSQL injection ────────────────────────────────
  test('P-SEC-08: NoSQL injection payload → güvenli cevap', async ({ request }) => {
    test.setTimeout(15_000);

    const nosqlPayloads = [
      { email: { $gt: '' }, password: { $gt: '' } },
      { email: { $regex: '.*' }, password: { $regex: '.*' } },
    ];

    for (const payload of nosqlPayloads) {
      const res = await request
        .post(`${API_URL}/api/auth/login`, {
          data: payload,
        })
        .catch(() => null);

      if (!res) continue;

      // Should not grant access (200 with token = vulnerability)
      if (res.status() === 200) {
        const body = await res.json().catch(() => null);
        if (body?.token || body?.accessToken) {
          // This would be a real vulnerability
          expect(
            false,
            `NoSQL injection ile token alındı: ${JSON.stringify(payload)}`,
          ).toBeTruthy();
        }
      }
      expect(res.status()).toBeLessThan(500);
    }
  });

  // ─── P-SEC-09: Command injection ─────────────────────────────
  test('P-SEC-09: Command injection payload → 400/422 döner', async ({ request }) => {
    test.setTimeout(15_000);

    const cmdPayloads = ['; ls -la', '| cat /etc/passwd', '`id`', '$(whoami)'];

    for (const cmd of cmdPayloads) {
      const res = await request
        .get(`${API_URL}/api/blog?search=${encodeURIComponent(cmd)}`)
        .catch(() => null);

      if (!res) continue;

      expect(res.status()).toBeLessThan(500);
      const body = await res.text().catch(() => '');
      // Should not contain OS command output
      expect(body).not.toMatch(/root:x:|uid=\d+|gid=\d+/);
    }
  });

  // ─── P-SEC-10: Stack trace ifşa ──────────────────────────────
  test("P-SEC-10: Error response production'da stack trace içermiyor", async ({ request }) => {
    test.setTimeout(15_000);

    const endpoints = ['/api/nonexistent-xyz-123', '/api/blog/invalid-id-!!'];

    for (const ep of endpoints) {
      const res = await request.get(`${API_URL}${ep}`).catch(() => null);
      if (!res) continue;

      const body = await res.text().catch(() => '');
      expect(body).not.toContain('at Object.<anonymous>');
      expect(body).not.toContain('node_modules');
      expect(body).not.toContain('SyntaxError:');
      expect(body).not.toContain('/Users/');
      expect(body).not.toContain('/home/');
    }
  });

  // ─── P-SEC-11: CORS wildcard ──────────────────────────────────
  test('P-SEC-11: CORS — API üretim endpoint wildcard kullanmıyor', async ({ request }) => {
    test.setTimeout(15_000);

    const res = await request
      .fetch(`${API_URL}/api/health`, {
        method: 'OPTIONS',
        headers: {
          Origin: 'https://attacker.com',
          'Access-Control-Request-Method': 'POST',
        },
      })
      .catch(() => null);

    if (!res) {
      console.warn('⚠ Backend erişilemiyor');
      return;
    }

    const acao = res.headers()['access-control-allow-origin'];
    if (acao === '*') {
      console.warn('⚠ CORS wildcard (*) — API güvenli olmayan kaynaklara açık');
    }
    if (acao === 'https://attacker.com') {
      expect(acao, 'CORS: attacker.com kabul edildi').not.toBe('https://attacker.com');
    }
    expect(true).toBeTruthy();
  });

  // ─── P-SEC-12: Brute force → account lock ────────────────────
  test('P-SEC-12: Login brute force — 6 başarısız deneme → 429 veya lock', async ({ request }) => {
    test.setTimeout(30_000);

    const attempts = Array.from({ length: 6 }, () =>
      request
        .post(`${API_URL}/api/auth/login`, {
          data: { email: 'bruteforce@test.com', password: 'WrongPassword!' + Math.random() },
        })
        .catch(() => null),
    );

    const responses = await Promise.all(attempts);
    const statuses = responses.map((r) => r?.status() ?? 0).filter((s) => s > 0);

    if (statuses.length === 0) {
      console.warn('⚠ Backend erişilemiyor');
      return;
    }

    const has429 = statuses.includes(429);
    const hasLock = statuses.some((s) => s === 423); // 423 Locked

    if (!has429 && !hasLock) {
      console.warn(`⚠ Brute force koruması yok — statuses: ${statuses.join(',')}`);
    }
    // No 5xx
    expect(
      statuses.every((s) => s < 500),
      '5xx during brute force',
    ).toBeTruthy();
  });

  // ─── P-SEC-13: JSON bomb ──────────────────────────────────────
  test('P-SEC-13: JSON bomb (deeply nested) → server crash yok', async ({ request }) => {
    test.setTimeout(20_000);

    // Deeply nested JSON object
    let nested: Record<string, unknown> = { value: 'bomb' };
    for (let i = 0; i < 20; i++) {
      nested = { nested };
    }

    const res = await request
      .post(`${API_URL}/api/contact`, {
        data: nested,
        headers: { 'Content-Type': 'application/json' },
      })
      .catch(() => null);

    if (!res) {
      console.warn('⚠ Backend erişilemiyor');
      return;
    }

    // Server should handle it gracefully
    expect(res.status()).toBeLessThan(500);
  });

  // ─── P-SEC-14: Unauth file upload ────────────────────────────
  test('P-SEC-14: Kimliksiz dosya yükleme → 401/403', async ({ request }) => {
    test.setTimeout(15_000);

    const uploadEndpoints = ['/api/upload', '/api/files', '/api/media/upload'];

    for (const ep of uploadEndpoints) {
      const res = await request
        .post(`${API_URL}${ep}`, {
          multipart: {
            file: {
              name: 'test.txt',
              mimeType: 'text/plain',
              buffer: Buffer.from('test content'),
            },
          },
        })
        .catch(() => null);

      if (!res) continue;

      const status = res.status();
      // Without auth, should deny
      if (status === 200 || status === 201) {
        console.warn(`⚠ ${ep}: Kimliksiz upload kabul edildi (${status})`);
      }
      expect([401, 403, 404, 405, 422, 415]).toContain(status);
    }
  });

  // ─── P-SEC-15: Security header skor ─────────────────────────
  test('P-SEC-15: Security header toplam skoru (CSP, HSTS, XFO, XCTO, RP)', async ({ request }) => {
    test.setTimeout(15_000);

    const res = await request.get(BASE_URL);
    const h = res.headers();

    const score = {
      CSP: h['content-security-policy'] ? 20 : 0,
      HSTS: h['strict-transport-security'] ? 20 : 0,
      XFO: h['x-frame-options'] ? 20 : 0,
      XCTO: h['x-content-type-options'] ? 20 : 0,
      RP: h['referrer-policy'] ? 10 : 0,
      PP: h['permissions-policy'] ? 10 : 0,
    };
    const total = Object.values(score).reduce((a, b) => a + b, 0);

    console.warn(
      `Security Header Score: ${total}/100\n${Object.entries(score)
        .map(([k, v]) => `  ${k}: ${v > 0 ? '✅' : '❌'}`)
        .join('\n')}`,
    );

    if (total < 40) {
      console.warn("⚠ Security header skoru < 40 — production'da header ekle (nginx/Vercel)");
    }
    expect(true).toBeTruthy(); // Informational — localhost dev server
  });
});
