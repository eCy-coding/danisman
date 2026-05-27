import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AdaySchema,
  type AdayInput,
  REVENUE_OPTIONS,
  SOURCE_OPTIONS,
  SERVICE_CATALOG,
  HIGH_REVENUE_RANGES,
} from '../../../lib/aday-schema';
import { useCreateAday } from '../../../hooks/useAdminLeads';

export function LeadCaptureForm() {
  const { mutate, isPending } = useCreateAday();

  const {
    register,
    handleSubmit,
    watch,
    formState: { isValid },
  } = useForm<AdayInput>({
    resolver: zodResolver(AdaySchema),
    mode: 'onChange',
    defaultValues: {
      serviceInterest: [],
    },
  });

  const revenueRange = watch('revenueRange');
  const isHighRevenue = (HIGH_REVENUE_RANGES as readonly string[]).includes(revenueRange ?? '');

  const onSubmit = (data: AdayInput) => {
    mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div>
        <label htmlFor="aday-name">Ad Soyad</label>
        <input id="aday-name" type="text" autoComplete="name" {...register('name')} />
      </div>

      <div>
        <label htmlFor="aday-email">E-posta</label>
        <input id="aday-email" type="email" autoComplete="email" {...register('email')} />
      </div>

      <div>
        <label htmlFor="aday-company">Şirket</label>
        <input id="aday-company" type="text" {...register('company')} />
      </div>

      <div>
        <label htmlFor="aday-revenue">Ciro Aralığı</label>
        <select id="aday-revenue" {...register('revenueRange')}>
          <option value="">Seçiniz</option>
          {REVENUE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <fieldset>
        <legend>Hizmet İlgisi</legend>
        {SERVICE_CATALOG.map((svc) => (
          <label key={svc.value}>
            <input type="checkbox" value={svc.value} {...register('serviceInterest')} />
            {svc.label}
          </label>
        ))}
      </fieldset>

      <div>
        <label htmlFor="aday-source">Kaynak</label>
        <select id="aday-source" {...register('source')}>
          <option value="">Seçiniz</option>
          {SOURCE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {isHighRevenue && (
        <div>
          <label htmlFor="aday-purchase-authority">Satın Alma Kararı</label>
          <input id="aday-purchase-authority" type="checkbox" {...register('purchaseAuthority')} />
        </div>
      )}

      <div>
        <input id="aday-kvkk" type="checkbox" {...register('kvkkConsent')} />
        <label htmlFor="aday-kvkk">KVKK Aydınlatma Metni'ni okudum ve kabul ediyorum</label>
      </div>

      <button type="submit" disabled={!isValid || isPending}>
        Aday Kaydet
      </button>
    </form>
  );
}
