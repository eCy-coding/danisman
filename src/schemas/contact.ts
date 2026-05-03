import { z } from 'zod';

export const contactSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  company: z.string().optional(),
  subject: z.union([
    z.literal('general'),
    z.literal('project'),
    z.literal('partnership'),
    z.literal('career'),
    z.literal('')
  ]).optional(),
  message: z.string().min(10, { message: 'Message must be at least 10 characters.' }),
});

export type ContactFormData = z.infer<typeof contactSchema>;
