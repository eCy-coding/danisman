/**
 * P16 — Language-aware Zod error map.
 *
 * Zod v4 introduced `z.config({ customError })` for global issue-to-message
 * translation. We hook it once at module load via `installZodI18n()`. The
 * function consults the i18next instance at *invocation* time, so the active
 * language is always honored without re-installing on `languageChanged`.
 *
 * Strategy:
 *   • If a schema provides its own `{ message: 'forms:errors.something' }` or
 *     `{ message: 'contact.form.name_min' }`, that wins (issue.message is set).
 *   • Otherwise, the issue.code → i18n key map below kicks in, falling back to
 *     `forms:errors.custom` if no match.
 *
 * The map is centralized here so namespaces like `forms:errors.*` are the
 * single source of truth for default validation copy.
 */

import { z } from 'zod';
import i18n from '../i18n-react';

type Issue = z.core.$ZodIssue;

/** Resolve "forms:errors.X" key with current language. Defensive (returns key
 *  itself if i18n hasn't loaded). */
function tt(key: string, vars?: Record<string, unknown>): string {
  try {
    const out = i18n.t(key, vars);
    // i18next returns the key when missing — surface it so devs notice.
    return typeof out === 'string' ? out : key;
  } catch {
    return key;
  }
}

function originLabel(issue: Issue): string {
  // origin: 'string' | 'number' | 'array' | 'date' | ...
  const origin = (issue as { origin?: string }).origin ?? 'unknown';
  return origin;
}

function mapIssue(issue: Issue): string {
  const code = issue.code;

  switch (code) {
    case 'invalid_type': {
      const received = (issue as { received?: string }).received;
      if (received === 'undefined' || received === 'null') {
        return tt('forms:errors.required');
      }
      return tt('forms:errors.invalid_type');
    }
    case 'too_small': {
      const origin = originLabel(issue);
      const minimum = (issue as { minimum?: number | bigint }).minimum ?? 0;
      const key =
        origin === 'string'
          ? Number(minimum) === 1
            ? 'forms:errors.too_small_string_one'
            : 'forms:errors.too_small_string'
          : origin === 'number'
            ? 'forms:errors.too_small_number'
            : origin === 'array' || origin === 'set'
              ? 'forms:errors.too_small_array'
              : origin === 'date'
                ? 'forms:errors.too_small_date'
                : 'forms:errors.too_small_string';
      return tt(key, { minimum: String(minimum) });
    }
    case 'too_big': {
      const origin = originLabel(issue);
      const maximum = (issue as { maximum?: number | bigint }).maximum ?? 0;
      const key =
        origin === 'string'
          ? 'forms:errors.too_big_string'
          : origin === 'number'
            ? 'forms:errors.too_big_number'
            : origin === 'array' || origin === 'set'
              ? 'forms:errors.too_big_array'
              : origin === 'date'
                ? 'forms:errors.too_big_date'
                : 'forms:errors.too_big_string';
      return tt(key, { maximum: String(maximum) });
    }
    case 'invalid_format': {
      const format = (issue as { format?: string }).format;
      if (format === 'email') return tt('forms:errors.invalid_email');
      if (format === 'url') return tt('forms:errors.invalid_url');
      if (format === 'uuid') return tt('forms:errors.invalid_uuid');
      return tt('forms:errors.invalid_string');
    }
    case 'invalid_value': {
      // enum / literal mismatches
      const values = (issue as { values?: unknown[] }).values;
      if (Array.isArray(values) && values.length === 1) {
        return tt('forms:errors.invalid_literal', { expected: String(values[0]) });
      }
      return tt('forms:errors.invalid_enum');
    }
    case 'not_multiple_of':
    case 'invalid_union':
    case 'invalid_key':
    case 'invalid_element':
    case 'unrecognized_keys':
    case 'custom':
    default:
      return tt('forms:errors.custom');
  }
}

let installed = false;

/**
 * Install the global zod error map. Idempotent (calling twice is a no-op).
 *
 * Call once from the i18n bootstrap — `createForm`'s factory module does this
 * via side-effect import.
 */
export function installZodI18n(): void {
  if (installed) return;
  installed = true;
  z.config({
    customError: (issue) => mapIssue(issue as Issue),
  });
}
