/**
 * Tests for capturePostHog and PostHogEventMap — Sprint 11 P44-T04
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { capturePostHog } from '../posthog-events';

vi.mock('../../posthog', () => ({
  getPostHog: vi.fn(),
}));

import { getPostHog } from '../../posthog';

const mockedGetPostHog = vi.mocked(getPostHog);

function makePostHog(
  overrides?: Partial<{ capture: ReturnType<typeof vi.fn>; has_opted_in_capturing: () => boolean }>,
) {
  return {
    capture: vi.fn(),
    has_opted_in_capturing: () => true,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Consent gate tests (3)
// ---------------------------------------------------------------------------
describe('capturePostHog — consent gate', () => {
  it('1. no-op when getPostHog returns null', async () => {
    mockedGetPostHog.mockResolvedValue(null);
    await capturePostHog('page_view', { path: '/test' });
    // No error thrown; capture never called because ph is null
  });

  it('2. no-op when has_opted_in_capturing returns false', async () => {
    const ph = makePostHog({ has_opted_in_capturing: () => false });
    mockedGetPostHog.mockResolvedValue(ph as never);
    await capturePostHog('page_view', { path: '/test' });
    expect(ph.capture).not.toHaveBeenCalled();
  });

  it('3. calls ph.capture when opted in', async () => {
    const ph = makePostHog();
    mockedGetPostHog.mockResolvedValue(ph as never);
    await capturePostHog('page_view', { path: '/test', title: 'Home' });
    expect(ph.capture).toHaveBeenCalledOnce();
  });
});

// ---------------------------------------------------------------------------
// Event payload tests (11 — one per event)
// ---------------------------------------------------------------------------
describe('capturePostHog — event payloads', () => {
  let ph: ReturnType<typeof makePostHog>;

  beforeEach(() => {
    ph = makePostHog();
    mockedGetPostHog.mockResolvedValue(ph as never);
  });

  it('4. page_view fires with correct args', async () => {
    await capturePostHog('page_view', {
      path: '/home',
      title: 'Home',
      referrer: 'https://google.com',
    });
    expect(ph.capture).toHaveBeenCalledWith('page_view', {
      path: '/home',
      title: 'Home',
      referrer: 'https://google.com',
    });
  });

  it('5. signup_started fires with correct args', async () => {
    await capturePostHog('signup_started', { source: 'hero_cta' });
    expect(ph.capture).toHaveBeenCalledWith('signup_started', { source: 'hero_cta' });
  });

  it('6. signup_completed fires with correct args and no email in payload', async () => {
    const payload = { source: 'contact_form' };
    await capturePostHog('signup_completed', payload);
    expect(ph.capture).toHaveBeenCalledWith('signup_completed', payload);
    // Assert no email field leaked into the payload
    const capturedPayload = ph.capture.mock.calls[0][1] as Record<string, unknown>;
    expect(capturedPayload).not.toHaveProperty('email');
  });

  it('7. discovery_booked fires with correct args', async () => {
    await capturePostHog('discovery_booked', { source: 'nav', service: 'strategy' });
    expect(ph.capture).toHaveBeenCalledWith('discovery_booked', {
      source: 'nav',
      service: 'strategy',
    });
  });

  it('8. dsar_submitted fires with correct args', async () => {
    await capturePostHog('dsar_submitted', { request_type: 'deletion' });
    expect(ph.capture).toHaveBeenCalledWith('dsar_submitted', { request_type: 'deletion' });
  });

  it('9. retainer_inquiry fires with correct args', async () => {
    await capturePostHog('retainer_inquiry', { tier: 'platinum' });
    expect(ph.capture).toHaveBeenCalledWith('retainer_inquiry', { tier: 'platinum' });
  });

  it('10. founder_letter_signup fires with correct args', async () => {
    await capturePostHog('founder_letter_signup', { source: 'footer_banner' });
    expect(ph.capture).toHaveBeenCalledWith('founder_letter_signup', { source: 'footer_banner' });
  });

  it('11. exit_intent_shown fires with correct args', async () => {
    await capturePostHog('exit_intent_shown', { page: '/pricing', trigger: 'cursor' });
    expect(ph.capture).toHaveBeenCalledWith('exit_intent_shown', {
      page: '/pricing',
      trigger: 'cursor',
    });
  });

  it('12. language_switch fires with correct args', async () => {
    await capturePostHog('language_switch', { from: 'tr', to: 'en' });
    expect(ph.capture).toHaveBeenCalledWith('language_switch', { from: 'tr', to: 'en' });
  });

  it('13. kvkk_consent_given fires with correct args', async () => {
    await capturePostHog('kvkk_consent_given', { categories: ['analytics', 'marketing'] });
    expect(ph.capture).toHaveBeenCalledWith('kvkk_consent_given', {
      categories: ['analytics', 'marketing'],
    });
  });

  it('14. kvkk_consent_revoked fires with correct args', async () => {
    await capturePostHog('kvkk_consent_revoked', { categories: ['marketing'] });
    expect(ph.capture).toHaveBeenCalledWith('kvkk_consent_revoked', { categories: ['marketing'] });
  });
});
