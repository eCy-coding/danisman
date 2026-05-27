import React from 'react';
import { motion } from 'motion/react';
import { Linkedin, Globe, ArrowRight } from 'lucide-react';
import { FadeIn } from '../components/common/FadeIn';
import { useTranslation, getLang, MultiLang } from '../lib/i18n';
import { TEAM_COPY } from '../constants';
import { SEO } from '../components/common/SEO';
import { Link } from 'react-router-dom';

const MEMBERS = [
  {
    id: 'ceo',
    name: 'Emre C.',
    role: { tr: 'Kurucu & Baş Stratejist', en: 'Founder & Chief Strategist' },
    bio: {
      tr: "15+ yıl kurumsal dönüşüm deneyimiyle İstanbul ve Londra'da global şirketlere liderlik ediyor.",
      en: '15+ years of corporate transformation experience, leading global firms across Istanbul and London.',
    },
    tags: {
      tr: ['Kurumsal Strateji', 'M&A', 'Dijital Dönüşüm'],
      en: ['Corporate Strategy', 'M&A', 'Digital Transformation'],
    },
    initials: 'EC',
    color: '#2563EB',
  },
  {
    id: 'ai-lead',
    name: 'Dr. Ayşe K.',
    role: { tr: 'Yapay Zeka & Veri Direktörü', en: 'AI & Data Director' },
    bio: {
      tr: 'MIT mezunu, makine öğrenmesi ve iş analitiğinde 10 yıllık araştırma ve uygulama tecrübesi.',
      en: 'MIT alumni with 10 years of applied ML and enterprise analytics research.',
    },
    tags: {
      tr: ['Yapay Zeka', 'Tahmine Dayalı Analitik', 'Veri Yönetişimi'],
      en: ['AI Strategy', 'Predictive Analytics', 'Data Governance'],
    },
    initials: 'AK',
    color: '#38BDF8',
  },
  {
    id: 'ma-partner',
    name: 'Mert D.',
    role: { tr: 'M&A Danışmanlık Ortağı', en: 'M&A Advisory Partner' },
    bio: {
      tr: 'Tier-1 yatırım bankacılığı ve premium consulting kökenli; birleşme, satın alma ve değerleme alanında 8 yıl üst düzey deneyim.',
      en: 'Tier-1 investment banking and premium consulting background; 8 years of senior M&A, valuation, and exit strategy expertise.',
    },
    tags: {
      tr: ['Due Diligence', 'Değerleme', 'Exit Stratejisi'],
      en: ['Due Diligence', 'Valuation', 'Exit Strategy'],
    },
    initials: 'MD',
    color: '#D97706',
  },
  {
    id: 'ops-lead',
    name: 'Selin Y.',
    role: { tr: 'Operasyonel Mükemmellik Lideri', en: 'Operational Excellence Lead' },
    bio: {
      tr: 'Lean Six Sigma Master Black Belt; üretim ve tedarik zincirinde 200M€+ tasarruf projeleri yönetimi.',
      en: 'Lean Six Sigma Master Black Belt; managed 200M€+ savings projects in manufacturing & supply chain.',
    },
    tags: {
      tr: ['Yalın Üretim', 'Altı Sigma', 'Tedarik Zinciri'],
      en: ['Lean', 'Six Sigma', 'Supply Chain'],
    },
    initials: 'SY',
    color: '#10B981',
  },
  {
    id: 'esg-lead',
    name: 'Zeynep A.',
    role: { tr: 'ESG & Sürdürülebilirlik Direktörü', en: 'ESG & Sustainability Director' },
    bio: {
      tr: 'UN Global Compact danışmanı; Yeşil Mutabakat ve karbon nötralik stratejilerinde uzman.',
      en: 'UN Global Compact advisor; expert in Green Deal compliance and carbon neutrality roadmaps.',
    },
    tags: {
      tr: ['ESG Raporlaması', 'Yeşil Finans', 'Karbon'],
      en: ['ESG Reporting', 'Green Finance', 'Carbon'],
    },
    initials: 'ZA',
    color: '#8B5CF6',
  },
  {
    id: 'finance-lead',
    name: 'Burak T.',
    role: { tr: 'Mali Danışmanlık & Vergi Ortağı', en: 'Financial Advisory & Tax Partner' },
    bio: {
      tr: 'KPMG kökenli; kurumsal vergi optimizasyonu ve mali dönüşüm projelerinde 12 yıl üst düzey deneyim.',
      en: 'Ex-KPMG; 12 years in corporate tax optimization, budgeting, and financial transformation.',
    },
    tags: {
      tr: ['Vergi Planlaması', 'Mali Analiz', 'Bütçe'],
      en: ['Tax Planning', 'Financial Analysis', 'Budget'],
    },
    initials: 'BT',
    color: '#F43F5E',
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
    },
  },
};

export const TeamPage: React.FC = () => {
  const { language: lang } = useTranslation();
  const l = (obj: MultiLang) => getLang(obj, lang);
  const la = (arr: { tr: string[]; en: string[] }) => arr[lang as 'tr' | 'en'] ?? arr.en;

  return (
    <div className="min-h-screen bg-neutral text-white">
      <SEO
        title={l(TEAM_COPY.title as MultiLang)}
        description={l(TEAM_COPY.subtitle as MultiLang)}
        canonical="/team"
      />

      {/* Hero */}
      <section className="relative overflow-hidden pt-32 pb-20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgba(37,99,235,0.12),transparent)]" />
        <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
          <FadeIn>
            <span className="inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold tracking-[0.25em] text-slate-400 uppercase mb-6">
              {lang === 'tr' ? 'Ekibimiz' : 'Our Team'}
            </span>
            <h1
              className="text-4xl md:text-6xl font-serif font-medium text-white mb-6 leading-tight"
              data-testid="team-heading"
            >
              {l(TEAM_COPY.title as MultiLang)}
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl font-light leading-relaxed">
              {l(TEAM_COPY.subtitle as MultiLang)}
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-y border-white/5 bg-white/2">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {/* P45: Stats P42 about + KPI section ile sync — conservative + transparent. */}
            {[
              { value: '120+', label: { tr: 'Stratejik Karar', en: 'Strategic Decisions' } },
              { value: '12+', label: { tr: 'Sektör', en: 'Sectors' } },
              { value: '5+', label: { tr: 'Yıl Pratik', en: 'Years of Practice' } },
              { value: '95%*', label: { tr: 'Müşteri Memnuniyeti', en: 'Client Satisfaction' } },
            ].map((stat) => (
              <div key={stat.value}>
                <div className="text-3xl md:text-4xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                  {l(stat.label as MultiLang)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Grid */}
      <section className="py-20 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            transition={{ staggerChildren: 0.1 }}
          >
            {MEMBERS.map((m) => (
              <motion.div
                key={m.id}
                variants={cardVariants}
                data-testid="team-member-card"
                className="group relative bg-white/5 border border-white/10 rounded-2xl p-8 overflow-hidden hover:border-white/20 transition-all duration-500"
              >
                {/* Glow */}
                <div
                  className="absolute -top-12 -left-12 w-40 h-40 rounded-full blur-3xl opacity-15 group-hover:opacity-35 transition-opacity duration-700"
                  style={{ background: `radial-gradient(circle, ${m.color}, transparent)` }}
                />

                {/* Avatar + name */}
                <div className="flex items-start gap-4 mb-5 relative z-10">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${m.color}40, ${m.color}15)`,
                      border: `1px solid ${m.color}30`,
                    }}
                  >
                    {m.initials}
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white mb-0.5">{m.name}</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {l(m.role as MultiLang)}
                    </p>
                  </div>
                </div>

                {/* Bio */}
                <p className="text-slate-400 text-sm leading-relaxed mb-5 relative z-10">
                  {l(m.bio as MultiLang)}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-6 relative z-10">
                  {la(m.tags).map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 text-[9px] font-bold tracking-wider uppercase rounded bg-white/5 border border-white/10 text-slate-400"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Footer */}
                <div className="flex items-center gap-2 pt-4 border-t border-white/5 relative z-10">
                  <button
                    type="button"
                    aria-label="LinkedIn"
                    className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-white/30 transition-all"
                  >
                    <Linkedin size={12} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label="Website"
                    className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-white/30 transition-all"
                  >
                    <Globe size={12} aria-hidden="true" />
                  </button>
                  <Link
                    to="/contact"
                    className="ml-auto text-[10px] text-slate-500 hover:text-secondary transition-colors flex items-center gap-1 font-bold uppercase tracking-wider"
                  >
                    {lang === 'tr' ? 'İletişim' : 'Contact'} <ArrowRight size={11} />
                  </Link>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 md:px-12 border-t border-white/5">
        <div className="max-w-3xl mx-auto text-center">
          <FadeIn>
            <h2 className="text-3xl md:text-4xl font-serif text-white mb-6">
              {lang === 'tr' ? 'Ekibimize Katılın' : 'Join Our Team'}
            </h2>
            <p className="text-slate-400 text-lg mb-10 leading-relaxed">
              {lang === 'tr'
                ? 'Global danışmanlık ekibimizde yerinizi alın. Büyüyen portföyümüzle birlikte kariyer fırsatlarını keşfedin.'
                : 'Join our global consulting team and explore career opportunities with our growing portfolio.'}
            </p>
            <Link
              to="/careers"
              className="inline-flex items-center gap-3 px-8 py-4 bg-secondary hover:bg-amber-400 text-neutral font-bold uppercase tracking-widest rounded-xl shadow-[0_0_30px_rgba(250,204,21,0.3)] hover:shadow-[0_0_50px_rgba(250,204,21,0.5)] transition-all duration-300"
            >
              {lang === 'tr' ? 'Açık Pozisyonlar' : 'Open Positions'} <ArrowRight size={16} />
            </Link>
          </FadeIn>
        </div>
      </section>
    </div>
  );
};
