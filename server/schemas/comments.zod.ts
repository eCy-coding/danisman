import { z } from 'zod';

export const createCommentSchema = z.object({
  authorName: z.string().min(2, 'İsim en az 2 karakter olmalıdır').max(100),
  authorEmail: z.string().email('Geçerli bir e-posta adresi giriniz'),
  bodyMd: z.string().min(10, 'Yorum en az 10 karakter olmalıdır').max(5000),
  parentId: z.string().cuid().optional(),
  kvkkConsent: z.literal(true, { error: 'KVKK onayı zorunludur' }),
});

export const moderateCommentSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED', 'SPAM']),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type ModerateCommentInput = z.infer<typeof moderateCommentSchema>;
