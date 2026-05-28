import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ShieldCheck, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NewsletterSidebarProps {
  variant?: 'sidebar' | 'inline';
}

const schema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi girin'),
  kvkk: z.boolean().refine((val) => val === true, {
    message: 'KVKK onayı zorunludur',
  }),
});

type FormValues = z.infer<typeof schema>;

export function NewsletterSidebar({ variant = 'sidebar' }: NewsletterSidebarProps) {
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', kvkk: false },
  });

  async function onSubmit(_data: FormValues) {
    await new Promise((r) => setTimeout(r, 600));
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div
        className={cn(
          'rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center',
          variant === 'sidebar' && 'sticky top-20',
        )}
        data-testid="newsletter-success"
      >
        <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-3" />
        <p className="font-semibold text-emerald-800 mb-1">Abone oldunuz!</p>
        <p className="text-sm text-emerald-700">İlk Founder Letter'ı yakında alacaksınız.</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-xl border border-amber-200 overflow-hidden',
        variant === 'sidebar' && 'sticky top-20',
        variant === 'inline' && 'max-w-2xl mx-auto',
      )}
      data-testid="newsletter-sidebar"
    >
      <div className="bg-amber-600 px-6 py-5">
        <h3 className="text-white font-bold text-lg mb-1">Founder Letter</h3>
        <p className="text-amber-100 text-sm">
          Her hafta M&A, ESG ve aile şirketi dünyasından seçkileri Emre Can Yalçın yazıyor.
        </p>
      </div>

      <div className="bg-white px-6 py-5">
        <form onSubmit={handleSubmit(onSubmit)} noValidate data-testid="newsletter-form">
          <div className="mb-3">
            <input
              {...register('email')}
              type="email"
              placeholder="e-posta adresiniz"
              autoComplete="email"
              className={cn(
                'w-full px-4 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400',
                errors.email ? 'border-red-400' : 'border-slate-200',
              )}
              data-testid="newsletter-email-input"
            />
            {errors.email && (
              <p className="text-xs text-red-500 mt-1" data-testid="email-error">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="mb-4">
            <label className="flex items-start gap-2 cursor-pointer" data-testid="kvkk-consent">
              <input
                {...register('kvkk')}
                type="checkbox"
                className="mt-0.5 rounded border-slate-300 text-amber-600 focus:ring-amber-400"
                data-testid="kvkk-checkbox"
              />
              <span className="text-xs text-slate-600 leading-relaxed">
                <ShieldCheck className="inline w-3.5 h-3.5 text-emerald-600 mr-1" />
                KVKK opt-in — kişisel verilerimin işlenmesini kabul ediyorum. İstediğim zaman
                abonelikten çıkabilirim.
              </span>
            </label>
            {errors.kvkk && (
              <p className="text-xs text-red-500 mt-1" data-testid="kvkk-error">
                {errors.kvkk.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={cn(
              'w-full py-2.5 rounded-lg text-sm font-semibold transition-colors',
              'bg-amber-600 text-white hover:bg-amber-700',
              'disabled:opacity-60 disabled:cursor-not-allowed',
              'flex items-center justify-center gap-2',
            )}
            data-testid="newsletter-submit-btn"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Abone ol
          </button>
        </form>

        <p
          className="text-xs text-slate-400 mt-3 flex items-center gap-1.5"
          data-testid="kvkk-badge"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          KVKK opt-in — istediğiniz zaman çıkabilirsiniz
        </p>
      </div>
    </div>
  );
}
