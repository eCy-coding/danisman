/**
 * IndependenceCheckForm — Bağımsızlık Beyanı veri giriş formu.
 *
 * Big4 çakışması tespit edilirse inline uyarı gösterir (PwC, Deloitte, EY, KPMG).
 * React Hook Form + Zod validation.
 */

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertTriangle, Shield, User, Building2 } from 'lucide-react';

export interface IndependenceCheckData {
  clientId: string;
  clientName: string;
  pureAdvisoryConfirmed: boolean;
  signatoryUserId: string;
}

interface Props {
  onSubmit: (data: IndependenceCheckData) => void;
  loading: boolean;
}

// Big4 detection — mirrors server-side logic
const BIG4_PATTERNS: Array<{ firm: string; patterns: RegExp[] }> = [
  { firm: 'PwC', patterns: [/pwc/i, /pricewaterhousecoopers/i, /price\s*waterhouse/i] },
  { firm: 'Deloitte', patterns: [/deloitte/i] },
  { firm: 'EY', patterns: [/\bey\b/i, /ernst\s*&?\s*young/i, /ernst and young/i] },
  { firm: 'KPMG', patterns: [/kpmg/i] },
];

function detectBig4(clientName: string): string[] {
  return BIG4_PATTERNS.filter(({ patterns }) => patterns.some((re) => re.test(clientName))).map(
    ({ firm }) => firm,
  );
}

const schema = z.object({
  clientId: z.string().min(1, 'Müşteri ID zorunlu'),
  clientName: z.string().min(1, 'Müşteri adı zorunlu'),
  pureAdvisoryConfirmed: z.boolean().refine((v) => v === true, {
    message: 'Danışmanlık onayı zorunlu',
  }),
  signatoryUserId: z.string().min(1, 'İmzacı kullanıcı ID zorunlu'),
});

export const IndependenceCheckForm: React.FC<Props> = ({ onSubmit, loading }) => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<IndependenceCheckData>({
    resolver: zodResolver(schema),
    defaultValues: { pureAdvisoryConfirmed: false },
  });

  const clientName = watch('clientName') ?? '';
  const big4Conflicts = detectBig4(clientName);

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-fib-6 rounded-lg border border-[#2A2B2C] bg-[#1E1F20] p-fib-6"
      noValidate
    >
      <div className="flex items-center gap-fib-4 mb-fib-3">
        <Shield className="w-5 h-5 text-[#60A5FA]" />
        <h2 className="text-golden-lg font-semibold text-[#F9FAFB]">Bağımsızlık Kontrolü</h2>
      </div>

      {/* clientId */}
      <div className="flex flex-col gap-fib-3">
        <label
          htmlFor="ind-clientId"
          className="text-golden-sm font-medium text-[#D1D5DB] flex items-center gap-fib-3"
        >
          <Building2 className="w-4 h-4 text-[#9CA3AF]" />
          Müşteri ID
        </label>
        <input
          id="ind-clientId"
          {...register('clientId')}
          type="text"
          placeholder="client-abc-123"
          className="rounded border border-[#374151] bg-[#111827] text-[#F9FAFB] p-fib-4 text-golden-sm focus:outline-none focus:border-[#3B82F6] transition-colors font-mono"
        />
        {errors.clientId && (
          <span className="text-xs text-[#FCA5A5]">{errors.clientId.message}</span>
        )}
      </div>

      {/* clientName + Big4 uyarısı */}
      <div className="flex flex-col gap-fib-3">
        <label
          htmlFor="ind-clientName"
          className="text-golden-sm font-medium text-[#D1D5DB] flex items-center gap-fib-3"
        >
          <Building2 className="w-4 h-4 text-[#9CA3AF]" />
          Müşteri Adı
        </label>
        <input
          id="ind-clientName"
          {...register('clientName')}
          type="text"
          placeholder="Şirket adı (Big4 çakışması için kontrol edilir)"
          className="rounded border border-[#374151] bg-[#111827] text-[#F9FAFB] p-fib-4 text-golden-sm focus:outline-none focus:border-[#3B82F6] transition-colors"
        />
        {errors.clientName && (
          <span className="text-xs text-[#FCA5A5]">{errors.clientName.message}</span>
        )}

        {/* Big4 conflict warning */}
        {big4Conflicts.length > 0 && (
          <div className="flex items-start gap-fib-3 rounded border border-[#92400E] bg-[#451A03] p-fib-4">
            <AlertTriangle className="w-4 h-4 text-[#FCD34D] mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-[#FCD34D]">Big4 Çakışması Tespit Edildi</p>
              <p className="text-xs text-[#FDE68A] mt-fib-2">
                Bağımsızlık riski:{' '}
                <span className="font-mono font-bold">{big4Conflicts.join(', ')}</span>. DPO onayı
                gerekebilir.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* signatoryUserId */}
      <div className="flex flex-col gap-fib-3">
        <label
          htmlFor="ind-signatoryUserId"
          className="text-golden-sm font-medium text-[#D1D5DB] flex items-center gap-fib-3"
        >
          <User className="w-4 h-4 text-[#9CA3AF]" />
          İmzacı Kullanıcı ID
        </label>
        <input
          id="ind-signatoryUserId"
          {...register('signatoryUserId')}
          type="text"
          placeholder="user-id"
          className="rounded border border-[#374151] bg-[#111827] text-[#F9FAFB] p-fib-4 text-golden-sm focus:outline-none focus:border-[#3B82F6] transition-colors font-mono"
        />
        {errors.signatoryUserId && (
          <span className="text-xs text-[#FCA5A5]">{errors.signatoryUserId.message}</span>
        )}
      </div>

      {/* pureAdvisoryConfirmed */}
      <div className="flex items-start gap-fib-4">
        <input
          {...register('pureAdvisoryConfirmed')}
          type="checkbox"
          id="pureAdvisoryConfirmed"
          className="mt-1 w-4 h-4 rounded border-[#374151] bg-[#111827] accent-[#3B82F6]"
        />
        <div>
          <label
            htmlFor="pureAdvisoryConfirmed"
            className="text-golden-sm text-[#D1D5DB] font-medium cursor-pointer"
          >
            Yalnızca danışmanlık hizmeti verildiği onaylanmıştır
          </label>
          <p className="text-xs text-[#6B7280] mt-fib-2">
            eCyPro'nun bu müşteri için denetim (audit) faaliyeti yürütmediği teyit edilmiştir.
          </p>
          {errors.pureAdvisoryConfirmed && (
            <span className="text-xs text-[#FCA5A5]">{errors.pureAdvisoryConfirmed.message}</span>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full inline-flex items-center justify-center gap-fib-3 px-fib-6 py-fib-4 rounded bg-[#1D4ED8] hover:bg-[#1E40AF] active:scale-95 text-white text-sm font-medium transition-all disabled:opacity-50"
      >
        {loading ? (
          <>
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Kaydediliyor…
          </>
        ) : (
          <>
            <Shield className="w-4 h-4" />
            Bağımsızlık Beyanı Oluştur
          </>
        )}
      </button>
    </form>
  );
};
