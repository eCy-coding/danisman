/**
 * ROPADataCategoryPicker — KVKK veri kategorisi çoklu seçim bileşeni.
 *
 * Kullanıcı, ROPA kaydında işlenen veri kategorilerini bu bileşen
 * aracılığıyla seçer. Özel nitelikli veriler (OZEL_NITELIKLI) kırmızı
 * ile belirtilir — KVKK m.6 kapsamında ek dikkat gerektirir.
 */

import React from 'react';
import { cn } from '../../../lib/utils';

interface DataCategoryOption {
  value: string;
  label: string;
  sensitive?: boolean;
}

const DATA_CATEGORIES: DataCategoryOption[] = [
  { value: 'KIMLIK', label: 'Kimlik' },
  { value: 'ILETISIM', label: 'İletişim' },
  { value: 'FINANSAL', label: 'Finansal' },
  { value: 'DAVRANISSAL', label: 'Davranışsal' },
  { value: 'OZEL_NITELIKLI', label: 'Özel Nitelikli (m.6)', sensitive: true },
  { value: 'GORUNTU', label: 'Görüntü/Ses' },
  { value: 'IP', label: 'IP Adresi' },
  { value: 'LOG', label: 'Log' },
  { value: 'CEREZ', label: 'Çerez' },
  { value: 'CV', label: 'Özgeçmiş (CV)' },
  { value: 'SATIN_ALMA', label: 'Satın Alma' },
  { value: 'VERGI', label: 'Vergi' },
  { value: 'GORUSME_NOTU', label: 'Görüşme Notu' },
  { value: 'EPOSTA', label: 'E-posta' },
];

interface ROPADataCategoryPickerProps {
  value: string[];
  onChange: (v: string[]) => void;
  disabled?: boolean;
}

export function ROPADataCategoryPicker({
  value,
  onChange,
  disabled = false,
}: ROPADataCategoryPickerProps) {
  const toggle = (cat: string) => {
    if (disabled) return;
    if (value.includes(cat)) {
      onChange(value.filter((v) => v !== cat));
    } else {
      onChange([...value, cat]);
    }
  };

  return (
    <div className="flex flex-col gap-fib-3">
      <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Veri Kategorisi</p>
      <div className="flex flex-wrap gap-fib-2">
        {DATA_CATEGORIES.map((cat) => {
          const selected = value.includes(cat.value);
          return (
            <button
              key={cat.value}
              type="button"
              onClick={() => toggle(cat.value)}
              disabled={disabled}
              aria-pressed={selected}
              className={cn(
                'rounded-md border px-fib-3 py-fib-2 text-xs font-medium transition-colors',
                selected
                  ? cat.sensitive
                    ? 'border-red-500/60 bg-red-900/30 text-red-300'
                    : 'border-blue-500/60 bg-blue-900/30 text-blue-300'
                  : 'border-white/10 bg-zinc-900 text-zinc-400 hover:border-white/20 hover:text-zinc-200',
                disabled && 'cursor-not-allowed opacity-50',
              )}
            >
              {cat.label}
            </button>
          );
        })}
      </div>
      {value.length > 0 && (
        <p className="text-xs text-zinc-500">
          {value.length} kategori seçili: {value.join(', ')}
        </p>
      )}
    </div>
  );
}
