/**
 * P49 S10 — KVKK / GDPR Compliance Checker.
 *
 * 15 maddelik KVKK/GDPR self-audit. Yes / Partial / No. Compliance score % +
 * critical gap'lar listesi.
 */
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, AlertTriangle } from 'lucide-react';

type Status = 'yes' | 'partial' | 'no' | null;

const ITEMS = [
  { id: 'inv', label: 'Veri envanteri (data inventory) güncel', critical: true },
  { id: 'pol', label: 'Aydınlatma metni + açık rıza dokümanları yayında', critical: true },
  { id: 'temp', label: 'KVK temsilcisi atanmış', critical: true },
  { id: 'dpia', label: 'DPIA (Data Protection Impact Assessment) süreci var', critical: false },
  { id: 'breach', label: 'Veri ihlali bildirim playbook (72sa) hazır', critical: true },
  { id: 'rights', label: 'Veri sahibi hakları (Madde 11) talep yönetimi süreç', critical: true },
  { id: 'retention', label: 'Saklama süresi politikası uygulanıyor', critical: false },
  {
    id: 'processor',
    label: 'Veri işleyici sözleşmeleri (DPA) tüm vendor için var',
    critical: true,
  },
  { id: 'cookie', label: 'Çerez politikası + consent banner aktif', critical: false },
  { id: 'iso', label: 'ISO 27001 sertifikasyon hedefi tanımlı', critical: false },
  { id: 'log', label: 'Erişim log + DLP teknik kontrol', critical: true },
  { id: 'train', label: 'Çalışan KVKK eğitimi yıllık verilir', critical: false },
  { id: 'crossborder', label: 'Yurt dışı veri aktarımı kayıt altında', critical: true },
  { id: 'audit', label: 'Yıllık compliance audit yapılır', critical: false },
  { id: 'risk', label: 'Risk register güncel; threat modeling yapıldı', critical: false },
];

const STATUS_SCORE: Record<Exclude<Status, null>, number> = { yes: 1, partial: 0.5, no: 0 };

export const KVKKComplianceChecker: React.FC = () => {
  const [answers, setAnswers] = useState<Record<string, Status>>(
    Object.fromEntries(ITEMS.map((i) => [i.id, null])),
  );

  const totalScore = useMemo(() => {
    return Object.entries(answers).reduce((sum, [, st]) => sum + (st ? STATUS_SCORE[st] : 0), 0);
  }, [answers]);

  const completed = Object.values(answers).every((v) => v !== null);
  const pct = Math.round((totalScore / ITEMS.length) * 100);
  const gaps = ITEMS.filter(
    (i) => i.critical && (answers[i.id] === 'no' || answers[i.id] === 'partial'),
  );

  return (
    <section
      className="py-16 px-6 md:px-12 border-t border-white/5 bg-gradient-to-b from-transparent via-secondary/[0.03] to-transparent"
      aria-labelledby="kvkk-heading"
      data-testid="kvkk-compliance-checker"
    >
      <div className="max-w-5xl mx-auto">
        <div className="mb-10">
          <div className="text-xs font-bold uppercase tracking-[0.25em] text-secondary mb-3 flex items-center gap-2">
            <ShieldCheck size={14} /> KVKK / GDPR Audit
          </div>
          <h2
            id="kvkk-heading"
            className="text-3xl md:text-4xl font-serif font-bold text-white mb-3"
          >
            15 Maddelik Self-Compliance Check
          </h2>
          <p className="text-slate-400">
            Evet / Kısmen / Hayır. Toplam compliance % + kritik açık listesi.
          </p>
        </div>
        <div className="space-y-2 mb-8">
          {ITEMS.map((item) => (
            <div
              key={item.id}
              className="flex flex-col md:flex-row items-start md:items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-xl"
            >
              <span className="flex-1 text-slate-200 text-sm">
                {item.critical && (
                  <span className="text-amber-400 mr-2" aria-label="kritik">
                    ⚠
                  </span>
                )}
                {item.label}
              </span>
              <div className="flex gap-2 flex-shrink-0">
                {(['yes', 'partial', 'no'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setAnswers({ ...answers, [item.id]: st })}
                    aria-pressed={answers[item.id] === st}
                    className={`min-h-[36px] px-3 rounded-lg border text-xs font-semibold transition-colors ${
                      answers[item.id] === st
                        ? st === 'yes'
                          ? 'bg-emerald-500 text-neutral border-emerald-400'
                          : st === 'partial'
                            ? 'bg-amber-500 text-neutral border-amber-400'
                            : 'bg-slate-600 text-white border-slate-500'
                        : 'bg-white/5 border-white/10 text-slate-400'
                    }`}
                  >
                    {st === 'yes' ? 'Evet' : st === 'partial' ? 'Kısmen' : 'Hayır'}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        {completed && (
          <div
            className="bg-gradient-to-br from-secondary/15 to-primary/10 border border-secondary/30 rounded-2xl p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500"
            role="status"
            aria-live="polite"
          >
            <div className="text-xs uppercase tracking-widest text-secondary mb-2">
              Compliance Skoru
            </div>
            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-5xl font-serif font-bold text-white">%{pct}</span>
            </div>
            {gaps.length > 0 && (
              <>
                <div className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-3 flex items-center gap-2">
                  <AlertTriangle size={14} /> Kritik Açıklar ({gaps.length})
                </div>
                <ul className="space-y-2 mb-6">
                  {gaps.map((g) => (
                    <li key={g.id} className="text-slate-200 text-sm flex items-start gap-2">
                      <AlertTriangle size={14} className="text-amber-400 mt-0.5 flex-shrink-0" />
                      {g.label}
                    </li>
                  ))}
                </ul>
              </>
            )}
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 min-h-[44px] rounded-xl bg-secondary text-neutral font-semibold hover:bg-secondary/90 transition-colors"
            >
              KVKK Audit Görüşmesi <ArrowRight size={16} />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};
