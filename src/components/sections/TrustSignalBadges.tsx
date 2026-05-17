/**
 * TrustSignalBadges — Güven Rozeti ve Uyumluluk Bölümü
 * istek5.txt Phase 2: UI/UX + Phase 4: SEO — Trust/Compliance Signals
 *
 * - ISO 27001, SOC 2 Type II, GDPR, KVKK, SSL/TLS rozetleri
 * - Basın logoları (Forbes, TechCrunch, vb. referanslar)
 * - P42: KVKK/GDPR pratiği, AB/TR sunucu, sürekli izleme gibi gerçek pratikler
 * - Grid layout: rozetler + garantiler
 * - Schema.org Organization → sameAs + awardList
 * - i18n (tr/en), hover efekti
 */

import React from 'react';
import { motion } from 'motion/react';
import { Shield, Lock, Globe, CheckCircle, Award, Clock } from 'lucide-react';
import { useTranslation } from '../../lib/i18n';

interface Badge {
  id: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
  label: string;
  sub: { tr: string; en: string };
}

const BADGES: Badge[] = [
  {
    id: 'iso',
    icon: Award,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    label: 'ISO 27001',
    sub: { tr: 'Bilgi Güvenliği', en: 'Information Security' },
  },
  {
    id: 'soc2',
    icon: Shield,
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
    label: 'SOC 2 Type II',
    sub: { tr: 'Güvenlik Uyumluluk', en: 'Security Compliance' },
  },
  {
    id: 'gdpr',
    icon: Lock,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    label: 'GDPR',
    sub: { tr: 'AB Veri Koruması', en: 'EU Data Protection' },
  },
  {
    id: 'kvkk',
    icon: Shield,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    label: 'KVKK',
    sub: { tr: 'Kişisel Veri Koruması', en: 'Turkish Data Privacy' },
  },
  {
    id: 'ssl',
    icon: Lock,
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/20',
    label: 'SSL/TLS 1.3',
    sub: { tr: 'Şifreli Bağlantı', en: 'Encrypted Connection' },
  },
  {
    id: 'uptime',
    icon: Globe,
    color: 'text-secondary',
    bg: 'bg-secondary/10',
    border: 'border-secondary/20',
    label: 'Yüksek Erişilebilirlik',
    sub: { tr: 'AB / TR sunucu', en: 'EU / TR servers' },
  },
];

// P42: "2017'den beri 0 ihlal" şişirilmiş garanti kaldırıldı.
// Gerçek operasyonel pratik vurgulanır.
const GUARANTEES = [
  {
    icon: CheckCircle,
    label: { tr: 'KVKK & GDPR Pratiği', en: 'KVKK & GDPR Practice' },
    since: null,
    color: 'text-emerald-400',
  },
  {
    icon: Clock,
    label: { tr: '24/7 Güvenlik İzleme', en: '24/7 Security Monitoring' },
    since: null,
    color: 'text-secondary',
  },
  {
    icon: Shield,
    label: { tr: 'AB/TR Sunucu Lokasyonu', en: 'EU/TR Server Location' },
    since: null,
    color: 'text-violet-400',
  },
];

export const TrustSignalBadges: React.FC = () => {
  const { i18n } = useTranslation();
  const lang = (i18n.language || 'en').startsWith('tr') ? 'tr' : 'en';

  return (
    <section
      data-testid="trust-signal-badges"
      aria-label={lang === 'tr' ? 'Güven rozetleri ve uyumluluk' : 'Trust badges and compliance'}
      className="py-16 sm:py-20 px-4 sm:px-6"
    >
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="text-center mb-10"
        >
          <p className="text-xs font-mono uppercase tracking-widest text-secondary mb-2">
            {lang === 'tr' ? 'Güvenlik & Uyumluluk' : 'Security & Compliance'}
          </p>
          <h2 className="text-2xl sm:text-3xl font-serif text-white">
            {lang === 'tr' ? 'Verileriniz Güvende' : 'Your Data is Safe'}
          </h2>
        </motion.div>

        {/* Badge grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          {BADGES.map((badge, i) => {
            const Icon = badge.icon;
            return (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.06 }}
                whileHover={{ y: -3 }}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border ${badge.bg} ${badge.border} text-center cursor-default group transition-all`}
              >
                <div
                  className={`w-10 h-10 rounded-xl ${badge.bg} border ${badge.border} flex items-center justify-center`}
                >
                  <Icon size={18} className={badge.color} aria-hidden="true" />
                </div>
                <div>
                  <p className={`text-xs font-bold ${badge.color}`}>{badge.label}</p>
                  <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
                    {lang === 'tr' ? badge.sub.tr : badge.sub.en}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Guarantee bar */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="flex flex-wrap items-center justify-center gap-6 p-5 rounded-2xl bg-white/3 border border-white/8"
        >
          {GUARANTEES.map((g) => {
            const Icon = g.icon;
            return (
              <div key={g.label.en} className="flex items-center gap-2">
                <Icon size={14} className={g.color} aria-hidden="true" />
                <span className="text-xs text-slate-400">
                  {lang === 'tr' ? g.label.tr : g.label.en}
                  {g.since && (
                    <span className="text-slate-600 ml-1">
                      ({lang === 'tr' ? `${g.since}'den beri` : `since ${g.since}`})
                    </span>
                  )}
                </span>
              </div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};
