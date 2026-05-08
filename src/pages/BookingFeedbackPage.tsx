/**
 * P37-T10: BookingFeedbackPage — Public NPS Feedback Form
 *
 * Route: /feedback/:bookingId?token=...
 *
 * Flow:
 *   1. Token validation via GET /api/feedback/:bookingId?token=...
 *   2. Already submitted? → show thank-you (idempotent)
 *   3. Score selection: 0-10 NPS slider (Promoters ≥9, Passives 7-8, Detractors ≤6)
 *   4. Optional comment textarea
 *   5. POST /api/feedback/:bookingId → { token, score, comment }
 *   6. Success state: animated confetti-style thank-you
 *
 * NPS color mapping (Nielsen-Norman Group standard):
 *   0-6 → red (Detractor)
 *   7-8 → amber (Passive)
 *   9-10 → green (Promoter)
 *
 * Accessibility:
 *   - Score buttons: role="radio" group with aria-checked
 *   - Focus ring visible on keyboard nav
 *   - Error state uses role="alert"
 */

import React, { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Star, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { apiClient } from '../lib/api';

interface FeedbackStatus {
  status: 'success' | 'already_submitted';
  data: {
    bookingId?: string;
    scheduledAt?: string;
    userName?: string;
    score?: number;
  };
}

function getNpsCategory(score: number): { label: string; color: string; emoji: string } {
  if (score >= 9) return { label: 'Destekçi', color: 'text-green-400', emoji: '🌟' };
  if (score >= 7) return { label: 'Pasif', color: 'text-amber-400', emoji: '😐' };
  return { label: 'Eleştirmen', color: 'text-red-400', emoji: '😞' };
}

const NPS_LABELS: Record<number, string> = {
  0: 'Kesinlikle önermem',
  1: 'Önermem',
  2: 'Muhtemelen önermem',
  3: 'Pek önermem',
  4: 'Kararsız',
  5: 'Nötr',
  6: 'Hafifçe önerebilirim',
  7: 'Önerebilirim',
  8: 'Muhtemelen öneririm',
  9: 'Kesinlikle öneririm',
  10: 'Mükemmel deneyim!',
};

export const BookingFeedbackPage: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [score, setScore] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Validate token + get booking info
  const {
    data: statusData,
    isLoading,
    isError,
  } = useQuery<FeedbackStatus>({
    queryKey: ['feedback', bookingId, token],
    queryFn: () =>
      apiClient
        .get(`/feedback/${bookingId}`, { params: { token } })
        .then((r) => r.data as FeedbackStatus),
    enabled: Boolean(bookingId && token),
    retry: false,
  });

  const alreadySubmitted = statusData?.status === 'already_submitted' || submitted;

  // Submit NPS feedback
  const submitMutation = useMutation({
    mutationFn: () => apiClient.post(`/feedback/${bookingId}`, { token, score, comment }),
    onSuccess: () => setSubmitted(true),
  });

  const canSubmit = score !== null && !submitMutation.isPending;

  // ── Loading ──────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral flex items-center justify-center">
        <Loader2 size={32} className="text-secondary animate-spin" />
      </div>
    );
  }

  // ── Invalid/Expired Token ─────────────────────────────────
  if (isError || !token || !bookingId) {
    return (
      <div className="min-h-screen bg-neutral flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <AlertTriangle size={48} className="text-amber-400 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-white mb-2">
            Geçersiz veya Süresi Dolmuş Link
          </h1>
          <p className="text-slate-400 text-sm">
            Bu değerlendirme linki artık geçerli değil. Linkler 7 gün geçerlidir ve yalnızca bir kez
            kullanılabilir.
          </p>
        </div>
      </div>
    );
  }

  // ── Already submitted / success ────────────────────────────
  if (alreadySubmitted) {
    const prevScore = statusData?.data?.score ?? score;
    return (
      <div className="min-h-screen bg-neutral flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6 animate-bounce">
            {prevScore !== null && prevScore !== undefined ? getNpsCategory(prevScore).emoji : '⭐'}
          </div>
          <CheckCircle size={48} className="text-green-400 mx-auto mb-4" />
          <h1 className="text-2xl font-serif font-bold text-white mb-3">
            Değerlendirmeniz İçin Teşekkürler!
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            Görüşünüz hizmetlerimizi geliştirmemize büyük katkı sağlar. En kısa sürede size daha iyi
            bir deneyim sunmak için çalışmaya devam edeceğiz.
          </p>
          <div className="mt-8 pt-6 border-t border-white/10">
            <p className="text-xs text-slate-600">EcyPro Premium Consulting</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Main NPS Form ─────────────────────────────────────────
  const userName = statusData?.data?.userName;
  const meetingDate = statusData?.data?.scheduledAt
    ? new Date(statusData.data.scheduledAt).toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '';

  return (
    <div className="min-h-screen bg-neutral flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-secondary/10 border border-secondary/20 rounded-full px-4 py-1.5 mb-6">
            <Star size={14} className="text-secondary fill-secondary" />
            <span className="text-xs font-semibold text-secondary tracking-wide">
              Görüşme Değerlendirmesi
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-white mb-3">
            {userName ? `${userName}, görüşmemizi değerlendirin` : 'Görüşmemizi değerlendirin'}
          </h1>
          {meetingDate && (
            <p className="text-slate-400 text-sm">
              {meetingDate} tarihli stratejik danışmanlık görüşmemiz
            </p>
          )}
        </div>

        {/* NPS Score Card */}
        <div className="bg-white/3 border border-white/8 rounded-2xl p-6 mb-4">
          <p className="text-sm font-medium text-slate-300 mb-1 text-center">
            EcyPro'yu bir arkadaşınıza veya iş ortağınıza ne kadar önerirsiniz?
          </p>
          <p className="text-xs text-slate-500 mb-6 text-center">
            0 = Kesinlikle önermem · 10 = Kesinlikle öneririm
          </p>

          {/* Score buttons */}
          <div role="radiogroup" aria-label="NPS Score" className="grid grid-cols-11 gap-1">
            {Array.from({ length: 11 }, (_, i) => {
              const isSelected = score === i;
              return (
                <button
                  key={i}
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => setScore(i)}
                  className={`
                    aspect-square rounded-xl text-sm font-bold transition-all duration-150
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary
                    ${
                      isSelected
                        ? `bg-secondary text-white scale-110 shadow-lg shadow-secondary/30`
                        : `bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:text-white`
                    }
                  `}
                >
                  {i}
                </button>
              );
            })}
          </div>

          {/* Score label */}
          {score !== null && (
            <div className="mt-4 text-center">
              <span className={`text-sm font-semibold ${getNpsCategory(score).color}`}>
                {getNpsCategory(score).emoji} {NPS_LABELS[score]}
              </span>
              <span className="text-xs text-slate-600 ml-2">({getNpsCategory(score).label})</span>
            </div>
          )}
        </div>

        {/* Optional comment */}
        {score !== null && (
          <div className="bg-white/3 border border-white/8 rounded-2xl p-5 mb-4 transition-all">
            <label
              htmlFor="feedback-comment"
              className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2"
            >
              Yorumunuz (isteğe bağlı)
            </label>
            <textarea
              id="feedback-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={1000}
              rows={3}
              placeholder={
                score >= 9
                  ? 'Neler beğendiniz? Ne özellikle öne çıktı?'
                  : score >= 7
                    ? 'Deneyiminizi nasıl geliştirebiliriz?'
                    : 'Beklentilerinizi karşılamadıysak bize anlatın, düzeltmek isteriz.'
              }
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 resize-none focus:outline-none focus:border-secondary/50 transition-colors"
            />
            <div className="flex justify-end mt-1">
              <span className="text-xs text-slate-600">{comment.length}/1000</span>
            </div>
          </div>
        )}

        {/* Submit error */}
        {submitMutation.isError && (
          <div
            role="alert"
            className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-3"
          >
            <AlertTriangle size={13} />
            Gönderim başarısız. Lütfen tekrar deneyin.
          </div>
        )}

        {/* Submit button */}
        <button
          onClick={() => submitMutation.mutate()}
          disabled={!canSubmit}
          className="w-full py-3.5 bg-secondary text-white font-semibold rounded-xl hover:bg-secondary/90 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {submitMutation.isPending ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Gönderiliyor...
            </>
          ) : (
            <>Değerlendirimi Gönder</>
          )}
        </button>

        <p className="text-xs text-slate-600 text-center mt-4">
          30 saniye · Yanıtınız gizli tutulur · EcyPro Premium Consulting
        </p>
      </div>
    </div>
  );
};

export default BookingFeedbackPage;
