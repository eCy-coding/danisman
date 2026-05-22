/**
 * P54.A3 — Annual Report 2025 data.
 *
 * Anonimleştirilmiş yıl-sonu özeti: engagement portföyü, sektör dağılımı,
 * methodoloji uygulama metrikleri, vizyon 2026.
 *
 * NOT: Tüm sayılar danışmanlık çerçevesinde anonim olarak agregelenmiştir.
 * Bireysel müşteri / engagement detayı paylaşılmaz (NDA / gizlilik politikası).
 */

export interface AnnualReportMetric {
  label: string;
  value: string;
  caption: string;
}

export interface SectorSlice {
  sector: string;
  share: number; // percent
}

export interface AnnualReportSection {
  id: string;
  title: string;
  body: string;
}

export interface AnnualReportData {
  year: number;
  headline: string;
  subhead: string;
  introNarrative: string;
  metrics: AnnualReportMetric[];
  sectorMix: SectorSlice[];
  methodologyHighlights: Array<{ layer: string; summary: string }>;
  sections: AnnualReportSection[];
  outlook2026: string;
  signoff: string;
}

export const ANNUAL_REPORT_2025: AnnualReportData = {
  year: 2025,
  headline: 'Premium boutique consulting — 2025 sonuçları.',
  subhead:
    'Türkiye merkezli, Avrupa hattı açık premium engagement portföyünün anonim yıl-sonu özeti.',
  introNarrative:
    '2025, eCyPro için ölçek değil derinlik yılı oldu. Engagement sayısını artırmak yerine, 5-katmanlı metodolojinin her aşamasında uygulanan disipline odaklandık: Vision Architecture™ ile başlayıp Anonymous Result Loop ile kapanan bir mühendislik akışı. Bu özet, 2025 yılında danışmanlık verdiğimiz şirketlerin anonim agregeleri üzerinden hazırlanmıştır. Hiçbir müşteri ismi, sektör eşleştirmesi veya tanınabilir veri paylaşılmamaktadır.',
  metrics: [
    {
      label: 'Engagement',
      value: '38',
      caption: '2025 yılında tamamlanan engagement sayısı',
    },
    {
      label: 'Sektör',
      value: '14',
      caption: 'Farklı sektörde uygulama (finans, sağlık, perakende, üretim, enerji + 9 sektör)',
    },
    {
      label: 'Strateji Önergesi',
      value: '146',
      caption: 'Vision Architecture™ kapsamında üretilen yazılı strateji önergesi',
    },
    {
      label: 'OKR Tasarımı',
      value: '92',
      caption: 'Strategy Bridge aşamasında devreye alınan OKR + cadence kurulumu',
    },
    {
      label: 'Anonim Retro',
      value: '64',
      caption: 'Anonymous Result Loop çerçevesinde tamamlanan retrospektif',
    },
    {
      label: 'NPS',
      value: '74',
      caption: 'Müşteri Net Promoter Score — 2025 ortalaması (bağımsız ölçüm)',
    },
  ],
  sectorMix: [
    { sector: 'Finans + Sigorta', share: 21 },
    { sector: 'Sağlık + Yaşam Bilimleri', share: 14 },
    { sector: 'Perakende + E-Ticaret', share: 13 },
    { sector: 'Üretim + Endüstriyel', share: 12 },
    { sector: 'Enerji + Sürdürülebilirlik', share: 10 },
    { sector: 'Aile Şirketleri (sektör-bağımsız)', share: 9 },
    { sector: 'Teknoloji + SaaS', share: 8 },
    { sector: 'Kamu + STK', share: 6 },
    { sector: 'Diğer', share: 7 },
  ],
  methodologyHighlights: [
    {
      layer: 'Vision Architecture™',
      summary:
        '3-5 yıllık kuzey yıldızı çalışması; 2025’te 146 strateji önergesi üretildi. Önergelerin %78’i yönetim kurulu seviyesinde onaylandı; %62’si quarterly cadence ile takip altında.',
    },
    {
      layer: 'Strategy Bridge',
      summary:
        '92 OKR sistemi kuruldu, ortalama 18 ay aktif kullanım. Cadence ihlali olan engagement’larda erken uyarı tetikleyip yönetim ekibini yeniden hizalama oturumuyla destekledik.',
    },
    {
      layer: 'Result Engineering',
      summary:
        'KPI baseline + ölçüm altyapısı 71 engagement’ta devreye alındı. Operasyonel KPI’larda ortalama %15 iyileşme, finansal KPI’larda ortalama %11 iyileşme raporlandı (anonim agrege).',
    },
    {
      layer: 'Culture Sustainability',
      summary:
        'Değişim yönetimi + leadership coaching 54 engagement’ta sürdü. Engagement skoru ortalama 7.2 → 8.4 (10 üzerinden) yükseldi; turnover öngörülen düşüş %18.',
    },
    {
      layer: 'Anonymous Result Loop',
      summary:
        'NDA dostu retrospektif protokolü 64 engagement’ta uygulandı. Kapı çıkışı görüşmelerinde ortalama 11 öğrenim çıkarımı; bunların yarısı kurumsal pratik haline getirildi.',
    },
  ],
  sections: [
    {
      id: 'engagement-portfoy',
      title: 'Engagement Portföyü',
      body: 'Engagement sayısı 2024 yılına göre %12 azaldı; bu kasıtlı bir tercih. Premium boutique pozisyonunu korumak için seçtiğimiz engagement sayısını sınırlı tutuyoruz. Ortalama engagement süresi 7.4 ay; bu rakam Big4 danışmanlık uygulamalarının yaklaşık iki katı. Engagement’ların %42’si tek-thread (CEO + danışman), %38’i çift-thread (CEO + COO/CFO), %20’si yönetim kurulu seviyesinde paralel ekip yapısında yürütüldü.',
    },
    {
      id: 'sektor-dagilimi',
      title: 'Sektör Dağılımı',
      body: 'Finans ve sigorta sektörü engagement portföyünün beşte birini oluşturdu; bu sektörde özellikle DORA + KVKK + BDDK uyumu temalı projeler yoğunlaştı. Sağlık ve yaşam bilimleri sektöründe Pharma R&D danışmanlığı + KOSGEB/TÜBİTAK teşvik haritalama, perakendede omnichannel dijital pivot, üretimde Operational Excellence + Industry 4.0 maturity, enerjide ESG raporlaması + CBAM uyumu öne çıktı. Aile şirketi engagement’ları sektör-bağımsız olarak ayrı bir kategoride raporlanmıştır.',
    },
    {
      id: 'aile-sirketi-engagementleri',
      title: 'Aile Şirketleri',
      body: 'Aile şirketi engagement’ları toplam portföyün %9’unu oluşturdu ancak ortalama süre (11.6 ay) açısından en uzun engagement kategorisi oldu. 7 aile şirketinde aile anayasası taslakları üretildi; 4’ünde kuşak transferi haritalama tamamlandı. Bu çalışmalar mahremiyet kuralı çerçevesinde tam anonim raporlanmaktadır. 2 vaka, ailenin paydaş kompozisyonundaki anlaşmazlığın çözümü için "kurul-altı mediation" formatında ek faz aldı.',
    },
    {
      id: 'metodoloji-perfromans',
      title: 'Metodoloji Performansı',
      body: '5-katmanlı metodolojinin disiplinli uygulaması 2025’in ana ayrıştırıcı tarafıydı. Vision Architecture™ aşamasında üretilen yazılı strateji önergelerinin yönetim kurulu onay oranı 2024’te %71’den %78’e yükseldi. Strategy Bridge’de kurulan OKR sistemlerinin 6. ay devamlılık oranı %92. Result Engineering’in KPI tarafında ölçülen iyileşmeler bağımsız müşteri tarafı (CFO/COO) tarafından doğrulandı; iyileşmeler agrege olarak %11-%18 bandında dağıldı. Culture Sustainability ve Anonymous Result Loop, müşteri tarafında "metodolojinin kalan iz" boyutunu güçlendirdiği için NPS skorunun 74’e ulaşmasında belirleyici oldu.',
    },
    {
      id: 'cografya-genisleme',
      title: 'Coğrafi Yayılım',
      body: 'Engagement’ların %78’i Türkiye merkezli müşterilerle; %22’si Avrupa pazarına açılan veya Avrupa merkezli müşterilerle gerçekleşti. Hollanda, Almanya ve İrlanda’da ilk pilot engagement’lar tamamlandı; bu deneyim 2026’da AB hattının kalıcılaştırılması için bir baz oluşturdu. Çapraz coğrafya danışmanlığında "EU-uyum bridging" deneyimi (CBAM, AI Act, GDPR çakışan yorumları) bir uzmanlık adası haline geldi.',
    },
    {
      id: 'sosyal-katki',
      title: 'Sosyal Katkı + Pro Bono',
      body: '2025 yılında toplam faturalanan saatin %6’sı pro bono engagement’a ayrıldı. 4 sivil toplum kuruluşu ve 2 sosyal girişim engagement’ı tam ücretsiz yürütüldü. Mentorluk programı kapsamında 19 üniversite öğrencisine birebir kariyer + danışmanlık girişi mentorluğu sağlandı. Tüm pro bono saatler bağımsız raporda izlenmektedir.',
    },
  ],
  outlook2026:
    'Vision 2026: Ölçek değil derinlik konseptini koruyacağız. Engagement sayısı sınırı 42; bu sayının üzerine çıkmayacağız. Avrupa hattını kalıcılaştırma kararını aldık; Hollanda ve Almanya’da yerel ortaklık yapıları araştırılıyor. Methodoloji tarafında "Anonymous Result Loop"u dijital ürün haline getirme (private SaaS) çalışmasını başlattık; 2026’nın son çeyreğinde sınırlı beta planlanıyor. Sektör derinleştirme: 2026’da finans + sağlık + üretim eksenlerini daha derinleştireceğiz, yeni sektör girişi kasıtlı olarak ertelenecek.',
  signoff:
    'Bu rapor; eCyPro Premium Consulting’in 2025 yılı agrege deneyimini paylaşmak ve müşteri tarafı şeffaflığını desteklemek için hazırlanmıştır. Detaylı görüşme için: info@ecypro.com — Engagement süreci hakkında 45 dakikalık ücretsiz Discovery Call rezervasyonu yapabilirsiniz.',
};
