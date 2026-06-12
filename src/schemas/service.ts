import { z } from 'zod';
import { LucideIcon } from 'lucide-react';

export const ServiceSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  category: z.enum(['ma', 'esg', 'fintech', 'aile', 'insan', 'risk', 'buyume']),
  description: z.string().min(10),
  icon: z.custom<LucideIcon>((val) => {
    return typeof val === 'function' || typeof val === 'object';
  }),
  link: z.string().startsWith('/'),
});

export type Service = z.infer<typeof ServiceSchema>;

export const ServiceListSchema = z.array(ServiceSchema);
