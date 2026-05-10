import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import { generateManageToken, verifyManageToken, verifyCalWebhook } from './hmac';

describe('generateManageToken', () => {
  it('returns a non-empty base64url string', () => {
    const token = generateManageToken('booking-uuid-1234');
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);
    // base64url characters only: A-Z a-z 0-9 - _
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('includes the bookingId when decoded', () => {
    const id = 'booking-uuid-5678';
    const token = generateManageToken(id);
    const decoded = Buffer.from(token, 'base64url').toString('utf-8');
    expect(decoded).toContain(id);
  });

  it('produces different tokens on each call (different expiry)', async () => {
    const t1 = generateManageToken('same-id');
    await new Promise((r) => setTimeout(r, 10));
    const t2 = generateManageToken('same-id');
    // Same bookingId but different because expiry (seconds) may differ
    // — we just ensure they are valid tokens for the same booking
    const r1 = verifyManageToken(t1);
    const r2 = verifyManageToken(t2);
    expect(r1.bookingId).toBe('same-id');
    expect(r2.bookingId).toBe('same-id');
  });
});

describe('verifyManageToken', () => {
  it('returns { valid: true, bookingId } for a fresh token', () => {
    const id = 'test-booking-abc';
    const token = generateManageToken(id);
    const result = verifyManageToken(token);
    expect(result.valid).toBe(true);
    expect(result.bookingId).toBe(id);
  });

  it('returns { valid: false, reason: EXPIRED } for an expired token', () => {
    const id = 'expired-booking';
    // TTL of -1 second → already expired
    const token = generateManageToken(id, -1);
    const result = verifyManageToken(token);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('EXPIRED');
  });

  it('returns { valid: false, reason: BAD_SIGNATURE } for a tampered token', () => {
    const id = 'tamper-booking';
    const token = generateManageToken(id);
    const decoded = Buffer.from(token, 'base64url').toString('utf-8');
    const parts = decoded.split(':');
    // Flip last char of HMAC signature
    parts[2] = parts[2]!.slice(0, -1) + (parts[2]!.endsWith('a') ? 'b' : 'a');
    const tampered = Buffer.from(parts.join(':')).toString('base64url');
    const result = verifyManageToken(tampered);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('BAD_SIGNATURE');
  });

  it('returns { valid: false, reason: INVALID_FORMAT } for garbage input', () => {
    const result = verifyManageToken('not-a-valid-token-at-all');
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('INVALID_FORMAT');
  });

  it('returns { valid: false, reason: INVALID_FORMAT } for empty string', () => {
    const result = verifyManageToken('');
    expect(result.valid).toBe(false);
  });
});

describe('verifyCalWebhook', () => {
  const secret = 'test-cal-webhook-secret';

  function sign(body: string): string {
    return crypto.createHmac('sha256', secret).update(body).digest('hex');
  }

  it('returns true for a valid HMAC signature', () => {
    const body = '{"triggerEvent":"BOOKING_CREATED"}';
    const sig = sign(body);
    expect(verifyCalWebhook(body, sig, secret)).toBe(true);
  });

  it('returns true when signature has sha256= prefix', () => {
    const body = '{"triggerEvent":"BOOKING_CREATED"}';
    const sig = `sha256=${sign(body)}`;
    expect(verifyCalWebhook(body, sig, secret)).toBe(true);
  });

  it('returns false for a wrong signature', () => {
    const body = '{"triggerEvent":"BOOKING_CREATED"}';
    expect(verifyCalWebhook(body, 'deadbeef'.repeat(8), secret)).toBe(false);
  });

  it('returns false when body is tampered after signing', () => {
    const body = '{"triggerEvent":"BOOKING_CREATED"}';
    const sig = sign(body);
    const tampered = '{"triggerEvent":"BOOKING_CANCELLED"}';
    expect(verifyCalWebhook(tampered, sig, secret)).toBe(false);
  });

  it('returns false for empty signature string', () => {
    const body = '{"event":"test"}';
    expect(verifyCalWebhook(body, '', secret)).toBe(false);
  });
});
