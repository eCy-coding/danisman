import { z } from 'zod';

/**
 * P44-T06 — Centralized DSAR request schema.
 *
 * Previously inline in `components/admin/dsar/DSARRequestForm.tsx`. Migrated to
 * this canonical location per Sprint 11 form-drift remediation (NLM Standards
 * vault: "createForm bypass = standart ihlali").
 *
 * Mesajlar i18n key path (`admin.dsar.form.*`). UI tarafında `t(errors.x.message)`
 * ile çözülür; eşleme yoksa key kendisi gösterilir (createForm zod-error-map
 * default'u — `src/lib/forms/zod-error-map.ts`).
 *
 * KVKK m.11 (İlgili kişinin hakları) + GDPR Art. 15-22 (DSAR rights):
 *   - ACCESS              → erişim (right to access)
 *   - RECTIFICATION       → düzeltme (right to rectification)
 *   - ERASURE             → silme (right to erasure / "to be forgotten")
 *   - RESTRICTION         → işlemenin kısıtlanması (restriction)
 *   - PORTABILITY         → veri taşınabilirliği (data portability)
 *   - OBJECTION           → işlemeye itiraz (objection)
 *   - AUTOMATED_DECISION  → otomatik karara itiraz (automated decision-making)
 */

export const DSAR_REQUEST_TYPES = [
  'ACCESS',
  'RECTIFICATION',
  'ERASURE',
  'RESTRICTION',
  'PORTABILITY',
  'OBJECTION',
  'AUTOMATED_DECISION',
] as const;

export type DSARRequestType = (typeof DSAR_REQUEST_TYPES)[number];

/** UI label mapping — Türkçe; çeviri için i18n namespace `admin.dsar.types.*`. */
export const DSAR_REQUEST_TYPE_LABELS: Record<DSARRequestType, string> = {
  ACCESS: 'Erişim',
  RECTIFICATION: 'Düzeltme',
  ERASURE: 'Silme',
  RESTRICTION: 'Kısıtlama',
  PORTABILITY: 'Taşınabilirlik',
  OBJECTION: 'İtiraz',
  AUTOMATED_DECISION: 'Otomatik Karar',
};

export const dsarRequestSchema = z.object({
  requesterName: z
    .string()
    .min(1, { message: 'admin.dsar.form.name_required' })
    .max(200, { message: 'admin.dsar.form.name_max' }),
  requesterEmail: z.string().email({ message: 'admin.dsar.form.invalid_email' }),
  requestType: z.enum(DSAR_REQUEST_TYPES, {
    message: 'admin.dsar.form.type_required',
  }),
  description: z.string().max(5000, { message: 'admin.dsar.form.description_max' }).optional(),
  // P15 — Honeypot: bot trap. Off-screen + aria-hidden in UI.
  hp_field: z.string().optional(),
});

export type DSARRequestFormData = z.infer<typeof dsarRequestSchema>;
