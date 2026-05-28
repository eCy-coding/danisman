import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

const commentSchema = z.object({
  name: z.string().min(2, 'Adınızı girin'),
  email: z.string().email('Geçerli bir e-posta girin'),
  body: z.string().min(10, 'En az 10 karakter yazın'),
  kvkk: z.literal(true, { message: 'KVKK onayı zorunludur' }),
});

type CommentFormData = z.infer<typeof commentSchema>;

interface CommentsSectionProps {
  postId: string;
  commentCount: number;
  className?: string;
}

export function CommentsSection({
  postId: _postId,
  commentCount,
  className,
}: CommentsSectionProps) {
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CommentFormData>({ resolver: zodResolver(commentSchema) });

  const onSubmit = async (_data: CommentFormData) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    setSubmitted(true);
  };

  return (
    <section className={cn('', className)} aria-label="Yorumlar" data-testid="comments-section">
      <h2 className="text-lg font-bold text-slate-800 mb-fib-3">
        Yorumlar <span className="text-slate-400 font-normal text-base">({commentCount})</span>
      </h2>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-fib-5 mb-fib-6 flex flex-wrap items-center justify-between gap-fib-4">
        <div>
          <p className="font-semibold text-slate-800 text-sm">Yorum yerine Founder ile konuş</p>
          <p className="text-xs text-slate-600">
            Doğrudan Emre Can Yalçın ile keşif görüşmesi yapın.
          </p>
        </div>
        <Link
          to="/discovery"
          className="inline-flex items-center gap-fib-2 rounded-lg bg-amber-500 px-fib-5 py-fib-3 text-sm font-bold text-white hover:bg-amber-600 transition-colors whitespace-nowrap"
          data-testid="discovery-cta-link"
        >
          Founder ile konuş →
        </Link>
      </div>

      {submitted ? (
        <div
          className="rounded-xl border border-emerald-200 bg-emerald-50 p-fib-6 text-center"
          data-testid="comment-submitted"
        >
          <p className="font-semibold text-emerald-800">Yorumunuz alındı!</p>
          <p className="text-sm text-emerald-700 mt-1">Onaylandıktan sonra yayımlanacak.</p>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-fib-4 rounded-xl border border-slate-200 bg-white p-fib-6"
          noValidate
          data-testid="comment-form"
        >
          <h3 className="font-semibold text-slate-800">Yorum yaz</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-fib-4">
            <div>
              <label
                htmlFor="comment-name"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Adınız
              </label>
              <input
                {...register('name')}
                id="comment-name"
                type="text"
                className={cn(
                  'w-full rounded-lg border px-fib-4 py-fib-3 text-sm',
                  'border-slate-300 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500',
                  errors.name && 'border-red-400',
                )}
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? 'comment-name-error' : undefined}
              />
              {errors.name && (
                <p id="comment-name-error" className="text-xs text-red-600 mt-1">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="comment-email"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                E-posta
              </label>
              <input
                {...register('email')}
                id="comment-email"
                type="email"
                className={cn(
                  'w-full rounded-lg border px-fib-4 py-fib-3 text-sm',
                  'border-slate-300 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500',
                  errors.email && 'border-red-400',
                )}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'comment-email-error' : undefined}
              />
              {errors.email && (
                <p id="comment-email-error" className="text-xs text-red-600 mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="comment-body" className="block text-sm font-medium text-slate-700 mb-1">
              Yorumunuz
            </label>
            <textarea
              {...register('body')}
              id="comment-body"
              rows={4}
              className={cn(
                'w-full rounded-lg border px-fib-4 py-fib-3 text-sm resize-y',
                'border-slate-300 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500',
                errors.body && 'border-red-400',
              )}
              aria-invalid={!!errors.body}
              aria-describedby={errors.body ? 'comment-body-error' : undefined}
            />
            {errors.body && (
              <p id="comment-body-error" className="text-xs text-red-600 mt-1">
                {errors.body.message}
              </p>
            )}
          </div>

          <label
            className="flex items-start gap-fib-3 cursor-pointer"
            data-testid="kvkk-consent-label"
          >
            <input
              {...register('kvkk')}
              type="checkbox"
              id="comment-kvkk"
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500"
              aria-label="KVKK onayı"
              data-testid="kvkk-consent-checkbox"
            />
            <span className="text-xs text-slate-500">
              <strong>KVKK</strong> kapsamında yorumumu yayımlamak amacıyla adım ve e-postamın
              işlenmesine onay veriyorum.
            </span>
          </label>
          {errors.kvkk && (
            <p className="text-xs text-red-600" data-testid="kvkk-error">
              {errors.kvkk.message}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-amber-500 px-fib-6 py-fib-3 text-sm font-bold text-white hover:bg-amber-600 disabled:opacity-50 transition-colors"
            data-testid="comment-submit-button"
          >
            {isSubmitting ? 'Gönderiliyor...' : 'Yorum gönder'}
          </button>
        </form>
      )}
    </section>
  );
}
