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

export const METHODOLOGY_COPY = {
  title: { tr: 'Yaklaşımımız', en: 'Our Approach' },
  subtitle: {
    tr: 'Veriye dayalı, insan odaklı ve sonuç eksenli.',
    en: 'Data-driven, human-centric, and result-oriented.',
  },
  steps: [
    {
      icon: 'Microscope',
      title: { tr: '1. Analiz & Teşhis', en: '1. Analysis & Diagnosis' },
      description: {
        tr: 'Mevcut durumun derinlemesine röntgenini çekiyor, darboğazları ve gizli fırsatları belirliyoruz. Veri analitiği ile kök nedenleri tespit ediyoruz.',
        en: 'We perform a deep X-ray of the current situation, identifying bottlenecks and hidden opportunities. We pinpoint root causes with data analytics.',
      },
    },
    {
      icon: 'Compass',
      title: { tr: '2. Strateji Geliştirme', en: '2. Strategy Development' },
      description: {
        tr: 'Kurumunuza özel, uygulanabilir ve ölçülebilir bir yol haritası tasarlıyoruz. Hedeflerinize ulaşmanız için en uygun rotayı çiziyoruz.',
        en: 'We design a custom, actionable, and measurable roadmap for your organization. We chart the optimal course to achieve your goals.',
      },
    },
    {
      icon: 'Zap',
      title: { tr: '3. Uygulama & Dönüşüm', en: '3. Execution & Transformation' },
      description: {
        tr: 'Sadece planlamıyor, sahada yanınızda yer alarak değişimi yönetiyoruz. Hızlı kazanımlar ve uzun vadeli iyileştirmeler sağlıyoruz.',
        en: "We don't just plan; we manage change by standing with you in the field. We ensure quick wins and long-term improvements.",
      },
    },
    {
      icon: 'TrendingUp',
      title: { tr: '4. Sürdürülebilirlik & Büyüme', en: '4. Sustainability & Growth' },
      description: {
        tr: 'Elde edilen başarının kalıcı olmasını sağlıyor ve sürekli iyileştirme kültürünü yerleştiriyoruz.',
        en: 'We ensure the success achieved is permanent and instill a culture of continuous improvement.',
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
