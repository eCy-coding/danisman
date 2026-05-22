import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LocalPersistenceService } from '../services/persistence';
import { z } from 'zod';

const TestSchema = z.object({
  id: z.number(),
  val: z.string(),
});

describe('LocalPersistenceService', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should save data correctly', () => {
    const data = { id: 1, val: 'test' };
    LocalPersistenceService.save('test_key', data);
    expect(localStorage.getItem('test_key')).toBe(JSON.stringify(data));
  });

  it('should load valid data correctly', () => {
    const data = { id: 1, val: 'test' };
    localStorage.setItem('test_key', JSON.stringify(data));
    const result = LocalPersistenceService.load('test_key', TestSchema, { id: 0, val: 'default' });
    expect(result).toEqual(data);
  });

  it('should return default value for missing data', () => {
    const defaultValue = { id: 0, val: 'default' };
    const result = LocalPersistenceService.load('missing_key', TestSchema, defaultValue);
    expect(result).toEqual(defaultValue);
  });

  it('should return default value for invalid data', () => {
    localStorage.setItem('test_key', JSON.stringify({ id: 'invalid', val: 123 }));
    const defaultValue = { id: 0, val: 'default' };
    const result = LocalPersistenceService.load('test_key', TestSchema, defaultValue);
    expect(result).toEqual(defaultValue);
  });

  it('should remove data correctly', () => {
    localStorage.setItem('test_key', 'value');
    LocalPersistenceService.remove('test_key');
    expect(localStorage.getItem('test_key')).toBeNull();
  });
});
