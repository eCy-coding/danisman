import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { cn } from '../../../lib/utils';

const REQUEST_TYPES = [
  { value: 'ACCESS', label: 'Erişim' },
  { value: 'RECTIFICATION', label: 'Düzeltme' },
  { value: 'ERASURE', label: 'Silme' },
  { value: 'RESTRICTION', label: 'Kısıtlama' },
  { value: 'PORTABILITY', label: 'Taşınabilirlik' },
  { value: 'OBJECTION', label: 'İtiraz' },
  { value: 'AUTOMATED_DECISION', label: 'Otomatik Karar' },
] as const;

const schema = z.object({
  requesterEmail: z.string().email('Geçerli bir e-posta giriniz.'),
  requesterName: z.string().min(1, 'Ad Soyad zorunlu.').max(200),
  requestType: z.enum([
    'ACCESS',
    'RECTIFICATION',
    'ERASURE',
    'RESTRICTION',
    'PORTABILITY',
    'OBJECTION',
    'AUTOMATED_DECISION',
  ]),
  description: z.string().max(5000).optional(),
});

type FormValues = z.infer<typeof schema>;

interface DSARRequestFormProps {
  onSubmit: (data: FormValues) => void;
  loading?: boolean;
}

export function DSARRequestForm({ onSubmit, loading = false }: DSARRequestFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const handleFormSubmit = (data: FormValues) => {
    onSubmit(data);
    reset();
  };

  const inputClass = cn(
    'w-full rounded-lg border border-white/10 bg-white/5 px-fib-4 py-fib-3',
    'text-sm text-white placeholder-gray-500',
    'focus:outline-none focus:ring-1 focus:ring-blue-500/60',
    'disabled:opacity-50',
  );

  const errorClass = 'text-xs text-red-400 mt-1';

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col gap-fib-5">
      <div>
        <label htmlFor="requesterName" className="block text-sm font-medium text-gray-300 mb-1">
          İlgili Kişi Adı <span className="text-red-400">*</span>
        </label>
        <input
          id="requesterName"
          {...register('requesterName')}
          type="text"
          placeholder="Ad Soyad"
          disabled={loading}
          className={inputClass}
        />
        {errors.requesterName && <p className={errorClass}>{errors.requesterName.message}</p>}
      </div>

      <div>
        <label htmlFor="requesterEmail" className="block text-sm font-medium text-gray-300 mb-1">
          E-posta <span className="text-red-400">*</span>
        </label>
        <input
          id="requesterEmail"
          {...register('requesterEmail')}
          type="email"
          placeholder="ilgili@ornek.com"
          disabled={loading}
          className={inputClass}
        />
        {errors.requesterEmail && <p className={errorClass}>{errors.requesterEmail.message}</p>}
      </div>

      <div>
        <label htmlFor="requestType" className="block text-sm font-medium text-gray-300 mb-1">
          Başvuru Türü <span className="text-red-400">*</span>
        </label>
        <select
          id="requestType"
          {...register('requestType')}
          disabled={loading}
          className={cn(inputClass, 'cursor-pointer')}
        >
          <option value="" className="bg-gray-900">
            Seçiniz...
          </option>
          {REQUEST_TYPES.map((type) => (
            <option key={type.value} value={type.value} className="bg-gray-900">
              {type.label}
            </option>
          ))}
        </select>
        {errors.requestType && <p className={errorClass}>{errors.requestType.message}</p>}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">
          Açıklama
        </label>
        <textarea
          id="description"
          {...register('description')}
          rows={4}
          placeholder="Başvuru detayları..."
          disabled={loading}
          className={cn(inputClass, 'resize-y')}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className={cn(
          'rounded-lg px-fib-5 py-fib-3 text-sm font-medium',
          'bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white',
          'transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
        )}
      >
        {loading ? 'Kaydediliyor…' : 'Başvuruyu Kaydet'}
      </button>
    </form>
  );
}
