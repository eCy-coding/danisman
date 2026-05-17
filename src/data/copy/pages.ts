// P42: Founder gerçek bilgileriyle güncellendi.
// Image: branded SVG placeholder — gerçek portre eklendiğinde /founder.jpg override edilir.
export const TEAM_COPY = {
  title: { tr: 'Liderlik', en: 'Leadership' },
  subtitle: {
    tr: 'eCyverse vizyonu çerçevesinde premium danışmanlık pratiği.',
    en: 'Premium consulting practice under the eCyverse vision.',
  },
  members: [
    {
      id: 'founder',
      name: 'Emre Can Yalçın',
      role: {
        tr: 'Kurucu, eCyverse · Premium Consulting Strategist',
        en: 'Founder, eCyverse · Premium Consulting Strategist',
      },
      bio: {
        tr: '5+ yıllık premium danışmanlık pratiği. Organizasyonel dönüşüm, stratejik danışmanlık ve kültür mühendisliği odaklı; Türkiye merkezli, AB pazarlarında engagement deneyimi.',
        en: '5+ years of premium consulting practice. Focused on organizational transformation, strategic advisory, and culture engineering; Türkiye-based with engagement experience across EU markets.',
      },
      image: '/founder.svg',
    },
  ],
};

// P45 C4: EcyPro Premium Consulting metodolojisinin 5 katmanı. Her katman
// Discovery Call sonrası engagement'in farklı bir fazına denk gelir. Bu
// yapı Vision → Bridge → Engineering → Culture → Loop sırasıyla işler.
export const METHODOLOGY_COPY = {
  title: { tr: 'Yaklaşımımız', en: 'Our Approach' },
  subtitle: {
    tr: 'Vizyondan kültüre, 5 katmanlı bir engagement mimarisi. Veri odaklı, ölçülebilir, anonim sonuç döngüsüyle kapanan.',
    en: 'From vision to culture, a five-layer engagement architecture. Data-driven, measurable, closed by an anonymized result loop.',
  },
  steps: [
    {
      icon: 'Eye',
      title: { tr: 'Vizyon Mimarı', en: 'Vision Architecture' },
      description: {
        tr: 'Her engagement, 3-5 yıllık ufuk için stratejik netlik üretmekle başlar. Vizyon Mimarı katmanında "nerede oynuyoruz" sorusunu cevaplarız: hangi pazarlarda, hangi müşteri segmentleriyle, hangi değer önerisiyle? Üst yönetimle birlikte rekabet sınırlarını tanımlar, organizasyonun mevcut konumundan hedef konuma geçişin temel varsayımlarını masaya yatırırız. Bu katmanın çıktısı; Discovery Call notlarından beslenen, kararlaştırılmış bir kuzey yıldızı dokümanıdır.',
        en: 'Every engagement starts by producing strategic clarity for a 3-5 year horizon. The Vision Architecture layer answers the "where do we play" question: which markets, which customer segments, which value proposition? Together with senior leadership we define competitive boundaries and surface the core assumptions of the transition from current to target state. Output: a documented north-star statement, informed by Discovery Call findings.',
      },
    },
    {
      icon: 'Compass',
      title: { tr: 'Strateji Köprüsü', en: 'Strategy Bridge' },
      description: {
        tr: "Vizyon güzeldir, uygulama zordur. Strateji Köprüsü katmanı, kuzey yıldızı ile çeyreklik hedefler arasındaki köprüyü kurar. OKR setting, quarterly cadence ve karar mercii sorumluluk haritası bu katmanda netleşir. Hangi kararın kim tarafından verileceğini, hangi metrik eşiğinde eskalasyon olacağını ve haftalık ritmin nasıl işleyeceğini birlikte tasarlarız. Çıktı: 90 günlük yol haritası, RACI matrisi ve haftalık operasyonel ritim takvimi.",
        en: 'Vision is easy, execution is hard. The Strategy Bridge layer builds the connection between the north star and quarterly targets. OKR setting, quarterly cadence, and decision-rights mapping crystallize here. We co-design who decides what, the metric thresholds that trigger escalation, and how the weekly rhythm operates. Output: a 90-day roadmap, a RACI matrix, and a weekly operational cadence calendar.',
      },
    },
    {
      icon: 'Wrench',
      title: { tr: 'Sonuç Mühendisliği', en: 'Result Engineering' },
      description: {
        tr: "Strateji ölçülemiyorsa stratejik değildir. Sonuç Mühendisliği katmanı; KPI tasarımı, baseline ölçümü ve metric instrumentation'a odaklanır. İlk haftada mevcut performansın baseline'ını çıkarır, hangi metriklerin gerçekten engagement'i temsil ettiğini birlikte seçeriz. Veri toplama mekanizmasını, dashboard kurulumunu ve 90 günlük retrospektif raporun şablonunu kurarız. Hedef: engagement bittiğinde şirketin metriği kendi başına izleyebilmesi — bağımlılık değil, kapasite bırakırız.",
        en: 'Strategy that cannot be measured is not strategy. The Result Engineering layer focuses on KPI design, baseline measurement, and metric instrumentation. In week one we establish the performance baseline and jointly choose the metrics that truly represent the engagement. We set up data collection, dashboarding, and the template for the 90-day retrospective report. Goal: by the engagement\'s end, the organization can track its own metrics — we leave capacity, not dependency.',
      },
    },
    {
      icon: 'Sprout',
      title: { tr: 'Kültür Sürdürülebilirliği', en: 'Culture Sustainability' },
      description: {
        tr: 'En iyi stratejiler, kültür uyumsuzluğunda erir. Kültür Sürdürülebilirliği katmanı; değişim yönetimi, davranışsal nudges ve liderlik koçluğunu birleştirir. Yönetim toplantısı ritüellerini, performans konuşmalarının dili ve karar verme protokollerini engagement boyunca gözlemleyip rafine ederiz. Yöneticilere bire bir 30-60 dakikalık koçluk seansları, ekip moderasyonu için "decision sprint" formatı ve geri bildirim ritüellerinin kurulumunu sağlarız. Çıktı: stratejinin günlük davranışa dönüştüğü, yönetim sirkülasyonu olmadan da yaşayan bir operasyonel kültür.',
        en: 'The best strategies dissolve in cultural friction. The Culture Sustainability layer combines change management, behavioral nudges, and leadership coaching. We observe and refine leadership meeting rituals, the language of performance conversations, and decision protocols throughout the engagement. We provide one-on-one 30-60 minute coaching sessions for senior leaders, a "decision sprint" format for team moderation, and the installation of feedback rituals. Output: an operational culture in which strategy becomes daily behavior, sustained without churning leadership.',
      },
    },
    {
      icon: 'Recycle',
      title: { tr: "Anonim Sonuç Loop'u", en: 'Anonymous Result Loop' },
      description: {
        tr: "Engagement'in kapanışı, öğrenmenin başlangıcıdır. Anonim Sonuç Loop'u katmanında; NDA çerçevesinde standartlaştırılmış bir retrospektif yapı kullanırız. Engagement bittikten 6 ay sonra müşteriyle anonim takip görüşmesi yapar, hangi varsayımların doğru çıktığını, hangilerinin gözden geçirilmesi gerektiğini sorarız. Bu öğrenmeler — müşteri kimliği olmadan — gelecekteki engagement'lerin diagnostic anketlerine ve playbook revizyonlarına girer. Sürekli iyileştirme metodolojiyi sahaya yakın tutar, modaya kapılan jenerik framework'lerden uzaklaşır.",
        en: 'The end of an engagement is the start of learning. The Anonymous Result Loop layer uses a standardized retrospective structure under NDA. Six months after closure we run an anonymous follow-up review with the client, asking which assumptions proved correct and which need revision. These learnings — without client identity — feed into the diagnostic surveys and playbook revisions of future engagements. Continuous improvement keeps the methodology field-tested, away from trend-driven generic frameworks.',
      },
    },
  ],
};

export const GENERIC_SERVICE_DETAILS = {
  title: { tr: 'Hizmet Detayları', en: 'Service Details' },
  aboutServiceTitle: { tr: 'Hizmet Hakkında', en: 'About Service' },
  intro: {
    tr: 'Kurumsal hedeflerinize ulaşmanız için tasarlanmış kapsamlı çözümler.',
    en: 'Comprehensive solutions designed to help you achieve your corporate goals.',
  },
  processTitle: { tr: 'Süreç Nasıl İşler?', en: 'How It Works?' },
  deliverablesTitle: { tr: 'Ne Kazanacaksınız?', en: 'Deliverables' },
  benefitsTitle: { tr: 'Kazanımlar', en: 'Benefits' },
  benefits: [
    {
      title: { tr: 'Verimlilik Artışı', en: 'Increased Efficiency' },
      desc: { tr: 'Operasyonel maliyetlerde düşüş.', en: 'Reduction in operational costs.' },
    },
    {
      title: { tr: 'Risk Yönetimi', en: 'Risk Management' },
      desc: {
        tr: 'Belirsizliklere karşı proaktif koruma.',
        en: 'Proactive protection against uncertainties.',
      },
    },
  ],
  offerTitle: { tr: 'Özel Teklif', en: 'Special Offer' },
  offerDesc: {
    tr: 'Bu hizmet için size özel bir strateji planı hazırlayabiliriz.',
    en: 'We can prepare a custom strategy plan for this service.',
  },
  ctaTitle: { tr: 'Hemen Başlayın', en: 'Start Now' },
  ctaDesc: {
    tr: 'Uzmanlarımızla 15 dakikalık ücretsiz görüşme planlayın.',
    en: 'Schedule a free 15-minute consultation with our experts.',
  },
  ctaButton: { tr: 'Randevu Al', en: 'Book Appointment' },
  ctaNote: { tr: 'Kredi kartı gerekmez.', en: 'No credit card required.' },
};

export const INDUSTRIES_COPY = {
  title: { tr: 'Sektörler', en: 'Industries' },
  subtitle: {
    tr: 'Farklı sektörlerdeki derinlemesine uzmanlığımız.',
    en: 'In-depth expertise across various industries.',
  },
  items: [
    {
      title: { tr: 'Finans', en: 'Finance' },
      desc: { tr: 'Bankacılık ve Sigorta', en: 'Banking and Insurance' },
    },
    {
      title: { tr: 'Teknoloji', en: 'Technology' },
      desc: { tr: 'Yazılım ve Donanım', en: 'Software and Hardware' },
    },
  ],
};

export const LOCATIONS_COPY = {
  title: { tr: 'Ofislerimiz', en: 'Our Offices' },
  subtitle: {
    tr: 'Global varlığımızla yanınızdayız.',
    en: 'We are with you with our global presence.',
  },
  // P45: Sahte adres + telefon kartları kaldırıldı. Tek ofis kartı, sadece
  // şehir + ülke bilgisi + iletişim formuna yönlendirme. Gerçek ofis adresi
  // eklenince burada güncellenecek.
  offices: [
    {
      city: { tr: 'İstanbul', en: 'Istanbul' },
      address: { tr: 'Türkiye merkezli pratik', en: 'Türkiye-based practice' },
      phone: '',
    },
  ],
};

export const HERO_CONTENT = {
  badge: { tr: 'Yeni Nesil Danışmanlık', en: 'Next Gen Consulting' },
  title: {
    line1: { tr: 'Geleceği', en: 'Shape' },
    highlight: { tr: 'Şekillendirin', en: 'The Future' },
    line2: { tr: 'Bugünden', en: 'Today' },
  },
  description: {
    tr: 'Stratejik danışmanlık ile potansiyelinizi açığa çıkarın ve rekabette öne geçin.',
    en: 'Unlock your potential with strategic consulting and stay ahead of the competition.',
  },
  primaryCta: { label: { tr: 'Hemen Başlayın', en: 'Get Started' } },
  secondaryCta: { label: { tr: 'Hizmetlerimiz', en: 'Our Services' } },
};

export const ABOUT_COPY = {
  title: { tr: 'Hakkımızda', en: 'About Us' },
  missionTitle: { tr: 'Misyonumuz', en: 'Our Mission' },
  missionDesc: {
    tr: 'Kurumlara sürdürülebilir büyüme yolculuklarında rehberlik etmek.',
    en: 'To guide organizations on their sustainable growth journey.',
  },
  visionTitle: { tr: 'Vizyonumuz', en: 'Our Vision' },
  visionDesc: {
    tr: 'Global iş dünyasında en güvenilir stratejik ortak olmak.',
    en: 'To be the most trusted strategic partner in the global business world.',
  },
};

export const CAREERS_COPY = {
  title: { tr: 'Kariyer', en: 'Careers' },
  subtitle: {
    tr: 'Ekibimize katılın ve fark yaratın.',
    en: 'Join our team and make a difference.',
  },
  openPositions: { tr: 'Açık Pozisyonlar', en: 'Open Positions' },
  applyNow: { tr: 'Başvur', en: 'Apply Now' },
};

export const EVENTS_COPY = {
  title: { tr: 'Etkinlikler', en: 'Events' },
  subtitle: {
    tr: 'Yaklaşan seminer ve webinarlarımız.',
    en: 'Our upcoming seminars and webinars.',
  },
  upcoming: { tr: 'Yaklaşan Etkinlikler', en: 'Upcoming Events' },
  noEvents: {
    tr: 'Şu an planlanmış etkinlik bulunmuyor.',
    en: 'No events scheduled at the moment.',
  },
};

export const FAQ_COPY = {
  title: { tr: 'Sıkça Sorulan Sorular', en: 'FAQ' },
  subtitle: { tr: 'Aklınıza takılan soruların yanıtları.', en: 'Answers to your questions.' },
  questions: [],
};
