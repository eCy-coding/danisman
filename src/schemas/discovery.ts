import { z } from 'zod';

// Schema for /discovery lead-capture form (Discovery.tsx).
// Matches KVKK SAT-01 fields: name, email, company required; sector/headcount
// optional qualifiers; hp_field bot trap (must stay empty).
export const discoverySchema = z.object({
  name: z.string().min(2, { message: 'discovery.form.name_min' }),
  email: z.string().email({ message: 'discovery.form.invalid_email' }),
  company: z.string().min(1, { message: 'discovery.form.company_required' }),
  sector: z.string().optional(),
  headcount: z.string().optional(),
  description: z.string().max(1000, { message: 'discovery.form.description_max' }).optional(),
  kvkkConsent: z.boolean().refine((v) => v === true, {
    message: 'discovery.form.kvkk_required',
  }),
  hp_field: z.string().optional(),
});

export type DiscoveryFormData = z.infer<typeof discoverySchema>;

// Schema for /discovery-page form (DiscoveryPage.tsx) — different field set:
// revenue range + multi-select services[] instead of sector/headcount.
export const discoveryPageSchema = z.object({
  name: z.string().min(2, { message: 'discovery.form.name_min' }),
  email: z.string().email({ message: 'discovery.form.invalid_email' }),
  company: z.string().min(1, { message: 'discovery.form.company_required' }),
  revenue: z.string().optional(),
  services: z.array(z.string()).optional().default([]),
  message: z.string().optional(),
  kvkkConsent: z.boolean().refine((v) => v === true, {
    message: 'discovery.form.kvkk_required',
  }),
});

export type DiscoveryPageFormData = z.infer<typeof discoveryPageSchema>;
