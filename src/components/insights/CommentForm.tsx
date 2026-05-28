import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const commentSchema = z.object({
  authorName: z.string().min(2, 'İsim en az 2 karakter olmalıdır').max(100),
  authorEmail: z.string().email('Geçerli bir e-posta adresi giriniz'),
  bodyMd: z.string().min(10, 'Yorum en az 10 karakter olmalıdır').max(5000),
  kvkkConsent: z.literal(true, { error: 'KVKK onayı zorunludur' }),
});

type CommentFormData = z.infer<typeof commentSchema>;

interface CommentFormProps {
  postId: string;
  parentId?: string;
  onSuccess: () => void;
}

export function CommentForm({ postId, parentId, onSuccess }: CommentFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema),
    defaultValues: { kvkkConsent: undefined as unknown as true },
  });

  const onSubmit = async (data: CommentFormData) => {
    setSubmitting(true);
    setServerError(null);

    try {
      const res = await fetch(`/api/v1/insights/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, parentId }),
      });

      if (res.status === 429) {
        setServerError('Çok fazla yorum gönderdiniz. Lütfen bir süre bekleyiniz.');
        return;
      }

      if (!res.ok) {
        const body = await res.json();
        setServerError(body.message ?? 'Yorum gönderilemedi. Lütfen tekrar deneyin.');
        return;
      }

      reset();
      onSuccess();
    } catch {
      setServerError('Bağlantı hatası. Lütfen tekrar deneyin.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate aria-label="Yorum formu">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label
            htmlFor={`name-${parentId ?? 'root'}`}
            className="block text-sm text-neutral-400 mb-1"
          >
            İsim{' '}
            <span aria-hidden="true" className="text-red-400">
              *
            </span>
          </label>
          <input
            id={`name-${parentId ?? 'root'}`}
            type="text"
            autoComplete="name"
            aria-required="true"
            aria-describedby={errors.authorName ? `name-error-${parentId ?? 'root'}` : undefined}
            className="w-full bg-neutral-800 border border-neutral-700 rounded px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-amber-500"
            {...register('authorName')}
          />
          {errors.authorName && (
            <p
              id={`name-error-${parentId ?? 'root'}`}
              role="alert"
              className="text-xs text-red-400 mt-1"
            >
              {errors.authorName.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor={`email-${parentId ?? 'root'}`}
            className="block text-sm text-neutral-400 mb-1"
          >
            E-posta{' '}
            <span aria-hidden="true" className="text-red-400">
              *
            </span>
          </label>
          <input
            id={`email-${parentId ?? 'root'}`}
            type="email"
            autoComplete="email"
            aria-required="true"
            aria-describedby={errors.authorEmail ? `email-error-${parentId ?? 'root'}` : undefined}
            className="w-full bg-neutral-800 border border-neutral-700 rounded px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-amber-500"
            {...register('authorEmail')}
          />
          {errors.authorEmail && (
            <p
              id={`email-error-${parentId ?? 'root'}`}
              role="alert"
              className="text-xs text-red-400 mt-1"
            >
              {errors.authorEmail.message}
            </p>
          )}
        </div>
      </div>

      <div className="mb-4">
        <label
          htmlFor={`body-${parentId ?? 'root'}`}
          className="block text-sm text-neutral-400 mb-1"
        >
          Yorumunuz{' '}
          <span aria-hidden="true" className="text-red-400">
            *
          </span>
        </label>
        <textarea
          id={`body-${parentId ?? 'root'}`}
          rows={4}
          aria-required="true"
          aria-describedby={errors.bodyMd ? `body-error-${parentId ?? 'root'}` : undefined}
          className="w-full bg-neutral-800 border border-neutral-700 rounded px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-amber-500 resize-y min-h-[100px]"
          {...register('bodyMd')}
        />
        {errors.bodyMd && (
          <p
            id={`body-error-${parentId ?? 'root'}`}
            role="alert"
            className="text-xs text-red-400 mt-1"
          >
            {errors.bodyMd.message}
          </p>
        )}
      </div>

      {/* KVKK consent — ZORUNLU, formun tepesinde değil kullanıcı okuduktan sonra */}
      <div className="mb-4 p-4 bg-neutral-800/50 border border-neutral-700 rounded-lg">
        <fieldset>
          <legend className="text-sm font-medium text-neutral-300 mb-2">Kişisel Veri İzni</legend>
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              aria-required="true"
              aria-describedby={errors.kvkkConsent ? `kvkk-error-${parentId ?? 'root'}` : undefined}
              className="mt-0.5 h-4 w-4 rounded border-neutral-600 bg-neutral-700 text-amber-500 focus:ring-amber-500 focus:ring-offset-neutral-900"
              {...register('kvkkConsent')}
            />
            <span className="text-sm text-neutral-400 leading-snug group-hover:text-neutral-300 transition-colors">
              Kişisel verilerimin (isim, e-posta) KVKK kapsamında işlenmesine, yorumuma eklenmesine
              ve 90 gün boyunca saklanmasına onay veriyorum.{' '}
              <a
                href="/gizlilik"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-400 hover:underline"
              >
                Gizlilik Politikası
              </a>
            </span>
          </label>
          {errors.kvkkConsent && (
            <p
              id={`kvkk-error-${parentId ?? 'root'}`}
              role="alert"
              className="text-xs text-red-400 mt-2"
            >
              {errors.kvkkConsent.message}
            </p>
          )}
        </fieldset>
      </div>

      {serverError && (
        <div
          role="alert"
          className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded text-sm text-red-300"
        >
          {serverError}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="px-6 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-neutral-900 font-semibold text-sm rounded transition-colors"
      >
        {submitting ? 'Gönderiliyor…' : 'Yorum Gönder'}
      </button>

      <p className="mt-3 text-xs text-neutral-500">
        Yorumlar moderasyon onayı sonrası yayınlanır. E-posta adresiniz kamuya gösterilmez.
      </p>
    </form>
  );
}
