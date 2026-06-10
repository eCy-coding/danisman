/**
 * Sektör derinlik içeriği — answer-first GEO/SEO katmanı (EK GÖREV 11).
 *
 * FAQ (sectorFaqs.ts) ile birlikte sektör sayfalarını ~450 → ~900+ kelimeye
 * çıkarır. `overview` answer-first (ilk cümle doğrudan değer — AI cevap
 * motorları açılışa bakar); `methodology` nasıl çalıştığımız; `outcomes`
 * somut metrikler (humanizer: gerçek/anonim sayı, founder-voice).
 * Render: src/components/sections/SectorDepth.tsx (prop-driven).
 */
type Lang = 'tr' | 'en';

export interface MethodStep {
  title: { tr: string; en: string };
  desc: { tr: string; en: string };
}

export interface Outcome {
  metric: string;
  label: { tr: string; en: string };
}

export interface SectorContent {
  overview: { tr: string; en: string };
  methodology: MethodStep[];
  outcomes: Outcome[];
}

export const SECTOR_CONTENT: Record<string, SectorContent> = {
  'imalat-sanayi': {
    overview: {
      tr: 'İmalat şirketlerinde değer, sahada üretilir — sunum odasında değil. eCyPro üretim operasyonunuzu önce ölçer (OEE taban, darboğaz hattı, fire kaynakları), sonra en yüksek getirili tek hatta odaklanır. Lean & Six Sigma disiplinini Endüstri 4.0 veri görünürlüğüyle birleştirir; tipik bir hatta ilk çeyrekte ölçülebilir verimlilik kazanımı hedefler. Founder Emre Can Yalçın doğrudan eşlik eder — junior delegasyon yok.',
      en: 'In manufacturing, value is made on the floor — not in the boardroom. eCyPro first measures your production operation (OEE baseline, bottleneck line, scrap sources), then focuses on the single highest-return line. We combine Lean & Six Sigma discipline with Industry 4.0 data visibility and target measurable efficiency gains on a line within the first quarter. Founder Emre Can Yalçın works with you directly — no junior delegation.',
    },
    methodology: [
      {
        title: { tr: 'Ölç', en: 'Measure' },
        desc: {
          tr: 'İlk 2 haftada OEE taban ölçümü + değer akışı haritalama (VSM) ile darboğazı buluruz.',
          en: 'In the first 2 weeks we baseline OEE and map the value stream (VSM) to locate the bottleneck.',
        },
      },
      {
        title: { tr: 'Odaklan', en: 'Focus' },
        desc: {
          tr: 'En yüksek getirili tek hatta yoğunlaşır, kazanımı kanıtlarız — dağılmadan.',
          en: 'We concentrate on the single highest-return line and prove the gain — without spreading thin.',
        },
      },
      {
        title: { tr: 'Standartlaştır', en: 'Standardize' },
        desc: {
          tr: 'Kazanan değişikliği SOP + görsel yönetim ile kalıcı hale getiririz.',
          en: 'We make the winning change permanent via SOPs and visual management.',
        },
      },
      {
        title: { tr: 'Ölçekle', en: 'Scale' },
        desc: {
          tr: 'ROI kanıtlanınca diğer hatlara + Endüstri 4.0 veri katmanına genişletiriz.',
          en: 'Once ROI is proven we extend to other lines and the Industry 4.0 data layer.',
        },
      },
    ],
    outcomes: [
      {
        metric: '%10-18',
        label: { tr: 'İlk çeyrek OEE artışı (tipik)', en: 'First-quarter OEE lift (typical)' },
      },
      {
        metric: '60-90 gün',
        label: { tr: 'İlk ölçülebilir kazanım', en: 'First measurable gain' },
      },
      { metric: '6-12 ay', label: { tr: 'Tam Lean dönüşümü', en: 'Full Lean transformation' } },
    ],
  },
  'finansal-hizmetler': {
    overview: {
      tr: 'Finansal hizmetlerde rekabet, uyum ile hızın aynı anda yönetilmesiyle kazanılır. eCyPro önce mevcut müşteri kabul ve izleme sürecinizi MASAK/AML yükümlülükleriyle eşleştirir, boşluk haritası çıkarır; ardından risk-bazlı segmentasyon ve raporlama akışını kurar. Operasyonel ve regülasyon riskini tek bir envanterde birleştirir — denetimde tek kaynak konuşur. Bağımsızız: hiçbir core-banking ya da regtech satıcısının ortağı değiliz, önerimiz tarafsızdır.',
      en: 'In financial services, you win by managing compliance and speed at once. eCyPro first maps your onboarding and monitoring against MASAK/AML obligations and produces a gap map, then builds risk-based segmentation and the reporting workflow. We unify operational and regulatory risk in a single inventory — audits speak from one source of truth. We are independent: not a partner of any core-banking or regtech vendor, so our recommendation is unbiased.',
    },
    methodology: [
      {
        title: { tr: 'Boşluk Haritası', en: 'Gap Map' },
        desc: {
          tr: 'Mevcut süreci MASAK/Basel yükümlülükleriyle eşleştirir, açıkları önceliklendiririz.',
          en: 'We map current process against MASAK/Basel obligations and prioritize gaps.',
        },
      },
      {
        title: { tr: 'Risk Envanteri', en: 'Risk Inventory' },
        desc: {
          tr: 'Her riske sahip, kontrol, eşik ve raporlama frekansı atarız.',
          en: 'Every risk gets an owner, control, threshold, and reporting cadence.',
        },
      },
      {
        title: { tr: 'Otomasyon', en: 'Automation' },
        desc: {
          tr: 'KYC/şüpheli işlem akışını otomatikleştirir, manuel inceleme süresini kısaltırız.',
          en: 'We automate KYC/suspicious-transaction flows, cutting manual review time.',
        },
      },
      {
        title: { tr: 'Yönetişim', en: 'Governance' },
        desc: {
          tr: 'Üç aylık risk komitesi ritmiyle uyumu sürdürülebilir kılarız.',
          en: 'A quarterly risk-committee rhythm makes compliance sustainable.',
        },
      },
    ],
    outcomes: [
      {
        metric: '8-12 hafta',
        label: { tr: 'Denetime hazırlık (tipik fintech)', en: 'Audit readiness (typical fintech)' },
      },
      {
        metric: '%40-60',
        label: { tr: 'Manuel KYC inceleme süresi azalışı', en: 'Manual KYC review time reduction' },
      },
      {
        metric: 'Tek',
        label: {
          tr: 'Risk envanteri — tek doğruluk kaynağı',
          en: 'Risk inventory — single source of truth',
        },
      },
    ],
  },
  'ilac-saglik': {
    overview: {
      tr: 'İlaç ve sağlıkta başarı, regülasyon ile ticari stratejinin aynı masada konuşulmasıyla gelir. eCyPro kalite sisteminizi GMP gereklilikleriyle karşılaştırır, denetim-hazırlık boşluklarını kapatır; eş zamanlı olarak pazara erişim ve geri ödeme stratejisini şekillendirir. Sağlık verisini KVKK özel-nitelikli veri kurallarıyla korur — analizde anonimleştirme/pseudonimleştirme uygular, ham hasta verisini açmaz. Belirli bir CRO ya da yazılımın satıcısı değiliz; tarafsız yol haritası veririz.',
      en: 'In pharma and healthcare, success comes when regulatory and commercial strategy sit at the same table. eCyPro benchmarks your quality system against GMP, closes inspection-readiness gaps, and concurrently shapes market access and reimbursement strategy. We protect health data under KVKK special-category rules — anonymizing/pseudonymizing for analysis, never exposing raw patient data. We are not a reseller of any CRO or software; the roadmap is unbiased.',
    },
    methodology: [
      {
        title: { tr: 'GMP Boşluk', en: 'GMP Gap' },
        desc: {
          tr: 'Kalite sistemini GMP ile karşılaştırır, denetim-hazırlık analizini 2-3 haftada çıkarırız.',
          en: 'We benchmark the quality system against GMP and produce an inspection-readiness analysis in 2-3 weeks.',
        },
      },
      {
        title: { tr: 'CAPA', en: 'CAPA' },
        desc: {
          tr: 'Dokümantasyon, CAPA ve değişiklik kontrol süreçlerini güçlendiririz.',
          en: 'We strengthen documentation, CAPA, and change-control processes.',
        },
      },
      {
        title: { tr: 'Pazara Erişim', en: 'Market Access' },
        desc: {
          tr: 'Ödeyici beklentisine göre değer dosyasını şekillendiririz.',
          en: 'We shape the value dossier to payer expectations.',
        },
      },
      {
        title: { tr: 'Veri Koruma', en: 'Data Protection' },
        desc: {
          tr: 'Açık rıza akışı + erişim logu + anonimleştirme ile KVKK uyumu sağlarız.',
          en: 'Explicit-consent flows + access logging + anonymization ensure KVKK compliance.',
        },
      },
    ],
    outcomes: [
      {
        metric: '2-3 hafta',
        label: { tr: 'Denetim boşluk analizi', en: 'Inspection gap analysis' },
      },
      {
        metric: '3-6 ay',
        label: { tr: 'Değer dosyası hazırlığı', en: 'Value dossier preparation' },
      },
      {
        metric: 'Özel-nitelik',
        label: { tr: 'Sağlık verisi KVKK koruması', en: 'Special-category health-data protection' },
      },
    ],
  },
  'perakende-e-ticaret': {
    overview: {
      tr: 'Perakende ve e-ticarette büyüme, tek müşteri görünümüyle başlar. Mağaza, online ve çağrı merkezi verisi ayrı durdukça omnichannel sadece slogan kalır. eCyPro önce kimlik birleştirme ve stok görünürlüğünü kurar (ilk 8-12 hafta), sonra kanal-arası deneyimi açar. CLV ve kohort analiziyle pazarlama bütçesini değer ürettiği segmente kaydırır; envanter ve son-mil maliyetini ölçer, sonra düşürür. Her aksiyonu A/B testiyle doğrularız.',
      en: 'In retail and e-commerce, growth starts with a single customer view. As long as store, online, and call-center data sit apart, omnichannel stays a slogan. eCyPro first unifies identity and inventory visibility (the first 8-12 weeks), then unlocks cross-channel experiences. With CLV and cohort analysis we shift budget to the segment that creates value, and we measure then reduce inventory and last-mile cost. We validate every action with A/B tests.',
    },
    methodology: [
      {
        title: { tr: 'Tek Görünüm', en: 'Single View' },
        desc: {
          tr: 'Kimlik birleştirme + stok görünürlüğü ile omnichannel temelini kurarız.',
          en: 'We build the omnichannel foundation via identity unification + inventory visibility.',
        },
      },
      {
        title: { tr: 'Segment', en: 'Segment' },
        desc: {
          tr: 'CLV + kohort analiziyle yüksek-değerli segmenti buluruz.',
          en: 'CLV + cohort analysis surface the high-value segment.',
        },
      },
      {
        title: { tr: 'Optimize', en: 'Optimize' },
        desc: {
          tr: 'Talep tahmini + güvenlik stoğu + son-mil ağını optimize ederiz.',
          en: 'We optimize demand forecasting, safety stock, and the last-mile network.',
        },
      },
      {
        title: { tr: 'Test Et', en: 'Test' },
        desc: {
          tr: 'Dönüşüm aksiyonlarını A/B testiyle doğrular, kazananı ölçekleriz.',
          en: 'We validate conversion actions with A/B tests and scale the winner.',
        },
      },
    ],
    outcomes: [
      {
        metric: '8-12 hafta',
        label: { tr: 'Tek müşteri görünümü kurulumu', en: 'Single customer view setup' },
      },
      {
        metric: '30-60 gün',
        label: { tr: 'Dönüşüm quick-win ölçümü', en: 'Conversion quick-win measurement' },
      },
      {
        metric: 'A/B',
        label: { tr: 'Her aksiyon kanıtla doğrulanır', en: 'Every action validated by evidence' },
      },
    ],
  },
  'teknoloji-saas': {
    overview: {
      tr: "Teknoloji ve SaaS'ta sürdürülebilir büyüme, doğru metriklerle başlar. Çoğu ekip MRR ve churn'ü tutarsız hesaplar, board yanlış sinyal alır. eCyPro tek bir metrik sözlüğü kurar, NRR'yi (net gelir tutma) büyümenin asıl pusulası yapar — sağlıklı bir SaaS'ta NRR %110 üzeridir. AI yatırımını hype değil kullanım senaryosuyla değerlendirir, küçük pilotla ROI'yi kanıtlar. Operatör bakışıyla çalışırız: slayt değil, çalışan sistem kurarız.",
      en: "In tech and SaaS, sustainable growth starts with the right metrics. Most teams compute MRR and churn inconsistently and the board gets the wrong signal. eCyPro builds a single metric dictionary and makes NRR (net revenue retention) the real compass — a healthy SaaS shows NRR above 110%. We evaluate AI investment by use case, not hype, proving ROI with a small pilot. We work with an operator's lens: we build working systems, not slides.",
    },
    methodology: [
      {
        title: { tr: 'Metrik Netliği', en: 'Metric Clarity' },
        desc: {
          tr: "Tek metrik sözlüğü kurar, NRR'yi büyümenin pusulası yaparız.",
          en: 'We build a single metric dictionary and make NRR the growth compass.',
        },
      },
      {
        title: { tr: 'ICP & GTM', en: 'ICP & GTM' },
        desc: {
          tr: 'İğne-ucu segment seçer, kanal-mesaj uyumunu test ederiz.',
          en: 'We pick a sharp ICP and test channel-message fit.',
        },
      },
      {
        title: { tr: 'AI Pilotu', en: 'AI Pilot' },
        desc: {
          tr: 'AI yatırımını 2-4 haftalık pilotla, ROI kanıtlanınca ölçekleriz.',
          en: 'We pilot AI investment in 2-4 weeks and scale once ROI is proven.',
        },
      },
      {
        title: { tr: 'Org Tasarımı', en: 'Org Design' },
        desc: {
          tr: 'Karar haklarını netleştirir, koordinasyon maliyetini düşürürüz.',
          en: 'We clarify decision rights and cut coordination cost.',
        },
      },
    ],
    outcomes: [
      {
        metric: '%110+',
        label: { tr: 'Hedef NRR (sağlıklı SaaS)', en: 'Target NRR (healthy SaaS)' },
      },
      { metric: '2-4 hafta', label: { tr: 'AI pilot doğrulama', en: 'AI pilot validation' } },
      {
        metric: '<12 ay',
        label: { tr: 'Hedef CAC geri ödeme süresi', en: 'Target CAC payback period' },
      },
    ],
  },
};

export function getSectorContent(slug: string): SectorContent | undefined {
  return SECTOR_CONTENT[slug];
}

export type { Lang };
