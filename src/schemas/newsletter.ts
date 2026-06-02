import { z } from 'zod';

// Shared schema for newsletter / email-capture forms (NewsletterSection,
// NewsletterCapture, ExitIntentModal). Field name is `consent` to match the
// API body and existing component field names.
export const newsletterSchema = z.object({
  email: z.string().email({ message: 'newsletter.form.invalid_email' }),
  consent: z.boolean().refine((v) => v === true, {
    message: 'newsletter.form.consent_required',
  }),
});

export type NewsletterFormData = z.infer<typeof newsletterSchema>;
