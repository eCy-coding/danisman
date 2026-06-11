/**
 * Pillar page editorial layer: per-category intro ("what eCyPro believes about
 * this domain") and the "Buradan başlayın" curated picks. Picks fall back to
 * the three most substantial pieces (longest read) until editors override via
 * the `start` slug lists below.
 */
import { ALL_ITEMS, type FeedItem } from '@/lib/perspektifler';

export interface PillarIntro {
  /** 150–300-word intro, split into paragraphs. */
  paragraphs: string[];
  /** Meta description. */
  seo: string;
  /** Optional curated "Buradan başlayın" slugs (max 3). */
  start?: string[];
}

export const PILLAR_INTROS: Record<string, PillarIntro> = {
  strateji: {
    seo: 'Kurumsal strateji, rekabet avantajı ve dönüşüm yol haritaları üzerine eCyPro içgörüleri.',
    paragraphs: [
      'Strateji, bir slayt destesi değil; kaynakların nereye akacağına dair verilmiş kararların toplamıdır. eCyPro olarak stratejiyi üç soruya indiririz: nerede oynayacağız, nasıl kazanacağız ve bundan vazgeçmek pahasına neyi yapmayacağız? Türkiye pazarında büyüyen şirketlerin çoğunun sorunu fikir kıtlığı değil, seçim disiplini eksikliğidir.',
      'Bu kategoride rekabet analizi, büyüme yol haritaları, kriz dönemi karar mekanizmaları ve danışmanlık hizmeti satın alma pratiği üzerine saha tecrübesinden süzülmüş analizler bulacaksınız. Her yazı, yönetim kurulu masasına taşınabilecek netlikte bir karar çerçevesi sunmayı hedefler.',
    ],
  },
  'yapay-zeka-teknoloji': {
    seo: 'Yapay zeka stratejisi, üretken AI, MLOps ve dijital dönüşüm üzerine eCyPro içgörüleri.',
    paragraphs: [
      'Yapay zekâda kazananlar, en yeni modeli deneyenler değil; veri temelini, operasyon ritmini ve insan adaptasyonunu aynı anda kurabilenlerdir. eCyPro, AI yatırımlarını demo coşkusuyla değil, ölçülebilir iş sonucu (ROI, döngü süresi, hata oranı) ile değerlendirir.',
      'Bu kategoride AI olgunluk değerlendirmesinden üretim hattında MLOps pratiğine, KPI tahminlemesinden üretken AI kullanım senaryolarına uzanan, uygulama odaklı rehberler yer alır. Amaç teknoloji vitrinleri değil; pazartesi sabahı uygulanabilir adımlardır.',
    ],
  },
  'finans-ekonomi': {
    seo: 'CFO gündemi, makroekonomik risk, yatırım ve finansal planlama üzerine eCyPro içgörüleri.',
    paragraphs: [
      'Finans fonksiyonu, kayıt tutan bir arka ofis olmaktan çıkıp sermaye tahsisinin stratejik beyni olmak zorunda. Yüksek enflasyon ve kur oynaklığı ortamında planlama ufku kısalırken, senaryo disiplini ve nakit görünürlüğü şirketlerin gerçek rekabet avantajı hâline geliyor.',
      'Bu kategoride makro risk yönetimi, AI yatırımlarının finansal gerekçelendirmesi, KPI tahminlemesi ve CFO ajandası üzerine analizler bulacaksınız. Her içgörü, finans liderlerinin yönetim kuruluna taşıyabileceği karar çerçeveleri sunar.',
    ],
  },
  'insan-organizasyon': {
    seo: 'Organizasyon tasarımı, aile şirketleri, İK stratejisi ve endüstriyel ilişkiler üzerine eCyPro içgörüleri.',
    paragraphs: [
      'Strateji insanlar aracılığıyla gerçekleşir; organizasyon tasarımı bu yüzden bir org-şeması egzersizi değil, karar haklarının ve sorumluluğun mimarisidir. Aile şirketlerinde kurumsallaşma, nesil geçişi ve profesyonel yönetimle sınır çizme bu mimarinin en kritik sınavlarıdır.',
      'Bu kategoride aile anayasasından toplu sözleşme stratejisine, yetenek yönetiminden değişim yönetimine uzanan içgörüler yer alır. Ortak payda: davranış değişikliği ölçülmüyorsa dönüşüm yok demektir.',
    ],
  },
  operasyon: {
    seo: 'Yalın operasyon, Altı Sigma, süreç optimizasyonu ve tedarik zinciri üzerine eCyPro içgörüleri.',
    paragraphs: [
      'Operasyonel mükemmellik bir maliyet programı değil, müşteriye akan değerin hız ve kalitesini sistematik olarak artırma disiplinidir. Yalın ve Altı Sigma araçları, ancak yönetim ritmi ve sahiplenme kültürüyle birleştiğinde kalıcı sonuç üretir.',
      'Bu kategoride üretim hattından proje yönetim ofisine, tedarik zinciri optimizasyonundan süreç madenciliğine uzanan uygulama hikâyeleri ve yöntem rehberleri bulacaksınız. Her yazının çıpası ölçülebilir verimlilik kazancıdır.',
    ],
  },
  'pazarlama-cx': {
    seo: 'Müşteri deneyimi, marka yönetimi ve pazarlama stratejisi üzerine eCyPro içgörüleri.',
    paragraphs: [
      'Marka, söylediğiniz değil; müşterinin her temas noktasında yaşadığıdır. Pazarlama ve müşteri deneyimini iki ayrı departman olarak değil, tek bir değer vaadi zinciri olarak ele alırız: konumlandırma, deneyim tasarımı ve ölçüm aynı masada kurgulanmalıdır.',
      'Bu kategoride nöropazarlamadan müşteri hizmetleri operasyonuna, işveren markasından itibar yönetimine uzanan analizler yer alır. Ortak ilke: algı iddiası değil, davranış verisi.',
    ],
  },
  'global-vizyon': {
    seo: 'Uluslararasılaşma, ihracat stratejisi ve sınır ötesi büyüme üzerine eCyPro içgörüleri.',
    paragraphs: [
      'Globalleşme bir pazar listesi değil, kabiliyet sorusudur: hangi pazara, hangi iş modeliyle, hangi yerel ortaklık ve uyum mimarisiyle? Türkiye merkezli şirketler için Turquality gibi destek mekanizmaları doğru kurgulandığında uluslararası büyümenin kaldıracı olur.',
      'Bu kategoride pazar giriş stratejisi, sınır ötesi M&A değerleme tuzakları ve ihracat operasyonu üzerine saha temelli rehberler bulacaksınız.',
    ],
  },
  'kamu-esg': {
    seo: 'ESG, sürdürülebilirlik, karbon yönetimi, KVKK ve regülasyon uyumu üzerine eCyPro içgörüleri.',
    paragraphs: [
      'ESG ve regülasyon uyumu, pazarlama broşürü değil; finansmana erişimin, tedarik zincirinde kalmanın ve kamu güveninin ön koşuludur. CBAM, CSRD ve KVKK/GDPR dalgası, uyumu hukuk departmanının köşesinden çıkarıp yönetim kurulu gündemine taşıdı.',
      'Bu kategoride net-zero eylem planlarından emisyon hesabına, veri yönetişiminden akıllı şehir politikalarına uzanan, denetlenebilirlik odaklı içgörüler yer alır.',
    ],
  },
  liderlik: {
    seo: 'Liderlik, yönetim kurulu etkinliği ve karar kalitesi üzerine eCyPro içgörüleri.',
    paragraphs: [
      'Liderlik karizma değil, tekrarlanabilir karar kalitesidir. Belirsizlik altında çevik kalmak; sinyali gürültüden ayıran bir bilgi mimarisi, hızlı-yavaş karar ayrımı ve hatadan öğrenme ritmi gerektirir.',
      'Bu kategoride yönetim kurulu çevikliği, liderlik takımı ritmi ve kurumsal yönetişim pratikleri üzerine, vaka temelli analizler bulacaksınız.',
    ],
  },
  'ma-degerleme': {
    seo: 'M&A stratejisi, değerleme, due diligence ve birleşme sonrası entegrasyon üzerine eCyPro içgörüleri.',
    paragraphs: [
      'M&A’da değer, imza anında değil; entegrasyonun ilk 90 gününde kazanılır ya da kaybedilir. Değerleme modelleri ne kadar rafine olursa olsun, sinerji varsayımları operasyonel sahiplenmeyle buluşmazsa kâğıt üzerinde kalır.',
      'Bu kategoride due diligence rehberlerinden 90-günlük entegrasyon kuralına, sınır ötesi değerleme tuzaklarından sermaye devri stratejisine uzanan içgörüler yer alır. Hedef: işlem heyecanını disipline eden çerçeveler.',
    ],
  },
};

/** Curated picks or fallback: 3 most substantial (longest-read) pieces. */
export function getStartHere(categorySlug: string): FeedItem[] {
  const curated = PILLAR_INTROS[categorySlug]?.start;
  const inCategory = ALL_ITEMS.filter(
    (i) => i.categorySlug === categorySlug && i.format !== 'vaka-analizi',
  );
  if (curated?.length) {
    const bySlug = new Map(inCategory.map((i) => [i.slug, i]));
    return curated.map((s) => bySlug.get(s)).filter((i): i is FeedItem => Boolean(i));
  }
  return [...inCategory].sort((a, b) => b.readTimeMin - a.readTimeMin).slice(0, 3);
}
