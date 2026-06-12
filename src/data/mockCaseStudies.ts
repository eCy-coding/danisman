import { CaseStudy } from '../components/features/case-studies/CaseStudyCard';

/**
 * P42: Anonimleştirilmiş case study'ler. Sayılar conservative,
 * tüm metinler "Anonymized client" disclaimer'ı taşır.
 * Görseller branded SVG (yerel asset) — unsplash bağımlılığı kaldırıldı.
 */
export const CASE_STUDIES: CaseStudy[] = [
  {
    slug: 'tech-scaleup-operational-excellence',
    title: 'Tech Scale-up · Operasyonel Mükemmellik',
    client: 'Anonymized client · Tech Scale-up',
    industry: 'Technology',

    categorySlug: 'yapay-zeka-teknoloji',

    format: 'vaka-analizi',
    result: 'Süreç netliği · ortak dil',
    duration: '6 ay',
    goLive: '2025',
    challenge:
      'Hızlı büyüyen scale-up bünyesinde rol netliği, karar hakları ve süreç sahipliği gri kalmıştı.',
    image: '/case-studies/tech-scaleup.svg',
    content: `
      <h2>Bağlam</h2>
      <p>Türkiye merkezli bir teknoloji scale-up, iki yıl içinde 4 katı büyüdü; süreç sahipliği ve
      karar hakları aynı hızla netleştirilmemişti. Yönetim ekibi ortak bir dil arıyordu.</p>

      <h2>Yaklaşım</h2>
      <ul>
        <li><strong>Diagnostic (4 hafta):</strong> Yönetim ekibiyle 1:1, kritik süreç haritalaması, OKR-ritm değerlendirmesi.</li>
        <li><strong>Operating Model (8 hafta):</strong> RACI yeniden tanımı, karar hakları matrisi, haftalık operasyon ritmi.</li>
        <li><strong>Adoption (12 hafta):</strong> Lider koçluğu, retro şablonları, "ortak dil" rehberi.</li>
      </ul>

      <h2>Sonuç (engagement-sonrası retrospektif)</h2>
      <ul>
        <li>Karar yürütme döngüsü "günler"den "saatler"e indirildi (ekip beyanı).</li>
        <li>Yönetim ekibi haftalık karar ritmini kurumsal alışkanlığa dönüştürdü.</li>
        <li>OKR adoption, lider seviyesinde sürdürülebilir hale geldi.</li>
      </ul>

      <p><em>* Tüm sayısal göstergeler, müşterinin engagement-sonrası retrospektif görüşmesine dayalıdır.
      Veri NDA gereği anonimleştirilmiştir.</em></p>
    `,
  },
  {
    slug: 'family-business-governance',
    title: 'Aile Şirketi · Yönetişim & Kuşak Geçişi',
    client: 'Anonymized client · Family Business',
    industry: 'Family Business',

    categorySlug: 'insan-organizasyon',

    format: 'vaka-analizi',
    result: 'Yönetişim modeli kuruldu',
    duration: '9 ay',
    goLive: '2025',
    challenge:
      'İkinci kuşağa geçiş hazırlığı; aile ve şirket sınırları, karar mekanizmaları, hissedar haklarının netleştirilmesi.',
    image: '/case-studies/family-business.svg',
    content: `
      <h2>Bağlam</h2>
      <p>Türkiye'nin önde gelen aile şirketlerinden biri ikinci kuşağa geçiş hazırlığındaydı. Aile
      bireyleri arasında karar mekanizmaları, profesyonel yönetimle sınırlar ve hissedar hakları
      gri alandaydı.</p>

      <h2>Yaklaşım</h2>
      <ul>
        <li><strong>Aile Anayasası (12 hafta):</strong> Aile üyeleriyle 1:1 görüşmeler, ortak değerler atölyesi, anayasa metni.</li>
        <li><strong>Yönetişim Modeli (10 hafta):</strong> Aile konseyi, yönetim kurulu, icra arasındaki sınırlar; toplantı ritmi.</li>
        <li><strong>Kuşak Geçişi Yol Haritası (12 hafta):</strong> Yetkinlik haritası, mentörlük programı, sahiplik aktarım takvimi.</li>
      </ul>

      <h2>Sonuç</h2>
      <ul>
        <li>Yönetişim çerçevesi yazılı dokümana ve toplantı ritmine bağlandı.</li>
        <li>İkinci kuşak liderleri tanımlı rol-yetkinlik haritasıyla yönlendirildi.</li>
        <li>Aile-içi anlaşmazlık çözüm prosedürleri formelleştirildi.</li>
      </ul>

      <p><em>* Veri NDA gereği anonimleştirilmiştir.</em></p>
    `,
  },
  {
    slug: 'manufacturing-lean-six-sigma',
    title: 'Üretim · Lean & Six Sigma Pratiği',
    client: 'Anonymized client · Manufacturing',
    industry: 'Manufacturing',

    categorySlug: 'operasyon',

    format: 'vaka-analizi',
    result: 'Sürdürülebilir verimlilik artışı',
    duration: '8 ay',
    goLive: '2025',
    challenge:
      'Üretim hattında plansız duruşlar ve yüksek hata oranı; mevcut raporlama sahaya inmiyordu.',
    image: '/case-studies/manufacturing.svg',
    content: `
      <h2>Bağlam</h2>
      <p>Çok-tesisli bir üretim grubu, raporlardan saha gerçekliğine inemeyen Lean uygulamasıyla
      başa çıkıyordu. Hat sahipleri ile yönetim arasında ortak dil eksikti.</p>

      <h2>Yaklaşım</h2>
      <ul>
        <li><strong>Gemba (4 hafta):</strong> Vardiya bazında saha gözlemi, kayıp ağacı haritalaması.</li>
        <li><strong>Kaizen Sistemi (12 hafta):</strong> Hat sahibi koçluğu, görsel yönetim, günlük performans toplantı ritmi.</li>
        <li><strong>Six Sigma DMAIC (16 hafta):</strong> 3 kritik hata moduna odaklanan disiplinli iyileştirme projeleri.</li>
      </ul>

      <h2>Sonuç (retrospektif)</h2>
      <ul>
        <li>Hat sahipleri haftalık performans göstergelerini sahaya bağladı.</li>
        <li>Öncelikli hata modlarında ölçülebilir azalma (müşteri beyanı, NDA).</li>
        <li>İyileştirme metodolojisi kuruma "kalıcı bir yetenek" olarak transfer edildi.</li>
      </ul>

      <p><em>* Tüm sayısal göstergeler müşterinin iç ölçümüne dayalıdır; NDA gereği paylaşılmaz.</em></p>
    `,
  },
  {
    slug: 'ma-advisory-engagement',
    title: 'M&A Advisory · Due Diligence + PMI',
    client: 'Anonymized client · M&A Advisory',
    industry: 'M&A Advisory',

    categorySlug: 'ma-degerleme',

    format: 'vaka-analizi',
    result: 'Disiplinli müzakere & entegrasyon',
    duration: '5 ay',
    goLive: '2025',
    challenge:
      'Stratejik bir satın alma fırsatında due diligence kapsamı, müzakere disiplini ve birleşme sonrası entegrasyon planı.',
    image: '/case-studies/ma-advisory.svg',
    content: `
      <h2>Bağlam</h2>
      <p>Orta ölçekli bir kurum, kendisinin yarısı büyüklüğünde stratejik bir oyuncuyu satın alma
      fırsatıyla karşılaşmıştı. Süreç hızlı, kapsam genişti; müzakere ve entegrasyon riski yüksekti.</p>

      <h2>Yaklaşım</h2>
      <ul>
        <li><strong>Due Diligence (6 hafta):</strong> Finansal, operasyonel, kültürel ve hukuki kapsam; risk haritası.</li>
        <li><strong>Valuation & Müzakere (4 hafta):</strong> Çoklu metodoloji değerleme; müzakere oyun planı.</li>
        <li><strong>Post-Merger Integration (12 hafta):</strong> "100-gün planı", kültürel uyumlandırma, sinerji takip mekanizması.</li>
      </ul>

      <h2>Sonuç</h2>
      <ul>
        <li>İşlem öngörülen takvimle kapatıldı; kritik risklerin yarısı müzakerede temizlendi.</li>
        <li>PMI dönemi yönetilebilir ritimde ilerledi; "Day 100" hedefleri tutarlı raporlandı.</li>
        <li>Kurum, kendi içinde tekrarlanabilir bir M&A oyun kitabı edindi.</li>
      </ul>

      <p><em>* İşlem detayları NDA gereği paylaşılmaz; veriler anonim retrospektife dayalıdır.</em></p>
    `,
  },
  {
    slug: 'organizational-transformation',
    title: 'Organizasyonel Dönüşüm · Yeni İşletim Modeli',
    client: 'Anonymized client · Mid-cap',
    industry: 'Organizational',

    categorySlug: 'insan-organizasyon',

    format: 'vaka-analizi',
    result: 'Yeni işletim modeli',
    duration: '7 ay',
    goLive: '2025',
    challenge:
      'Fonksiyonel siloların yavaşlattığı karar süreçleri; yatay işbirliğinde sürtünme; performans yönetiminde tutarlılık eksikliği.',
    image: '/case-studies/org-transformation.svg',
    content: `
      <h2>Bağlam</h2>
      <p>Orta-büyük ölçekli bir kurum, fonksiyonel silolarla yavaşlayan karar süreçlerinden
      şikayetçiydi. Üst yönetim "müşteri-merkezli" bir işletim modeline geçmek istiyordu.</p>

      <h2>Yaklaşım</h2>
      <ul>
        <li><strong>Mevcut Durum (5 hafta):</strong> Lider 1:1, karar hakları matrisi, kültürel sinyal okuması.</li>
        <li><strong>Hedef İşletim Modeli (8 hafta):</strong> Müşteri yolculukları etrafında ürün-odaklı squad tasarımı, yönetim ritmi.</li>
        <li><strong>Adoption & Kültür (12 hafta):</strong> Lider koçluğu, performans yönetimi rev, yeni rol tanımları.</li>
      </ul>

      <h2>Sonuç</h2>
      <ul>
        <li>Yeni işletim modeli yönetim kurulu tarafından onaylandı ve sahada uygulamaya başlandı.</li>
        <li>Üst yönetim, karar haklarını yazılı olarak netleştirdi.</li>
        <li>Çapraz fonksiyon işbirliği için ortak ritim kuruldu (haftalık + aylık).</li>
      </ul>

      <p><em>* Detaylar NDA gereği anonimleştirilmiştir.</em></p>
    `,
  },
  {
    slug: 'culture-engineering',
    title: 'Kültür Mühendisliği · Ortak Dil Programı',
    client: 'Anonymized client · Mid-cap',
    industry: 'Culture',

    categorySlug: 'insan-organizasyon',

    format: 'vaka-analizi',
    result: 'Ortak dil & değer çerçevesi',
    duration: '4 ay',
    goLive: '2025',
    challenge:
      'Hızlı büyümede kurucu ekibin "kültürel kodu" yeni katılanlara aktarılamıyordu; değerler raporlarda kalmıştı.',
    image: '/case-studies/culture-engineering.svg',
    content: `
      <h2>Bağlam</h2>
      <p>Hızlı büyüyen bir kurum, kurucu ekibin "kültürel kodunu" yeni katılan liderlere aktarmakta
      zorlanıyordu. Değerler doküman düzeyinde kalmış, günlük davranışa inememişti.</p>

      <h2>Yaklaşım</h2>
      <ul>
        <li><strong>Kültürel Sinyal Okuması (4 hafta):</strong> 1:1 ve focus group; kurum-içi mit ve hikayelerin haritalanması.</li>
        <li><strong>Ortak Dil Çerçevesi (6 hafta):</strong> Değerlerin "gözlemlenebilir davranışa" indirgendiği bir matris.</li>
        <li><strong>Lider Pratiği (6 hafta):</strong> Performans görüşmesi şablonları, retrospektif kültürü, hikayeleme atölyesi.</li>
      </ul>

      <h2>Sonuç</h2>
      <ul>
        <li>Değerler, performans değerlendirme şablonlarına entegre edildi.</li>
        <li>Liderler, ekip toplantılarında "ortak dil" çerçevesini aktif kullandı.</li>
        <li>Onboarding sürecinde kültürel transfer ölçülebilir hale geldi.</li>
      </ul>

      <p><em>* Detaylar NDA gereği anonimleştirilmiştir.</em></p>
    `,
  },
];

/** Exported for sitemap + other SSR tooling to avoid re-declaring slugs. */
export const CASE_STUDY_SLUGS = CASE_STUDIES.map((c) => c.slug);
