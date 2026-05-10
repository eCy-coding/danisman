import { z } from 'zod';
import { Logger } from '../lib/logger';

// Define constraints for storage keys to avoid typos
export const STORAGE_KEYS = {
  SESSIONS: 'ecypro_sessions',
  SETTINGS: 'ecypro_settings',
  ROI_CALCULATOR: 'ecypro_roi_calc',
} as const;

// Generic wrapper for LocalStorage with Zod validation
export class LocalPersistenceService {
  /**
   * Saves data to LocalStorage with JSON serialization.
   * @param key Storage key
   * @param data Data to save
   */
  static save<T>(key: string, data: T): void {
    try {
      const serialized = JSON.stringify(data);
      localStorage.setItem(key, serialized);
    } catch (error) {
      Logger.error(`LocalPersistenceService Error: Failed to save to ${key}`, error);
    }
  }

  // Alias for setItem to match usage in ConsultingModule
  static setItem<T>(key: string, data: T): void {
    this.save(key, data);
  }

  /**
   * Loads data from LocalStorage and validates it against a Zod schema.
   * Returns default value if validation fails or data is missing.
   * @param key Storage key
   * @param schema Zod schema for validation
   * @param defaultValue Default value if not found/invalid
   */
  static load<T>(key: string, schema: z.ZodType<T>, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      if (!item) return defaultValue;

      const parsed = JSON.parse(item);
      const result = schema.safeParse(parsed);

      if (!result.success) {
        Logger.warn(
          `LocalPersistenceService Warning: Data for ${key} invalid, using default.`,
          result.error,
        );
        return defaultValue;
      }

      return result.data;
    } catch (error) {
      Logger.error(`LocalPersistenceService Error: Failed to load from ${key}`, error);
      return defaultValue;
    }
  }

  // Alias for getItem (needs to be generic/inferred, but easier to just use load with schema in component if possible, or cast here)
  // To avoid breaking component signature requesting generic:
  static getItem<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;
      return JSON.parse(item) as T;
    } catch (_e) {
      return null;
    }
  }

  /**
   * Removes item from storage.
   */
  static remove(key: string): void {
    localStorage.removeItem(key);
  }
}

// --- Domain Schemas ---

export const SessionSchema = z.object({
  id: z.string(),
  // Allow 'client' OR 'clientId' to match different usages if needed, picking one standard is better.
  // Component uses clientId, mock uses client.
  clientId: z
    .string()
    .min(2, 'Müşteri adı en az 2 karakter olmalıdır.')
    .optional()
    .or(z.literal('')),
  client: z.string().optional(),

  type: z.string().optional(),
  date: z.string().optional(), // YYYY-MM-DD
  time: z.string().optional(), // HH:MM

  // Mixed English/Turkish status support
  status: z.enum(['Planlandı', 'Tamamlandı', 'Beklemede', 'active', 'completed', 'pending']),

  notes: z.string().optional(),
  startTime: z.number().optional(),
  endTime: z.number().optional(),
  duration: z.number().optional(),
});

export type Session = z.infer<typeof SessionSchema>;
