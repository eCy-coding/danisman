import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { NAMESPACES } from '../../lib/i18n-react';

const TR_PATH = resolve(__dirname, '../../../public/locales/tr/insights.json');
const EN_PATH = resolve(__dirname, '../../../public/locales/en/insights.json');

function flatKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) => {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      return flatKeys(v as Record<string, unknown>, fullKey);
    }
    return [fullKey];
  });
}

describe('insights i18n locale files', () => {
  it('TR locale file exists and has required top-level keys', () => {
    const raw = readFileSync(TR_PATH, 'utf-8');
    const data = JSON.parse(raw) as Record<string, unknown>;
    const requiredKeys = [
      'nav',
      'category',
      'tag',
      'series',
      'author',
      'archive',
      'search',
      'card',
      'breadcrumb',
      'newsletter',
    ];
    requiredKeys.forEach((k) => {
      expect(data[k], `TR missing top-level key: ${k}`).toBeDefined();
    });
  });

  it('EN locale file exists and has required top-level keys', () => {
    const raw = readFileSync(EN_PATH, 'utf-8');
    const data = JSON.parse(raw) as Record<string, unknown>;
    const requiredKeys = [
      'nav',
      'category',
      'tag',
      'series',
      'author',
      'archive',
      'search',
      'card',
      'breadcrumb',
      'newsletter',
    ];
    requiredKeys.forEach((k) => {
      expect(data[k], `EN missing top-level key: ${k}`).toBeDefined();
    });
  });

  it('TR and EN have key parity (same flat keys)', () => {
    const tr = JSON.parse(readFileSync(TR_PATH, 'utf-8')) as Record<string, unknown>;
    const en = JSON.parse(readFileSync(EN_PATH, 'utf-8')) as Record<string, unknown>;
    const trKeys = flatKeys(tr).sort();
    const enKeys = flatKeys(en).sort();
    expect(trKeys).toEqual(enKeys);
  });

  it('insights namespace is registered in NAMESPACES array', () => {
    expect(NAMESPACES).toContain('insights');
  });
});
