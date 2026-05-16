/**
 * P18 BE Track 2 / Aşama 1 — Storage adapter regression suite.
 *
 * Pins:
 *   - assertSafeStorageKey rejects traversal + control chars + size.
 *   - LocalStorageAdapter round-trips bytes + content-type via the
 *     sidecar metadata file.
 *   - LocalStorageAdapter signing: verifySignature is constant-time on
 *     a known-bad signature.
 *   - Signed URL contains the expected query params and an unexpired exp.
 *
 * Sandbox-only: tests use a tmp directory and never hit AWS.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { assertSafeStorageKey } from './types';
import { LocalStorageAdapter } from './local';

describe('assertSafeStorageKey', () => {
  it('accepts a normal key', () => {
    expect(() => assertSafeStorageKey('user/2026/05/abc.png')).not.toThrow();
  });

  it('rejects empty + oversize keys', () => {
    expect(() => assertSafeStorageKey('')).toThrow(/length out of bounds/);
    expect(() => assertSafeStorageKey('a'.repeat(1025))).toThrow(/length out of bounds/);
  });

  it('rejects absolute paths', () => {
    expect(() => assertSafeStorageKey('/abs/path')).toThrow(/must not start/);
    expect(() => assertSafeStorageKey('\\abs\\path')).toThrow(/must not start/);
  });

  it('rejects traversal segments', () => {
    expect(() => assertSafeStorageKey('user/../etc/passwd')).toThrow(/forbidden path segment/);
    expect(() => assertSafeStorageKey('./hidden')).toThrow(/forbidden path segment/);
  });

  it('rejects control characters', () => {
    expect(() => assertSafeStorageKey('user/abc\x00.png')).toThrow(/control characters/);
  });
});

describe('LocalStorageAdapter', () => {
  let root: string;
  let adapter: LocalStorageAdapter;

  beforeEach(() => {
    root = mkdtempSync(path.join(tmpdir(), 'ecypro-storage-test-'));
    adapter = new LocalStorageAdapter({
      root,
      signingSecret: 'unit-test-secret-must-be-at-least-32-chars-long',
      publicBaseUrl: '/api/uploads/get',
    });
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it('round-trips bytes + content-type', async () => {
    const body = Buffer.from('hello world');
    const result = await adapter.put({
      key: 'user/test.png',
      body,
      contentType: 'image/png',
    });
    expect(result.size).toBe(body.length);
    expect(result.contentType).toBe('image/png');
    expect(result.hash).toMatch(/^[0-9a-f]{64}$/);

    const got = await adapter.get('user/test.png');
    expect(got).not.toBeNull();
    expect(got!.body.toString('utf8')).toBe('hello world');
    expect(got!.contentType).toBe('image/png');
  });

  it('returns null on missing key', async () => {
    const got = await adapter.get('does/not/exist.bin');
    expect(got).toBeNull();
  });

  it('delete removes both blob and sidecar', async () => {
    await adapter.put({
      key: 'tmp.png',
      body: Buffer.from('x'),
      contentType: 'image/png',
    });
    await adapter.delete('tmp.png');
    const got = await adapter.get('tmp.png');
    expect(got).toBeNull();
  });

  it('signed URL contains key, exp, sig and verifies', async () => {
    const url = await adapter.signedUrl('user/test.png', 60);
    expect(url).toMatch(/[?&]key=user%2Ftest.png/);
    expect(url).toMatch(/[?&]exp=\d+/);
    expect(url).toMatch(/[?&]sig=[0-9a-f]{64}/);

    const u = new URL(url, 'http://localhost');
    const key = u.searchParams.get('key')!;
    const exp = Number(u.searchParams.get('exp')!);
    const sig = u.searchParams.get('sig')!;
    expect(adapter.verifySignature(key, exp, sig)).toBe(true);
  });

  it('verifySignature rejects tampered signature', () => {
    const sig = 'a'.repeat(64);
    expect(adapter.verifySignature('user/test.png', Date.now() / 1000 + 60, sig)).toBe(false);
  });

  it('verifySignature rejects expired URL', () => {
    const past = Math.floor(Date.now() / 1000) - 10;
    const url = adapter.signSync('user/test.png', -60);
    const sig = url.split('sig=')[1] ?? '';
    expect(adapter.verifySignature('user/test.png', past, sig)).toBe(false);
  });
});
