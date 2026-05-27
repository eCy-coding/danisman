import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { cn } from '../../../lib/utils';

export interface NewBreachData {
  detectedAt: string;
  detectionSource: string;
  description: string;
  affectedDataCategories: string[];
  affectedSubjectsCount: number;
}

const DATA_CATEGORIES = [
  { value: 'KİMLİK', label: 'Kimlik' },
  { value: 'İLETİŞİM', label: 'İletişim' },
  { value: 'FİNANSAL', label: 'Finansal' },
  { value: 'ÖZEL_NİTELİKLİ', label: 'Özel Nitelikli' },
  { value: 'GÖRÜNTÜ', label: 'Görüntü' },
  { value: 'LOG', label: 'Log' },
  { value: 'ÇEREZ', label: 'Çerez' },
] as const;

const DETECTION_SOURCES = [
  { value: 'SIEM', label: 'SIEM' },
  { value: 'MANUAL', label: 'Manuel Tespit' },
  { value: 'AUDIT', label: 'Denetim' },
  { value: 'THIRD_PARTY', label: 'Üçüncü Taraf' },
] as const;

const schema = z.object({
  detectedAt: z.string().min(1, 'Tespit tarihi zorunlu.'),
  detectionSource: z.enum(['SIEM', 'MANUAL', 'AUDIT', 'THIRD_PARTY']),
  description: z.string().min(1, 'Açıklama zorunlu.').max(5000),
  affectedDataCategories: z.array(z.string()).min(1, 'En az bir veri kategorisi seçiniz.'),
  affectedSubjectsCount: z.number().int().min(0),
});

type FormValues = z.infer<typeof schema>;

interface BreachDetailFormProps {
  onSubmit: (data: NewBreachData) => void;
  loading: boolean;
}

export function BreachDetailForm({ onSubmit, loading }: BreachDetailFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      affectedDataCategories: [],
    },
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
  const labelClass = 'block text-sm font-medium text-gray-300 mb-1';

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col gap-fib-5">
      {/* detectedAt */}
      <div>
        <label htmlFor="breach-detectedAt" className={labelClass}>
          Tespit Tarihi <span className="text-red-400">*</span>
        </label>
        <input
          id="breach-detectedAt"
          {...register('detectedAt')}
          type="datetime-local"
          disabled={loading}
          className={inputClass}
          aria-label="Tespit Tarihi"
        />
        {errors.detectedAt && <p className={errorClass}>{errors.detectedAt.message}</p>}
      </div>

      {/* detectionSource */}
      <div>
        <label htmlFor="breach-detectionSource" className={labelClass}>
          Tespit Kaynağı <span className="text-red-400">*</span>
        </label>
        <select
          id="breach-detectionSource"
          {...register('detectionSource')}
          disabled={loading}
          className={cn(inputClass, 'cursor-pointer')}
          aria-label="Tespit Kaynağı"
        >
          <option value="" className="bg-gray-900">
            Seçiniz...
          </option>
          {DETECTION_SOURCES.map((src) => (
            <option key={src.value} value={src.value} className="bg-gray-900">
              {src.label}
            </option>
          ))}
        </select>
        {errors.detectionSource && <p className={errorClass}>{errors.detectionSource.message}</p>}
      </div>

      {/* description */}
      <div>
        <label htmlFor="breach-description" className={labelClass}>
          İhlal Açıklaması <span className="text-red-400">*</span>
        </label>
        <textarea
          id="breach-description"
          {...register('description')}
          rows={4}
          placeholder="İhlalin niteliği, nasıl gerçekleştiği..."
          disabled={loading}
          className={cn(inputClass, 'resize-y')}
          aria-label="İhlal Açıklaması"
        />
        {errors.description && <p className={errorClass}>{errors.description.message}</p>}
      </div>

      {/* affectedDataCategories */}
      <div>
        <p className={labelClass}>
          Etkilenen Veri Kategorileri <span className="text-red-400">*</span>
        </p>
        <Controller
          name="affectedDataCategories"
          control={control}
          render={({ field }) => (
            <div className="flex flex-wrap gap-fib-4">
              {DATA_CATEGORIES.map((cat) => {
                const checked = field.value.includes(cat.value);
                return (
                  <label
                    key={cat.value}
                    className={cn(
                      'inline-flex items-center gap-fib-2 cursor-pointer',
                      'rounded-lg px-fib-4 py-fib-2 border text-xs font-medium transition-colors',
                      checked
                        ? 'bg-blue-600/20 border-blue-500/60 text-blue-300'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10',
                      loading && 'pointer-events-none opacity-50',
                    )}
                  >
                    <input
                      type="checkbox"
                      value={cat.value}
                      checked={checked}
                      onChange={(e) => {
                        const next = e.target.checked
                          ? [...field.value, cat.value]
                          : field.value.filter((v) => v !== cat.value);
                        field.onChange(next);
                      }}
                      className="sr-only"
                      aria-label={cat.label}
                    />
                    {cat.label}
                  </label>
                );
              })}
            </div>
          )}
        />
        {errors.affectedDataCategories && (
          <p className={errorClass}>{errors.affectedDataCategories.message}</p>
        )}
      </div>

      {/* affectedSubjectsCount */}
      <div>
        <label htmlFor="breach-subjectsCount" className={labelClass}>
          Etkilenen Kişi Sayısı <span className="text-red-400">*</span>
        </label>
        <input
          id="breach-subjectsCount"
          {...register('affectedSubjectsCount', { valueAsNumber: true })}
          type="number"
          min={0}
          placeholder="0"
          disabled={loading}
          className={inputClass}
          aria-label="Etkilenen Kişi Sayısı"
        />
        {errors.affectedSubjectsCount && (
          <p className={errorClass}>{errors.affectedSubjectsCount.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className={cn(
          'rounded-lg px-fib-5 py-fib-3 text-sm font-medium',
          'bg-red-600 hover:bg-red-500 active:bg-red-700 text-white',
          'transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
        )}
      >
        {loading ? 'Kaydediliyor…' : 'İhlali Kaydet'}
      </button>
    </form>
  );
}
