import React from 'react';
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { Card } from '@/components/ui/Card';

export interface ROIData {
  revenue: string;
  efficiencyGain: string;
  cost: string;
}

interface CalculatorInputsProps {
  register: UseFormRegister<ROIData>;
  errors: FieldErrors<ROIData>;
}

export const CalculatorInputs: React.FC<CalculatorInputsProps> = ({ register, errors }) => {
  const revenueId = React.useId();
  const efficiencyId = React.useId();
  const costId = React.useId();

  return (
    <Card className="p-6 space-y-4 bg-white/5 backdrop-blur-sm border-white/10">
      <h3 className="text-xl font-bold text-white mb-4">Proje Verileriniz</h3>

      <div className="space-y-2">
        <label htmlFor={revenueId} className="text-sm font-medium text-gray-300">
          Yıllık Cironuz (₺)
        </label>
        <input
          id={revenueId}
          type="number"
          inputMode="numeric"
          {...register('revenue', { required: true, min: 0 })}
          className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          placeholder="Örn: 1000000"
          aria-required="true"
          aria-invalid={errors.revenue ? 'true' : 'false'}
          aria-describedby={errors.revenue ? `${revenueId}-error` : undefined}
        />
        {errors.revenue && (
          <span id={`${revenueId}-error`} role="alert" className="text-red-400 text-xs">
            Bu alan zorunludur.
          </span>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor={efficiencyId} className="text-sm font-medium text-gray-300">
          Hedeflenen Verimlilik Artışı (%)
        </label>
        <div className="relative">
          <input
            id={efficiencyId}
            type="number"
            inputMode="numeric"
            step="1"
            max="100"
            {...register('efficiencyGain', { required: true, min: 1, max: 100 })}
            className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:ring-2 focus:ring-green-500 outline-none transition-all"
            placeholder="Örn: 20"
            aria-required="true"
            aria-invalid={errors.efficiencyGain ? 'true' : 'false'}
            aria-describedby={errors.efficiencyGain ? `${efficiencyId}-error` : undefined}
          />
          <span className="absolute right-4 top-3 text-gray-400 font-bold" aria-hidden="true">
            %
          </span>
        </div>
        {errors.efficiencyGain && (
          <span id={`${efficiencyId}-error`} role="alert" className="text-red-400 text-xs">
            1 ile 100 arasında bir değer girin.
          </span>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor={costId} className="text-sm font-medium text-gray-300">
          Tahmini Danışmanlık Bütçesi (₺)
        </label>
        <input
          id={costId}
          type="number"
          inputMode="numeric"
          {...register('cost', { required: true, min: 0 })}
          className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all"
          placeholder="Örn: 50000"
          aria-required="true"
          aria-invalid={errors.cost ? 'true' : 'false'}
          aria-describedby={errors.cost ? `${costId}-error` : undefined}
        />
        {errors.cost && (
          <span id={`${costId}-error`} role="alert" className="text-red-400 text-xs">
            Bu alan zorunludur.
          </span>
        )}
      </div>

      <p className="text-xs text-slate-400 mt-2">* Tahminler sadece bilgi amaçlıdır.</p>
    </Card>
  );
};
