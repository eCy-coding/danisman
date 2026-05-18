/**
 * P53.D1 — Founder bio variants (TR + EN, 4 lengths).
 *
 * Use cases:
 *   - 50w → Twitter/LinkedIn micro-bio, conference speaker tag
 *   - 150w → Standard speaker intro, podcast description
 *   - 300w → Full press kit + interview brief
 *   - 500w → Annual report opening, board introduction
 *
 * Reusable via `FOUNDER_BIOS[lang][length]`.
 */

export type FounderBioLength = '50w' | '150w' | '300w' | '500w';
export type SupportedLang = 'tr' | 'en';

interface FounderBio {
  text: string;
  wordCount: number;
}

export const FOUNDER_BIOS: Record<SupportedLang, Record<FounderBioLength, FounderBio>> = {
  tr: {
    '50w': {
      wordCount: 50,
      text:
        'Emre Can Yalçın, eCyPro Premium Consulting\'in kurucusu ve baş stratejisti. Stratejik dönüşüm, kurumsal yönetişim ve kültür mühendisliği alanlarında pratik yürütüyor. Türkiye merkezli orta-büyük ölçekli şirketlere AB pazarlarında engagement deneyimi getiriyor.',
    },
    '150w': {
      wordCount: 150,
      text:
        'Emre Can Yalçın, eCyPro Premium Consulting\'in kurucusu ve baş stratejisti. Stratejik dönüşüm, kurumsal yönetişim, M&A advisory ve kültür mühendisliği alanlarında engagement\'lar yürütüyor. eCyverse ekosisteminin premium danışmanlık kolunu kurarak, Türkiye merkezli orta-büyük ölçekli şirketlere AB pazarlarında engagement deneyimi getiriyor. Çalıştığı engagement\'larda kendi geliştirdiği 5-katmanlı metodolojiyi (Vizyon Mimarı, Strateji Köprüsü, Sonuç Mühendisliği, Kültür Sürdürülebilirliği, Anonim Sonuç Loop\'u) uygular. Big4 mid-market boşluğunda boutique premium pozisyonunu hedefler; engagement\'larında üst yönetim seviyesinde stratejik karar destek + sahaya inerek uygulama disiplini birleşimini sunar. Profesyonel deneyimi süresince 120+ stratejik kararın oluşumuna katkıda bulunmuştur.',
    },
    '300w': {
      wordCount: 300,
      text:
        'Emre Can Yalçın, eCyPro Premium Consulting\'in kurucusu ve baş stratejisti olarak Türkiye iş dünyasında premium boutique consulting pazarında pozisyon almıştır. 5+ yıllık pratik deneyimi boyunca 120+ stratejik karar oluşumuna katkıda bulunmuş, 12+ sektörde engagement yürütmüştür. eCyverse ekosisteminin premium danışmanlık kolunu kurarak, Big4 mid-market boşluğunda boutique premium pozisyonunu hedeflemiştir.\n\nÇalıştığı engagement\'larda kendi geliştirdiği 5-katmanlı metodolojiyi uygular: Vizyon Mimarı (3-5 yıllık kuzey yıldızı), Strateji Köprüsü (OKR + quarterly cadence + RACI), Sonuç Mühendisliği (KPI baseline + measurement), Kültür Sürdürülebilirliği (değişim yönetimi + leadership coaching), Anonim Sonuç Loop\'u (NDA-friendly retrospective).\n\nStrategic management advisory, organizational transformation, M&A advisory, family business governance ve culture engineering uzmanlık alanlarıdır. Türkiye + AB pazarlarında engagement deneyimine sahip; ihracatçı üreticiler, aile holdingleri, fintech scale-up\'lar, ESG/CBAM hazırlık yapan kurumlar müşteri portföyünün omurgasıdır.',
    },
    '500w': {
      wordCount: 500,
      text:
        'Emre Can Yalçın, eCyPro Premium Consulting\'in kurucusu ve baş stratejisti olarak Türkiye iş dünyasında premium boutique consulting pazarında pozisyon almıştır. 5+ yıllık pratik deneyimi boyunca 120+ stratejik karar oluşumuna katkıda bulunmuş, 12+ sektörde engagement yürütmüştür. eCyverse ekosisteminin premium danışmanlık kolunu kurarak, Big4 mid-market boşluğunda boutique premium pozisyonunu hedeflemiştir.\n\nÇalıştığı engagement\'larda kendi geliştirdiği 5-katmanlı metodolojiyi uygular: Vizyon Mimarı (3-5 yıllık kuzey yıldızı), Strateji Köprüsü (OKR + quarterly cadence + RACI), Sonuç Mühendisliği (KPI baseline + measurement), Kültür Sürdürülebilirliği (değişim yönetimi + leadership coaching), Anonim Sonuç Loop\'u (NDA-friendly retrospective).\n\nStrategic management advisory, organizational transformation, M&A advisory, family business governance ve culture engineering uzmanlık alanlarıdır. Türkiye + AB pazarlarında engagement deneyimine sahip; ihracatçı üreticiler, aile holdingleri, fintech scale-up\'lar, ESG/CBAM hazırlık yapan kurumlar müşteri portföyünün omurgasıdır.\n\nMethodology felsefesi: Big4\'ün scale ekonomisinin aksine, eCyPro premium boutique olarak engagement-başına derinleşmeyi seçer. Her engagement bir kuzey yıldızı + 90 günlük uygulama köprüsü + ölçülebilir KPI ile başlar; engagement sonu retrospektif + 6 ay sonra anonim takip ile öğrenmeleri konsolide eder. Vendor-agnostic, conflict-of-interest free, ve müşteri kapasitesini bağımlılık değil otonomi yönüne büyütmeyi hedefler.\n\nBoş zamanlarında Türk iş dünyasının dönüşüm süreçlerini gözlemler; aile şirketi 3. nesil geçişleri, KOBİ dijital dönüşümü ve AB Yeşil Mutabakatı sınırında Türk üreticilerin ESG hazırlığı özel ilgi alanlarıdır. Düzenli olarak LinkedIn ve sektörel konferanslarda thought leadership içeriği paylaşır.',
    },
  },
  en: {
    '50w': {
      wordCount: 50,
      text:
        'Emre Can Yalçın is the founder and chief strategist of EcyPro Premium Consulting. He practices in strategic transformation, organizational governance, and culture engineering. He brings EU market engagement experience to mid-to-large enterprises headquartered in Türkiye.',
    },
    '150w': {
      wordCount: 150,
      text:
        'Emre Can Yalçın is the founder and chief strategist of EcyPro Premium Consulting. He leads engagements in strategic transformation, organizational governance, M&A advisory, and culture engineering. As the founder of the eCyverse ecosystem\'s premium consulting arm, he brings EU market engagement experience to mid-to-large enterprises headquartered in Türkiye. Engagements apply his self-developed 5-layer methodology (Vision Architecture, Strategy Bridge, Result Engineering, Culture Sustainability, Anonymous Result Loop). He positions EcyPro in the boutique premium space — addressing the mid-market gap left by Big4 firms — combining executive-level strategic decision support with field-level execution discipline. Throughout his professional practice, he has contributed to 120+ strategic decisions across 12+ industries.',
    },
    '300w': {
      wordCount: 300,
      text:
        'Emre Can Yalçın is the founder and chief strategist of EcyPro Premium Consulting, positioning the firm in Türkiye\'s premium boutique consulting market. Across 5+ years of professional practice he has contributed to 120+ strategic decisions and engaged 12+ industries. He founded the eCyverse ecosystem\'s premium consulting arm specifically to address the mid-market gap left by Big4 firms.\n\nEngagements apply his self-developed 5-layer methodology: Vision Architecture (3-5 year north star), Strategy Bridge (OKR + quarterly cadence + RACI), Result Engineering (KPI baseline + measurement), Culture Sustainability (change management + leadership coaching), and Anonymous Result Loop (NDA-friendly retrospective).\n\nHis areas of expertise include strategic management advisory, organizational transformation, M&A advisory, family business governance, and culture engineering. With engagement experience in both Türkiye and EU markets, his client portfolio centers on exporting manufacturers, family holdings, fintech scale-ups, and organizations preparing for ESG/CBAM compliance.',
    },
    '500w': {
      wordCount: 500,
      text:
        'Emre Can Yalçın is the founder and chief strategist of EcyPro Premium Consulting, positioning the firm in Türkiye\'s premium boutique consulting market. Across 5+ years of professional practice he has contributed to 120+ strategic decisions and engaged 12+ industries. He founded the eCyverse ecosystem\'s premium consulting arm specifically to address the mid-market gap left by Big4 firms.\n\nEngagements apply his self-developed 5-layer methodology: Vision Architecture (3-5 year north star), Strategy Bridge (OKR + quarterly cadence + RACI), Result Engineering (KPI baseline + measurement), Culture Sustainability (change management + leadership coaching), and Anonymous Result Loop (NDA-friendly retrospective).\n\nHis areas of expertise include strategic management advisory, organizational transformation, M&A advisory, family business governance, and culture engineering. With engagement experience in both Türkiye and EU markets, his client portfolio centers on exporting manufacturers, family holdings, fintech scale-ups, and organizations preparing for ESG/CBAM compliance.\n\nMethodology philosophy: in contrast to Big4 scale economics, EcyPro chooses depth-per-engagement as a premium boutique. Every engagement starts with a north star, a 90-day implementation bridge, and a measurable KPI baseline; closes with a retrospective and an anonymous follow-up review 6 months later to consolidate learnings. The practice is vendor-agnostic, free of conflicts of interest, and aims to grow client capacity toward autonomy rather than dependency.\n\nOutside of practice, he observes Türkiye\'s transformation dynamics — family business third-generation transitions, SME digital adoption, and Turkish exporters\' ESG readiness ahead of the EU Green Deal are personal areas of interest. He shares thought leadership content regularly on LinkedIn and at sector conferences.',
    },
  },
};

export function getFounderBio(lang: SupportedLang, length: FounderBioLength): FounderBio {
  return FOUNDER_BIOS[lang][length];
}
