/**
 * P21/T1 — useSaveData hook tests.
 *
 * `navigator.connection` mock'lanır; React render'a girmeden saf
 * `isDataSaverActive` / `readNetworkInfo` fonksiyonları test edilir.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { isDataSaverActive, readNetworkInfo } from './useSaveData';

interface ConnLike {
  saveData?: boolean;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
}

function mockConnection(conn: ConnLike | null): void {
  Object.defineProperty(globalThis.navigator, 'connection', {
    configurable: true,
    get: () => conn,
  });
}

afterEach(() => {
  vi.restoreAllMocks();
  // Reset to undefined connection
  Object.defineProperty(globalThis.navigator, 'connection', {
    configurable: true,
    get: () => undefined,
  });
});

describe('isDataSaverActive', () => {
  it('returns true when saveData=true', () => {
    mockConnection({ saveData: true, effectiveType: '4g' });
    expect(isDataSaverActive()).toBe(true);
  });

  it('returns true when effectiveType=slow-2g', () => {
    mockConnection({ saveData: false, effectiveType: 'slow-2g' });
    expect(isDataSaverActive()).toBe(true);
  });

  it('returns true when effectiveType=2g', () => {
    mockConnection({ saveData: false, effectiveType: '2g' });
    expect(isDataSaverActive()).toBe(true);
  });

  it('returns false when saveData=false and effectiveType=4g', () => {
    mockConnection({ saveData: false, effectiveType: '4g' });
    expect(isDataSaverActive()).toBe(false);
  });

  it('returns false when connection API absent', () => {
    mockConnection(null);
    expect(isDataSaverActive()).toBe(false);
  });
});

describe('readNetworkInfo', () => {
  it('exposes all connection fields', () => {
    mockConnection({ saveData: true, effectiveType: '3g', downlink: 1.2, rtt: 300 });
    const info = readNetworkInfo();
    expect(info.saveData).toBe(true);
    expect(info.effectiveType).toBe('3g');
    expect(info.downlink).toBe(1.2);
    expect(info.rtt).toBe(300);
  });

  it('returns null fields when API absent', () => {
    mockConnection(null);
    const info = readNetworkInfo();
    expect(info.saveData).toBe(false);
    expect(info.effectiveType).toBeNull();
    expect(info.downlink).toBeNull();
    expect(info.rtt).toBeNull();
  });
});
