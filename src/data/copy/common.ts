export const NAV_COPY = {
  home: { tr: "Ana Sayfa", en: "Home" },
  services: { tr: "Hizmetler", en: "Services" },
  industries: { tr: "Sektörler", en: "Industries" },
  about: { tr: "Hakkımızda", en: "About Us" },
  contact: { tr: "İletişim", en: "Contact" },
  login: { tr: "Giriş", en: "Login" },
  getStarted: { tr: "Başla", en: "Get Started" }
};

export const NAV_ITEMS = {
    home: { 
        id: 'home', 
        href: '#hero', 
        label: { tr: "Ana Sayfa", en: "Home" } 
    },
    services: { 
        id: 'services', 
        href: '#services', 
        label: { tr: "Hizmetler", en: "Services" },
        children: [
            { id: 'strategy', label: { tr: "Stratejik Yönetim", en: "Strategic Management" }, href: '/services/strategy' },
            { id: 'digital', label: { tr: "Dijital Dönüşüm", en: "Digital Transformation" }, href: '/services/digital' }
        ]
    },
    industries: { 
        id: 'industries', 
        href: '#industries', 
        label: { tr: "Sektörler", en: "Industries" },
        children: []
    },
    pricing: {
        id: 'pricing',
        href: '/pricing',
        label: { tr: "Fiyatlandırma", en: "Pricing" }
    },
    about: { 
        id: 'about', 
        href: '/about', 
        label: { tr: "Hakkımızda", en: "About Us" } 
    },
    contact: { 
        id: 'contact', 
        href: '#contact', 
        label: { tr: "İletişim", en: "Contact" } 
    }
};

export const CONTACT_CONFIG = {
    title: { tr: "İletişim", en: "Contact" },
    email: "info@ecypro.com",
    address: { tr: "İstanbul, Türkiye", en: "Istanbul, Turkey" },
    phone: "+902125550000",
    phoneDisplay: "+90 (212) 555 0000",
    whatsapp: "+905555555555",
    mapLink: "https://maps.google.com",
    social: {
        linkedin: "https://linkedin.com/company/ecypro",
        twitter: "https://twitter.com/ecypro",
        instagram: "https://instagram.com/ecypro"
    }
};

export const LEGAL_COPY = {
  privacyTitle: { tr: "Gizlilik Politikası", en: "Privacy Policy" },
  termsTitle: { tr: "Kullanım Koşulları", en: "Terms of Use" },
  cookiesTitle: { tr: "Çerez Politikası", en: "Cookie Policy" },
  lastUpdated: { tr: "Son Güncelleme", en: "Last Updated" },
  date: "01.01.2026",

  privacy: {
    title: { tr: "Gizlilik Politikası", en: "Privacy Policy" },
    lastUpdated: { tr: "Son Güncelleme", en: "Last Updated" },
    date: "01.01.2026",
    sections: [
      {
        heading: { tr: "1. Veri Toplama", en: "1. Data Collection" },
        content: { tr: "Kişisel verileriniz (KVKK kapsamında) titizlikle korunmaktadır.", en: "Your personal data is strictly protected." }
      }
    ]
  },
  terms: {
    title: { tr: "Kullanım Koşulları", en: "Terms of Use" },
    termsTitle: { tr: "Kullanım Koşulları", en: "Terms of Use" }, 
    lastUpdated: { tr: "Son Güncelleme", en: "Last Updated" },
    sections: [
      {
        heading: { tr: "1. Hizmet Kullanımı", en: "1. Service Usage" },
        content: { tr: "Hizmetlerimiz fikri mülkiyet haklarına tabidir.", en: "Our services are subject to intellectual property rights." }
      }
    ]
  },
  cookies: {
     title: { tr: "Çerez Politikası", en: "Cookie Policy" },
     lastUpdated: { tr: "Son Güncelleme", en: "Last Updated" },
     sections: []
  }
};

export const FOOTER_COPY = {
  copyright: { tr: "© 2026 EcyPro Consulting. Tüm hakları saklıdır.", en: "© 2026 EcyPro Consulting. All rights reserved." },
  disclaimer: { tr: "EcyPro, stratejik yönetim ve dijital dönüşüm alanında uzmanlaşmış global bir danışmanlık firmasıdır.", en: "EcyPro is a global consulting firm specializing in strategic management and digital transformation." },
  
  companyTitle: { tr: "Şirket", en: "Company" },
  servicesTitle: { tr: "Hizmetler", en: "Services" },
  legalTitle: { tr: "Yasal", en: "Legal" },

  // Missing properties added for Footer.tsx compatibility
  blog: { tr: "Blog", en: "Blog" },
  careers: { tr: "Kariyer", en: "Careers" },
  locations: { tr: "Ofisler", en: "Locations" },
  newsletterTitle: { tr: "Bülten", en: "Newsletter" },
  newsletterDesc: { tr: "En son gelişmelerden haberdar olun.", en: "Stay updated with the latest news." },
  newsletterPlaceholder: { tr: "E-posta adresiniz", en: "Your email address" },
  subscribe: { tr: "Abone Ol", en: "Subscribe" },
  rights: { tr: "Tüm hakları saklıdır.", en: "All rights reserved." },
  
  // Direct access compatibility
  privacy: { tr: "Gizlilik", en: "Privacy" },
  terms: { tr: "Koşullar", en: "Terms" },
  cookies: { tr: "Çerezler", en: "Cookies" },
  
  links: {
      privacy: { tr: "Gizlilik", en: "Privacy" },
      terms: { tr: "Koşullar", en: "Terms" },
      cookies: { tr: "Çerezler", en: "Cookies" }
  },
  // Added missing keys
  description: { tr: "EcyPro, stratejik yönetim ve dijital dönüşüm alanında uzmanlaşmış global bir danışmanlık firmasıdır.", en: "EcyPro is a global consulting firm specializing in strategic management and digital transformation." },
  events: { tr: "Etkinlikler", en: "Events" },
  corporateTitle: { tr: "Kurumsal", en: "Corporate" }
};

export const COOKIE_BANNER_COPY = {
  text: { tr: "Deneyiminizi iyileştirmek için çerezleri kullanıyoruz.", en: "We use cookies to improve your experience." },
  settings: { tr: "Ayarlar", en: "Settings" },
  accept: { tr: "Kabul Et", en: "Accept" },
  modalTitle: { tr: "Çerez Tercihleri", en: "Cookie Preferences" },
  modalDesc: { tr: "Hangi çerezlerin kullanılacağını seçebilirsiniz.", en: "You can choose which cookies to use." },
  essential: { tr: "Gerekli", en: "Essential" },
  essentialDesc: { tr: "Sitenin çalışması için zorunludur.", en: "Required for the site to work." },
  alwaysActive: { tr: "Her Zaman Aktif", en: "Always Active" },
  analytics: { tr: "Analiz", en: "Analytics" },
  analyticsDesc: { tr: "Site performansını ölçmemize yardımcı olur.", en: "Helps us measure site performance." },
  marketing: { tr: "Pazarlama", en: "Marketing" },
  marketingDesc: { tr: "Size özel içerikler sunmamızı sağlar.", en: "Allows us to present personalized content." },
  acceptAll: { tr: "Tümünü Kabul Et", en: "Accept All" },
  save: { tr: "Kaydet", en: "Save" }
};

export const CONTACT_FORM_COPY = {
  title: { tr: "Bize Ulaşın", en: "Contact Us" },
  description: { tr: "Sorularınız veya işbirliği fırsatları için bizimle iletişime geçin.", en: "Get in touch with us for your questions or collaboration opportunities." },
  headquarters: { tr: "Genel Merkez", en: "Headquarters" },
  emailLabel: { tr: "E-posta", en: "Email" },
  phoneLabel: { tr: "Telefon", en: "Phone" },
  whatsapp: { tr: "WhatsApp'tan Yazın", en: "Message on WhatsApp" },
  responsePromise: { tr: "24 Saat İçinde Yanıt Sözü", en: "24-Hour Response Promise" },
  successTitle: { tr: "Mesajınız Alındı", en: "Message Received" },
  successDesc: { tr: "En kısa sürede size geri dönüş yapacağız.", en: "We will get back to you as soon as possible." },
  newMsg: { tr: "Yeni Bir Mesaj Gönder", en: "Send a New Message" },
  errorMsg: { tr: "Bir hata oluştu. Lütfen tekrar deneyin.", en: "An error occurred. Please try again." },
  placeholders: {
    name: { tr: "Adınız Soyadınız", en: "Your Full Name" },
    email: { tr: "E-posta Adresiniz", en: "Your Email Address" },
    subject: { tr: "Konu", en: "Subject" },
    message: { tr: "Mesajınız...", en: "Your Message..." }
  },
  labels: {
    name: { tr: "Ad Soyad", en: "Full Name" },
    email: { tr: "E-posta", en: "Email" },
    subject: { tr: "Konu", en: "Subject" },
    message: { tr: "Mesaj", en: "Message" }
  },
  submitting: { tr: "Gönderiliyor...", en: "Submitting..." },
  send: { tr: "Mesajı Gönder", en: "Send Message" }
};
