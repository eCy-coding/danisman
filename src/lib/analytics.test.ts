import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  trackEvent,
  trackCTA,
  trackScrollDepth,
  trackForm,
  trackPageView,
  trackBooking,
  trackContactConversion,
  trackNewsletterConversion,
  trackBookingConversion,
  trackQuoteRequest,
} from './analytics';

describe('analytics', () => {
  let gtagSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    gtagSpy = vi.fn();
    window.gtag = gtagSpy;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any)._last_analytics_event;
  });

  describe('trackEvent', () => {
    it('calls gtag with event + category + label', () => {
      trackEvent('Engagement', 'button_click', 'hero-cta');
      expect(gtagSpy).toHaveBeenCalledWith(
        'event',
        'button_click',
        expect.objectContaining({
          event_category: 'Engagement',
          event_label: 'hero-cta',
        }),
      );
    });

    it('calls gtag without label when omitted', () => {
      trackEvent('Navigation', 'page_view');
      expect(gtagSpy).toHaveBeenCalledWith(
        'event',
        'page_view',
        expect.objectContaining({ event_category: 'Navigation' }),
      );
    });

    it('payload includes ISO timestamp', () => {
      trackEvent('Test', 'test_action');
      const payload = gtagSpy.mock.calls[0]?.[2] as Record<string, unknown>;
      expect(payload.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
  });

  describe('trackCTA', () => {
    it('fires cta_click with label and location', () => {
      trackCTA('Hero Primary', 'hero');
      expect(gtagSpy).toHaveBeenCalledWith(
        'event',
        'cta_click',
        expect.objectContaining({ cta_label: 'Hero Primary', cta_location: 'hero' }),
      );
    });
  });

  describe('trackScrollDepth', () => {
    it('fires scroll_depth with correct percentage', () => {
      trackScrollDepth(75, '/services');
      expect(gtagSpy).toHaveBeenCalledWith(
        'event',
        'scroll_depth',
        expect.objectContaining({ scroll_percentage: 75, page_path: '/services' }),
      );
    });

    it('supports all four milestones', () => {
      ([25, 50, 75, 100] as const).forEach((pct) => {
        trackScrollDepth(pct, '/');
      });
      expect(gtagSpy).toHaveBeenCalledTimes(4);
    });
  });

  describe('trackForm', () => {
    it('fires form_start with form_id', () => {
      trackForm('contact', 'start');
      expect(gtagSpy).toHaveBeenCalledWith(
        'event',
        'form_start',
        expect.objectContaining({ form_id: 'contact' }),
      );
    });

    it('fires form_submit_success', () => {
      trackForm('newsletter', 'submit_success');
      expect(gtagSpy).toHaveBeenCalledWith(
        'event',
        'form_submit_success',
        expect.objectContaining({ form_id: 'newsletter' }),
      );
    });

    it('passes extra context', () => {
      trackForm('booking', 'abandon', { last_field: 'email' });
      expect(gtagSpy).toHaveBeenCalledWith(
        'event',
        'form_abandon',
        expect.objectContaining({ form_id: 'booking', last_field: 'email' }),
      );
    });
  });

  describe('trackPageView', () => {
    it('fires page_view_enhanced with page_path', () => {
      trackPageView('/about');
      expect(gtagSpy).toHaveBeenCalledWith(
        'event',
        'page_view_enhanced',
        expect.objectContaining({ page_path: '/about' }),
      );
    });

    it('passes extra context', () => {
      trackPageView('/services', { locale: 'tr', persona: 'executive' });
      expect(gtagSpy).toHaveBeenCalledWith(
        'event',
        'page_view_enhanced',
        expect.objectContaining({ locale: 'tr', persona: 'executive' }),
      );
    });
  });

  describe('trackBooking', () => {
    it('fires booking_flow with numeric step', () => {
      trackBooking(1);
      expect(gtagSpy).toHaveBeenCalledWith(
        'event',
        'booking_flow',
        expect.objectContaining({ booking_step: 1 }),
      );
    });

    it('fires booking_flow with string step', () => {
      trackBooking('success');
      expect(gtagSpy).toHaveBeenCalledWith(
        'event',
        'booking_flow',
        expect.objectContaining({ booking_step: 'success' }),
      );
    });

    it('passes extra context', () => {
      trackBooking('error', { reason: 'network' });
      expect(gtagSpy).toHaveBeenCalledWith(
        'event',
        'booking_flow',
        expect.objectContaining({ booking_step: 'error', reason: 'network' }),
      );
    });
  });

  describe('no-op without gtag', () => {
    it('does not throw when window.gtag is undefined', () => {
      delete window.gtag;
      expect(() => trackCTA('Test', 'test')).not.toThrow();
    });
  });

  // ─── P34-T01 GA4 Conversion Goals ─────────────────────────────────────
  describe('GA4 Conversion Goals (P34-T01)', () => {
    beforeEach(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).dataLayer = [];
    });

    it('trackContactConversion fires generate_lead + parallel form submit_success', () => {
      trackContactConversion('contact', { source: 'pricing' });
      expect(gtagSpy).toHaveBeenCalledWith(
        'event',
        'generate_lead',
        expect.objectContaining({
          form_id: 'contact',
          method: 'contact_form',
          value: 1,
          currency: 'TRY',
          source: 'pricing',
        }),
      );
      // dataLayer parallel push
      expect(window.dataLayer).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ event: 'generate_lead', form_id: 'contact' }),
        ]),
      );
    });

    it('trackNewsletterConversion fires sign_up + legacy newsletter_signup', () => {
      trackNewsletterConversion('footer', 'tr', { campaign: 'launch' });
      const calls = gtagSpy.mock.calls.map((c) => c[1]);
      expect(calls).toContain('sign_up');
      expect(calls).toContain('newsletter_signup');
      expect(gtagSpy).toHaveBeenCalledWith(
        'event',
        'sign_up',
        expect.objectContaining({
          method: 'newsletter',
          source: 'footer',
          locale: 'tr',
          campaign: 'launch',
        }),
      );
    });

    it('trackBookingConversion fires generate_lead with booking-scoped params', () => {
      trackBookingConversion('strategy_session', 2500, { rep: 'EYL' });
      expect(gtagSpy).toHaveBeenCalledWith(
        'event',
        'generate_lead',
        expect.objectContaining({
          form_id: 'booking',
          method: 'booking_flow',
          booking_type: 'strategy_session',
          value: 2500,
          currency: 'TRY',
          rep: 'EYL',
        }),
      );
    });

    it('trackBookingConversion defaults value to 1 when omitted', () => {
      trackBookingConversion('intro_call');
      expect(gtagSpy).toHaveBeenCalledWith(
        'event',
        'generate_lead',
        expect.objectContaining({ value: 1, booking_type: 'intro_call' }),
      );
    });

    it('trackQuoteRequest fires quote_request with source attribution', () => {
      trackQuoteRequest('quick_check', { tier: 'enterprise' });
      expect(gtagSpy).toHaveBeenCalledWith(
        'event',
        'quote_request',
        expect.objectContaining({
          source: 'quick_check',
          tier: 'enterprise',
          value: 1,
          currency: 'TRY',
        }),
      );
    });

    it('dataLayer push initializes array if undefined', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (window as any).dataLayer;
      trackContactConversion('discovery');
      expect(Array.isArray(window.dataLayer)).toBe(true);
      expect(window.dataLayer!.length).toBeGreaterThan(0);
    });
  });
});
