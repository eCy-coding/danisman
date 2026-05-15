/**
 * P37-T05: Booking Management Page — reschedule / cancel (no login)
 *
 * Public page accessed via email manage link:
 *   /booking/manage?id={bookingId}&token={hmacToken}
 *
 * Fetches booking details (if token valid), then lets user cancel.
 * Reschedule: future phase — show Cal.com embed or redirect.
 */

import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { apiClient } from '../lib/api';

interface BookingDetail {
  id: string;
  scheduledAt: string;
  durationMin: number;
  status: string;
  userName: string | null;
  service: { titleEn: string; titleTr: string } | null;
}

interface ApiBookingResponse {
  status: string;
  data: BookingDetail;
}

export const BookingManagePage: React.FC = () => {
  const [params] = useSearchParams();
  const id = params.get('id') ?? '';
  const token = params.get('token') ?? '';
  const [cancelled, setCancelled] = useState(false);
  const [error, setError] = useState('');

  const { data, isLoading, isError } = useQuery<ApiBookingResponse>({
    queryKey: ['booking-manage', id, token],
    queryFn: () =>
      apiClient
        .get<ApiBookingResponse>(`/manage/booking?id=${id}&token=${encodeURIComponent(token)}`)
        .then((r) => r.data),
    enabled: !!(id && token),
    retry: false,
  });

  const cancelMutation = useMutation({
    mutationFn: () => apiClient.post('/manage/booking/cancel', { id, token }),
    onSuccess: () => setCancelled(true),
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Bir hata oluştu.';
      setError(msg);
    },
  });

  const booking = data?.data;
  const scheduledDate = booking ? new Date(booking.scheduledAt) : null;
  const dateStr = scheduledDate?.toLocaleDateString('tr-TR', {
    dateStyle: 'full',
    timeZone: 'Europe/Istanbul',
  });
  const timeStr = scheduledDate?.toLocaleTimeString('tr-TR', {
    timeStyle: 'short',
    timeZone: 'Europe/Istanbul',
  });
  const isCancellable = booking?.status === 'PENDING' || booking?.status === 'CONFIRMED';

  return (
    <>
      <Helmet>
        <title>Görüşme Yönetimi | EcyPro</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <main className="min-h-screen bg-neutral flex items-center justify-center px-4 py-16">
        <h1 className="sr-only">Görüşme Yönetimi / Booking Management</h1>
        <div className="w-full max-w-md">
          {/* Brand */}
          <div className="text-center mb-8">
            <span className="text-2xl font-bold text-white font-serif">
              Ecy<span className="text-secondary">Pro</span>
            </span>
            <p className="text-slate-400 text-sm mt-1">Görüşme Yönetimi</p>
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="bg-white/3 border border-white/5 rounded-2xl p-8 text-center">
              <Loader2 className="animate-spin mx-auto mb-3 text-secondary" size={28} />
              <p className="text-slate-300">Görüşme bilgileri yükleniyor…</p>
            </div>
          )}

          {/* Error (invalid/expired token) */}
          {(isError || (!isLoading && !booking)) && !cancelled && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center">
              <XCircle className="mx-auto mb-3 text-red-400" size={32} />
              <h2 className="text-white font-semibold text-lg mb-2">
                Link Geçersiz veya Süresi Dolmuş
              </h2>
              <p className="text-slate-400 text-sm">
                Bu yönetim linki artık geçerli değil. Yeni bir görüşme planlamak için web sitemizi
                ziyaret edin.
              </p>
              <a
                href="https://ecypro.com/#contact"
                className="inline-block mt-6 px-6 py-3 bg-secondary text-white rounded-xl font-medium text-sm hover:bg-blue-600 transition-colors"
              >
                Yeni Görüşme Planla
              </a>
            </div>
          )}

          {/* Cancelled confirmation */}
          {cancelled && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-8 text-center">
              <CheckCircle className="mx-auto mb-3 text-green-400" size={32} />
              <h2 className="text-white font-semibold text-lg mb-2">Görüşme İptal Edildi</h2>
              <p className="text-slate-400 text-sm">
                Görüşmeniz başarıyla iptal edildi. İptal onay e-postası kısa süre içinde gelecektir.
              </p>
              <a
                href="https://ecypro.com"
                className="inline-block mt-6 px-6 py-3 bg-secondary text-white rounded-xl font-medium text-sm hover:bg-blue-600 transition-colors"
              >
                Ana Sayfaya Dön
              </a>
            </div>
          )}

          {/* Booking detail card */}
          {booking && !cancelled && (
            <div className="bg-white/3 border border-white/5 rounded-2xl overflow-hidden">
              {/* Status banner */}
              <div
                className={`px-6 py-3 text-sm font-medium text-center ${
                  booking.status === 'CONFIRMED'
                    ? 'bg-green-500/10 text-green-400'
                    : booking.status === 'PENDING'
                      ? 'bg-yellow-500/10 text-yellow-400'
                      : booking.status === 'CANCELLED'
                        ? 'bg-red-500/10 text-red-400'
                        : 'bg-slate-500/10 text-slate-400'
                }`}
              >
                {booking.status === 'CONFIRMED'
                  ? '✅ Onaylandı'
                  : booking.status === 'PENDING'
                    ? '🕐 Beklemede'
                    : booking.status === 'CANCELLED'
                      ? '❌ İptal Edildi'
                      : booking.status === 'COMPLETED'
                        ? '✔️ Tamamlandı'
                        : booking.status}
              </div>

              <div className="p-6 space-y-5">
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    Merhaba, {booking.userName ?? 'Değerli Danışman'} 👋
                  </h2>
                  <p className="text-slate-400 text-sm mt-1">
                    Görüşme detaylarınız aşağıda yer almaktadır.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 bg-white/3 rounded-xl p-3">
                    <Calendar size={16} className="text-secondary shrink-0" />
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-widest">Tarih</p>
                      <p className="text-white text-sm font-medium">{dateStr}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-white/3 rounded-xl p-3">
                    <Clock size={16} className="text-secondary shrink-0" />
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-widest">Saat</p>
                      <p className="text-white text-sm font-medium">
                        {timeStr} · {booking.durationMin} dakika
                      </p>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm">
                    <AlertCircle size={14} className="shrink-0" />
                    {error}
                  </div>
                )}

                {isCancellable && (
                  <div className="pt-2 space-y-3">
                    <p className="text-slate-400 text-xs text-center">
                      Görüşmeyi iptal etmek istiyorsanız aşağıdaki butona tıklayın.
                    </p>
                    <button
                      onClick={() => cancelMutation.mutate()}
                      disabled={cancelMutation.isPending}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors font-medium text-sm disabled:opacity-50"
                    >
                      {cancelMutation.isPending ? (
                        <>
                          <Loader2 size={14} className="animate-spin" /> İptal ediliyor…
                        </>
                      ) : (
                        <>
                          <XCircle size={14} /> Görüşmeyi İptal Et
                        </>
                      )}
                    </button>
                  </div>
                )}

                {!isCancellable && (
                  <p className="text-slate-500 text-xs text-center pt-2">
                    Bu görüşme artık değiştirilemez (durumu: {booking.status}).
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
};
