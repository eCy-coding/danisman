/**
 * P47 — 21 servisin 16-section detaylı içerik datası.
 *
 * Tüm metinler Türkçe (site TR-first). EN visitors için ileride genişletilebilir.
 * Service-specific FAQ, methodology, deliverables, timeline, investment, mini
 * assessment. ServiceDetailLayout component'i bu datayı render eder.
 *
 * Convention:
 *   - slug = `/services/<slug>` ile match etmeli (SERVICE_CATEGORIES + services.ts)
 *   - related[] = diğer servis slug'ları (cross-link grid)
 *   - assessment.scoring: ranges [low, mid, high] → result message
 */

export interface ServiceContent {
  slug: string;
  hero: {
    title: string;
    subtitle: string;
    valueProp: string;
    primaryCtaText: string;
  };
  problem: {
    title: string;
    painPoints: string[];
  };
  outcomes: {
    title: string;
    results: string[];
  };
  methodology: {
    title: string;
    phases: { name: string; duration: string; description: string }[];
  };
  deliverables: {
    title: string;
    artifacts: string[];
  };
  timeline: {
    totalDuration: string;
    milestones: { name: string; week: string }[];
  };
  investment: {
    range: string;
    model: string;
    paymentPlan: string;
  };
  trust: {
    anonymizedExample: string;
    caseStudySlug?: string;
  };
  faq: {
    items: { q: string; a: string }[];
  };
  related: string[];
  assessment: {
    title: string;
    questions: string[];
    rubric: string;
  };
}

// Reusable boilerplate — ortak engagement parametreleri tüm servisler için
const SHARED_FAQ_END = (_slug: string) => [
  {
    q: 'Discovery Call ücretsiz mi?',
    a: '45 dakikalık keşif görüşmesi ücretsiz. Sonunda uyum doğrulanırsa 5-7 gün içinde yazılı önerge paylaşılır.',
  },
  {
    q: 'Fiyatlandırma sabit mi yoksa saatlik mi?',
    a: 'Sabit fiyat (fixed-scope) modeli kullanırız; saat bazlı faturalama yok. Kapsam ve süre yazılı önergede netleşir. Detay: /pricing',
  },
  {
    q: 'NDA imzalanır mı?',
    a: "Evet, standart engagement'larda karşılıklı NDA imzalanır; vaka analizleri anonim paylaşılır.",
  },
];

const STANDARD_ASSESSMENT = (slug: string, theme: string) => ({
  title: `${theme} sizin için uygun mu? — 5 Soruluk Hızlı Teşhis`,
  questions: [
    `Son 12 ayda ${theme.toLowerCase()} konusunda yönetim seviyesinde bir karar geciktirdiğiniz oldu mu?`,
    `İç ekibinizle bu alanda iz bırakan bir proje deneme/başlatma girişiminiz oldu mu?`,
    `Üst yönetim bu konuyu çeyreklik gündeme alıyor mu?`,
    `Önümüzdeki 6 ay için ölçülebilir bir hedef tanımlandı mı?`,
    `Bu konuda harici uzmanlık alıp almama tartışması yapıldı mı?`,
  ],
  rubric:
    "4-5 evet → Discovery Call için ideal zaman; aktif engagement aday.\n2-3 evet → Strateji Oturumu (1 hafta) ile durumu birlikte haritalayalım.\n0-1 evet → /blog ve /methodology'i inceleyin; ileride faydalı olabilir.",
});

const SERVICE_CONTENT_LIST: ServiceContent[] = [
  // ─────────────────────────────────────────────────────────────
  // S1 — STRATEGIC TRANSFORMATION (FULL — pilot)
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'strategic-transformation',
    hero: {
      title: 'Stratejik Dönüşüm & Kurumsal Planlama',
      subtitle: 'Belirsizlik ortamında 3-5 yıllık kuzey yıldızı + 90 günlük uygulama köprüsü.',
      valueProp:
        'Vizyon ile günlük operasyon arasındaki kopukluğu kapatır; yönetim kurulu seviyesinde alınan kararların sahada gerçekleşmesini sağlar.',
      primaryCtaText: 'Ücretsiz Strateji Görüşmesi Al',
    },
    problem: {
      title: 'Çözdüğümüz Problemler',
      painPoints: [
        'Stratejik plan her yıl tazelense de ekibin günlük operasyonu vizyonla uyumsuz çalışıyor.',
        'Yönetim toplantılarında alınan kararlar 3-6 ay içinde tatil oluyor; uygulama disiplini düşük.',
        'Rekabet ve pazar değişiyor ama 3-5 yıllık ufuk masaya getirilmiyor; reaktif kalınıyor.',
        '"Vizyon" doküman olarak güzel ama OKR/KPI seviyesinde measurable hedeflere dönüşmüyor.',
        'Aile şirketlerinde kuşaklar arası vizyon farkı kurumun stratejik netliğini zayıflatıyor.',
      ],
    },
    outcomes: {
      title: 'Engagement Sonunda Elde Edeceğiniz Somut Sonuçlar',
      results: [
        '3-5 yıllık ufuk için kararlaştırılmış kuzey yıldızı dokümanı (yönetim kurulu onaylı).',
        '90 günlük yol haritası — RACI matrisi + milestone tablosu.',
        'Çeyreklik OKR seti (5-7 OKR, ölçülebilir başarı kriterleri).',
        'Haftalık yönetim ritmi takvimi (decision cadence + escalation eşikleri).',
        'Engagement-sonu retrospektif: hangi varsayım doğru, hangisi revize gerek.',
      ],
    },
    methodology: {
      title: 'Metodoloji — Vizyon Mimarı Yaklaşımı',
      phases: [
        {
          name: '1. Discovery & Diagnostic',
          duration: '1 hafta',
          description:
            "Üst yönetim ile bire bir görüşmeler (30-60 dk), mevcut strateji dokümanlarının review'ı, son 3 yılın finansal ve operasyonel KPI baseline'ı.",
        },
        {
          name: '2. Vision Architecture Workshop',
          duration: '2 hafta',
          description:
            'C-level ile 2x yarım gün workshop: "nerede oynuyoruz", "nasıl kazanacağız", "hangi varsayımlar kritik". Çıktı: 3-5 yıllık kuzey yıldızı dokümanı.',
        },
        {
          name: '3. Strategy Bridge',
          duration: '3 hafta',
          description:
            'Vizyon → OKR → 90 günlük yol haritasına dönüşüm. RACI matrisi, decision rights, haftalık ritim takvimi.',
        },
        {
          name: '4. Pilot & Calibration',
          duration: '4 hafta',
          description:
            'İlk 30 günde uygulama; haftalık check-in; metrik baseline ölçümü; varsayım test edilir, gerekirse stratejik revize.',
        },
        {
          name: '5. Handoff & Retrospective',
          duration: '2 hafta',
          description:
            'Yönetim ekibine self-sustain handoff. Engagement-sonu retrospektif raporu. 6 ay sonra opsiyonel anonim takip.',
        },
      ],
    },
    deliverables: {
      title: 'Teslim Edilen Çıktılar',
      artifacts: [
        '3-5 Yıllık Kuzey Yıldızı Dokümanı (PDF + slide deck, ~25 sayfa)',
        '90 Günlük Yol Haritası (RACI + Gantt-style milestone tablosu)',
        'Çeyreklik OKR Tablosu (5-7 OKR, başarı kriterleriyle)',
        'Haftalık Yönetim Ritmi Takvimi + Toplantı Şablonları',
        'Karar Hakları (Decision Rights) Matrisi',
        'Stratejik KPI Baseline Raporu',
        'Engagement-Sonu Retrospektif (PDF, 8-12 sayfa)',
      ],
    },
    timeline: {
      totalDuration: '12 hafta (3 ay)',
      milestones: [
        { name: 'Discovery + Diagnostic raporu', week: 'Hafta 1' },
        { name: 'Kuzey Yıldızı Workshop tamamlandı', week: 'Hafta 3' },
        { name: 'OKR + 90 günlük yol haritası hazır', week: 'Hafta 6' },
        { name: 'İlk metrik ölçümü + revize', week: 'Hafta 10' },
        { name: 'Handoff + Retrospective', week: 'Hafta 12' },
      ],
    },
    investment: {
      range: '₺250.000 – ₺450.000',
      model: 'Sabit fiyat (fixed-scope). Saat bazlı faturalama yok.',
      paymentPlan: '3 milestone ödeme: %30 başlangıç, %40 OKR teslimi, %30 retrospektif sonrası.',
    },
    trust: {
      anonymizedExample:
        "Bir 180 çalışanlı teknoloji scale-up ile 12 haftalık engagement. Vizyon: \"Türkiye'nin en güvenilir B2B SaaS'i\". 90 günde 3 ürün hattının portföyü tek north star'a uyumlandı, çeyreklik OKR kadansı kuruldu. 6 ay sonra retro: yeni müşteri kazanım %32 arttı, ekip net promoter score 22 → 47.",
      caseStudySlug: 'tech-scaleup-operational-excellence',
    },
    faq: {
      items: [
        {
          q: "Strateji dokümanım zaten var. Bu engagement'ı yine ihtiyacım var mı?",
          a: 'Doküman varsa Discovery fazında onu temel alırız. Ekleme değer: ekibin günlük operasyonuyla strateji arasındaki kopukluğu kapatmak (OKR + ritim + RACI). Sadece doküman güncellemiyoruz, uygulama köprüsü kuruyoruz.',
        },
        {
          q: 'Üst yönetim çok meşgul, 12 hafta boyunca ne kadar zaman ayırması gerekir?',
          a: "C-level toplam ~30 saat (4 yarım gün workshop + 90 dk haftalık check-in + retrospective). Diğer süre danışman ekibinin background work'ü ile geçer.",
        },
        {
          q: 'Engagement bittikten sonra strateji kalıcı olur mu yoksa eski hale mi döner?',
          a: 'Handoff fazında ekibe haftalık ritim disiplinini kuruyoruz; OKR cadence kendi başına işliyor. 6 ay sonra anonim retrospektif ile öğrenmeleri konsolide ederiz. Süreklilik için "Yıllık Ortaklık" modeli de mevcut.',
        },
        {
          q: 'Aile şirketiyiz, kuşaklar arası vizyon farkı var. Bu engagement bunu da çözer mi?',
          a: "Evet. Discovery fazında nesil bazlı vizyon görüşmeleri yaparız; Vision Architecture workshop'unda farklılıkları masaya koyar, ortak bir kuzey yıldızı üretmek için yapılandırılmış müzakere kullanırız. Aile şirketleri yönetişimi ile birlikte planlanabilir.",
        },
        ...SHARED_FAQ_END('strategic-transformation'),
      ],
    },
    related: ['mergers-acquisitions', 'family-business', 'digital-strategy'],
    assessment: STANDARD_ASSESSMENT('strategic-transformation', 'Stratejik Dönüşüm'),
  },

  // ─────────────────────────────────────────────────────────────
  // S2 — MERGERS & ACQUISITIONS
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'mergers-acquisitions',
    hero: {
      title: 'Birleşme, Satın Alma (M&A) & Değerleme',
      subtitle:
        'Şirket değerleme, due diligence, birleşme sonrası entegrasyon (PMI) ve exit stratejileri.',
      valueProp:
        'M&A süreçlerinde stratejik uyumdan kapanışa ve entegrasyona kadar üst yönetime objektif danışmanlık. Değerleme tartışmalarını sayısal ve sektörel anchor ile masaya koyar.',
      primaryCtaText: 'Değerleme Görüşmesi Talep Et',
    },
    problem: {
      title: 'M&A Süreçlerinde Karşılaşılan Tipik Zorluklar',
      painPoints: [
        'Alıcı ve satıcı tarafın değer beklentileri arasında 2-4x fark var; müzakere kilitleniyor.',
        'Due diligence sürecinde gizlenen riskler kapanış sonrası ortaya çıkıyor (vergi, dava, kültür).',
        'Birleşme sonrası entegrasyon (PMI) planı yok; 18-24 ay içinde sinerji hedefi tutmuyor.',
        'Aile şirketlerinde exit kararı duygusal; pazara doğru zamanda çıkamıyor.',
        'Yabancı yatırımcı için Türkiye pazarına özel risk haritası eksik.',
      ],
    },
    outcomes: {
      title: 'Engagement Çıktıları',
      results: [
        'DCF + comparable transaction yöntemiyle bağımsız değerleme raporu (±%10 hassasiyet).',
        'Due diligence checklist + bulgu raporu (financial, legal, operational, cultural).',
        'PMI 100-günlük entegrasyon planı (organizasyon + sistem + kültür birleşmesi).',
        'Exit timing matrisi (pazar koşulları + vergi pencereleri + alıcı havuzu).',
        'Müzakere strateji notu (BATNA + walk-away değerleri).',
      ],
    },
    methodology: {
      title: 'M&A Sürecinde Yaklaşımımız',
      phases: [
        {
          name: '1. Strategic Fit Diagnostic',
          duration: '1-2 hafta',
          description:
            'Stratejik uyum analizi: target neden, beklenen sinerji, risk haritası. Go/no-go önerisi.',
        },
        {
          name: '2. Valuation & Modeling',
          duration: '2-3 hafta',
          description:
            'DCF + comparable + asset-based üç metot. Sektörel multiple benchmark. Senaryo analizi (base / bull / bear).',
        },
        {
          name: '3. Due Diligence Yönetimi',
          duration: '4-6 hafta',
          description:
            'Mali, hukuki, operasyonel, kültürel DD. Hukuk firması ve denetçilerle koordinasyon. Risk register.',
        },
        {
          name: '4. Müzakere & Kapanış Desteği',
          duration: '2-4 hafta',
          description:
            'BATNA hazırlığı, term sheet review, müzakere oturumlarında stratejik danışmanlık.',
        },
        {
          name: '5. Post-Merger Integration (PMI)',
          duration: '3-6 ay',
          description:
            '100-günlük plan, organizasyon entegrasyonu, sistem migrasyonu, kültür birleşmesi. Sinerji ölçümü.',
        },
      ],
    },
    deliverables: {
      title: 'Teslim Edilen Çıktılar',
      artifacts: [
        'Stratejik Uyum Raporu (PDF, 15-20 sayfa)',
        'Bağımsız Değerleme Raporu (DCF + comp + asset, Excel + PDF)',
        'Due Diligence Bulgu Raporu (5 alan, risk severity skalası)',
        'PMI 100-Günlük Entegrasyon Planı (Gantt + RACI)',
        'Müzakere Strateji Notu + BATNA Senaryoları',
        'Term Sheet / SPA Review Notları',
        "Sinerji Ölçüm Dashboard'u (PMI fazı)",
      ],
    },
    timeline: {
      totalDuration: 'Sell-side: 4-9 ay · Buy-side: 3-6 ay · PMI: 3-6 ay',
      milestones: [
        { name: 'Strategic fit raporu', week: 'Hafta 2' },
        { name: 'Değerleme tamamlandı', week: 'Hafta 4-5' },
        { name: 'DD bulgu raporu', week: 'Hafta 8-10' },
        { name: 'Term sheet / LOI', week: 'Hafta 10-12' },
        { name: 'Kapanış', week: 'Hafta 16-24' },
        { name: 'PMI 100. gün', week: '+100 gün' },
      ],
    },
    investment: {
      range: "₺400.000 – ₺1.500.000+ (deal size'a göre)",
      model: 'Sabit fiyat (DD/PMI) + opsiyonel success fee (close kontingent).',
      paymentPlan: 'Faz-bazlı: %25 strategic fit, %35 DD, %25 kapanış, %15 PMI başlangıç.',
    },
    trust: {
      anonymizedExample:
        "Bir orta-ölçek üretim şirketi için yabancı stratejik yatırımcıya satış. Sell-side mandate; değerleme alıcı tekliflerinin %35 üzerine çıkardı (multiple anchor: regional industry comp). PMI fazında 18 ayda sinerji hedefinin %92'si tutturuldu.",
      caseStudySlug: 'ma-advisory-engagement',
    },
    faq: {
      items: [
        {
          q: 'Sell-side mı buy-side mı çalışıyorsunuz?',
          a: "Her iki tarafta da deneyimimiz var. Conflict-of-interest engagement'larında dürüstlük için sadece bir tarafı temsil ederiz.",
        },
        {
          q: 'Değerleme banker tarafından mı yapılmalı?',
          a: 'Yatırım bankacılığı işlevi (sürece broker olma) bizim hizmetimiz değil. Stratejik değerleme ve müzakere danışmanlığı veriyoruz; transaction execution için lisanslı banka önerilir.',
        },
        {
          q: 'Yabancı alıcı/satıcı ile çalışıyor musunuz?',
          a: "Evet. Cross-border M&A'lerde Türkiye spesifik risk haritası ve cultural fit değerlendirmesi kritik.",
        },
        ...SHARED_FAQ_END('mergers-acquisitions'),
      ],
    },
    related: ['strategic-transformation', 'family-business', 'investment-incentives'],
    assessment: STANDARD_ASSESSMENT('mergers-acquisitions', 'M&A Danışmanlığı'),
  },

  // ─────────────────────────────────────────────────────────────
  // S3 — FAMILY BUSINESS
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'family-business',
    hero: {
      title: 'Aile Şirketleri Yönetişimi & Anayasa',
      subtitle:
        'Nesiller arası devir süreçleri, kurumsallaşma ve sürdürülebilir aile anayasasının hazırlanması.',
      valueProp:
        "Türkiye'nin ekonomik bel kemiği aile şirketlerinde 3. nesle geçişin en kritik dönemecini birlikte yönetiyoruz: aile değerini koruyarak kurumsallaşma.",
      primaryCtaText: 'Aile Anayasası Görüşmesi Al',
    },
    problem: {
      title: 'Aile Şirketlerinde Yapısal Zorluklar',
      painPoints: [
        'Kurucu nesil emekliliğe yaklaşıyor; 2. ve 3. nesil arası yetki devri planlanmadı.',
        'Aile üyeleri arasında karar haklarında belirsizlik; toplantılar çatışmaya dönüşüyor.',
        'Şirket bir aile, bir aile şirket; rolleri ayırmak mümkün değil.',
        'Profesyonel yönetici (CEO/CFO) atandı ama aile gölgesinde kararlar veremiyor.',
        'Hisse devri, kar payı, akrabaların istihdamı yazılı kural yok; spor olmaktan çıktı, krize döndü.',
      ],
    },
    outcomes: {
      title: "Aile Anayasası Engagement'ı Sonunda",
      results: [
        'Aile Konseyi (Family Council) tüzüğü ve toplantı düzeni.',
        'Yazılı Aile Anayasası (mission, values, ownership policy, governance).',
        'Yetki Devir (Succession) Yol Haritası — 3-7 yıllık plan.',
        'Profesyonel Yönetim ile Aile Konseyi Etkileşim Protokolü.',
        'Akraba İstihdam Politikası + Performans Standartları.',
        'Kar Payı Dağıtım ve Yeniden Yatırım Çerçevesi.',
      ],
    },
    methodology: {
      title: 'Aile Anayasası Süreci',
      phases: [
        {
          name: '1. Family Discovery',
          duration: '2-3 hafta',
          description:
            'Tüm aile üyeleriyle bire bir görüşmeler; nesil bazlı değerler ve beklentiler haritalama.',
        },
        {
          name: '2. Governance Workshop',
          duration: '2 hafta',
          description:
            'Aile Konseyi yapısı tasarımı; karar hakları matrisi (operasyon vs aile vs ownership).',
        },
        {
          name: '3. Anayasa Drafting',
          duration: '4-6 hafta',
          description:
            'Yazılı doküman taslakları; aile üyeleri ile iteratif review; hukuki danışmanla validation.',
        },
        {
          name: '4. Succession Planning',
          duration: '3-4 hafta',
          description:
            'Yetki devir takvimi; kuşak transfer mentor programı; profesyonel CEO/CFO interview desteği.',
        },
        {
          name: '5. Ratification & Launch',
          duration: '2 hafta',
          description: 'Tüm aile üyelerinin imza onayı; ilk Aile Konseyi toplantısı moderasyonu.',
        },
      ],
    },
    deliverables: {
      title: 'Teslim Edilen Çıktılar',
      artifacts: [
        'Aile Anayasası (PDF, ~40 sayfa, hukuki review onaylı)',
        'Aile Konseyi Tüzüğü ve Toplantı Şablonları',
        'Succession Yol Haritası (3-7 yıllık Gantt)',
        'Karar Hakları (Decision Rights) Matrisi',
        'Akraba İstihdam Politikası Dokümanı',
        'Kar Payı Dağıtım Çerçevesi',
        'İlk 4 Aile Konseyi Toplantısı Moderasyonu',
      ],
    },
    timeline: {
      totalDuration: '14-20 hafta (3.5-5 ay)',
      milestones: [
        { name: 'Family Discovery raporu', week: 'Hafta 3' },
        { name: 'Governance yapısı kararlaştırıldı', week: 'Hafta 5' },
        { name: 'Anayasa taslağı v1', week: 'Hafta 9' },
        { name: 'Succession yol haritası', week: 'Hafta 13' },
        { name: 'Ratification ve ilk konsey toplantısı', week: 'Hafta 16-20' },
      ],
    },
    investment: {
      range: '₺350.000 – ₺850.000',
      model: 'Sabit fiyat. Hukuki review için 3. taraf avukat ücreti hariç.',
      paymentPlan: '4 milestone: %25 Discovery, %25 Governance, %30 Anayasa, %20 Ratification.',
    },
    trust: {
      anonymizedExample:
        "İkinci nesil 4 kardeşin yönetiminde, ciro 180 milyon ₺ olan üretim grubu için 18 haftalık aile anayasası engagement'ı. 3. nesilden 7 kuzen iş hayatına atılmadan governance yazıldı. 12 ay sonra: kardeş içi karar süreleri %60 hızlandı, yıllık 1 kez kriz yaratan kar payı tartışması yapılandırılmış formüle bağlandı.",
      caseStudySlug: 'family-business-governance',
    },
    faq: {
      items: [
        {
          q: 'Hukuki bağlayıcılığı var mı?',
          a: 'Aile Anayasası moral pacta sunt servanda niteliğindedir; hukuki bağlayıcılık için hisse devir sözleşmeleri, vekaletname ve şirket ana sözleşmesi revize edilir (hukuki danışmanlık ayrı).',
        },
        {
          q: 'Aile içi anlaşmazlık varsa engagement başlatılabilir mi?',
          a: 'Aktif çatışma varsa önce mediation önerilir. Yapıcı görüşmenin mümkün olduğu noktadan başlarız.',
        },
        {
          q: 'Tüm aile üyeleri katılmak zorunda mı?',
          a: 'Karar haklarını kullananlar (mevcut + yakın gelecek) zorunlu. Tüm aile üyeleri davet edilir; katılım gönüllüdür.',
        },
        ...SHARED_FAQ_END('family-business'),
      ],
    },
    related: ['strategic-transformation', 'hr-transformation', 'mergers-acquisitions'],
    assessment: STANDARD_ASSESSMENT('family-business', 'Aile Yönetişimi'),
  },

  // ─────────────────────────────────────────────────────────────
  // S4 — OPERATIONAL EXCELLENCE
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'operational-excellence',
    hero: {
      title: 'Operasyonel Mükemmellik & Tedarik Zinciri',
      subtitle:
        'Yalın üretim (Lean), Altı Sigma metodolojileri ve uçtan uca lojistik optimizasyonu.',
      valueProp:
        'Maliyet yapısını sahaya inerek söker, OEE/cycle time/lead time gibi metriklerde %15-40 iyileşme yaratır.',
      primaryCtaText: 'OEE Audit Talep Et',
    },
    problem: {
      title: 'Operasyonda Tipik Verimsizlikler',
      painPoints: [
        'OEE %50-65 bandında stuck; ekipman duruşları, kalite kayıpları açıklanamıyor.',
        'Tedarik zincirinde safety stock yüksek ama yine de stok-out yaşanıyor.',
        'Lead time müşteri beklentisini karşılamıyor; rakipler aynı sektörde 2x hızlı.',
        'Kalite kontrol son-aşamada; rework maliyeti net görünmüyor.',
        'Lean dönüşüm projeleri 6-12 ay sonra eskiyi geri çağırıyor; sürdürülebilirlik düşük.',
      ],
    },
    outcomes: {
      title: 'Operasyonel İyileşme Hedefleri',
      results: [
        "OEE +%15 minimum (baseline'a göre, ilk 90 günde).",
        'Stok devir hızı %20-40 artış; safety stock optimize.',
        'Lead time %25-50 kısalma (siparişten teslime).',
        'First-pass yield (FPY) %5-15 artış; rework maliyeti düşüş.',
        'Standart iş prosedürleri (SOP) + kontrol noktaları yazılı.',
      ],
    },
    methodology: {
      title: 'Lean Six Sigma Yaklaşımı',
      phases: [
        {
          name: '1. Gemba Walk + Value Stream Mapping',
          duration: '2 hafta',
          description:
            'Sahada bizzat akış izleme; current state value stream haritası; 7 müda (israf) tanımlama.',
        },
        {
          name: '2. Baseline + Hedef Belirleme',
          duration: '1 hafta',
          description: 'OEE, lead time, FPY ölçümü. Sektörel benchmark. Future state target.',
        },
        {
          name: "3. Kaizen Sprint'leri",
          duration: '6-8 hafta',
          description:
            "Haftalık 2-3 günlük kaizen workshop'ları. SMED, 5S, kanban, poka-yoke uygulamaları.",
        },
        {
          name: '4. Six Sigma DMAIC Projeler',
          duration: '8-12 hafta',
          description:
            'Kritik kalite problemleri için statistical process control + DOE. Green Belt eğitim.',
        },
        {
          name: '5. Sürdürülebilirlik Sistemleri',
          duration: '4 hafta',
          description:
            'Daily management board, ekip liderlerine moderasyon eğitimi, KPI dashboard kurulumu.',
        },
      ],
    },
    deliverables: {
      title: 'Teslim Edilen Çıktılar',
      artifacts: [
        'Current + Future State Value Stream Haritaları',
        'OEE/FPY/Lead Time Baseline + Hedef Raporu',
        '5S Standart İş Prosedürleri (SOP) Seti',
        'Kanban Tasarımı + Implementation Guide',
        'Six Sigma Green Belt Eğitim Materyalleri (3 modül)',
        'Daily Management Board Şablonu',
        'Ölçüm Dashboard (Excel + opsiyonel BI tool)',
      ],
    },
    timeline: {
      totalDuration: '16-24 hafta (4-6 ay)',
      milestones: [
        { name: 'Gemba + VSM tamamlandı', week: 'Hafta 2' },
        { name: 'Baseline ölçüm + hedef', week: 'Hafta 3' },
        { name: 'İlk 3 kaizen sprint sonucu', week: 'Hafta 8' },
        { name: 'Six Sigma proje kapanışı', week: 'Hafta 16' },
        { name: 'Sürdürülebilirlik handoff', week: 'Hafta 20' },
      ],
    },
    investment: {
      range: '₺300.000 – ₺900.000',
      model: "Sabit fiyat + opsiyonel value-based komponent (gerçekleşen tasarrufun %5-10'u).",
      paymentPlan: '4 milestone: %20 VSM, %30 kaizen sprint, %30 Six Sigma proje, %20 handoff.',
    },
    trust: {
      anonymizedExample:
        'Beyaz eşya tedarikçisi orta ölçek üretici, 16 haftalık engagement. Başlangıç OEE %58. SMED ile setup time %62 azaltıldı, 5S + kanban hattı yeniden organize edildi. Sonuç: OEE %78, lead time 18 gün → 8 gün, yıllık tasarruf ₺4.2M.',
      caseStudySlug: 'manufacturing-lean-six-sigma',
    },
    faq: {
      items: [
        {
          q: "Lean veya Six Sigma'ya hangisinden başlamalı?",
          a: "Lean (akış + israf) ile Six Sigma (varyans) farklı problemleri çözer. Discovery'de hangi tip kayıp baskın belirlenir; ekseriya Lean ile başlar, kritik kalite problemleri için Six Sigma'ya geçilir.",
        },
        {
          q: 'Üretim dışı (hizmet, ofis) operasyonlarda da çalışıyor mu?',
          a: 'Evet. Lean Office, dokümantasyon, hizmet süreçleri için aynı metodoloji uygulanır (different unit of work).',
        },
        {
          q: 'İç ekibim eğitilebilir mi?',
          a: "Six Sigma Green Belt 3-modül eğitim engagement'ın parçası. Black Belt sertifikasyonu için ek 6 ay mentor programı opsiyoneldir.",
        },
        ...SHARED_FAQ_END('operational-excellence'),
      ],
    },
    related: ['digital-strategy', 'ai-analytics', 'crisis-management'],
    assessment: STANDARD_ASSESSMENT('operational-excellence', 'Operasyonel Mükemmellik'),
  },

  // ─────────────────────────────────────────────────────────────
  // S5 — NEUROMARKETING
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'neuromarketing',
    hero: {
      title: 'Nöropazarlama & Tüketici Deneyimi (CX)',
      subtitle:
        'Bilinçdışı tüketici davranışlarını analiz ederek, veri odaklı marka ve iletişim stratejileri.',
      valueProp:
        'Tüketici "ne söylediği"nin ötesinde "ne yaptığı" ve "ne hissettiği"ni nörobilimsel framework ile inceler. Marka iletişiminin dönüşüm oranını ölçülebilir biçimde yükseltir.',
      primaryCtaText: 'CX Audit Talep Et',
    },
    problem: {
      title: 'Marka & CX Cephesinde Tipik Zorluklar',
      painPoints: [
        'Anket araştırmaları "iyi" diyor ama satış grafiği yatay; söylem-davranış uçurumu.',
        'Reklam yatırımları ROI ölçülemiyor; kreatif kararlar dahili tartışmaya kalıyor.',
        "Dijital funnel'da %30+ abandon var; nedeni bilinmiyor.",
        'Marka kimliği "modernleşmesi" gerektiği hissi var ama hangi öğeleri korumalı belirsiz.',
        'B2B sektöründe duygusal karar mekanizması ihmal ediliyor; rasyonel pitch yetersiz.',
      ],
    },
    outcomes: {
      title: 'Engagement Çıktıları',
      results: [
        'Müşteri yolculuğu (CJM) — her temas noktasında duygu + dikkat ölçümü.',
        'Reklam/web/CRM mesajlarının A/B test sonuçları (eye-tracking + heatmap).',
        'Marka konumlandırma haritası — algı vs hedef gap analizi.',
        'CX iyileştirme önceliklendirme matrisi (impact × effort).',
        'Hedef segmentler için davranışsal persona seti (demografik değil).',
      ],
    },
    methodology: {
      title: 'Nöropazarlama Süreci',
      phases: [
        {
          name: '1. Stakeholder Discovery + Brand Audit',
          duration: '2 hafta',
          description:
            'Marka pozisyonu, mevcut iletişim materyalleri, satış-pazarlama uyumu görüşmeleri.',
        },
        {
          name: '2. Davranışsal Araştırma Tasarımı',
          duration: '2 hafta',
          description:
            'Eye-tracking, GSR (galvanic skin response), facial coding, EEG (opsiyonel) protokol tasarımı.',
        },
        {
          name: '3. Saha Çalışması & Veri Toplama',
          duration: '3-4 hafta',
          description:
            '60-120 katılımcı ile lab veya in-store araştırma. Davranışsal metrik kaydı.',
        },
        {
          name: '4. Analiz & İçgörü Üretimi',
          duration: '3 hafta',
          description:
            'Quantitative analiz + qualitative tema çıkarımı. Davranışsal persona inşası.',
        },
        {
          name: '5. Aktivasyon Workshop',
          duration: '2 hafta',
          description:
            'Pazarlama ve ürün ekipleriyle bulguların uygulamaya geçirilmesi; A/B test roadmap.',
        },
      ],
    },
    deliverables: {
      title: 'Teslim Edilen Çıktılar',
      artifacts: [
        "Customer Journey Map — Emosyonel Yoğunluk Heatmap'iyle",
        'Eye-Tracking + Heatmap Raporu (web, reklam, ambalaj)',
        'Marka Algı Haritası (Perceptual Map)',
        'Davranışsal Persona Seti (5-7 segment)',
        'CX İyileştirme Önceliklendirme Matrisi',
        'A/B Test Roadmap (12-aylık)',
        'Aktivasyon Workshop Recording + Slide Deck',
      ],
    },
    timeline: {
      totalDuration: '12-16 hafta (3-4 ay)',
      milestones: [
        { name: 'Brand audit tamamlandı', week: 'Hafta 2' },
        { name: 'Araştırma protokolü onaylı', week: 'Hafta 4' },
        { name: 'Saha veri toplama bitti', week: 'Hafta 8' },
        { name: 'İçgörü raporu teslim', week: 'Hafta 11' },
        { name: 'Aktivasyon workshop', week: 'Hafta 14' },
      ],
    },
    investment: {
      range: '₺250.000 – ₺650.000',
      model: 'Sabit fiyat + saha çalışması maliyeti (katılımcı sayısına göre).',
      paymentPlan: '%30 başlangıç, %40 saha tamamlandığında, %30 aktivasyon sonrası.',
    },
    trust: {
      anonymizedExample:
        'Hızlı tüketim markası (FMCG) için ambalaj redesign araştırması. 80 katılımcı eye-tracking + facial coding. Mevcut ambalajın görsel hierarchy zayıflığı tespit edildi; yeni tasarım A/B testinde satış %18 artırdı (8 hafta).',
    },
    faq: {
      items: [
        {
          q: 'Nöropazarlama "manipülasyon" mu?',
          a: 'Hayır. Tüketicinin bilinçdışı karar mekanizmalarını anlamak, daha iyi ürün ve iletişim tasarımı için. Etik framework (örn: Neuromarketing Science & Business Association) uygulanır.',
        },
        {
          q: 'EEG/fMRI cihaz gerekli mi?',
          a: 'Engagement seviyesine göre değişir. Çoğu B2B/B2C iş için eye-tracking + facial coding + GSR yeterli. fMRI özel araştırma projelerinde, dış lab ile partner.',
        },
        {
          q: 'Sonuçlar küçük örneklemle güvenilir mi?',
          a: 'Davranışsal araştırmada 60-120 katılımcı istatistiksel anlamlı içgörü üretir (kontrollü protokol + bias mitigation ile).',
        },
        ...SHARED_FAQ_END('neuromarketing'),
      ],
    },
    related: ['digital-strategy', 'ai-analytics', 'employer-branding'],
    assessment: STANDARD_ASSESSMENT('neuromarketing', 'Nöropazarlama'),
  },

  // ─────────────────────────────────────────────────────────────
  // S6 — HR TRANSFORMATION
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'hr-transformation',
    hero: {
      title: 'İnsan Kaynakları & Organizasyon Tasarımı',
      subtitle:
        'Yetenek matrisleri, performans yönetim sistemleri ve çevik organizasyonel yapıların kurgulanması.',
      valueProp:
        'İK\'yı "bordro+izin" fonksiyonundan stratejik partnere dönüştürür; org tasarımını stratejiyle uyumlandırır, yetenek yönetimini ölçülebilir hale getirir.',
      primaryCtaText: 'Org Tasarım Görüşmesi Al',
    },
    problem: {
      title: 'İK & Organizasyonda Yapısal Sorunlar',
      painPoints: [
        'Org şema kağıt üstünde "doğru" ama günlük operasyonda silos var; eskalasyon hattı belirsiz.',
        'Performans değerlendirme yıllık 360°; aksiyona dönüşmüyor, motivasyon düşürüyor.',
        'Yetenek havuzu sığ; kritik pozisyonlar için succession planı yok.',
        'İK ekibi reaktif; stratejik ortağa dönüşemiyor, "support function" konumunda kalıyor.',
        'Hibrit/uzaktan çalışma politikası belirsiz; verimlilik ölçüm metodolojisi yok.',
      ],
    },
    outcomes: {
      title: 'Engagement Çıktıları',
      results: [
        'Yeni org şeması — karar hakları + span of control optimize.',
        'Yetenek matrisi (9-box) + kritik pozisyon succession planı.',
        'Performans yönetim sistemi (OKR + sürekli feedback).',
        'Hibrit çalışma politikası + ölçüm framework.',
        'İK stratejik partner rolüne geçiş yol haritası.',
      ],
    },
    methodology: {
      title: 'İK Dönüşüm Süreci',
      phases: [
        {
          name: '1. Diagnostic',
          duration: '2 hafta',
          description: 'Mevcut org analizi, çalışan engagement araştırması, İK süreç haritası.',
        },
        {
          name: '2. Org Design Workshop',
          duration: '3 hafta',
          description: 'Yeni org modeli (functional, matrix, agile pod). Karar hakları matrisi.',
        },
        {
          name: '3. Performans Sistemi',
          duration: '4 hafta',
          description: 'OKR cadence, sürekli feedback ritmi, kalibreli değerlendirme tasarımı.',
        },
        {
          name: '4. Yetenek Yönetimi',
          duration: '4 hafta',
          description: '9-box değerlendirme, succession planlaması, gelişim havuzu (talent pool).',
        },
        {
          name: '5. Change Management',
          duration: '3 hafta',
          description: 'Geçiş iletişimi, eğitim, manager enablement, kültürel uyum sprintleri.',
        },
      ],
    },
    deliverables: {
      title: 'Teslim Edilen Çıktılar',
      artifacts: [
        'Yeni Org Şeması + Karar Hakları Matrisi',
        'Yetenek Matrisi (9-Box) + Succession Roadmap',
        'OKR Şablonu + Performans Yönetim Playbook',
        'Hibrit Çalışma Politika Dokümanı',
        'Manager Enablement Eğitim Materyalleri',
        'Change Communication Plan',
      ],
    },
    timeline: {
      totalDuration: '14-18 hafta (3.5-4.5 ay)',
      milestones: [
        { name: 'Diagnostic raporu', week: 'Hafta 2' },
        { name: 'Yeni org modeli onaylandı', week: 'Hafta 5' },
        { name: 'Performans sistemi pilot', week: 'Hafta 9' },
        { name: 'Talent pool kurulu', week: 'Hafta 13' },
        { name: 'Change rollout tamamlandı', week: 'Hafta 16' },
      ],
    },
    investment: {
      range: '₺280.000 – ₺650.000',
      model: 'Sabit fiyat. Sertifikasyon eğitimleri (örn: Hogan, MBTI) ayrı ücretlendirilir.',
      paymentPlan:
        '4 milestone: %20 Diagnostic, %30 Org Design, %30 Performance/Talent, %20 Change.',
    },
    trust: {
      anonymizedExample:
        'Üretim grubu (650 çalışan) için 16 haftalık org dönüşüm. Önceki 7-katmanlı yapı 4-katmana indirildi, span of control 1:4 → 1:7. Karar hızı %42 arttı, yıllık çalışan turnover 18% → 11%.',
      caseStudySlug: 'organizational-transformation',
    },
    faq: {
      items: [
        {
          q: 'Mevcut İK ekibim kalır mı?',
          a: 'Evet. Engagement, İK ekibi ile birlikte yürütülür; biz "araç + yöntem", onlar "uygulayıcı + sürdürücü". Engagement sonrası İK ekibi otonom işletir.',
        },
        {
          q: 'Org küçültme (downsizing) yapar mısınız?',
          a: 'Strateji gerektiriyorsa evet; ama amacımız genelde "doğru yerde doğru kişi" optimization. Downsizing sadece veri net gösteriyorsa önerilir.',
        },
        {
          q: 'Çalışan görüşmeleri gizli mi?',
          a: 'Evet, 360°/engagement araştırmaları anonim ve toplam raporda agregate edilir. Bireysel görüşmeler güvende kalır.',
        },
        ...SHARED_FAQ_END('hr-transformation'),
      ],
    },
    related: ['strategic-transformation', 'family-business', 'employer-branding'],
    assessment: STANDARD_ASSESSMENT('hr-transformation', 'İK Dönüşümü'),
  },

  // ─────────────────────────────────────────────────────────────
  // S7 — CRISIS MANAGEMENT
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'crisis-management',
    hero: {
      title: 'Kriz Yönetimi & İş Sürekliliği',
      subtitle:
        'Finansal veya operasyonel kriz anlarında acil eylem planları ve dayanıklılık (resilience) testleri.',
      valueProp:
        'Kriz dönemlerinde 72 saatlik karar penceresinde stratejik triage; iş sürekliliği planı + paydaş iletişimi + finansal manevralar.',
      primaryCtaText: 'Acil Durum Görüşmesi',
    },
    problem: {
      title: 'Kriz Dönemlerinde Karşılaşılan Tipik Sorunlar',
      painPoints: [
        'Kriz öncesi business continuity planı yok; ilk 48 saatte panik kararlar veriliyor.',
        'Stakeholder iletişimi koordinasyonsuz; medya, çalışan, müşteri, banka farklı mesaj alıyor.',
        'Nakit akışı 4-6 hafta sonra kritik; finansal triage yapılmıyor.',
        'Krize sebep olan sistemsel zayıflık post-mortem yapılmıyor; aynı tip kriz tekrarlıyor.',
        'Liderlik ekibi ya overreaction ya da underreaction; risk-adjusted karar verme zorlaşıyor.',
      ],
    },
    outcomes: {
      title: 'Kriz Engagement Çıktıları',
      results: [
        '72 Saatlik Acil Eylem Planı (Day 1-3).',
        'Stakeholder iletişim playbook + tek-sayfa mesaj çerçevesi.',
        '13-haftalık nakit projeksiyonu + finansal triage matrisi.',
        'Operasyonel sürekliliği koruma kritik fonksiyon listesi.',
        'Post-crisis öğrenme + resilience iyileştirme yol haritası.',
      ],
    },
    methodology: {
      title: 'Kriz Süreci Aşamaları',
      phases: [
        {
          name: '1. Hızlı Triage',
          duration: '24-48 saat',
          description:
            'Krizin doğası, etkilenen alanlar, hayati riskler. CEO/CFO ile bire bir oturum.',
        },
        {
          name: '2. Stabilizasyon Planı',
          duration: '1 hafta',
          description: '72-saat planı + 13-hafta nakit + iletişim stratejisi.',
        },
        {
          name: '3. Uygulama Komuta',
          duration: '4-8 hafta',
          description: 'Günlük standup (kriz komuta odası), karar günlüğü, stakeholder iletişim.',
        },
        {
          name: '4. Toparlanma Fazı',
          duration: '4-12 hafta',
          description:
            'Operasyonel restore, finansal sağlık, müşteri/çalışan güveni yeniden inşası.',
        },
        {
          name: '5. Post-Mortem + Resilience',
          duration: '4 hafta',
          description:
            'Lessons learned, business continuity planı (BCP) güncelleme, simülasyon tatbikatı.',
        },
      ],
    },
    deliverables: {
      title: 'Teslim Edilen Çıktılar',
      artifacts: [
        '72-Saatlik Acil Eylem Planı',
        'Stakeholder İletişim Playbook (medya, çalışan, müşteri, finansör)',
        '13-Haftalık Nakit Projeksiyonu (Excel + senaryo)',
        'Kritik Fonksiyon Sürekliliği Listesi',
        'Kriz Komuta Odası Operasyon Şablonu',
        'Post-Mortem Raporu + Resilience İyileştirme Listesi',
        'Yıllık Tatbikat Senaryosu',
      ],
    },
    timeline: {
      totalDuration: 'Akut faz 4-8 hafta · Resilience hardening 4-8 hafta sonrası',
      milestones: [
        { name: 'İlk triage tamamlandı', week: '48 saat içinde' },
        { name: 'Stabilizasyon planı', week: 'Hafta 1' },
        { name: 'Operasyonel restore başlangıç', week: 'Hafta 4' },
        { name: 'Post-mortem raporu', week: 'Hafta 10' },
        { name: 'Resilience tatbikatı', week: 'Hafta 14' },
      ],
    },
    investment: {
      range: '₺150.000 – ₺850.000 (krizin ölçeğine göre)',
      model: 'Sabit fiyat + opsiyonel yıllık BCP ortaklığı (preventive audit + tatbikat).',
      paymentPlan: '%50 başlangıç (acil müdahale), %50 stabilizasyon + handoff sonrası.',
    },
    trust: {
      anonymizedExample:
        'Yangın sonucu üretim hattı durmuş 220 çalışanlı imalatçı için 6 haftalık akut müdahale. 72 saat içinde alternatif tesis devreye alındı (paid manufacturing partner), 13-haftalık nakit modeli ile banka covenants korundu, müşteri kontratlarında force majeure uygulaması yapıldı. 4 ayda operasyon tam restore + BCP audit. Kayıp ciro projeksiyonun %35 altında kaldı.',
    },
    faq: {
      items: [
        {
          q: 'Krize zaten girdik, çok geç mi?',
          a: 'Hayır. Akut faz desteği 24 saat içinde başlatılabilir. Erken triage karar hızını ve kalitesini dramatik artırır.',
        },
        {
          q: 'Hangi tip krizlerle ilgileniyorsunuz?',
          a: 'Finansal (likidite, banka), operasyonel (üretim duruşu, kalite incident), reputasyonel (medya, sosyal), siber (KVKK ihlali, fidye), regülasyon, doğal afet sonrası BCP.',
        },
        {
          q: '7/24 ulaşılabilir misiniz?',
          a: 'Akut faz aktiveyse evet, kriz komuta odası kurulur. Preventive BCP ortaklığı ile yıllık tatbikat + on-call destek.',
        },
        ...SHARED_FAQ_END('crisis-management'),
      ],
    },
    related: ['operational-excellence', 'macro-risk', 'data-governance'],
    assessment: STANDARD_ASSESSMENT('crisis-management', 'Kriz Yönetimi'),
  },

  // ─────────────────────────────────────────────────────────────
  // S8 — AI ANALYTICS
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'ai-analytics',
    hero: {
      title: 'Yapay Zeka (AI) & İş Analitiği',
      subtitle:
        'Makine öğrenmesi modelleri ile tahmine dayalı analizler ve yapay zeka entegrasyon stratejileri.',
      valueProp:
        "AI hype'ından ayrılarak ROI odaklı use-case seçimi; pilot → ölçeklendirme yol haritası ve veri-okuryazar organizasyon.",
      primaryCtaText: 'AI Use-Case Audit',
    },
    problem: {
      title: 'AI Yatırımlarında Sıkıntılar',
      painPoints: [
        '"AI yapalım" baskısı var ama hangi probleme uygulanacağı net değil.',
        "POC'ler kalıyor; production'a geçmiyor (MLOps olgunluğu eksik).",
        'Veri kalitesi düşük; modeli eğitmeden önce uzun veri temizliği gerekiyor.',
        "GenAI tool'lara ücret ödeniyor ama use-case ROI ölçülmüyor.",
        'AI etik + KVKK uyum belirsiz; veri yönetişimi olmadan model deploy ediliyor.',
      ],
    },
    outcomes: {
      title: 'AI Engagement Çıktıları',
      results: [
        'AI Use-Case portföyü — impact × feasibility önceliklendirme.',
        '2-3 pilot ML/GenAI projesi (production-ready).',
        'MLOps pipeline (versioning, monitoring, retraining).',
        'Data foundation roadmap (warehouse + governance).',
        "AI etik + KVKK uyumluluk framework'ü.",
      ],
    },
    methodology: {
      title: 'AI Engagement Süreci',
      phases: [
        {
          name: '1. AI Maturity Audit',
          duration: '2 hafta',
          description:
            'Mevcut veri varlıkları, AI okuryazarlık seviyesi, organize hazırlık değerlendirmesi.',
        },
        {
          name: '2. Use-Case Portfolio',
          duration: '2 hafta',
          description:
            "İş birimleri ile workshop'lar; impact × feasibility matrisi; 5-10 use-case listesi.",
        },
        {
          name: '3. Data Foundation',
          duration: '4-6 hafta',
          description: 'Veri pipeline, kalite kontrol, governance, KVKK uyum.',
        },
        {
          name: '4. Pilot ML/GenAI Build',
          duration: '6-10 hafta',
          description:
            '2-3 pilot model (tahmin, classification, GenAI workflow). Production deployment.',
        },
        {
          name: '5. Scaling & Capability',
          duration: '4 hafta',
          description: 'MLOps platformu, iç ekip eğitim, scaling stratejisi.',
        },
      ],
    },
    deliverables: {
      title: 'Teslim Edilen Çıktılar',
      artifacts: [
        'AI Maturity Assessment Raporu',
        'Use-Case Portfolio + Önceliklendirme Matrisi',
        '2-3 Pilot Model (Code + Documentation)',
        'MLOps Pipeline + Monitoring Dashboard',
        'Data Governance + KVKK Uyum Framework',
        'AI Etik Politikası Dokümanı',
        'İç Ekip Eğitim Modülleri (3 modül)',
      ],
    },
    timeline: {
      totalDuration: '18-24 hafta (4.5-6 ay)',
      milestones: [
        { name: 'Maturity audit', week: 'Hafta 2' },
        { name: 'Use-case portfolio', week: 'Hafta 4' },
        { name: 'Data foundation hazır', week: 'Hafta 10' },
        { name: 'Pilot model #1 production', week: 'Hafta 16' },
        { name: 'Scaling handoff', week: 'Hafta 22' },
      ],
    },
    investment: {
      range: '₺450.000 – ₺1.200.000',
      model: 'Sabit fiyat + cloud infra maliyeti müşteri hesabında (AWS/Azure/GCP).',
      paymentPlan: '%20 audit, %30 use-case + data, %35 pilot build, %15 scaling.',
    },
    trust: {
      anonymizedExample:
        'Perakende zinciri (180 mağaza) için 22 haftalık AI engagement. Use-case: demand forecasting + dynamic pricing. Pilot 24 mağazada production, %14 stok-out azalış, %6 marjin iyileşme. İç data science ekibi (3 kişi) eğitildi, scaling roadmap aktif.',
    },
    faq: {
      items: [
        {
          q: 'GenAI mi yoksa klasik ML mi öneriyorsunuz?',
          a: "Probleme göre değişir. Tahmin/optimization için klasik ML; bilgi yönetimi/içerik üretimi için GenAI. Çoğu engagement'ta hybrid uygulanır.",
        },
        {
          q: 'Hangi cloud platformu?',
          a: "AWS, Azure, GCP — müşterinin mevcut cloud stack'ine göre. Vendor-agnostic mimari prensibimiz.",
        },
        {
          q: 'Veri yetersiz olursa?',
          a: 'AI öncesi data foundation fazı zorunlu. Yetersizse 4-12 hafta hazırlık önerilir; aksi pilot başarısızlık riski yüksek.',
        },
        ...SHARED_FAQ_END('ai-analytics'),
      ],
    },
    related: ['digital-strategy', 'data-governance', 'operational-excellence'],
    assessment: STANDARD_ASSESSMENT('ai-analytics', 'AI & İş Analitiği'),
  },

  // ─────────────────────────────────────────────────────────────
  // S9 — DIGITAL STRATEGY
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'digital-strategy',
    hero: {
      title: 'Dijital Dönüşüm & Teknoloji Stratejisi',
      subtitle:
        'ERP seçimi, süreç otomasyonu (RPA) ve dijital olgunluk analizleri ile teknolojik kaldıraç.',
      valueProp:
        'Dijital dönüşüm tool seçimi değil, strateji-süreç-teknoloji-kültür tetragramının uyumlandırılmasıdır. ROI ölçülebilir, kalıcı dönüşüm.',
      primaryCtaText: 'Dijital Olgunluk Audit',
    },
    problem: {
      title: 'Dijital Dönüşüm Cephesi Sorunları',
      painPoints: [
        "5-7 SaaS aracı satın alındı ama silos'ta çalışıyor; entegrasyon yok.",
        'ERP / CRM 18 ay önce devreye girdi, hala %40 adoption.',
        'RPA pilotları 6 ay sonra unutuldu; sürdürülebilirlik zayıf.',
        'IT departmanı reaktif support function; stratejik partner değil.',
        '"Dijital olgunluk" iddiası var ama ölçüm framework\'ü yok.',
      ],
    },
    outcomes: {
      title: 'Engagement Çıktıları',
      results: [
        'Dijital olgunluk skoru (6 boyutta, sektörel benchmark).',
        'Teknoloji stratejisi yol haritası (3 yıllık).',
        'ERP/CRM seçim ve implementation roadmap (vendor-agnostic).',
        'RPA otomasyon adayları (top 10 use-case).',
        'IT operating model (centralized vs federated vs hybrid).',
      ],
    },
    methodology: {
      title: 'Dijital Dönüşüm Çerçevesi',
      phases: [
        {
          name: '1. Dijital Olgunluk Audit',
          duration: '2-3 hafta',
          description:
            'Strateji, süreç, teknoloji, veri, kültür, organizasyon boyutlarında değerlendirme.',
        },
        {
          name: '2. Teknoloji Strateji Workshop',
          duration: '2 hafta',
          description: 'C-level ile 3-yıllık teknoloji vizyonu; build-buy-partner kararları.',
        },
        {
          name: '3. ERP/CRM Seçim Süreci (opsiyonel)',
          duration: '6-8 hafta',
          description: 'Vendor değerlendirme, RFP, demo, referans araması, contract review.',
        },
        {
          name: '4. RPA / Otomasyon Pilot',
          duration: '4-6 hafta',
          description: 'Top 3 use-case için RPA bot tasarım + deploy. ROI ölçümü.',
        },
        {
          name: '5. Operating Model Hazırlığı',
          duration: '3 hafta',
          description: 'IT operating model design, change management, capability building.',
        },
      ],
    },
    deliverables: {
      title: 'Teslim Edilen Çıktılar',
      artifacts: [
        'Dijital Olgunluk Skoru + Benchmark Raporu',
        '3-Yıllık Teknoloji Stratejisi Yol Haritası',
        'ERP/CRM Vendor Evaluation Matrix + Tavsiye',
        'RPA Use-Case Portföy + Top 3 Pilot Code',
        'IT Operating Model Design Dokümanı',
        'Change Management Plan',
      ],
    },
    timeline: {
      totalDuration: '14-26 hafta (ERP dahilse uzar)',
      milestones: [
        { name: 'Olgunluk audit', week: 'Hafta 3' },
        { name: 'Tek strateji onaylandı', week: 'Hafta 5' },
        { name: 'ERP vendor short-list', week: 'Hafta 11' },
        { name: 'RPA pilot canlıda', week: 'Hafta 18' },
        { name: 'Operating model handoff', week: 'Hafta 22-26' },
      ],
    },
    investment: {
      range: '₺350.000 – ₺1.000.000',
      model: 'Sabit fiyat. Vendor lisans/implementation maliyeti müşteri hesabında.',
      paymentPlan: '%25 audit, %30 strateji, %30 ERP/RPA, %15 operating model.',
    },
    trust: {
      anonymizedExample:
        "Distribütör grup (12 lokasyon) için 20 haftalık dijital dönüşüm. ERP seçim sürecinde 3 vendor RFP'si, finalist demo, ve referans görüşmeler sonucu seçim yapıldı. RPA ile sipariş işleme süresi 4 saat → 25 dakika, yıllık ₺3.2M tasarruf.",
    },
    faq: {
      items: [
        {
          q: 'Vendor satıyor musunuz?',
          a: "Hayır. Vendor-agnostic'iz; SAP, Oracle, Microsoft, lokal ERP'ler — değerlendirme objektif, komisyon almıyoruz.",
        },
        {
          q: "ERP implementation'ı siz mi yapıyorsunuz?",
          a: "Hayır. Vendor partner ekibi implementation'ı yürütür. Biz seçim, PMO oversight, change management yapıyoruz (independent advisor).",
        },
        {
          q: 'RPA hangi platformlarla?',
          a: 'UiPath, Automation Anywhere, Microsoft Power Automate. Ayrıca Python custom otomasyon.',
        },
        ...SHARED_FAQ_END('digital-strategy'),
      ],
    },
    related: ['ai-analytics', 'operational-excellence', 'data-governance'],
    assessment: STANDARD_ASSESSMENT('digital-strategy', 'Dijital Dönüşüm'),
  },

  // ─────────────────────────────────────────────────────────────
  // S10 — DATA GOVERNANCE
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'data-governance',
    hero: {
      title: 'Veri Yönetişimi & KVKK/GDPR Uyum',
      subtitle:
        'Veri gizliliği, siber güvenlik yönetişimi ve yasal uyumluluk (ISO 27001) danışmanlığı.',
      valueProp:
        'KVKK/GDPR uyumunu compliance-checklist ötesinde stratejik veri yönetişimine çevirir; siber güvenlik kültürünü organize bir disipline dönüştürür.',
      primaryCtaText: 'KVKK Audit Talep Et',
    },
    problem: {
      title: 'Veri Yönetişiminde Tipik Boşluklar',
      painPoints: [
        'KVKK uyum projesi 2 yıl önce yapıldı; mevzuat ve organizasyon değişti, doküman güncel değil.',
        'Veri envanteri eksik; "hangi veri nerede" sorusuna 24 saatten önce cevap verilemiyor.',
        'Veri sahibi hakları (KVKK Madde 11) talepleri sistematik yönetilmiyor.',
        'Siber güvenlik araçları satın alındı (firewall, EDR) ama governance çerçevesi yok.',
        'ISO 27001 / KVKK sertifikasyon hedefi var ama implementation roadmap eksik.',
      ],
    },
    outcomes: {
      title: 'Engagement Çıktıları',
      results: [
        'Veri envanteri (data inventory + flow map).',
        'Güncel KVKK uyum dokümantasyon paketi.',
        'Veri sahibi hakları yönetimi süreci (otomatize).',
        'Bilgi güvenliği yönetim sistemi (ISMS) framework.',
        'ISO 27001 / KVKK sertifikasyon yol haritası.',
      ],
    },
    methodology: {
      title: 'Veri Yönetişimi Süreci',
      phases: [
        {
          name: '1. Mevcut Durum Audit',
          duration: '3 hafta',
          description: 'Veri envanteri, mevzuat gap analizi, mevcut güvenlik kontrolleri review.',
        },
        {
          name: '2. Risk Değerlendirme',
          duration: '2 hafta',
          description: 'Veri kategorileri risk haritası, threat modeling, impact analizi.',
        },
        {
          name: '3. Policy & Procedure Yazımı',
          duration: '4 hafta',
          description:
            'KVKK uyum dokümantasyon paketi (aydınlatma, çerez, açık rıza, veri sahibi başvuru).',
        },
        {
          name: '4. Technical Controls',
          duration: '4-6 hafta',
          description: 'DLP, access control, log management, incident response playbook.',
        },
        {
          name: '5. Eğitim & Sertifikasyon Hazırlık',
          duration: '3 hafta',
          description: 'Tüm çalışan KVKK eğitimi, KVK temsilcisi eğitimi, ISO 27001 ön-audit.',
        },
      ],
    },
    deliverables: {
      title: 'Teslim Edilen Çıktılar',
      artifacts: [
        'Veri Envanteri + Flow Map',
        'KVKK Uyum Doküman Paketi (8-12 doküman)',
        'Veri Sahibi Hakları Yönetim Süreci',
        'ISMS Policy Set (15-20 politika)',
        'Incident Response Playbook',
        'Çalışan KVKK Eğitim Modülleri',
        'ISO 27001 Gap Analizi + Roadmap',
      ],
    },
    timeline: {
      totalDuration: '16-22 hafta (4-5.5 ay)',
      milestones: [
        { name: 'Audit raporu', week: 'Hafta 3' },
        { name: 'Risk haritası', week: 'Hafta 5' },
        { name: 'Doküman paketi v1', week: 'Hafta 9' },
        { name: 'Technical controls deploy', week: 'Hafta 15' },
        { name: 'Eğitim + ön-audit', week: 'Hafta 20' },
      ],
    },
    investment: {
      range: '₺300.000 – ₺750.000',
      model: 'Sabit fiyat. ISO 27001 sertifikasyon ücreti 3. taraf akredite kuruluşa ayrı.',
      paymentPlan: '%25 audit, %25 policy, %30 technical, %20 eğitim + sertifikasyon hazırlık.',
    },
    trust: {
      anonymizedExample:
        'Fintech (220 çalışan) için 18 haftalık KVKK + ISO 27001 hazırlık engagement. Veri envanteri 47 sistem üzerinde haritalandı, 14 doküman + 18 ISMS politikası yazıldı. ISO 27001 sertifikasyonu engagement bitimi + 4 ay sonra alındı.',
    },
    faq: {
      items: [
        {
          q: 'KVK Kurumu denetlerse hazır mıyız?',
          a: 'Engagement sonunda evet — dokümantasyon + veri envanteri + incident playbook ile denetime hazır pozisyondasınız.',
        },
        {
          q: 'ISO 27001 zorunlu mu?',
          a: 'Hayır; B2B kontrat gereği veya KVKK denetimi öncesi proactive olarak alınır. Sertifikasyon süreci 3-6 ay sürer.',
        },
        {
          q: 'Hukuk firması ile koordinasyon yapıyor musunuz?',
          a: 'Evet, mevcut hukuk firmanızla birlikte çalışırız. Hukuki yorum gerektiren dokümanlar avukat onayından geçer.',
        },
        ...SHARED_FAQ_END('data-governance'),
      ],
    },
    related: ['ai-analytics', 'crisis-management', 'digital-strategy'],
    assessment: STANDARD_ASSESSMENT('data-governance', 'Veri Yönetişimi & KVKK'),
  },

  // ─────────────────────────────────────────────────────────────
  // S11 — ESG STRATEGY
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'esg-strategy',
    hero: {
      title: 'ESG Stratejisi & Yeşil Mutabakat',
      subtitle:
        'Karbon ayak izi raporlaması, sürdürülebilirlik stratejileri ve yeşil finansman erişimi.',
      valueProp:
        'AB Yeşil Mutabakatı + CBAM sınırında Türk üreticisi için stratejik ESG yol haritası: maliyet değil, rekabet avantajı olarak.',
      primaryCtaText: 'ESG Audit Talep Et',
    },
    problem: {
      title: 'ESG & Yeşil Mutabakat Karşısında Zorluklar',
      painPoints: [
        "CBAM (Karbon Sınırı Düzenleme Mekanizması) 2026'da tam aktif; etki simülasyonu yok.",
        'Müşterilerden Scope 3 emisyon talep ediliyor; ölçüm metodolojisi belirsiz.',
        'ESG raporu yıllık çıkıyor ama operasyonel kararla bağlı değil.',
        'Yeşil finansman (sustainable bond, green loan) için kriterler karşılanmıyor.',
        "Çalışan / yatırımcı baskısı ESG'yi gündeme alıyor ama strateji şekillenmiyor.",
      ],
    },
    outcomes: {
      title: 'ESG Engagement Çıktıları',
      results: [
        'Karbon ayak izi (Scope 1+2+3) ölçüm + raporlaması.',
        'CBAM etki simülasyonu (ihracat maliyetine etki).',
        'Decarbonization roadmap (5-10 yıllık).',
        'GRI / SASB / TCFD uyumlu sürdürülebilirlik raporu.',
        'Yeşil finansman erişim stratejisi.',
      ],
    },
    methodology: {
      title: 'ESG Strateji Süreci',
      phases: [
        {
          name: '1. Materiality Assessment',
          duration: '3 hafta',
          description: 'Hangi ESG konuları sektör + paydaş için kritik; öncelik haritası.',
        },
        {
          name: '2. Karbon Envanteri',
          duration: '4-6 hafta',
          description: 'Scope 1, 2, 3 emisyon hesaplama; ISO 14064 / GHG Protocol uyumlu.',
        },
        {
          name: '3. ESG Strateji Workshop',
          duration: '2 hafta',
          description: 'C-level ile 5-10 yıllık ESG hedefler, decarbonization yol haritası.',
        },
        {
          name: '4. Reporting Framework',
          duration: '4 hafta',
          description: 'GRI / SASB / TCFD seçimi; ilk sürdürülebilirlik raporu draft.',
        },
        {
          name: '5. Aktivasyon + Yeşil Finansman',
          duration: '3 hafta',
          description: 'İç ESG governance, yeşil bond/loan vendor görüşmeler, KPI dashboard.',
        },
      ],
    },
    deliverables: {
      title: 'Teslim Edilen Çıktılar',
      artifacts: [
        'Materiality Matrix',
        'Karbon Envanteri Raporu (Scope 1+2+3)',
        'CBAM Etki Simülasyonu',
        'ESG Strateji Dokümanı + Decarbonization Roadmap',
        'İlk Sürdürülebilirlik Raporu (GRI/SASB uyumlu)',
        'Yeşil Finansman Erişim Stratejisi',
      ],
    },
    timeline: {
      totalDuration: '16-22 hafta (4-5.5 ay)',
      milestones: [
        { name: 'Materiality assessment', week: 'Hafta 3' },
        { name: 'Karbon envanteri', week: 'Hafta 9' },
        { name: 'ESG strateji onaylandı', week: 'Hafta 11' },
        { name: 'Sürdürülebilirlik raporu v1', week: 'Hafta 16' },
        { name: 'Yeşil finansman pitch hazır', week: 'Hafta 20' },
      ],
    },
    investment: {
      range: '₺280.000 – ₺700.000',
      model: 'Sabit fiyat. 3. taraf assurance/verification ayrı.',
      paymentPlan: '%25 materiality, %30 karbon, %25 reporting, %20 yeşil finansman.',
    },
    trust: {
      anonymizedExample:
        "AB ihracatı %65 olan tekstil grubu için 18 haftalık ESG + CBAM hazırlık. Scope 3 emisyonun %42'si fason tedarikçilerden geldiği tespit edildi; tedarikçi decarbonization programı başlatıldı. Yeşil loan başvurusu finansman %1.5 daha düşük faizle alındı.",
    },
    faq: {
      items: [
        {
          q: 'CBAM bizi nasıl etkiler?',
          a: "AB'ye ihracatınız varsa karbon-yoğun ürünlerde (demir-çelik, çimento, alüminyum, gübre, hidrojen, elektrik) 2026 itibariyle ek vergi. Etki simülasyonu engagement ilk fazında yapılır.",
        },
        {
          q: 'Hangi reporting framework seçmeli?',
          a: "GRI çoğu sektör, SASB sermaye piyasası odaklı, TCFD iklim spesifik. Engagement'ta sektör + paydaş beklentisine göre seçim yapılır.",
        },
        {
          q: 'Karbon nötr olmak gerekli mi?',
          a: "Gerekli değil ama AB pazarı + yatırımcı + müşteri baskısı artıyor. Net-zero hedefi engagement'da değerlendirilir.",
        },
        ...SHARED_FAQ_END('esg-strategy'),
      ],
    },
    related: ['strategic-transformation', 'investment-incentives', 'macro-risk'],
    assessment: STANDARD_ASSESSMENT('esg-strategy', 'ESG Stratejisi'),
  },

  // ─────────────────────────────────────────────────────────────
  // S12 — INVESTMENT INCENTIVES
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'investment-incentives',
    hero: {
      title: 'Yatırım Teşvikleri & Hibe Yönetimi',
      subtitle:
        'Devlet destekleri, Ar-Ge hibeleri ve proje bazlı yatırım teşvik belgesi süreçleri.',
      valueProp:
        "Türkiye'nin teşvik mevzuatında 200+ destek programı içinden şirketinize uygun olanları haritalayıp başvuru-değerlendirme-uygulama süreçlerini yönetir.",
      primaryCtaText: 'Teşvik Eligibility Check',
    },
    problem: {
      title: 'Teşvik & Hibe Cephesi Sorunları',
      painPoints: [
        'Sanayi/Ticaret/Hazine teşvik mevzuatı sürekli değişiyor; ne hak ediliyor belirsiz.',
        'TÜBİTAK, KOSGEB, AB Horizon başvuruları arasında stratejik seçim yapılmıyor.',
        'Yatırım teşvik belgesi alındı ama Tamamlama Vizesi süreci geciktirildi; teşvikler iptal.',
        'Ar-Ge merkezi kuruldu, ama yıllık denetimlerde puan kaybediliyor.',
        'AB hibeleri (Horizon Europe, Erasmus+, LIFE) için partner havuzu eksik.',
      ],
    },
    outcomes: {
      title: 'Teşvik Engagement Çıktıları',
      results: [
        'Uygunluk haritası (eligibility map) — uygun olduğunuz tüm teşvikler.',
        "Önceliklendirilmiş başvuru pipeline'ı (ödül × başarı olasılığı).",
        'Yatırım teşvik belgesi / Ar-Ge merkezi başvurusu (paket).',
        'TÜBİTAK / KOSGEB / Horizon başvuru taslakları.',
        'Tamamlama vizesi + yıllık raporlama süreç desteği.',
      ],
    },
    methodology: {
      title: 'Teşvik Süreç Aşamaları',
      phases: [
        {
          name: '1. Eligibility Audit',
          duration: '2 hafta',
          description:
            'Şirket finansal+operasyonel profil, mevcut teşvik durumu, uygun programlar haritalama.',
        },
        {
          name: '2. Strateji Workshop',
          duration: '1 hafta',
          description: 'Hangi başvurulara öncelik; kaynak ayırma; takvim.',
        },
        {
          name: '3. Başvuru Dosyalarının Hazırlanması',
          duration: '4-8 hafta',
          description: 'TÜBİTAK / KOSGEB / Sanayi / AB başvuru taslakları + ekler.',
        },
        {
          name: '4. Değerlendirme Sürecinde Destek',
          duration: '8-12 hafta',
          description: 'Mülakat hazırlık, ek belge yanıtları, savunma.',
        },
        {
          name: '5. Tamamlama Vizesi + Raporlama',
          duration: 'Yıllık (uzun vadeli)',
          description: 'Yatırım gerçekleşmesi sonrası vizyon, yıllık denetim raporları.',
        },
      ],
    },
    deliverables: {
      title: 'Teslim Edilen Çıktılar',
      artifacts: [
        'Eligibility Map (uygun teşvikler listesi)',
        'Başvuru Pipeline + Önceliklendirme',
        'TÜBİTAK / KOSGEB Başvuru Dosyaları',
        'Yatırım Teşvik Belgesi Başvuru Paketi',
        'Ar-Ge Merkezi Başvuru Paketi (varsa)',
        'AB Hibe Başvuru Taslakları',
        'Yıllık Raporlama Şablonları',
      ],
    },
    timeline: {
      totalDuration: 'Başvuru hazırlık 6-12 hafta · Karar süreci 3-9 ay · Vizyon süreci yıllık',
      milestones: [
        { name: 'Eligibility audit', week: 'Hafta 2' },
        { name: 'İlk başvuru gönderildi', week: 'Hafta 8' },
        { name: 'İlk karar (kabul/red)', week: 'Hafta 16-30' },
        { name: 'Yatırım tamamlama vizyon', week: '12-24 ay' },
      ],
    },
    investment: {
      range: '₺120.000 – ₺500.000 + opsiyonel success fee',
      model: "Sabit fiyat (başvuru hazırlık) + opsiyonel success fee (alınan hibenin %3-8'i).",
      paymentPlan: '%50 başlangıç, %50 başvuru tamamlandığında. Success fee karar sonrası.',
    },
    trust: {
      anonymizedExample:
        'Üretici şirket (180 çalışan) için 14 haftalık engagement. TÜBİTAK 1501 + Yatırım Teşvik Belgesi (5. Bölge) + Ar-Ge Merkezi başvurularının üçü onaylandı. Toplam ek finansal değer: ₺18M (vergi muafiyeti + hibe).',
    },
    faq: {
      items: [
        {
          q: 'Başvuru reddedilirse?',
          a: "Başvuru süreçlerinde başarı olasılığı maksimize için kalite gate'leri kullanırız. Red durumunda revize başvuru veya alternatif program değerlendirilir; success fee sadece kabul edilen başvurulardan.",
        },
        {
          q: 'Hangi sektörlerde çalışıyorsunuz?',
          a: 'Türkiye teşvik mevzuatı çoğu sektörü kapsar; üretim, teknoloji, tarım, hizmet, enerji. Sektörel uzmanlık başvuru kalitesini artırır.',
        },
        {
          q: 'AB hibelerine başvuru için partner bulabilir misiniz?',
          a: 'AB Horizon Europe consortium kurulumunda Avrupa partner havuzumuz var; partner matchmaking destek veriyoruz.',
        },
        ...SHARED_FAQ_END('investment-incentives'),
      ],
    },
    related: ['esg-strategy', 'macro-risk', 'mergers-acquisitions'],
    assessment: STANDARD_ASSESSMENT('investment-incentives', 'Teşvik & Hibe'),
  },

  // ─────────────────────────────────────────────────────────────
  // S13 — MACRO RISK
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'macro-risk',
    hero: {
      title: 'Makroekonomik Risk & Piyasa Analizi',
      subtitle:
        'Kur, faiz ve enflasyon projeksiyonları ile C-Level stratejik karar destek raporları.',
      valueProp:
        'Türkiye + global makro değişkenler için scenario planning. CFO/CEO\'nun "ne olursa ne yapacağız" sorusuna yapılandırılmış cevap.',
      primaryCtaText: 'Makro Risk Görüşmesi',
    },
    problem: {
      title: 'Makro Belirsizlik Karşısında Zorluklar',
      painPoints: [
        'Bütçe varsayımları 3-6 ay içinde geçersiz oluyor; rolling forecast disiplini yok.',
        'Kur riski (open position) hedge edilmiyor veya optimize değil.',
        'Faiz riski (financial cost) bütçeye sigorta gibi gömülmüyor; net etki bilinmiyor.',
        'Enflasyon pricing kararlarına süpürülmüyor; marjin erozyonu fark edildiğinde geç.',
        'Senaryo analizi yapılıyor ama "ne olursa ne yapacağız" planı eksik.',
      ],
    },
    outcomes: {
      title: 'Makro Engagement Çıktıları',
      results: [
        'Rolling 13-haftalık nakit + 24-aylık finansal projeksiyon.',
        'Kur/faiz/enflasyon scenario matrisi (base / bull / bear / shock).',
        'Hedge stratejisi (forward, option, natural hedge).',
        'Pricing dinamik formülü (enflasyon pass-through).',
        'C-Level monthly makro briefing (engagement süresince).',
      ],
    },
    methodology: {
      title: 'Makro Risk Süreci',
      phases: [
        {
          name: '1. Risk Exposure Audit',
          duration: '2 hafta',
          description:
            'P&L + Balance Sheet üzerinde makro değişken duyarlılığı; FX/faiz/komodite exposure haritası.',
        },
        {
          name: '2. Scenario Workshop',
          duration: '2 hafta',
          description: 'CFO ile 4 senaryo: base, bull, bear, shock. Olasılık atama.',
        },
        {
          name: '3. Hedge & Pricing Strategy',
          duration: '3 hafta',
          description: 'Hedge enstrüman seçimi (banka quote review), pricing formülü.',
        },
        {
          name: '4. Forecast Model Build',
          duration: '3 hafta',
          description: '13-hafta + 24-ay finansal model (Excel/Power BI). Sensitivite analizi.',
        },
        {
          name: '5. Aylık Briefing Sistemi',
          duration: 'Devam eden',
          description: 'Aylık makro raporu, scenario revize, action triggers.',
        },
      ],
    },
    deliverables: {
      title: 'Teslim Edilen Çıktılar',
      artifacts: [
        'Risk Exposure Raporu',
        '4-Senaryo Matrisi + Olasılık',
        'Hedge Strateji Dokümanı',
        'Pricing Formülü (enflasyon pass-through)',
        '13-Hafta + 24-Ay Forecast Modeli',
        'Aylık C-Level Makro Briefing (template)',
      ],
    },
    timeline: {
      totalDuration: 'İlk faz 10-12 hafta · Aylık briefing 6-12 ay opsiyonel',
      milestones: [
        { name: 'Exposure audit', week: 'Hafta 2' },
        { name: 'Senaryolar onaylandı', week: 'Hafta 4' },
        { name: 'Hedge stratejisi', week: 'Hafta 7' },
        { name: 'Forecast model live', week: 'Hafta 10' },
        { name: 'İlk aylık briefing', week: 'Hafta 12' },
      ],
    },
    investment: {
      range: '₺180.000 – ₺450.000 + aylık briefing ₺25.000-50.000',
      model: 'İlk faz sabit fiyat. Aylık briefing ortaklık modeli.',
      paymentPlan: '%50 başlangıç, %50 forecast model handoff. Briefing ortaklığı aylık.',
    },
    trust: {
      anonymizedExample:
        'İthalata bağımlı orta-ölçek üretici için 10 haftalık makro engagement. Önceki yıl FX şokundan ₺22M zarar yaşanmıştı. Hedge stratejisi (natural + forward kombinasyonu) + dinamik pricing kuruldu. Sonraki 12 ayda FX volatilitesine rağmen marjin %2.4 koruma.',
    },
    faq: {
      items: [
        {
          q: 'Banka treasury ekibim varsa yine ihtiyacım var mı?',
          a: "Treasury enstrüman execution'da uzman; biz strateji + scenario + organizasyon ortak çalışıyoruz. Tamamlayıcı rolde.",
        },
        {
          q: 'Tek banka mı çoklu banka mı?',
          a: "Counterparty risk için 3-5 banka önerilir. Hedge instrument quote'larını karşılaştırma engagement parçası.",
        },
        {
          q: 'Yatırım kararı veriyor musunuz?',
          a: 'Hayır, regulated investment advice vermiyoruz. Stratejik karar destek + sceanrio analiz veriyoruz.',
        },
        ...SHARED_FAQ_END('macro-risk'),
      ],
    },
    related: ['strategic-transformation', 'crisis-management', 'mergers-acquisitions'],
    assessment: STANDARD_ASSESSMENT('macro-risk', 'Makro Risk Yönetimi'),
  },

  // ─────────────────────────────────────────────────────────────
  // S14 — COMPETITION ECONOMICS
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'competition-economics',
    hero: {
      title: 'Rekabet Ekonomisi & Regülasyon',
      subtitle:
        'Antitröst incelemeleri, pazar hakimiyeti analizleri ve regülasyon uyum danışmanlığı.',
      valueProp:
        'Rekabet Kurumu / EU Commission soruşturmalarında ekonomik analiz; M&A bildirim öncesi antitröst risk değerlendirmesi.',
      primaryCtaText: 'Antitröst Risk Audit',
    },
    problem: {
      title: 'Rekabet Hukuku Cephesinde Karşılaşılan Sorunlar',
      painPoints: [
        'Rekabet Kurumu soruşturması açıldı; ekonomik analiz / market definition desteği gerekiyor.',
        'M&A işlemi öncesi konsantrasyon analizi yapılmadı; bildirim sonrası gecikme veya red riski.',
        'Hakim durum (dominance) sınırı belirsiz; sektörde >%40 pay endişe yaratıyor.',
        'Dağıtım anlaşmalarında dikey kısıtlama (resale price maintenance, exclusive dealing) analizi eksik.',
        'AB pazarına ihracatta GVH (German competition), CMA (UK) bildirim eşikleri belirsiz.',
      ],
    },
    outcomes: {
      title: 'Engagement Çıktıları',
      results: [
        'Market definition + market shares ekonomik analizi.',
        'Konsantrasyon (HHI) / hakim durum değerlendirmesi.',
        'M&A antitröst bildirim risk raporu.',
        'Dağıtım anlaşmaları compliance review.',
        'Soruşturma dosyası ekonomik savunma notu.',
      ],
    },
    methodology: {
      title: 'Rekabet Ekonomisi Süreci',
      phases: [
        {
          name: '1. Case Discovery',
          duration: '1 hafta',
          description: 'Soruşturma / işlem detayları, mevcut hukuki danışmanla koordinasyon.',
        },
        {
          name: '2. Market Definition',
          duration: '2 hafta',
          description: 'SSNIP test, ürün + coğrafi pazar tanımlama, ekonomik veri toplama.',
        },
        {
          name: '3. Concentration / Effects Analysis',
          duration: '2-3 hafta',
          description: 'HHI hesabı, dominance kriterleri, fiyat/innovation etki analizi.',
        },
        {
          name: '4. Ekonomik Savunma Notu',
          duration: '2 hafta',
          description: "Rekabet Kurumu / Komisyon'a sunulacak ekonomik argümanların yazımı.",
        },
        {
          name: '5. Hearing Support',
          duration: 'Devam eden',
          description: 'Sözlü savunma hazırlık, soru-cevap, expert witness desteği.',
        },
      ],
    },
    deliverables: {
      title: 'Teslim Edilen Çıktılar',
      artifacts: [
        'Market Definition Raporu',
        'Konsantrasyon Analizi (HHI + dominance)',
        'M&A Antitröst Risk Raporu',
        'Ekonomik Savunma Notu',
        'Quantitative Veri Analizi (Stata / R / Excel)',
        'Hearing Hazırlık Paketi',
      ],
    },
    timeline: {
      totalDuration: 'M&A bildirim hazırlık 4-6 hafta · Soruşturma destek 6-18 ay',
      milestones: [
        { name: 'Case discovery', week: 'Hafta 1' },
        { name: 'Market definition', week: 'Hafta 3' },
        { name: 'Effects analizi', week: 'Hafta 6' },
        { name: 'Savunma notu teslim', week: 'Hafta 8' },
      ],
    },
    investment: {
      range: '₺250.000 – ₺1.500.000+ (case kompleksitesine göre)',
      model: 'Sabit fiyat (phase-based) + saat-bazlı top-up (hearing/savunma).',
      paymentPlan:
        'Faz-bazlı: %25 discovery + market def, %35 effects, %25 savunma notu, %15 hearing.',
    },
    trust: {
      anonymizedExample:
        'FMCG sektöründe yatay birleşme bildirim hazırlık. HHI analizinde post-merger 1850 (eşik 2000), market definition narrow → broad genişletildi (ikame ürün dahil). Bildirim koşulsuz onay aldı, 4 ay timeline 3 ay.',
    },
    faq: {
      items: [
        {
          q: 'Hukuk firması yerine sizinle mi çalışmalıyım?',
          a: 'Hayır, birlikte. Rekabet hukuku avukatları hukuki yorum + savunmayı yapar; biz ekonomik analiz + quantitative argüman üretiriz. Tamamlayıcı.',
        },
        {
          q: 'Hangi yargı yetki alanı?',
          a: 'Türkiye (Rekabet Kurumu), AB (Komisyon + ulusal otoriteler), UK (CMA), US (FTC/DOJ — bağımsız ABD ekonomist partner).',
        },
        {
          q: 'Expert witness olarak duruşmada çıkıyor musunuz?',
          a: 'Senior ekibimiz ekonomist expert witness rolünde duruşmaya katılabilir; case bazlı değerlendirilir.',
        },
        ...SHARED_FAQ_END('competition-economics'),
      ],
    },
    related: ['mergers-acquisitions', 'macro-risk', 'government-relations'],
    assessment: STANDARD_ASSESSMENT('competition-economics', 'Rekabet Ekonomisi'),
  },

  // ─────────────────────────────────────────────────────────────
  // S15 — INDUSTRIAL RELATIONS
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'industrial-relations',
    hero: {
      title: 'Endüstriyel İlişkiler & Sendika',
      subtitle:
        'Toplu iş sözleşmesi müzakereleri, sendikal ilişkiler yönetimi ve çalışma barışının korunması.',
      valueProp:
        'Toplu sözleşme dönemlerinde sendika ile yapılandırılmış müzakere; çalışma barışını korurken işveren maliyet zarfı içinde tutar.',
      primaryCtaText: 'Müzakere Stratejisi',
    },
    problem: {
      title: 'Endüstriyel İlişkilerde Yapısal Zorluklar',
      painPoints: [
        'Toplu sözleşme dönemi yaklaşıyor; sendika talepleri ile mali kapasite arasında uçurum.',
        'Önceki dönemlerdeki anlaşmalar precedent oluşturmuş; pazarlık marjı daraldı.',
        'Çalışan sirkülasyonu sendikal motivasyona dönüştü; iş yavaşlatma riski.',
        'İşçi sağlığı + güvenlik dosyası SGK / Çalışma Bakanlığı denetiminde risk taşıyor.',
        'Sendika dışı temsilci ekibi formal yapı değil; iletişim asimetrik.',
      ],
    },
    outcomes: {
      title: 'Engagement Çıktıları',
      results: [
        'Mali kapasite analizi (zarf modeli).',
        'Müzakere strateji notu (BATNA, walk-away).',
        "Sözleşme metin draft'ı (taraflara nötr taslak).",
        'Çalışma barışı KPI sistemi (post-anlaşma).',
        'İşçi sağlığı/güvenlik compliance audit.',
      ],
    },
    methodology: {
      title: 'TİS Müzakere Süreci',
      phases: [
        {
          name: '1. Diagnostic',
          duration: '2 hafta',
          description: "Önceki TİS'ler review, mali kapasite analizi, sendika talep haritası.",
        },
        {
          name: '2. Müzakere Strateji',
          duration: '2 hafta',
          description: 'BATNA, walk-away, sıra (sequence) planlama, takım rolleri.',
        },
        {
          name: '3. Pre-müzakere Hazırlık',
          duration: '2 hafta',
          description: 'Senaryo tatbikatı, soru-cevap, ekonomik veri paketi.',
        },
        {
          name: '4. Müzakere Oturumları Desteği',
          duration: '4-12 hafta',
          description: 'Oturum öncesi briefing, oturum gözlem, taktik revize.',
        },
        {
          name: '5. Post-Anlaşma Implementation',
          duration: '4 hafta',
          description: 'Sözleşme uygulamasının operasyona yansıması; çalışma barışı KPI sistemi.',
        },
      ],
    },
    deliverables: {
      title: 'Teslim Edilen Çıktılar',
      artifacts: [
        'Mali Kapasite Analizi',
        'Müzakere Strateji Notu (gizli)',
        'BATNA + Walk-away Senaryoları',
        'Sözleşme Taslak Metin',
        'Çalışma Barışı KPI Dashboard',
        'İSG Compliance Audit Raporu',
      ],
    },
    timeline: {
      totalDuration: '12-20 hafta (TİS süresi boyunca aktif)',
      milestones: [
        { name: 'Diagnostic', week: 'Hafta 2' },
        { name: 'Strateji onaylandı', week: 'Hafta 4' },
        { name: 'İlk oturum', week: 'Hafta 6' },
        { name: 'Anlaşma', week: 'Hafta 14-18' },
        { name: 'Implementation handoff', week: 'Hafta 20' },
      ],
    },
    investment: {
      range: '₺200.000 – ₺600.000',
      model: 'Sabit fiyat (faz-bazlı).',
      paymentPlan: '%30 strateji, %50 oturum desteği, %20 implementation.',
    },
    trust: {
      anonymizedExample:
        'Otomotiv yan sanayi (520 çalışan) TİS müzakere desteği, 14 hafta. Sendika talebi ücret %72 zam; mali kapasite max %38 izin veriyordu. Müzakerede non-cash benefits (vardiya bonus + yemek + servis) ile total reward %44 paketi olarak konsolide edildi; çalışma barışı korundu, iş yavaşlatma yaşanmadı.',
    },
    faq: {
      items: [
        {
          q: 'Sendika ile direkt görüşüyor musunuz?',
          a: 'Hayır, işveren tarafının danışmanıyız. Müzakere oturumunda işveren temsilcileri masada; biz arka odada strateji destek.',
        },
        {
          q: 'Hukuk firması ile birlikte mi?',
          a: 'Evet, hukuki konularda iş hukuku avukatınız primary; biz ekonomik analiz + müzakere taktik destek.',
        },
        {
          q: 'Çalışan tarafına da çalışıyor musunuz?',
          a: 'Hayır, conflict-of-interest. Sadece işveren tarafında.',
        },
        ...SHARED_FAQ_END('industrial-relations'),
      ],
    },
    related: ['hr-transformation', 'payroll-audit', 'crisis-management'],
    assessment: STANDARD_ASSESSMENT('industrial-relations', 'Endüstriyel İlişkiler'),
  },

  // ─────────────────────────────────────────────────────────────
  // S16 — PAYROLL AUDIT
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'payroll-audit',
    hero: {
      title: 'Bordro Denetimi & İstihdam Teşvikleri',
      subtitle:
        'SGK prim teşviklerinden maksimum yararlanma, maliyet optimizasyonu ve bordro risk denetimi.',
      valueProp:
        "Bordro maliyetinin %5-15'ini geri kazandırır; SGK / İş-Kur teşvik uygulamalarındaki boşlukları sistematik kapatır.",
      primaryCtaText: 'Bordro Optimizasyon Audit',
    },
    problem: {
      title: 'Bordro & İstihdam Teşvik Sorunları',
      painPoints: [
        '5510 / 4447 / 6111 sayılı kanun teşviklerinin uygulanmasında boşluk var.',
        'Kıdem tazminatı, ihbar, çalışma süresi hesaplamalarında risk taşıyan adımlar var.',
        'İş-Kur teşviklerinden (yeni istihdam, engelli, kadın) sistematik faydalanılmıyor.',
        'Bordro hatası SGK denetiminde geriye dönük 5 yıl ceza riski oluşturuyor.',
        'BES / dijital dönüşüm teşvikleri kayıt dışı kalıyor.',
      ],
    },
    outcomes: {
      title: 'Engagement Çıktıları',
      results: [
        'Bordro retroaktif denetim raporu (12-24 ay).',
        'Teşvik kayıp/eksik raporu + telafi başvurusu.',
        'SGK risk haritası (kıdem, ihbar, çalışma süresi).',
        'Aylık teşvik checkup süreci tasarımı.',
        'Bordro otomasyon iyileştirme önerileri.',
      ],
    },
    methodology: {
      title: 'Bordro Audit Süreci',
      phases: [
        {
          name: '1. Bordro Veri Toplama',
          duration: '2 hafta',
          description: 'Son 24 ayın bordro çıktıları, SGK bildirgeleri, sözleşmeler.',
        },
        {
          name: '2. Teşvik Audit',
          duration: '3 hafta',
          description: 'Her teşvik kanunu için uygulanma durumu kontrol; eksik/yanlış başvurular.',
        },
        {
          name: '3. Bordro Hesaplama Audit',
          duration: '2 hafta',
          description: 'Kıdem, ihbar, fazla mesai, izin hesaplamalarında metodoloji uygunluğu.',
        },
        {
          name: '4. Telafi Başvuruları',
          duration: '2-4 hafta',
          description: 'Geriye dönük teşvik düzeltme başvuruları, SGK iletişimi.',
        },
        {
          name: '5. Süreç İyileştirme',
          duration: '2 hafta',
          description: 'Aylık teşvik checkup, bordro otomasyon önerileri, eğitim.',
        },
      ],
    },
    deliverables: {
      title: 'Teslim Edilen Çıktılar',
      artifacts: [
        'Bordro Audit Raporu (24 ay)',
        'Teşvik Eksik Raporu + Tutar',
        'Telafi Başvuru Paketleri',
        'SGK Risk Haritası',
        'Aylık Teşvik Checkup Süreç Şablonu',
        'Bordro Otomasyon İyileştirme Listesi',
      ],
    },
    timeline: {
      totalDuration: '10-13 hafta',
      milestones: [
        { name: 'Veri toplama', week: 'Hafta 2' },
        { name: 'Teşvik audit', week: 'Hafta 5' },
        { name: 'Bordro hesaplama audit', week: 'Hafta 7' },
        { name: 'Telafi başvurular', week: 'Hafta 10' },
        { name: 'Süreç handoff', week: 'Hafta 12' },
      ],
    },
    investment: {
      range: '₺85.000 – ₺250.000 + opsiyonel success fee',
      model: "Sabit fiyat + opsiyonel success fee (telafi edilen teşvik tutarın %10'u).",
      paymentPlan: '%50 başlangıç, %50 audit raporu sonrası. Success fee yeniden hesap sonrası.',
    },
    trust: {
      anonymizedExample:
        'Gıda üretici (380 çalışan) için 11 haftalık bordro audit. 24 aylık teşvik uygulamasında ₺1.4M eksik tespit edildi; SGK düzeltme başvurusuyla ₺980k geri alındı. Aylık teşvik checkup süreç İK ekibine handoff.',
    },
    faq: {
      items: [
        {
          q: 'SMMM / mali müşavir varsa yine ihtiyacım var mı?',
          a: "SMMM bordro execution yapar; biz audit + teşvik optimization layer'ı. Genelde 2-3 yılda bir audit faydalı (mevzuat değişimi sıklığı).",
        },
        {
          q: 'Geriye dönük kaç yıl?',
          a: 'SGK 5 yıl, vergi 5 yıl zamanaşımı. Pratikte son 2-3 yıl audit yeterli.',
        },
        {
          q: 'Süreç sonrası destek var mı?',
          a: 'Aylık teşvik takip ortaklığı (₺8-15k/ay) opsiyoneldir; mevzuat değişiminde otomatik notify.',
        },
        ...SHARED_FAQ_END('payroll-audit'),
      ],
    },
    related: ['hr-transformation', 'industrial-relations', 'investment-incentives'],
    assessment: STANDARD_ASSESSMENT('payroll-audit', 'Bordro Optimizasyonu'),
  },

  // ─────────────────────────────────────────────────────────────
  // S17 — EMPLOYER BRANDING
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'employer-branding',
    hero: {
      title: 'Yetenek Yönetimi & İşveren Markası',
      subtitle:
        'Nitelikli işgücünü çekmek ve elde tutmak için stratejik işveren markası (Employer Branding) tasarımı.',
      valueProp:
        "İşveren değer önerisini (EVP) data + insight ile inşa eder; recruitment cost ve turnover'ı düşürürken çalışan engagement'ı artırır.",
      primaryCtaText: 'EVP Diagnostic',
    },
    problem: {
      title: 'Employer Brand Cephesinde Karşılaşılan Sorunlar',
      painPoints: [
        'Yetenek havuzu daralıyor; pozisyon dolma süresi 60+ gün, kalite düşüyor.',
        "Glassdoor / LinkedIn reviews'da ortalama puan 3.2; rakipler 4.0+.",
        'Recruiter pipeline sürekli aktif ama close oranı düşük (offer accept <%60).',
        'EVP (employer value proposition) yazılı değil; pazarlama mesajları tutarsız.',
        'New hire onboarding 6 ay sonra %30+ turnover yaratıyor.',
      ],
    },
    outcomes: {
      title: 'Engagement Çıktıları',
      results: [
        'EVP dokümanı + key messaging (rol bazlı).',
        'Employer brand audit (mevcut algı + hedef gap).',
        'Recruitment marketing 12-aylık takvim.',
        'Onboarding 90-günlük journey redesign.',
        'Çalışan referral programı + advocacy framework.',
      ],
    },
    methodology: {
      title: 'Employer Brand Süreci',
      phases: [
        {
          name: '1. Audit & Diagnostic',
          duration: '3 hafta',
          description:
            'Mevcut algı (çalışan + aday survey), Glassdoor/LinkedIn review, rakip benchmark.',
        },
        {
          name: '2. EVP Workshop',
          duration: '2 hafta',
          description:
            'Üst yönetim + İK + pazarlama workshop; "neden bizde çalışmalı" çekirdek hikaye.',
        },
        {
          name: '3. Brand Codifying',
          duration: '3 hafta',
          description: 'EVP key messaging, görsel kimlik, rol bazlı pazarlama paketleri.',
        },
        {
          name: '4. Recruitment Marketing Launch',
          duration: '4 hafta',
          description: 'LinkedIn / Glassdoor / company website kampanya kurulumu, content takvimi.',
        },
        {
          name: '5. Onboarding Redesign',
          duration: '3 hafta',
          description:
            "90-günlük journey, milestone'lar, manager enablement, çalışan refer programı.",
        },
      ],
    },
    deliverables: {
      title: 'Teslim Edilen Çıktılar',
      artifacts: [
        'EVP Dokümanı + Key Messaging',
        'Employer Brand Audit Raporu',
        'Recruitment Marketing 12-Aylık Takvim',
        'Glassdoor / LinkedIn Optimization Guide',
        '90-Günlük Onboarding Journey Map',
        'Çalışan Referral Programı Tasarımı',
      ],
    },
    timeline: {
      totalDuration: '14-16 hafta',
      milestones: [
        { name: 'Audit', week: 'Hafta 3' },
        { name: 'EVP onaylandı', week: 'Hafta 5' },
        { name: 'Brand paketleri hazır', week: 'Hafta 8' },
        { name: 'Recruitment kampanya canlı', week: 'Hafta 12' },
        { name: 'Onboarding handoff', week: 'Hafta 15' },
      ],
    },
    investment: {
      range: '₺180.000 – ₺450.000',
      model: 'Sabit fiyat. Medya satın alma (Linkedin Recruiter, Glassdoor ads) müşteri hesabında.',
      paymentPlan: '%25 audit, %35 EVP/brand, %25 launch, %15 onboarding.',
    },
    trust: {
      anonymizedExample:
        'Teknoloji şirketi (130 çalışan) için 15 haftalık engagement. Yazılım geliştirici pozisyon dolma süresi 78 gün → 32 gün, offer accept oranı %52 → %78. Glassdoor 3.1 → 4.2 (8 ay).',
    },
    faq: {
      items: [
        {
          q: 'EVP "marka pazarlaması" mı?',
          a: 'Daha geniş. EVP, çalışan deneyimi gerçeğini de değiştirir (kültür, kariyer, ödül). Pazarlama dış katmanı; engagement içeride başlar.',
        },
        {
          q: "Glassdoor review'ları yönetebilir miyiz?",
          a: 'Manipülasyon yasak. Doğru taktik: sahte değil, gerçek çalışan deneyimini iyileştirmek, mevcut çalışanları organik referans için aktive etmek.',
        },
        {
          q: 'Recruitment agency ile çakışıyor mu?',
          a: "Hayır. Agency execution yapar; biz strateji + brand katmanı kurarız. Agency'nin kullandığı materyal kaliteli olur.",
        },
        ...SHARED_FAQ_END('employer-branding'),
      ],
    },
    related: ['hr-transformation', 'neuromarketing', 'family-business'],
    assessment: STANDARD_ASSESSMENT('employer-branding', 'İşveren Markası'),
  },

  // ─────────────────────────────────────────────────────────────
  // S18 — MARKET ENTRY
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'market-entry',
    hero: {
      title: 'Uluslararası Pazara Giriş & İhracat',
      subtitle: 'Hedef pazar araştırması, distribütör bulma ve Turquality hazırlık süreçleri.',
      valueProp:
        'İhracatçı şirket için 2-3 hedef pazarda go-to-market stratejisi: distribütör havuzu + Turquality başvurusu + ihracat finansman.',
      primaryCtaText: 'Pazar Giriş Görüşmesi',
    },
    problem: {
      title: 'İhracat & Pazar Giriş Cephesinde Zorluklar',
      painPoints: [
        'İhracat çoğrafyamız 1-2 pazarda yoğunlaşmış; diversification riski yüksek.',
        'Hedef pazar seçimi sezgisel; sistematik fizibilite çalışması eksik.',
        'Distribütör bulma sürecinde 6-12 ay kayboluyor; kalite belirsiz.',
        'Turquality programı geleceği kapı ama başvuru kompleks.',
        'AB pazarına CE marking + sektörel sertifikasyonlar (CE, FDA, USDA) eksik.',
      ],
    },
    outcomes: {
      title: 'Engagement Çıktıları',
      results: [
        'Hedef pazar fizibilite raporu (3 pazar karşılaştırması).',
        'Distribütör seçim kriterleri + qualified list.',
        'Go-to-market plan (lansman + ilk 12 ay).',
        'Turquality başvuru paketi (uygunsa).',
        'İhracat finansman stratejisi (Eximbank, AB, ECA).',
      ],
    },
    methodology: {
      title: 'Pazar Giriş Süreci',
      phases: [
        {
          name: '1. Strategic Diagnostic',
          duration: '2 hafta',
          description: 'Ürün + sektör fit, ihracat kapasitesi, organizasyonel hazırlık.',
        },
        {
          name: '2. Pazar Tarama',
          duration: '4 hafta',
          description: '10-15 hedef pazar fizibilite; küçültme 3 finaliste.',
        },
        {
          name: '3. Deep Dive 3 Pazar',
          duration: '4-6 hafta',
          description: 'Distribütör havuzu, regülasyon, rekabet, fiyatlandırma, tedarik chain.',
        },
        {
          name: '4. Go-to-Market Plan',
          duration: '3 hafta',
          description: 'Lansman planı, sales channel, brand adaptation, finansal model.',
        },
        {
          name: '5. Distribütör Match + Turquality',
          duration: '4-8 hafta',
          description: 'Distribütör görüşmeleri + LOI desteği; Turquality başvuru hazırlık.',
        },
      ],
    },
    deliverables: {
      title: 'Teslim Edilen Çıktılar',
      artifacts: [
        'Strategic Diagnostic Raporu',
        'Pazar Tarama + Top 3 Fizibilite',
        'Distribütör Qualified List + Outreach Şablonu',
        'Go-to-Market Plan (3 yıllık finansal model)',
        'Turquality Başvuru Paketi',
        'İhracat Finansman Roadmap',
      ],
    },
    timeline: {
      totalDuration: '17-23 hafta',
      milestones: [
        { name: 'Diagnostic', week: 'Hafta 2' },
        { name: 'Top 3 pazar', week: 'Hafta 6' },
        { name: 'Deep dive raporu', week: 'Hafta 12' },
        { name: 'GTM plan', week: 'Hafta 15' },
        { name: 'İlk distribütör LOI', week: 'Hafta 20' },
      ],
    },
    investment: {
      range: '₺250.000 – ₺650.000',
      model: 'Sabit fiyat. Saha ziyareti + seyahat müşteri hesabında.',
      paymentPlan: '%20 diagnostic, %30 tarama, %30 deep dive + GTM, %20 distribütör + Turquality.',
    },
    trust: {
      anonymizedExample:
        "Gıda işleme şirketi için 20 haftalık market-entry engagement. Mısır + Birleşik Arap Emirlikleri + Almanya finaliste indi; ilk 18 ayda Mısır + Almanya'da distribütör atandı, ihracat ciro 2 katına çıktı. Turquality başvurusu engagement bitimi + 6 ay sonra onaylandı.",
    },
    faq: {
      items: [
        {
          q: 'Hangi pazarlara odaklanıyorsunuz?',
          a: 'AB ülkeleri, ME (Mısır, Suudi, BAE), Afrika (Mısır, Fas, Nijerya), Orta Asya (Özbekistan, Kazakistan), Balkanlar.',
        },
        {
          q: 'Distribütör buluyor musunuz yoksa sadece danışmanlık?',
          a: 'Aktif olarak Distribütör havuzunu tarar, görüşmeleri organize ederiz. Final seçim ve sözleşme müşteriye ait.',
        },
        {
          q: 'Turquality başvurusunu yapıyor musunuz?',
          a: "Başvuru dosyasını hazırlıyoruz. Onay süreci Ticaret Bakanlığı'na ait. Engagement sonu success fee opsiyonel.",
        },
        ...SHARED_FAQ_END('market-entry'),
      ],
    },
    related: ['global-intelligence', 'investment-incentives', 'esg-strategy'],
    assessment: STANDARD_ASSESSMENT('market-entry', 'Uluslararası Pazara Giriş'),
  },

  // ─────────────────────────────────────────────────────────────
  // S19 — GLOBAL INTELLIGENCE
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'global-intelligence',
    hero: {
      title: 'Global Diplomasi & Ticari İstihbarat',
      subtitle: 'Jeopolitik risk haritaları, ticari istihbarat ve devletlerarası kriz senaryoları.',
      valueProp:
        'Sınır-aşırı iş yapan şirketler için aylık geopolitik briefing + risk-event simülasyonu; Rusya-Ukrayna, ABD-Çin, AB-Türkiye gibi gerilim eksenlerinde stratejik karar destek.',
      primaryCtaText: 'Geopolitik Briefing',
    },
    problem: {
      title: 'Geopolitik Risk & Ticari İstihbarat Cephesinde Zorluklar',
      painPoints: [
        'Yaptırım rejimleri (US OFAC, EU, UK) sürekli değişiyor; compliance gap riski yüksek.',
        'Tedarik zinciri konsantrasyonu tek ülke / tek koridorda yoğunlaşmış (Çin, Süveyş).',
        'Müşteri / partner ülke riski (sovereign rating, FX rejim) bütçeye yansımıyor.',
        'Devlet ihalelerinde diplomatik faktör ağırlığı bilinmiyor.',
        'Kriz tatbikatları sadece operasyonel; siyasi/diplomatik boyut eksik.',
      ],
    },
    outcomes: {
      title: 'Engagement Çıktıları',
      results: [
        'Geopolitik risk haritası (15-25 ülke).',
        'Sanctions compliance audit (US OFAC, EU, UK).',
        'Tedarik zinciri ülke konsantrasyon analizi.',
        'Çeyreklik geopolitik briefing rapor.',
        'Senaryo-bazlı kriz simülasyonu tatbikatı.',
      ],
    },
    methodology: {
      title: 'Geopolitik İstihbarat Süreci',
      phases: [
        {
          name: '1. Strategic Exposure Audit',
          duration: '3 hafta',
          description: 'Ülke / koridor / partner exposure haritalama; sanctions risk evaluasyonu.',
        },
        {
          name: '2. Sanctions Compliance',
          duration: '3 hafta',
          description:
            'US OFAC, EU, UK sanctions screening, müşteri/tedarikçi due diligence süreç tasarımı.',
        },
        {
          name: '3. Tedarik Zinciri Diversification',
          duration: '4 hafta',
          description:
            'Tek-noktada konsantrasyonun değerlendirilmesi; alternative coğrafya/partner analizi.',
        },
        {
          name: '4. Çeyreklik Briefing Sistemi',
          duration: 'Devam eden',
          description: 'Quarterly geopolitik briefing, sektör + ülke spesifik.',
        },
        {
          name: '5. Kriz Simülasyonu',
          duration: '2 hafta',
          description:
            'Tabletop exercise: Rusya-Ukrayna, ABD-Çin, AB-Türkiye senaryolarında karar tatbikatı.',
        },
      ],
    },
    deliverables: {
      title: 'Teslim Edilen Çıktılar',
      artifacts: [
        'Geopolitik Risk Haritası (15-25 ülke)',
        'Sanctions Compliance Audit Raporu',
        'Sanctions Screening Süreç Şablonu',
        'Tedarik Zinciri Diversification Yol Haritası',
        'Çeyreklik Briefing Raporları',
        'Kriz Simülasyonu Tabletop Recording + Lessons',
      ],
    },
    timeline: {
      totalDuration: 'İlk faz 12-14 hafta · Çeyreklik briefing ortaklığı 12+ ay',
      milestones: [
        { name: 'Exposure audit', week: 'Hafta 3' },
        { name: 'Sanctions compliance live', week: 'Hafta 6' },
        { name: 'Diversification yol haritası', week: 'Hafta 10' },
        { name: 'İlk briefing', week: 'Hafta 12' },
        { name: 'Tatbikat tamamlandı', week: 'Hafta 14' },
      ],
    },
    investment: {
      range: 'İlk faz ₺220.000 – ₺550.000 + çeyreklik briefing ₺35.000-65.000',
      model: 'İlk faz sabit fiyat + çeyreklik briefing ortaklığı.',
      paymentPlan: '%50 başlangıç, %50 ilk faz handoff. Briefing ortaklığı çeyreklik.',
    },
    trust: {
      anonymizedExample:
        "Çelik üretici (450 çalışan, %70 ihracat) için 13 haftalık engagement + 4 çeyreklik briefing ortaklığı. Rusya hammadde bağımlılığı 2022 sonrası %48 idi, 18 ayda %12'ye indirildi (Türkiye + Ukrayna alternatifi). Sanctions screening süreç implementasyonu sayesinde 2 müşteri başvurusu compliance riski tespit edildi.",
    },
    faq: {
      items: [
        {
          q: 'Hangi ülkeler / bölgeler kapsamda?',
          a: 'Türkiye odaklı: AB, ME, Rusya-CIS, Orta Asya, Afrika kuzey-batı, ABD compliance perspektifinden. Asya-Pasifik isteğe bağlı.',
        },
        {
          q: 'Sanctions ihlali oluştuysa ne yaparsınız?',
          a: 'Önce kontrol: gerçekten ihlal mi yoksa risk algılaması mı. Gerçek ihlal hukuki tavsiye + yetkili otoritelere remediation. Biz strateji, hukuki yorum avukatla.',
        },
        {
          q: 'Devlet ihalelerinde danışmanlık veriyor musunuz?',
          a: 'Stratejik konteksti analiz ederiz (rekabet, diplomatik faktör). Lobby + temsil için /services/government-relations.',
        },
        ...SHARED_FAQ_END('global-intelligence'),
      ],
    },
    related: ['market-entry', 'macro-risk', 'competition-economics'],
    assessment: STANDARD_ASSESSMENT('global-intelligence', 'Geopolitik İstihbarat'),
  },

  // ─────────────────────────────────────────────────────────────
  // S20 — SMART CITIES
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'smart-cities',
    hero: {
      title: 'Akıllı Şehirler & Kamu Politikaları',
      subtitle:
        'Yerel yönetimler için dijital şehircilik stratejileri ve etki analizi raporlaması.',
      valueProp:
        'Belediye ve büyükşehir yönetimlerinde dijital dönüşüm yol haritası: vatandaş hizmetleri, ulaşım, enerji, atık, güvenlik için akıllı şehir mimarisi.',
      primaryCtaText: 'Smart City Audit',
    },
    problem: {
      title: 'Yerel Yönetimde Dijital Dönüşüm Zorlukları',
      painPoints: [
        'Belediye 8-12 SaaS aracı satın aldı ama silos; vatandaş tek noktadan hizmet alamıyor.',
        'Açık veri portalı var ama düşük kalitede; gerçek karar destek üretmiyor.',
        'IoT sensor projeleri (akıllı park, atık, hava kalitesi) pilot fazda kaldı.',
        'Stratejik plan 5-yıllık ama dijital dönüşüm bölümü genel; ölçüm metriği yok.',
        'AB ve TÜBİTAK hibe çağrılarına başvuruda kalite eksik.',
      ],
    },
    outcomes: {
      title: 'Engagement Çıktıları',
      results: [
        'Akıllı şehir maturity skoru (6 boyut).',
        '3-5 yıllık dijital strateji yol haritası.',
        'Vatandaş hizmetleri tek-noktası (omnichannel) tasarımı.',
        'IoT/sensör yatırım önceliklendirme.',
        'Hibe başvuru pipeline (AB, TÜBİTAK, Sanayi).',
      ],
    },
    methodology: {
      title: 'Smart City Süreci',
      phases: [
        {
          name: '1. Maturity Assessment',
          duration: '3 hafta',
          description:
            'Mevcut dijital varlıklar, ekosistem analizi, vatandaş beklentisi araştırması.',
        },
        {
          name: '2. Strategy Workshop',
          duration: '2 hafta',
          description: "Yönetim + müdürlüklerle workshop'lar; vizyon + öncelik haritası.",
        },
        {
          name: '3. Roadmap & Architecture',
          duration: '4 hafta',
          description: 'Teknoloji mimarisi, vendor strateji, faz-bazlı yatırım planı.',
        },
        {
          name: '4. Pilot Tasarımı',
          duration: '3 hafta',
          description: '1-2 pilot project (örn: smart waste, citizen portal) için detay tasarım.',
        },
        {
          name: '5. Hibe Başvuruları',
          duration: '4 hafta',
          description: 'AB Horizon, TÜBİTAK, Sanayi Bakanlığı başvuru paketleri.',
        },
      ],
    },
    deliverables: {
      title: 'Teslim Edilen Çıktılar',
      artifacts: [
        'Smart City Maturity Raporu',
        '3-5 Yıllık Dijital Strateji',
        'Teknoloji Mimarisi Dokümanı',
        'Vatandaş Hizmetleri Omnichannel Tasarım',
        '1-2 Pilot Project Detay Plan',
        'AB / TÜBİTAK / Sanayi Hibe Başvuruları',
      ],
    },
    timeline: {
      totalDuration: '14-18 hafta',
      milestones: [
        { name: 'Maturity', week: 'Hafta 3' },
        { name: 'Strateji onaylandı', week: 'Hafta 5' },
        { name: 'Mimari hazır', week: 'Hafta 9' },
        { name: 'Pilot detay', week: 'Hafta 12' },
        { name: 'Hibe başvuruları gönderildi', week: 'Hafta 16' },
      ],
    },
    investment: {
      range: '₺250.000 – ₺700.000',
      model: 'Sabit fiyat. Pilot proje implementation müşteri tedarikçisinde.',
      paymentPlan: '%25 maturity, %30 strateji, %30 mimari + pilot, %15 hibe.',
    },
    trust: {
      anonymizedExample:
        'Anadolu büyükşehir belediye için 16 haftalık smart city engagement. Vatandaş portalı omnichannel redesign (web + mobile + WhatsApp) + akıllı atık IoT pilot 3 bölge. AB Horizon Europe hibe başvurusu kabul (€1.4M).',
    },
    faq: {
      items: [
        {
          q: 'Hangi belediye ölçeği için uygun?',
          a: 'İl + büyükşehir + 100k+ nüfuslu ilçe belediyeleri için ideal. Küçük belediyeler için adapted scope.',
        },
        {
          q: 'Vendor seçiyor musunuz?',
          a: 'Vendor-agnostic; mimari ve seçim metodolojisi sağlıyoruz, implementation belediye prosedürü ile ihale ediliyor.',
        },
        {
          q: 'Kamu ihale prosedürleriyle uyumlu mu?',
          a: 'Evet, KİK + Sayıştay denetimi gözeten dokümantasyon sağlanır.',
        },
        ...SHARED_FAQ_END('smart-cities'),
      ],
    },
    related: ['digital-strategy', 'government-relations', 'data-governance'],
    assessment: STANDARD_ASSESSMENT('smart-cities', 'Akıllı Şehirler'),
  },

  // ─────────────────────────────────────────────────────────────
  // S21 — GOVERNMENT RELATIONS
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'government-relations',
    hero: {
      title: 'Kurumsal İlişkiler & Lobicilik (GR)',
      subtitle: 'Ankara ve Brüksel nezdinde paydaş haritalama, mevzuat takibi ve stratejik temsil.',
      valueProp:
        "Sektörünüzü etkileyen mevzuat değişikliklerinde erken sinyal + Ankara/Brüksel'de paydaş haritalama + etik lobicilik desteği.",
      primaryCtaText: 'GR Strateji Görüşmesi',
    },
    problem: {
      title: 'Kurumsal İlişkiler Cephesinde Yapısal Zorluklar',
      painPoints: [
        'Mevzuat değişikliği şirkete 6+ ay önce sinyal vermiyor; reaktif kalıyoruz.',
        'Bakanlık + meclis paydaşları haritalı değil; doğru kapıya nereden gidileceği belirsiz.',
        'Sektör derneği üyeliği var ama temsiliyet zayıf; tek sesle gücümüz az.',
        'Brüksel (AB Komisyon, AP) regülasyonları sektörü etkiliyor ama ilişki yok.',
        'Pozisyon kağıdı (position paper) hazırlamada disiplin eksik.',
      ],
    },
    outcomes: {
      title: 'GR Engagement Çıktıları',
      results: [
        'Stakeholder map (Ankara + Brüksel paydaşları).',
        'Erken sinyal sistemi (regulatory radar).',
        'Sektör position paper portfolio.',
        'Sektör derneği aktivasyon stratejisi.',
        'Aylık GR briefing rapor.',
      ],
    },
    methodology: {
      title: 'GR Süreç Aşamaları',
      phases: [
        {
          name: '1. Diagnostic + Stakeholder Mapping',
          duration: '3 hafta',
          description:
            'Bakanlık + meclis + parti + dernek paydaş haritası; mevcut ilişki seviyesi.',
        },
        {
          name: '2. Regulatory Radar Kurulumu',
          duration: '2 hafta',
          description: 'TBMM + bakanlık + AB Komisyon mevzuat takip sistem tasarımı.',
        },
        {
          name: '3. Position Paper Strateji',
          duration: '3 hafta',
          description: 'Sektör için 3-5 kritik konuda pozisyon kağıdı, mesajlama, sahiplenme.',
        },
        {
          name: '4. İlişki İnşası & Briefing',
          duration: '4-6 hafta',
          description: 'Stratejik görüşme planlaması, brief preparation, randevu desteği.',
        },
        {
          name: '5. Aylık GR Briefing Sistemi',
          duration: 'Devam eden',
          description: 'Aylık mevzuat radar + briefing notu + strateji revize.',
        },
      ],
    },
    deliverables: {
      title: 'Teslim Edilen Çıktılar',
      artifacts: [
        'Stakeholder Map (Ankara + Brüksel)',
        'Regulatory Radar Şablonu + Source List',
        'Position Paper Portfolio (3-5 konu)',
        'Sektör Derneği Aktivasyon Planı',
        'Aylık GR Briefing Rapor',
        'Stratejik Görüşme Brief Kitleri',
      ],
    },
    timeline: {
      totalDuration: 'İlk faz 12-14 hafta · Aylık ortaklık 12+ ay',
      milestones: [
        { name: 'Stakeholder map', week: 'Hafta 3' },
        { name: 'Regulatory radar live', week: 'Hafta 5' },
        { name: 'İlk position paper', week: 'Hafta 8' },
        { name: 'İlk stratejik görüşme', week: 'Hafta 12' },
        { name: 'İlk aylık briefing', week: 'Hafta 14' },
      ],
    },
    investment: {
      range: 'İlk faz ₺220.000 – ₺550.000 + aylık briefing ₺25.000-55.000',
      model: 'İlk faz sabit fiyat + aylık ortaklık (briefing + ad-hoc destek).',
      paymentPlan: '%50 başlangıç, %50 ilk faz handoff. Ortaklık aylık.',
    },
    trust: {
      anonymizedExample:
        "İlaç sektörü orta-ölçek üretici (180 çalışan) için 13 haftalık + 9 aylık ortaklık engagement. SGK ödeme listesi revizyonu için position paper + sektör derneği koordinasyonu sonucu, şirket ürün gruplarının %85'i listede korundu. Ankara + Brüksel paydaşları ile düzenli erken sinyal akışı kuruldu.",
    },
    faq: {
      items: [
        {
          q: 'Lobicilik yasal mı?',
          a: "Türkiye'de lobicilik regülasyonu net değil; etik framework (transparency, no quid pro quo, kayıt) uygulanır. AB'de lobicilik kayıtlı + regulated. Tüm engagement'larda etik çerçeve kritik.",
        },
        {
          q: 'Doğrudan bakana / milletvekiline ulaşıyor musunuz?',
          a: 'Stratejik görüşme planlaması yaparız; ulaşım çoğu zaman dernek + üst düzey CEO eli ile. Eşliği destekleriz, vekaleten konuşmayız.',
        },
        {
          q: 'Hangi sektörlerde deneyim var?',
          a: 'İlaç, gıda, enerji, finans, teknoloji, ulaşım, çevre. Sektör spesifik mevzuat radar farklı kurgulu.',
        },
        ...SHARED_FAQ_END('government-relations'),
      ],
    },
    related: ['competition-economics', 'global-intelligence', 'smart-cities'],
    assessment: STANDARD_ASSESSMENT('government-relations', 'Kurumsal İlişkiler & GR'),
  },
];

export const SERVICE_CONTENT: Record<string, ServiceContent> = Object.fromEntries(
  SERVICE_CONTENT_LIST.map((s) => [s.slug, s]),
);

export function getServiceContent(slug: string): ServiceContent | undefined {
  return SERVICE_CONTENT[slug];
}

export { SHARED_FAQ_END, STANDARD_ASSESSMENT };
