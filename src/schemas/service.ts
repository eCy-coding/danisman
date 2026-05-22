import { z } from 'zod';
import { LucideIcon } from 'lucide-react';

// For simplicity and practicality with Lucide icons:
export const ServiceSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  category: z.enum([
    'isletme',
    'iktisat',
    'kamu',
    'uluslararasi',
    'maliye',
    'ekonometri',
    'calisma',
    'ybs',
  ]),
  description: z.string().min(10),
  icon: z.custom<LucideIcon>((val) => {
    return typeof val === 'function' || typeof val === 'object';
  }),
  link: z.string().startsWith('/'),
});

export type Service = z.infer<typeof ServiceSchema>;

export const ServiceListSchema = z.array(ServiceSchema);
