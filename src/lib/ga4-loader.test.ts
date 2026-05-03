import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { isLoaded, loadGA4, unloadGA4 } from './ga4-loader';

describe('ga4-loader', () => {
  beforeEach(() => {
    document.head.querySelectorAll('script[data-ecypro-ga4]').forEach((n) => n.remove());
    delete (window as Window).gtag;
    window.dataLayer = [];
  });

  afterEach(() => {
    unloadGA4();
  });

  it('does nothing when measurementId is empty', () => {
    loadGA4('');
    expect(isLoaded()).toBe(false);
    expect(window.gtag).toBeUndefined();
  });

  it('injects the gtag.js script + bootstraps gtag/dataLayer', () => {
    loadGA4('G-TEST123');
    const script = document.head.querySelector<HTMLScriptElement>('script[data-ecypro-ga4]');
    expect(script).not.toBeNull();
    expect(script?.src).toContain('googletagmanager.com/gtag/js?id=G-TEST123');
    expect(script?.async).toBe(true);
    expect(typeof window.gtag).toBe('function');
    expect(Array.isArray(window.dataLayer)).toBe(true);
    expect(isLoaded('G-TEST123')).toBe(true);
  });

  it('is idempotent when called twice with the same id', () => {
    loadGA4('G-TEST123');
    loadGA4('G-TEST123');
    const scripts = document.head.querySelectorAll('script[data-ecypro-ga4]');
    expect(scripts).toHaveLength(1);
  });

  it('swaps the script when called with a different id', () => {
    loadGA4('G-OLD');
    loadGA4('G-NEW');
    const scripts = document.head.querySelectorAll<HTMLScriptElement>('script[data-ecypro-ga4]');
    expect(scripts).toHaveLength(1);
    expect(scripts[0]?.dataset.measurementId).toBe('G-NEW');
  });

  it('unloadGA4 removes the script, gtag, and clears dataLayer', () => {
    loadGA4('G-TEST123');
    unloadGA4();
    expect(document.head.querySelector('script[data-ecypro-ga4]')).toBeNull();
    expect(window.gtag).toBeUndefined();
    expect(window.dataLayer).toEqual([]);
  });

  it('unloadGA4 is safe to call when GA4 was never loaded', () => {
    expect(() => unloadGA4()).not.toThrow();
  });
});
