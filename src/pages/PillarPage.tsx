/**
 * P51.4 — Pillar pages (hub pages for SEO clustering).
 *
 * 5 cluster: strategy / family-business / operations / digital-ai / sustainability-esg
 * Data-driven from PILLARS map. Each cluster: 2000+ word overview + supporting
 * blog posts + relevant services + Discovery Call CTA.
 *
 * Route: /pillar/:slug (App.tsx integration push sonrası)
 */

import React, { useMemo } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowRight, Sparkles } from 'lucide-react';
import { SERVICES } from '../data/services';
import { JsonLd } from '../components/seo/JsonLd';
import { buildBreadcrumbListSchema } from '../lib/seo/breadcrumb';
import { useTranslation } from '@/lib/i18n';
import { buildCanonical } from '@/i18n/canonical';

interface Pillar {
  slug: string;
  title: string;
  subtitle: string;
  intro: string; // 200-300 word
  sections: { heading: string; body: string }[];
  relatedServiceSlugs: string[];
  blogTags: string[]; // post filter tags
}

const PILLARS: Pillar[] = [
  {
    slug: 'strategy',
    title: 'Stratejik Yönetim · Kuzey Yıldızından Uygulamaya',
    subtitle: 'Vizyon ile günlük operasyon arasındaki köprüyü kuruyoruz.',
    intro:
      'Türkiye iş dünyasında en sık karşılaştığımız problem: stratejik plan her yıl tazelense de ekibin günlük operasyonu vizyonla uyumsuz çalışıyor. Yönetim toplantılarında alınan kararlar 3-6 ay içinde tatil oluyor; uygulama disiplini düşük kalıyor. Premium consulting değer önerimizin özü tam burada: vizyon-uygulama köprüsünü 5 katmanlı engagement mimarisiyle kuruyoruz.',
    sections: [
      {
        heading: 'Vizyon Mimarı: 3-5 Yıllık Kuzey Yıldızı',
        body: 'Her engagement, stratejik netlik üretmekle başlar. "Nerede oynuyoruz" sorusunu yanıtlarız: hangi pazarlarda, hangi müşteri segmentleriyle, hangi değer önerisiyle. Üst yönetimle birlikte rekabet sınırlarını tanımlar, organizasyonun mevcut konumundan hedef konuma geçişin temel varsayımlarını masaya yatırırız. Çıktı: yönetim kurulu onaylı kuzey yıldızı dokümanı.',
      },
      {
        heading: 'Strateji Köprüsü: OKR + Quarterly Cadence',
        body: 'Vizyon güzeldir, uygulama zordur. Strateji Köprüsü katmanı, kuzey yıldızı ile çeyreklik hedefler arasındaki köprüyü kurar. OKR setting, quarterly cadence ve karar mercii sorumluluk haritası bu katmanda netleşir. Hangi kararın kim tarafından verileceğini, hangi metrik eşiğinde eskalasyon olacağını birlikte tasarlarız.',
      },
      {
        heading: 'Sonuç Mühendisliği: KPI Baseline + Ölçüm Sistemi',
        body: "Strateji ölçülemiyorsa stratejik değildir. KPI tasarımı, baseline ölçümü ve metric instrumentation'a odaklanır. İlk haftada mevcut performansın baseline'ını çıkarır, hangi metriklerin gerçekten engagement'i temsil ettiğini birlikte seçeriz.",
      },
      {
        heading: 'Kültür Sürdürülebilirliği: Değişim Yönetimi',
        body: 'En iyi stratejiler kültür uyumsuzluğunda erir. Yönetim toplantısı ritüellerini, performans konuşmalarının dili ve karar verme protokollerini engagement boyunca gözlemleyip rafine ederiz. Yöneticilere bire bir koçluk + "decision sprint" formatı.',
      },
      {
        heading: "Anonim Sonuç Loop'u: Sürekli Öğrenme",
        body: "Engagement'in kapanışı, öğrenmenin başlangıcıdır. NDA çerçevesinde standartlaştırılmış retrospektif yapı kullanırız. 6 ay sonra anonim takip; öğrenmeler gelecek engagement'lere yansır.",
      },
    ],
    relatedServiceSlugs: ['strategic-transformation', 'mergers-acquisitions', 'family-business'],
    blogTags: ['strateji', 'okr', 'transformation', 'vision'],
  },
  {
    slug: 'family-business',
    title: 'Aile Şirketi Yönetişimi · Nesilden Nesle',
    subtitle:
      'Türkiye iş ekonomisinin bel kemiği aile şirketlerinde kurumsallaşmayı birlikte tasarlıyoruz.',
    intro:
      "Türk ekonomisinin %85+'ı aile şirketleridir. Kurucu nesil emekliliğe yaklaştıkça, 2. ve 3. nesil arası yetki devri kritikleşir. Aile = şirket = kurucu denkleminden, profesyonel yönetim + aile konseyi + yazılı governance modeline geçiş, en zorlu transition deneyimi. Aile Anayasası engagement'larımız tam bu süreci yapılandırılmış hale getirir.",
    sections: [
      {
        heading: 'Aile Anayasası Anatomisi',
        body: 'Family mission, values, ownership policy, governance — 40 sayfa civarı doküman. Aile üyeleri ile iteratif review + hukuki validation ile finalize edilir. Hisse devri, kar payı, akraba istihdamı yazılı kurallarla netleşir.',
      },
      {
        heading: 'Family Council vs Yönetim Kurulu',
        body: 'İki ayrı yapı. Family Council aile üyelerinin "owner" rolündeki forumu. Yönetim Kurulu şirketin operasyonel karar mercii. Karışıklığa son: karar hakları matrisi (decision rights) bu sınırı netleştirir.',
      },
      {
        heading: 'Succession Planlaması (3-7 Yıllık)',
        body: 'Yetki devir takvimi, kuşak transfer mentor programı, profesyonel CEO/CFO interview desteği. Acele değil, planlı geçiş. Kurucu hala aktif iken next-gen rotasyonu başlar.',
      },
    ],
    relatedServiceSlugs: ['family-business', 'hr-transformation', 'mergers-acquisitions'],
    blogTags: ['aile-sirketleri', 'governance', 'succession'],
  },
  {
    slug: 'operations',
    title: 'Operasyonel Mükemmellik · Lean Six Sigma + Verimlilik',
    subtitle: 'OEE, cycle time, lead time metriklerinde %15-40 iyileşme — sahaya inerek.',
    intro:
      "Maliyet yapısını sahaya inerek söker, operasyonel kayıpları sistematik tespit ederiz. Gemba walk, Value Stream Mapping, kaizen sprint'leri, Six Sigma DMAIC projeler. Sürdürülebilirliği sağlamak için ekibe Green Belt eğitim + daily management board kurulumu.",
    sections: [
      {
        heading: 'Gemba Walk + Value Stream Mapping',
        body: 'Sahada bizzat akış izleme. Current state value stream haritası. 7 müda (israf) tanımlama: aşırı üretim, bekleme, transport, aşırı işleme, envanter, hareket, kusur. Future state target çiziminde sektörel benchmark kullanırız.',
      },
      {
        heading: "Kaizen Sprint'leri (6-8 hafta)",
        body: "Haftalık 2-3 günlük kaizen workshop'ları. SMED ile setup time azaltma, 5S ile alan organizasyonu, kanban ile pull production, poka-yoke ile hata önleme.",
      },
      {
        heading: 'Sürdürülebilirlik Sistemleri',
        body: 'Daily management board, ekip liderlerine moderasyon eğitimi, KPI dashboard kurulumu. Engagement bittikten 6-12 ay sonra metric tutarsa metodoloji kalıcıdır.',
      },
    ],
    relatedServiceSlugs: ['operational-excellence', 'digital-strategy', 'ai-analytics'],
    blogTags: ['lean', 'six-sigma', 'operations', 'verimlilik'],
  },
  {
    slug: 'digital-ai',
    title: 'Dijital & AI Dönüşümü · Tool Değil Strateji',
    subtitle:
      'AI/dijital tool seçimi değil, strateji-süreç-teknoloji-kültür tetragramının uyumlandırılması.',
    intro:
      "Dijital dönüşüm projelerinin %70'i başarısız olur — vendor seçimi değil organizasyon hazır olmadığı için. ERP/CRM 18 ay sonra %40 adoption, RPA pilotları 6 ay sonra unutuluyor, AI hype içinde use-case seçimi yapılmıyor. Vendor-agnostic yaklaşımla strateji + change management + operating model.",
    sections: [
      {
        heading: 'Dijital Olgunluk Audit (6 Boyut)',
        body: 'Strateji, süreç, teknoloji, veri, kültür, organizasyon. Sektörel benchmark. 3-yıllık teknoloji vizyonu; build-buy-partner kararları.',
      },
      {
        heading: 'AI Use-Case Portfolio',
        body: 'Impact × feasibility matrisi. 5-10 use-case listesi. 2-3 pilot ML/GenAI projesi production-ready. MLOps pipeline (versioning + monitoring + retraining).',
      },
      {
        heading: 'IT Operating Model',
        body: "Centralized vs federated vs hybrid. CTO/CDO C-level decision table'da. Change management plan + capability building.",
      },
    ],
    relatedServiceSlugs: ['digital-strategy', 'ai-analytics', 'data-governance'],
    blogTags: ['dijital-donusum', 'ai', 'tech-strategy', 'rpa'],
  },
  {
    slug: 'sustainability-esg',
    title: "Sürdürülebilirlik & ESG · CBAM'a Hazır Strateji",
    subtitle: 'AB Yeşil Mutabakatı 2026 takvimine sektörünüzü hazırlıyoruz.',
    intro:
      "CBAM (Karbon Sınırı Düzenleme Mekanizması) 2026'da tam aktif. AB pazarına ihracatçı Türk üreticilerin %42'si karbon-yoğun sektörlerde — etki simülasyonu yapılmamış. Müşteriden Scope 3 emisyon talep ediliyor ama ölçüm metodolojisi belirsiz. ESG strategy engagement'larımız ile materiality, karbon envanteri, decarbonization roadmap, yeşil finansman.",
    sections: [
      {
        heading: 'Materiality Assessment',
        body: 'Hangi ESG konuları sektör + paydaş için kritik. Öncelik haritası. GRI / SASB / TCFD framework seçimi.',
      },
      {
        heading: 'Karbon Envanteri (Scope 1+2+3)',
        body: 'ISO 14064 / GHG Protocol uyumlu. Scope 3 tedarikçi data toplama. CBAM etki simülasyonu — ihracat maliyetine etki.',
      },
      {
        heading: 'Yeşil Finansman Erişimi',
        body: 'Sustainable bond, green loan, EU Horizon hibe. Yıllık ESG raporu uluslararası standartlarda hazırlanır.',
      },
    ],
    relatedServiceSlugs: ['esg-strategy', 'investment-incentives', 'macro-risk'],
    blogTags: ['esg', 'cbam', 'sustainability', 'green-deal'],
  },
];

const SITE_URL = 'https://www.ecypro.com';

export const PillarPage: React.FC = () => {
  const { language } = useTranslation();
  const { slug } = useParams<{ slug: string }>();
  const pillar = useMemo(() => PILLARS.find((p) => p.slug === slug), [slug]);

  if (!pillar) return <Navigate to="/404" replace />;

  const services = pillar.relatedServiceSlugs
    .map((s) => SERVICES.find((sv) => sv.link?.endsWith(`/${s}`)))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  const pageUrl = `${SITE_URL}/pillar/${pillar.slug}`;
  const canonicalUrl = buildCanonical(`/pillar/${pillar.slug}`, language);
  const breadcrumbSchema = buildBreadcrumbListSchema([
    { name: 'Anasayfa', url: `${SITE_URL}/` },
    { name: 'Pillars', url: `${SITE_URL}/pillar` },
    { name: pillar.title, url: pageUrl },
  ]);

  return (
    <div className="min-h-screen bg-neutral text-slate-300">
      <Helmet>
        <title>{`${pillar.title} | eCyPro Premium Consulting`}</title>
        <meta name="description" content={pillar.subtitle} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={`${pillar.title} | eCyPro`} />
        <meta property="og:description" content={pillar.subtitle} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="article" />
      </Helmet>
      <JsonLd data={breadcrumbSchema} />

      <section className="relative pt-32 pb-12 px-6 md:px-12 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgba(37,99,235,0.12),transparent)] pointer-events-none" />
        <div className="relative max-w-4xl mx-auto">
          <nav className="text-sm text-slate-500 mb-8" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-secondary transition-colors">
              Anasayfa
            </Link>
            <span className="mx-2 text-slate-700">/</span>
            <span className="text-slate-300">Pillar</span>
            <span className="mx-2 text-slate-700">/</span>
            <span className="text-slate-300">{pillar.title.split('·')[0]?.trim()}</span>
          </nav>
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 border border-secondary/30 text-[10px] font-bold tracking-[0.25em] text-secondary uppercase mb-6">
            <Sparkles size={11} aria-hidden="true" /> Pillar · Strategic Cluster
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-white mb-6 leading-[1.05]">
            {pillar.title}
          </h1>
          <p className="text-xl text-slate-400 leading-relaxed mb-8">{pillar.subtitle}</p>
          <p className="text-lg text-slate-300 leading-relaxed border-l-4 border-secondary pl-5">
            {pillar.intro}
          </p>
        </div>
      </section>

      <section className="py-12 px-6 md:px-12 border-t border-white/5">
        <div className="max-w-4xl mx-auto space-y-10">
          {pillar.sections.map((s, i) => (
            <article key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8">
              <div className="text-xs font-bold uppercase tracking-widest text-secondary mb-2">
                Bölüm {i + 1}
              </div>
              <h2 className="text-2xl md:text-3xl font-serif font-bold text-white mb-4">
                {s.heading}
              </h2>
              <p className="text-slate-300 leading-relaxed">{s.body}</p>
            </article>
          ))}
        </div>
      </section>

      {services.length > 0 && (
        <section className="py-12 px-6 md:px-12 border-t border-white/5 bg-white/[0.02]">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-white mb-8">
              İlgili Hizmetlerimiz
            </h2>
            <div className="grid md:grid-cols-3 gap-5">
              {services.map((sv) => (
                <Link
                  key={sv.id}
                  to={sv.link}
                  className="group p-6 bg-white/5 border border-white/10 rounded-2xl hover:border-secondary/40 transition-all"
                >
                  <h3 className="text-lg font-bold text-white mb-3 group-hover:text-secondary transition-colors">
                    {sv.title}
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed mb-4 line-clamp-3">
                    {sv.description}
                  </p>
                  <span className="inline-flex items-center gap-1 text-xs text-secondary font-semibold">
                    Detayları gör <ArrowRight size={12} />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-20 px-6 md:px-12 border-t border-white/5 bg-gradient-to-b from-transparent to-secondary/[0.04]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-5">
            Discovery Call ile başlayalım
          </h2>
          <p className="text-slate-400 mb-10 leading-relaxed text-lg">
            45 dakikalık ücretsiz keşif görüşmesi; bu pillar kapsamında bir engagement
            değerlendirmesi.
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 px-8 py-4 min-h-[52px] rounded-xl bg-secondary text-neutral font-semibold hover:bg-secondary/90 transition-colors shadow-lg shadow-secondary/20"
          >
            Görüşme Planla <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default PillarPage;
