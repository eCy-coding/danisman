import { z } from 'zod';

// Schema for the public KVKK / GDPR data-rights form (DataRightsPage.tsx).
// `kind` drives the URL path (/gdpr/export or /gdpr/delete); it is not sent
// in the request body. `hp_field` is the honeypot — valid submissions leave
// it empty.
export const dsarSchema = z.object({
  email: z.string().email({ message: 'dsar.form.invalid_email' }),
  reason: z.string().max(2000, { message: 'dsar.form.reason_max' }).optional(),
  hp_field: z.string().optional(),
  kind: z.enum(['export', 'delete']),
});

export type DsarFormData = z.infer<typeof dsarSchema>;
