import { z } from 'zod';

// P15 — Mesajlar i18n key path (`contact.form.*`). UI tarafında
// `t(errors.x.message)` ile çözülür; eşleme yoksa key kendisi gösterilir.
export const contactSchema = z.object({
  name: z.string().min(2, { message: 'contact.form.name_min' }),
  email: z.string().email({ message: 'contact.form.invalid_email' }),
  company: z.string().optional(),
  subject: z
    .union([
      z.literal('general'),
      z.literal('project'),
      z.literal('partnership'),
      z.literal('career'),
      z.literal(''),
    ])
    .optional(),
  message: z.string().min(10, { message: 'contact.form.message_min' }),
  // Track B — KVKK explicit opt-in. Refines on `true` so the form blocks
  // submission until the consent checkbox is ticked.
  kvkkConsent: z.boolean().refine((v) => v === true, {
    message: 'contact.form.kvkk_required',
  }),
  // P15 — Honeypot: bot trap. Kullanıcılar tab'la atlar (off-screen + aria-hidden).
  hp_field: z.string().optional(),
});

export type ContactFormData = z.infer<typeof contactSchema>;
