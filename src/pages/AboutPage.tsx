import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useTranslation, getLang, MultiLang } from '../lib/i18n';
import { ABOUT_COPY, TEAM_COPY, LOCATIONS_COPY } from '@/data/copy/pages';
import { SEO } from '../components/common/SEO';
import { JsonLd } from '../components/seo/JsonLd';
import { buildBreadcrumbSchema } from '../lib/structured-data';
import {
  Target,
  Eye,
  Award,
  Globe,
  Users,
  TrendingUp,
  Shield,
  Zap,
  MapPin,
  Phone,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { FadeIn } from '../components/common/FadeIn';
import { getCalendlyCta, hasExternalCalendly } from '../lib/cta/calendly';

const VALUES = [
  {
    icon: Target,
    title: { tr: 'Sonuç Odaklılık', en: 'Result-Driven' },
    desc: {
      tr: "Her projeyi ölçülebilir KPI'lar ve net çıktılarla yönetir, vaat ettiğimizi teslim ederiz.",
      en: 'We manage every project with measurable KPIs and clear outputs, delivering on every promise.',
    },
    color: 'from-secondary/20 to-secondary/5',
    border: 'border-secondary/20',
  },
  {
    icon: Shield,
    title: { tr: 'Güvenilirlik', en: 'Reliability' },
    desc: {
      tr: "İstanbul'dan Londra'ya, müşterilerimizin güvendiği partner olarak her zaman yanlarındayız.",
      en: 'From Istanbul to London, we are always the trusted partner our clients rely on.',
    },
    color: 'from-blue-500/20 to-blue-500/5',
    border: 'border-blue-500/20',
  },
  {
    icon: Zap,
    title: { tr: 'İnovasyon', en: 'Innovation' },
    desc: {
      tr: 'Yapay zeka ve veri analitiğini geleneksel danışmanlık deneyimiyle birleştirerek benzersiz çözümler üretiriz.',
      en: 'We combine AI and data analytics with traditional consulting experience to deliver unique solutions.',
    },
    color: 'from-purple-500/20 to-purple-500/5',
    border: 'border-purple-500/20',
  },
  {
    icon: Users,
    title: { tr: 'Ortaklık', en: 'Partnership' },
    desc: {
      tr: 'Danışman değil, ortak olarak çalışırız. Başarınız bizim başarımızdır.',
      en: 'We work as partners, not consultants. Your success is our success.',
    },
    color: 'from-emerald-500/20 to-emerald-500/5',
    border: 'border-emerald-500/20',
  },
];

const MILESTONES = [
  {
    year: '2020',
    title: { tr: 'eCyverse Vizyonu', en: 'eCyverse Vision' },
    desc: {
      tr: 'Emre Can Yalçın tarafından premium danışmanlık ve stratejik dönüşüm vizyonu şekillendirildi.',
      en: 'Premium consulting and strategic transformation vision shaped by Emre Can Yalçın.',
    },
  },
  {
    year: '2022',
    title: { tr: 'Premium Pratik', en: 'Premium Practice' },
    desc: {
      tr: 'Organizasyonel dönüşüm, kültür mühendisliği ve operasyonel mükemmellik temalı engagement modeline geçildi.',
      en: 'Transition to an engagement model centered on organizational transformation, culture engineering, and operational excellence.',
    },
  },
  {
    year: '2024',
    title: { tr: 'Sektörlerarası Pratik', en: 'Cross-Sector Practice' },
    desc: {
      tr: 'Üretim, finans, perakende, teknoloji ve aile şirketlerinde çoklu sektör deneyimi.',
      en: 'Multi-sector experience across manufacturing, finance, retail, technology, and family business.',
    },
  },
  {
    year: '2025',
    title: { tr: 'eCyPro Premium Platformu', en: 'eCyPro Premium Platform' },
    desc: {
      tr: 'Danışmanlık pratiğini destekleyen veri odaklı premium platform devreye girdi.',
      en: 'Data-driven premium platform supporting the consulting practice went live.',
    },
  },
  {
    year: '2026',
    title: { tr: 'TR + AB Erişimi', en: 'TR + EU Reach' },
    desc: {
      tr: "Türkiye merkezli pratik, Avrupa Birliği pazarlarında çapraz engagement'lar.",
      en: 'Türkiye-based practice with cross-engagements across EU markets.',
    },
  },
];

// P42: Transparent, conservative göstergeler.
// "*" işareti müşteri görüşmelerine / engagement-sonrası retrospektife dayalı.
const STATS = [
  { value: '120+', label: { tr: 'Stratejik Karar', en: 'Strategic Decisions' }, icon: Users },
  { value: '12+', label: { tr: 'Sektör', en: 'Sectors' }, icon: Globe },
  { value: '5+', label: { tr: 'Yıl Pratik', en: 'Years of Practice' }, icon: TrendingUp },
  { value: '95%*', label: { tr: 'Müşteri Memnuniyeti', en: 'Client Satisfaction' }, icon: Award },
];

export const AboutPage: React.FC = () => {
  const { language: lang } = useTranslation();
  const l = (obj: { tr: string; en: string }) => obj[lang as 'tr' | 'en'] ?? obj.en;

  return (
    <div className="min-h-screen bg-neutral text-white">
      {/* P32-T12: keyword-optimised title (primary: "boutique yönetim danışmanlığı" / "boutique management consulting Turkey") */}
      <SEO
        title={
          lang === 'tr'
            ? 'eCyPro Hakkında — Boutique Yönetim Danışmanlığı | İstanbul'
            : 'About eCyPro — Boutique Management Consulting | Istanbul'
        }
        description={
          lang === 'tr'
            ? 'eCyPro, İstanbul merkezli Big4-alternatif boutique danışmanlık firması. Stratejik danışmanlık, KVKK uyumu ve operasyonel dönüşüm. Founder Emre Can Yalçın liderliğinde.'
            : 'eCyPro is Istanbul-based Big4-alternative boutique consulting. Strategic advisory, KVKK compliance and operational transformation. Led by founder Emre Can Yalçın.'
        }
        canonical="/about"
      />
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: lang === 'tr' ? 'Anasayfa' : 'Home', url: 'https://ecypro.com/' },
          { name: getLang(ABOUT_COPY.title as MultiLang, lang), url: 'https://ecypro.com/about' },
        ])}
      />

      {/* ── Hero ── */}
      <section data-testid="about-hero" className="relative overflow-hidden pt-32 pb-24">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(var(--color-primary-rgb),0.15),transparent)]" />
        <div className="absolute top-1/3 left-1/4 w-150 h-150 bg-secondary/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
          <FadeIn>
            <div className="max-w-4xl">
              <span className="inline-block text-xs font-bold tracking-[0.2em] text-secondary uppercase mb-6 border border-secondary/30 px-4 py-1.5 rounded-full bg-secondary/5">
                {lang === 'tr' ? 'Hakkımızda' : 'About eCyPro'}
              </span>
              {/* P32-T03: H1 keyword-optimized — "Stratejik Danışmanlık" targets TR SEO primary keyword. */}
              {/* P45: Sahte iddialı "Dünyanın En İyi" başlığı → eCyverse vizyonu copy. */}
              <h1 className="text-5xl md:text-7xl font-serif font-bold text-white leading-[1.05] mb-8">
                {lang === 'tr' ? (
                  <>
                    <span className="text-slate-300">Stratejik Danışmanlık</span>
                    <br />
                    <span className="text-secondary">eCyverse</span>
                    <br />
                    Ekosistemi
                  </>
                ) : (
                  <>
                    <span className="text-slate-300">Strategic Management</span>
                    <br />
                    <span className="text-secondary">Consulting</span>
                    <br />
                    Ecosystem
                  </>
                )}
              </h1>
              <p className="text-xl text-slate-400 leading-relaxed max-w-2xl">
                {lang === 'tr' ? (
                  <>
                    eCyverse ekosisteminin premium yönetim danışmanlığı kolu. Organizasyonel
                    dönüşüm, stratejik danışmanlık ve kültür mühendisliği ile Türkiye merkezli, AB
                    pazarlarında engagement deneyimi.{' '}
                    <Link to="/services" className="text-secondary hover:underline font-medium">
                      Hizmetlerimizi keşfedin →
                    </Link>
                  </>
                ) : (
                  <>
                    The premium management consulting arm of the eCyverse ecosystem. Organizational
                    transformation, strategic advisory, and culture engineering — Türkiye-based with
                    engagement experience across EU markets.{' '}
                    <Link to="/services" className="text-secondary hover:underline font-medium">
                      Explore our services →
                    </Link>
                  </>
                )}
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="py-16 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((stat, i) => (
              <motion.div
                key={stat.value}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="text-center"
              >
                <stat.icon size={20} className="text-secondary mx-auto mb-3 opacity-70" />
                <p className="text-4xl md:text-5xl font-serif font-bold text-white mb-2">
                  {stat.value}
                </p>
                <p className="text-sm text-slate-500 uppercase tracking-widest">{l(stat.label)}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Mission & Vision ── */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                icon: Target,
                color: 'text-secondary',
                bg: 'bg-secondary/10',
                border: 'border-secondary/20',
                title: l(ABOUT_COPY.missionTitle as { tr: string; en: string }),
                body: l(ABOUT_COPY.missionDesc as { tr: string; en: string }),
                items:
                  lang === 'tr'
                    ? ['Veri odaklı kararlar', 'Ölçülebilir sonuçlar', 'Uzun vadeli değer']
                    : ['Data-driven decisions', 'Measurable outcomes', 'Long-term value'],
              },
              {
                icon: Eye,
                color: 'text-blue-400',
                bg: 'bg-blue-500/10',
                border: 'border-blue-500/20',
                title: l(ABOUT_COPY.visionTitle as { tr: string; en: string }),
                body: l(ABOUT_COPY.visionDesc as { tr: string; en: string }),
                items:
                  lang === 'tr'
                    ? ['Global erişim', 'Yerel uzmanlık', 'Sürdürülebilir etki']
                    : ['Global reach', 'Local expertise', 'Sustainable impact'],
              },
            ].map((card, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: i === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                className={`bg-white/3 border ${card.border} rounded-3xl p-10 hover:bg-white/5 transition-colors duration-300`}
              >
                <div
                  className={`w-14 h-14 ${card.bg} rounded-2xl flex items-center justify-center mb-8 border ${card.border}`}
                >
                  <card.icon size={24} className={card.color} />
                </div>
                <h2 className="text-2xl font-serif font-bold text-white mb-4">{card.title}</h2>
                <p className="text-slate-400 leading-relaxed mb-8 text-lg">{card.body}</p>
                <ul className="space-y-3">
                  {card.items.map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm text-slate-300">
                      <CheckCircle2 size={15} className={card.color} />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Values ── */}
      <section data-testid="about-values" className="py-24 bg-white/1.5">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <FadeIn>
            <div className="text-center mb-16">
              <h2 className="text-4xl font-serif font-bold text-white mb-4">
                {lang === 'tr' ? 'Değerlerimiz' : 'Our Values'}
              </h2>
              <p className="text-slate-400 max-w-2xl mx-auto">
                {lang === 'tr'
                  ? 'Her kararımızı ve müşteri ilişkimizi şekillendiren temel prensipler.'
                  : 'The core principles that shape every decision and client relationship.'}
              </p>
            </div>
          </FadeIn>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUES.map((v, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className={`relative overflow-hidden rounded-2xl border ${v.border} p-8 group hover:border-white/20 transition-all duration-300`}
              >
                <div className={`absolute inset-0 bg-linear-to-br ${v.color} opacity-50`} />
                <div className="relative z-10">
                  <v.icon
                    size={28}
                    className="text-white/60 mb-6 group-hover:text-white transition-colors"
                  />
                  <h3 className="text-lg font-bold text-white mb-3">{l(v.title)}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{l(v.desc)}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Timeline ── */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <FadeIn>
            <h2 className="text-4xl font-serif font-bold text-white mb-16 text-center">
              {lang === 'tr' ? 'Yolculuğumuz' : 'Our Journey'}
            </h2>
          </FadeIn>
          <div className="relative">
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-linear-to-b from-secondary/40 via-white/10 to-transparent hidden md:block" />
            <div className="space-y-12">
              {MILESTONES.map((m, i) => (
                <motion.div
                  key={m.year}
                  initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className={`md:flex items-center gap-8 ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}
                >
                  <div className={`md:w-1/2 ${i % 2 === 0 ? 'md:text-right' : 'md:text-left'}`}>
                    <div
                      className={`bg-white/3 border border-white/8 rounded-2xl p-8 hover:bg-white/5 transition-colors`}
                    >
                      <span className="text-xs font-bold text-secondary tracking-[0.2em] uppercase mb-3 block">
                        {m.year}
                      </span>
                      <h3 className="text-xl font-bold text-white mb-2">{l(m.title)}</h3>
                      <p className="text-slate-400 text-sm leading-relaxed">{l(m.desc)}</p>
                    </div>
                  </div>
                  <div className="hidden md:flex items-center justify-center w-10 h-10 rounded-full bg-secondary/20 border-2 border-secondary/50 shrink-0 relative z-10">
                    <div className="w-3 h-3 rounded-full bg-secondary" />
                  </div>
                  <div className="md:w-1/2" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Founder Bio — gerçek profil (Atatürk Üni İşletme + Çukurova Üni YL +
              Seyhan Belediyesi + Gümrük Müşavirliği). Hedge phrase yok, formal
              "Siz" voice, KVKK + EU regülasyon pratisyenliği vurgusu. ── */}
      <section
        id="founder"
        aria-labelledby="founder-heading"
        className="py-24 border-t border-white/5"
      >
        <div className="max-w-5xl mx-auto px-6 md:px-12">
          <FadeIn>
            <div className="grid md:grid-cols-[180px_1fr] gap-10 items-start">
              <div className="md:sticky md:top-32">
                <div className="w-36 h-36 mx-auto md:mx-0 rounded-2xl bg-linear-to-br from-secondary/40 to-primary/40 flex items-center justify-center text-5xl font-serif font-bold text-white border border-white/10">
                  ECY
                </div>
                <p className="mt-4 text-center md:text-left text-xs uppercase tracking-[0.2em] text-secondary font-semibold">
                  {lang === 'tr' ? 'Kurucu' : 'Founder'}
                </p>
              </div>
              <div className="prose prose-invert max-w-none">
                <h2
                  id="founder-heading"
                  className="text-3xl md:text-4xl font-serif font-bold text-white mb-2"
                >
                  Emre Can Yalçın
                </h2>
                <p className="text-secondary text-sm font-semibold uppercase tracking-wide mb-6">
                  {lang === 'tr'
                    ? 'Kurucu · eCyPro Premium Consulting'
                    : 'Founder · eCyPro Premium Consulting'}
                </p>
                <p className="text-slate-300 leading-relaxed mb-5 text-base">
                  {lang === 'tr'
                    ? "Emre Can Yalçın, eCyPro'nun kurucusu ve eCyverse Holding ekosisteminin premium consulting kolunun stratejistidir. Atatürk Üniversitesi İşletme lisans mezunudur; Çukurova Üniversitesi Yönetim ve Organizasyon yüksek lisansı devam etmektedir."
                    : 'Emre Can Yalçın is the founder of eCyPro and the strategist of the premium consulting arm within the eCyverse Holding ecosystem. He holds a BSc in Business Administration from Atatürk University and is completing an MSc in Management & Organisation at Çukurova University.'}
                </p>
                <p className="text-slate-300 leading-relaxed mb-5 text-base">
                  {lang === 'tr'
                    ? "Profesyonel arka planı iki ana eksende ilerledi. Önce gümrük müşavirliğinde ithalat/ihracat operasyon ve iş takip uzmanlığı yaparak Türkiye'nin uluslararası ticaret mevzuatına saha düzeyinde nüfuz etti — birincil ve ikincil mevzuat arasındaki nüansları ve operasyonel uygulamanın kâğıt üstünde değil sahada nasıl işlediğini öğrendi."
                    : "His professional track advanced on two axes. He first practised at a customs brokerage, leading import/export operations and case follow-up — gaining field-level mastery of Turkey's international trade regulation, learning the nuance between primary and secondary legislation, and how operational practice actually works on the ground rather than on paper."}
                </p>
                <p className="text-slate-300 leading-relaxed mb-5 text-base">
                  {lang === 'tr'
                    ? "Sonra Seyhan Belediyesi'nde kamu eğitmenliğine geçerek aynı mevzuat akıcılığını KVKK uygulama, eğitim çerçevesi ve kurumsal kapasite inşası alanlarında halka açtı. Bu iki deneyim — sahada öğrenilen regulatory fluency ile eğitim aracılığıyla içselleştirilmiş KVKK uygulama disiplini — eCyPro'nun mesleki omurgasını oluşturur."
                    : 'He then moved into public-sector training at Seyhan Municipality, opening that same regulatory fluency to a public audience — KVKK implementation, training frameworks, and organisational capacity-building. These two experiences — field-level regulatory fluency and KVKK practice internalised through teaching — form the professional spine of eCyPro.'}
                </p>
                <p className="text-slate-300 leading-relaxed mb-5 text-base">
                  {lang === 'tr'
                    ? 'eCyverse Holding vizyonunun pratisyenidir: AI ekosistemi (eCyS Searcher, eCyMCP protokol katmanı, eCyE eğitim platformu) ile premium consulting kolu (eCyPro) arasında köprü kurar. Türkiye–AB regülasyon kavşağında çalışan KOBİ ve orta-büyük şirketlere KVKK, GDPR ve EU AI Act uyumu konusunda Türkçe ve İngilizce hizmet sunar.'
                    : 'He is the practitioner of the eCyverse Holding vision: bridging the AI ecosystem (eCyS Searcher, eCyMCP protocol layer, eCyE education platform) with the premium consulting arm (eCyPro). He serves Turkish and EU-facing SMEs and mid-market firms on KVKK, GDPR, and EU AI Act compliance in Turkish and English.'}
                </p>
                <p className="text-slate-300 leading-relaxed mb-6 text-base">
                  {lang === 'tr'
                    ? "ICC'nin (Milletlerarası Ticaret Odası) bağımsız danışmanlık prensiplerini benimseyerek çalışır; çıkar çatışması yönetimi ve regulatory disclosure konularında her engagement öncesi yazılı bağımsızlık beyanı imzalar."
                    : 'He works under the independence principles of the International Chamber of Commerce (ICC), signing a written independence declaration before each engagement, covering conflict-of-interest management and regulatory disclosure.'}
                </p>
                <div className="flex flex-wrap gap-2 not-prose">
                  {[
                    {
                      tr: 'KVKK Uygulama',
                      en: 'KVKK Implementation',
                    },
                    { tr: 'GDPR Uyum', en: 'GDPR Compliance' },
                    { tr: 'EU AI Act', en: 'EU AI Act' },
                    {
                      tr: 'Gümrük & Dış Ticaret Mevzuatı',
                      en: 'Customs & Trade Regulation',
                    },
                    {
                      tr: 'Kurumsal Eğitim',
                      en: 'Organisational Training',
                    },
                  ].map((tag) => (
                    <span
                      key={tag.tr}
                      className="inline-flex items-center px-3 py-1 rounded-full bg-secondary/10 border border-secondary/20 text-xs text-secondary font-medium"
                    >
                      {tag[lang as 'tr' | 'en']}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Leadership Team ── */}
      <section className="py-24 bg-white/1.5">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <FadeIn>
            <div className="text-center mb-16">
              <h2 className="text-4xl font-serif font-bold text-white mb-4">
                {l(TEAM_COPY.title)}
              </h2>
              <p className="text-slate-400 max-w-2xl mx-auto">{l(TEAM_COPY.subtitle)}</p>
            </div>
          </FadeIn>
          <div className="flex justify-center">
            {TEAM_COPY.members.map((member, i) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="bg-white/3 border border-white/8 rounded-3xl p-10 max-w-sm w-full text-center hover:border-secondary/30 hover:bg-white/5 transition-all duration-300 group"
              >
                <div className="w-24 h-24 rounded-full bg-linear-to-br from-secondary/40 to-primary/40 flex items-center justify-center mx-auto mb-6 text-3xl font-bold text-white border-2 border-white/10 group-hover:border-secondary/40 transition-colors">
                  {member.name.charAt(0)}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{member.name}</h3>
                <p className="text-secondary text-sm font-semibold mb-4 uppercase tracking-wide">
                  {l(member.role)}
                </p>
                <p className="text-slate-400 text-sm leading-relaxed">{l(member.bio)}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Offices ── */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <FadeIn>
            <div className="text-center mb-16">
              <h2 className="text-4xl font-serif font-bold text-white mb-4">
                {l(LOCATIONS_COPY.title)}
              </h2>
              <p className="text-slate-400 max-w-xl mx-auto">{l(LOCATIONS_COPY.subtitle)}</p>
            </div>
          </FadeIn>
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {LOCATIONS_COPY.offices.map((office, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white/3 border border-white/8 rounded-2xl p-8 hover:border-secondary/30 transition-all duration-300"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center justify-center">
                    <Globe size={18} className="text-secondary" />
                  </div>
                  <h3 className="text-xl font-bold text-white">{l(office.city)}</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 text-sm text-slate-400">
                    <MapPin size={14} className="text-slate-500 mt-0.5 shrink-0" />
                    <span>{l(office.address)}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-400">
                    <Phone size={14} className="text-slate-500 shrink-0" />
                    <span>{office.phone}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 border-t border-white/5">
        <div className="max-w-4xl mx-auto px-6 md:px-12 text-center">
          <FadeIn>
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-white mb-6">
              {lang === 'tr' ? 'Birlikte Büyüyelim' : "Let's Grow Together"}
            </h2>
            <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
              {lang === 'tr'
                ? 'Organizasyonunuzun potansiyelini açığa çıkarmak için 30 dakikalık ücretsiz keşif görüşmesi planlayın.'
                : "Schedule a free 30-minute discovery call to unlock your organization's potential."}
            </p>
            {(() => {
              const cta = getCalendlyCta('about-final');
              const shared =
                'inline-flex items-center gap-3 px-10 py-4 bg-secondary text-neutral font-bold rounded-full hover:bg-secondary/90 transition-all duration-300 shadow-[0_0_40px_rgba(var(--color-secondary-rgb),0.3)] hover:shadow-[0_0_60px_rgba(var(--color-secondary-rgb),0.5)] text-lg group';
              return hasExternalCalendly() ? (
                <a
                  href={cta.href}
                  target={cta.target}
                  rel={cta.rel}
                  {...cta.dataAttrs}
                  className={shared}
                >
                  {lang === 'tr' ? 'Görüşme Planla' : 'Book a Discovery Call'}
                  <ArrowRight
                    size={18}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </a>
              ) : (
                <button
                  type="button"
                  {...cta.dataAttrs}
                  onClick={() => window.dispatchEvent(new CustomEvent('open-booking'))}
                  className={shared}
                >
                  {lang === 'tr' ? 'Görüşme Planla' : 'Book a Discovery Call'}
                  <ArrowRight
                    size={18}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </button>
              );
            })()}
          </FadeIn>
        </div>
      </section>
    </div>
  );
};
