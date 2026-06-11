export const NAV_COPY = {
  home: { tr: 'Ana Sayfa', en: 'Home' },
  services: { tr: 'Hizmetler', en: 'Services' },
  industries: { tr: 'Sektörler', en: 'Industries' },
  about: { tr: 'Hakkımızda', en: 'About Us' },
  contact: { tr: 'İletişim', en: 'Contact' },
  login: { tr: 'Giriş', en: 'Login' },
  getStarted: { tr: 'Başla', en: 'Get Started' },
};

export const NAV_ITEMS = {
  home: {
    id: 'home',
    href: '#hero',
    label: { tr: 'Ana Sayfa', en: 'Home' },
  },
  services: {
    id: 'services',
    href: '#services',
    label: { tr: 'Hizmetler', en: 'Services' },
    hasMegaMenu: true,
    children: [
      {
        id: 'strategy',
        label: { tr: 'Stratejik Yönetim', en: 'Strategic Management' },
        href: '/services/strategic-transformation',
      },
      {
        id: 'digital',
        label: { tr: 'Dijital Dönüşüm', en: 'Digital Transformation' },
        href: '/services/digital-strategy',
      },
    ],
  },
  sektorler: {
    id: 'sektorler',
    href: '/sektorler',
    label: { tr: 'Sektörler', en: 'Industries' },
    hasMegaMenu: true,
    children: [
      {
        id: 'imalat',
        label: { tr: 'İmalat Sanayi', en: 'Manufacturing' },
        href: '/sektorler/imalat-sanayi',
      },
      {
        id: 'finansal',
        label: { tr: 'Finansal Hizmetler', en: 'Financial Services' },
        href: '/sektorler/finansal-hizmetler',
      },
      {
        id: 'ilac',
        label: { tr: 'İlaç & Sağlık', en: 'Pharma & Healthcare' },
        href: '/sektorler/ilac-saglik',
      },
      {
        id: 'perakende',
        label: { tr: 'Perakende & E-Ticaret', en: 'Retail & E-Commerce' },
        href: '/sektorler/perakende-e-ticaret',
      },
      {
        id: 'teknoloji',
        label: { tr: 'Teknoloji & SaaS', en: 'Tech & SaaS' },
        href: '/sektorler/teknoloji-saas',
      },
    ],
  },
  insights: {
    id: 'insights',
    href: '/perspektifler',
    label: { tr: 'Perspektifler', en: 'Insights' },
    hasMegaMenu: true,
    children: [
      {
        id: 'hub',
        label: { tr: 'Tüm İçgörüler', en: 'All Insights' },
        href: '/perspektifler',
      },
      {
        id: 'case-studies',
        label: { tr: 'Vaka Analizleri', en: 'Case Studies' },
        href: '/case-studies',
      },
      {
        id: 'topics',
        label: { tr: 'Tüm Konular', en: 'All Topics' },
        href: '/perspektifler/konular',
      },
    ],
  },
  pricing: {
    id: 'pricing',
    href: '/pricing',
    label: { tr: 'Fiyatlandırma', en: 'Pricing' },
  },
  about: {
    id: 'about',
    href: '/about',
    label: { tr: 'Hakkımızda', en: 'About Us' },
  },
  contact: {
    id: 'contact',
    href: '#contact',
    label: { tr: 'İletişim', en: 'Contact' },
  },
};

export const MEGA_MENUS = {
  services: {
    sections: [
      {
        id: 'strategy',
        title: { tr: 'Strateji', en: 'Strategy' },
        items: [
          {
            id: 'corporate-strategy',
            label: { tr: 'Kurumsal Strateji', en: 'Corporate Strategy' },
            description: {
              tr: 'Uzun vadeli rekabet avantajı ve büyüme yol haritası',
              en: 'Long-term competitive advantage and growth roadmap',
            },
            href: '/services/strategic-transformation',
            iconName: 'Target',
          },
          {
            id: 'ma-advisory',
            label: { tr: 'M&A Danışmanlığı', en: 'M&A Advisory' },
            description: {
              tr: 'Birleşme, satın alma ve entegrasyon süreçleri',
              en: 'Mergers, acquisitions and integration processes',
            },
            href: '/services/mergers-acquisitions',
            iconName: 'Handshake',
          },
          {
            id: 'org-design',
            label: { tr: 'Organizasyonel Tasarım', en: 'Org Design' },
            description: {
              tr: 'Verimli yapılar ve yönetim modelleri',
              en: 'Efficient structures and governance models',
            },
            href: '/services/strategic-transformation',
            iconName: 'Network',
          },
        ],
      },
      {
        id: 'technology',
        title: { tr: 'Teknoloji', en: 'Technology' },
        items: [
          {
            id: 'ai-data',
            label: { tr: 'Yapay Zeka & Veri', en: 'AI & Data Strategy' },
            description: {
              tr: 'AI olgunluk değerlendirmesi ve uygulama yol haritası',
              en: 'AI maturity assessment and implementation roadmap',
            },
            href: '/services/ai-analytics',
            iconName: 'Brain',
          },
          {
            id: 'digital-transformation',
            label: { tr: 'Dijital Dönüşüm', en: 'Digital Transformation' },
            description: {
              tr: 'Uçtan uca dijitalleşme ve platform modernizasyonu',
              en: 'End-to-end digitization and platform modernization',
            },
            href: '/services/digital-strategy',
            iconName: 'Zap',
          },
          {
            id: 'cloud-platform',
            label: { tr: 'Bulut & Platform', en: 'Cloud & Platform' },
            description: {
              tr: 'Ölçeklenebilir bulut mimarisi ve geçiş stratejisi',
              en: 'Scalable cloud architecture and migration strategy',
            },
            href: '/services/digital-strategy',
            iconName: 'Cloud',
          },
        ],
      },
      {
        id: 'performance',
        title: { tr: 'Performans', en: 'Performance' },
        items: [
          {
            id: 'revenue-growth',
            label: { tr: 'Gelir Büyümesi', en: 'Revenue Growth' },
            description: {
              tr: 'Pazar penetrasyonu ve yeni gelir akışları',
              en: 'Market penetration and new revenue streams',
            },
            href: '/services',
            iconName: 'TrendingUp',
          },
          {
            id: 'cost-transformation',
            label: { tr: 'Maliyet Dönüşümü', en: 'Cost Transformation' },
            description: {
              tr: 'Operasyonel verimlilik ve maliyet optimizasyonu',
              en: 'Operational efficiency and cost optimization',
            },
            href: '/services',
            iconName: 'BarChart3',
          },
          {
            id: 'digital-ops',
            label: { tr: 'Dijital Operasyonlar', en: 'Digital Operations' },
            description: {
              tr: 'Otomasyon, süreç mükemmelliği ve lean yönetim',
              en: 'Automation, process excellence and lean management',
            },
            href: '/services',
            iconName: 'Settings',
          },
        ],
      },
    ],
    featured: {
      tag: { tr: 'Ücretsiz Değerlendirme', en: 'Free Assessment' },
      title: { tr: 'AI Olgunluk Analizi', en: 'AI Maturity Analysis' },
      description: {
        tr: 'Organizasyonunuzun yapay zeka hazırlığını 15 dakikada ölçün. Kişiselleştirilmiş yol haritanızı alın.',
        en: "Measure your organization's AI readiness in 15 minutes. Get your personalized roadmap.",
      },
      href: '/maturity-assessment',
      cta: { tr: 'Analizi Başlat', en: 'Start Analysis' },
      gradient: 'from-primary/20 to-secondary/10',
    },
  },
  insights: {
    // BUG-03/04: the panel is insights-only now. Columns (Kategoriler /
    // Formatlar / Öne Çıkanlar) are computed live from the content index in
    // src/components/layout/insightsMenuData.ts — only the promo card and the
    // panel gradient remain as static copy here.
    sections: [],
    featured: {
      tag: { tr: 'Yeni Rapor', en: 'New Report' },
      title: { tr: '2026 AI Dönüşüm Raporu', en: '2026 AI Transformation Report' },
      description: {
        tr: 'Fortune 500 şirketlerinde AI benimseme trendleri ve başarı faktörleri.',
        en: 'AI adoption trends and success factors across Fortune 500 companies.',
      },
      href: '/perspektifler',
      cta: { tr: 'Raporu İncele', en: 'Read Report' },
      gradient: 'from-secondary/20 to-primary/10',
    },
  },
};

// P52: Gerçek telefon numarası entegrasyonu. ENV `VITE_CONTACT_PHONE` override edebilir.
// E.164 format: +905417143000 (Türkiye mobil) — tel: link compatible.
// Display format: +90 541 714 30 00 (insanlar için okunabilir).
// WhatsApp deep link: wa.me/<digits-only> + URL-encoded greeting.
const ENV_PHONE =
  typeof import.meta !== 'undefined' && import.meta.env?.VITE_CONTACT_PHONE
    ? String(import.meta.env.VITE_CONTACT_PHONE).trim()
    : '';
const PHONE_E164 = ENV_PHONE || '+905417143000';
const PHONE_DISPLAY = '+90 541 714 30 00';
const WHATSAPP_DEEP_LINK = `https://wa.me/${PHONE_E164.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Merhaba eCyPro, web siteniz üzerinden ulaşıyorum.')}`;

export const CONTACT_CONFIG = {
  title: { tr: 'İletişim', en: 'Contact' },
  email: 'info@ecypro.com',
  address: { tr: 'İstanbul, Türkiye', en: 'Istanbul, Turkey' },
  phone: PHONE_E164,
  phoneDisplay: PHONE_DISPLAY,
  whatsapp: WHATSAPP_DEEP_LINK,
  mapLink: 'https://maps.app.goo.gl/?q=Istanbul,Turkey',
  social: {
    linkedin: 'https://linkedin.com/company/ecypro',
    twitter: 'https://twitter.com/ecypro',
    instagram: 'https://instagram.com/ecypro',
  },
};

// LEGAL_COPY removed — superseded by LegalLayout + `legal` i18n namespace
// (public/locales/{tr,en}/legal.json). Migration completed in P0 commit 1.

export const FOOTER_COPY = {
  copyright: {
    tr: '© 2026 eCyPro Consulting. Tüm hakları saklıdır.',
    en: '© 2026 eCyPro Consulting. All rights reserved.',
  },
  disclaimer: {
    tr: 'eCyPro, stratejik yönetim ve dijital dönüşüm alanında uzmanlaşmış global bir danışmanlık firmasıdır.',
    en: 'eCyPro is a global consulting firm specializing in strategic management and digital transformation.',
  },

  companyTitle: { tr: 'Şirket', en: 'Company' },
  servicesTitle: { tr: 'Hizmetler', en: 'Services' },
  legalTitle: { tr: 'Yasal', en: 'Legal' },

  // Missing properties added for Footer.tsx compatibility
  blog: { tr: 'Blog', en: 'Blog' },
  careers: { tr: 'Kariyer', en: 'Careers' },
  locations: { tr: 'Ofisler', en: 'Locations' },
  newsletterTitle: { tr: 'Bülten', en: 'Newsletter' },
  newsletterDesc: {
    tr: 'En son gelişmelerden haberdar olun.',
    en: 'Stay updated with the latest news.',
  },
  newsletterPlaceholder: { tr: 'E-posta adresiniz', en: 'Your email address' },
  subscribe: { tr: 'Abone Ol', en: 'Subscribe' },
  rights: { tr: 'Tüm hakları saklıdır.', en: 'All rights reserved.' },

  // Direct access compatibility
  privacy: { tr: 'Gizlilik', en: 'Privacy' },
  terms: { tr: 'Koşullar', en: 'Terms' },
  cookies: { tr: 'Çerezler', en: 'Cookies' },

  links: {
    privacy: { tr: 'Gizlilik', en: 'Privacy' },
    terms: { tr: 'Koşullar', en: 'Terms' },
    cookies: { tr: 'Çerezler', en: 'Cookies' },
  },
  // Added missing keys
  description: {
    tr: 'eCyPro, stratejik yönetim ve dijital dönüşüm alanında uzmanlaşmış global bir danışmanlık firmasıdır.',
    en: 'eCyPro is a global consulting firm specializing in strategic management and digital transformation.',
  },
  events: { tr: 'Etkinlikler', en: 'Events' },
  corporateTitle: { tr: 'Kurumsal', en: 'Corporate' },
};

export const COOKIE_BANNER_COPY = {
  text: {
    tr: 'Deneyiminizi iyileştirmek için çerezleri kullanıyoruz.',
    en: 'We use cookies to improve your experience.',
  },
  settings: { tr: 'Ayarlar', en: 'Settings' },
  accept: { tr: 'Kabul Et', en: 'Accept' },
  modalTitle: { tr: 'Çerez Tercihleri', en: 'Cookie Preferences' },
  modalDesc: {
    tr: 'Hangi çerezlerin kullanılacağını seçebilirsiniz.',
    en: 'You can choose which cookies to use.',
  },
  essential: { tr: 'Gerekli', en: 'Essential' },
  essentialDesc: { tr: 'Sitenin çalışması için zorunludur.', en: 'Required for the site to work.' },
  alwaysActive: { tr: 'Her Zaman Aktif', en: 'Always Active' },
  analytics: { tr: 'Analiz', en: 'Analytics' },
  analyticsDesc: {
    tr: 'Site performansını ölçmemize yardımcı olur.',
    en: 'Helps us measure site performance.',
  },
  marketing: { tr: 'Pazarlama', en: 'Marketing' },
  marketingDesc: {
    tr: 'Size özel içerikler sunmamızı sağlar.',
    en: 'Allows us to present personalized content.',
  },
  acceptAll: { tr: 'Tümünü Kabul Et', en: 'Accept All' },
  save: { tr: 'Kaydet', en: 'Save' },
};

export const CONTACT_FORM_COPY = {
  title: { tr: 'Bize Ulaşın', en: 'Contact Us' },
  description: {
    tr: 'Sorularınız veya işbirliği fırsatları için bizimle iletişime geçin.',
    en: 'Get in touch with us for your questions or collaboration opportunities.',
  },
  headquarters: { tr: 'Genel Merkez', en: 'Headquarters' },
  emailLabel: { tr: 'E-posta', en: 'Email' },
  phoneLabel: { tr: 'Telefon', en: 'Phone' },
  whatsapp: { tr: "WhatsApp'tan Yazın", en: 'Message on WhatsApp' },
  responsePromise: { tr: '24 Saat İçinde Yanıt Sözü', en: '24-Hour Response Promise' },
  successTitle: { tr: 'Mesajınız Alındı', en: 'Message Received' },
  successDesc: {
    tr: 'En kısa sürede size geri dönüş yapacağız.',
    en: 'We will get back to you as soon as possible.',
  },
  newMsg: { tr: 'Yeni Bir Mesaj Gönder', en: 'Send a New Message' },
  errorMsg: {
    tr: 'Bir hata oluştu. Lütfen tekrar deneyin.',
    en: 'An error occurred. Please try again.',
  },
  placeholders: {
    name: { tr: 'Adınız Soyadınız', en: 'Your Full Name' },
    email: { tr: 'E-posta Adresiniz', en: 'Your Email Address' },
    subject: { tr: 'Konu', en: 'Subject' },
    message: { tr: 'Mesajınız...', en: 'Your Message...' },
  },
  labels: {
    name: { tr: 'Ad Soyad', en: 'Full Name' },
    email: { tr: 'E-posta', en: 'Email' },
    subject: { tr: 'Konu', en: 'Subject' },
    message: { tr: 'Mesaj', en: 'Message' },
  },
  submitting: { tr: 'Gönderiliyor...', en: 'Submitting...' },
  send: { tr: 'Mesajı Gönder', en: 'Send Message' },
};
