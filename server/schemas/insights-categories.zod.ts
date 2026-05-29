import { z } from 'zod';
import { Domain } from '@prisma/client';

const slugRegex = /^[a-z0-9-]+$/;

export const CreateCategorySchema = z.object({
  nameTr: z.string().min(2).max(120),
  nameEn: z.string().min(2).max(120).optional(),
  slug: z
    .string()
    .min(2)
    .max(150)
    .regex(slugRegex, 'Slug: sadece küçük harf, rakam, tire')
    .optional(),
  slugEn: z.string().min(2).max(150).regex(slugRegex).optional(),
  descTr: z.string().max(500).optional(),
  descEn: z.string().max(500).optional(),
  domain: z.nativeEnum(Domain),
  parentId: z.string().cuid().optional(),
  iconName: z.string().max(60).optional(),
  colorAccent: z.string().max(20).optional(),
  displayOrder: z.number().int().min(0).default(0),
});

export const UpdateCategorySchema = CreateCategorySchema.partial().extend({
  status: z.enum(['ACTIVE', 'ARCHIVED']).optional(),
});

export const ReorderCategorySchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().min(1),
        displayOrder: z.number().int().min(0),
      }),
    )
    .min(1),
});

export const CategoryListQuerySchema = z.object({
  domain: z.nativeEnum(Domain).optional(),
  status: z.enum(['ACTIVE', 'ARCHIVED']).optional(),
  parentId: z.string().optional(),
  search: z.string().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});
