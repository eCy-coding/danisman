/**
 * P17 BE Track 2 / Aşama 2 — email template rendering tests.
 *
 * The templates are static HTML strings, so the test surface is small:
 *   - subject + body localised correctly for TR / EN,
 *   - user-supplied variables HTML-escaped to defend against injection,
 *   - obviously dangerous URL schemes (javascript:, data:) stripped.
 */

import { describe, expect, it } from 'vitest';
import {
  renderWelcome,
  renderPasswordReset,
  renderGdprExportReady,
  renderGdprDeleteConfirm,
  _testing,
} from './templates';

describe('renderWelcome', () => {
  it('renders the TR variant with the user name escaped', () => {
    const result = renderWelcome({ name: '<Ada>', lang: 'tr' });
    expect(result.subject).toMatch(/Hoş Geldiniz/);
    expect(result.html).toContain('&lt;Ada&gt;');
    expect(result.html).not.toContain('<Ada>');
  });

  it('renders the EN variant when lang=en', () => {
    const result = renderWelcome({ name: 'Ada', lang: 'en' });
    expect(result.subject).toMatch(/Welcome/);
    expect(result.html).toContain('Welcome to eCyPro');
  });
});

describe('renderPasswordReset', () => {
  it('TR variant contains the reset URL', () => {
    const url = 'https://ecypro.com/reset?t=abc';
    const result = renderPasswordReset({ resetUrl: url, lang: 'tr' });
    expect(result.text).toContain(url);
    expect(result.html).toContain('Şifre Sıfırlama Talebi');
  });

  it('refuses javascript: URLs in the CTA href', () => {
    const result = renderPasswordReset({
      resetUrl: 'javascript:alert(1)',
      lang: 'tr',
    });
    expect(result.html).not.toContain('javascript:');
    // CTA falls back to "#" placeholder when the URL is rejected.
    expect(result.html).toContain('href="#"');
  });
});

describe('renderGdprExportReady', () => {
  it('TR variant formats expiresAt in Turkish locale', () => {
    const expiresAt = '2026-08-20T10:00:00.000Z';
    const result = renderGdprExportReady({
      downloadUrl: 'https://ecypro.com/exports/x.json',
      expiresAt,
      lang: 'tr',
    });
    // The Turkish locale long-style date string contains the year + month name.
    expect(result.html).toMatch(/2026/);
    expect(result.subject).toMatch(/GDPR Veri İhracatınız/);
  });

  it('EN variant formats expiresAt in English locale', () => {
    const result = renderGdprExportReady({
      downloadUrl: 'https://ecypro.com/exports/x.json',
      expiresAt: '2026-08-20T10:00:00.000Z',
      lang: 'en',
    });
    expect(result.html).toMatch(/2026/);
    expect(result.subject).toMatch(/data export/i);
  });
});

describe('renderGdprDeleteConfirm', () => {
  it('uses the irrevocable warning copy in TR', () => {
    const result = renderGdprDeleteConfirm({
      confirmUrl: 'https://ecypro.com/confirm/abc',
      lang: 'tr',
    });
    expect(result.html).toContain('geri alınamaz');
  });

  it('uses the irrevocable warning copy in EN', () => {
    const result = renderGdprDeleteConfirm({
      confirmUrl: 'https://ecypro.com/confirm/abc',
      lang: 'en',
    });
    expect(result.html).toContain('irreversible');
  });
});

describe('_testing.escapeHtml', () => {
  it('encodes the standard 5 entities', () => {
    expect(_testing.escapeHtml(`<>&"'`)).toBe('&lt;&gt;&amp;&quot;&#39;');
  });
});

describe('_testing.escapeAttr', () => {
  it('rejects data: URLs', () => {
    expect(_testing.escapeAttr('data:text/html,<script>alert(1)</script>')).toBe('#');
  });

  it('preserves http/https URLs', () => {
    expect(_testing.escapeAttr('https://ecypro.com/page?x=1&y=2')).toContain('ecypro.com');
  });
});
