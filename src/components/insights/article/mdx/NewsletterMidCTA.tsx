import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { cn } from '@/lib/utils';

const schema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi girin'),
  kvkk: z.literal(true, { message: 'KVKK onayı zorunludur' }),
});

type FormData = z.infer<typeof schema>;

interface NewsletterMidCTAProps {
  className?: string;
}

export function NewsletterMidCTA({ className }: NewsletterMidCTAProps) {
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (_data: FormData) => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div
        className={cn(
          'my-fib-7 rounded-xl bg-amber-50 border border-amber-200 p-fib-6 text-center',
          className,
        )}
        data-testid="newsletter-mid-cta-success"
      >
        <p className="font-semibold text-amber-800">Abone oldunuz!</p>
        <p className="text-sm text-amber-700 mt-1">Her hafta Founder Letter posta kutunuzda.</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'my-fib-7 rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-fib-6',
        className,
      )}
      data-testid="newsletter-mid-cta"
    >
      <h3 className="font-bold text-slate-800 text-base mb-1">Founder Letter</h3>
      <p className="text-sm text-slate-600 mb-fib-5">
        Her hafta M&A, ESG ve aile şirketi dünyasından seçkiler. Emre Can Yalçın yazıyor.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-fib-3" noValidate>
        <div className="flex gap-fib-3">
          <input
            {...register('email')}
            type="email"
            placeholder="e-posta adresiniz"
            className={cn(
              'flex-1 rounded-lg border px-fib-4 py-fib-3 text-sm',
              'border-slate-300 bg-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500',
              errors.email && 'border-red-400',
            )}
            aria-label="E-posta adresi"
            aria-invalid={!!errors.email}
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-amber-500 px-fib-5 py-fib-3 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50 transition-colors"
          >
            Abone ol
          </button>
        </div>

        {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}

        <label className="flex items-start gap-fib-3 cursor-pointer">
          <input
            {...register('kvkk')}
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500"
            aria-label="KVKK onayı"
          />
          <span className="text-xs text-slate-500">
            <span className="inline-flex items-center gap-1 font-semibold text-slate-600 mr-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              KVKK
            </span>
            kapsamında verilerimin işlenmesine onay veriyorum. İstediğim zaman çıkabilirim.
          </span>
        </label>
        {errors.kvkk && <p className="text-xs text-red-600">{errors.kvkk.message}</p>}
      </form>
    </div>
  );
}
