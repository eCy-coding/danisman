import { LucideIcon } from 'lucide-react';

export interface I18nString {
  tr?: string;
  en: string;
  es?: string;
}

export interface NavItem {
  id: string;
  label: I18nString;
  href: string;
  type: 'link' | 'dropdown' | 'button';
  children?: NavItem[];
}

export type NavItems = Record<string, NavItem>;

export interface ContactConfig {
  phone: string;
  phoneDisplay: string;
  whatsapp: string;
  email: string;
  address: I18nString;
  mapLink: string;
  social: {
    linkedin: string;
    twitter: string;
    instagram: string;
  };
}

export interface ServiceItem {
  id: string;
  title: I18nString;
  description: I18nString;
  icon: LucideIcon;
  link: string;
}

export interface ServiceCategory {
  id: string;
  title: I18nString;
  description: I18nString;
  items: ServiceItem[];
}

export interface KpiItem {
  id: string;
  value: number;
  suffix: string;
  label: I18nString;
  helperText: I18nString;
  category: 'consulting' | 'events' | 'digital';
}

export interface CaseStudy {
  id: string;
  client: string;
  sector: I18nString;
  challenge: I18nString;
  solution: I18nString;
  result: I18nString;
  description: I18nString;
  image: string;
  category: I18nString;
  slug: string;
}

export interface BlogPost {
  id: string;
  category: I18nString;
  date: I18nString;
  readTime: I18nString;
  title: I18nString;
  excerpt: I18nString;
  content?: string;
  image: string;
  slug: string;
}

export interface ValueProp {
  id: string;
  title: I18nString;
  description: I18nString;
  icon: LucideIcon;
}

export interface TrustLogo {
  id: string;
  name: string;
  sector: I18nString;
  alt: I18nString;
}

export interface HeroPillar {
  id: string;
  title: I18nString;
  subtitle: I18nString;
  href: string;
  icon: LucideIcon;
}

export interface HeroContent {
  badge: I18nString;
  title: {
    line1: I18nString;
    highlight: I18nString;
    line2: I18nString;
  };
  description: I18nString;
  primaryCta: {
    label: I18nString;
    href: string;
  };
  secondaryCta: {
    label: I18nString;
    href: string;
  };
  pillars: HeroPillar[];
}

export interface TrustBarCopy {
  sectionTitle: I18nString;
}

export interface ContactFormCopy {
  title: I18nString;
  description: I18nString;
  headquarters: I18nString;
  emailLabel: I18nString;
  phoneLabel: I18nString;
  whatsapp: I18nString;
  responsePromise: I18nString;
  successTitle: I18nString;
  successDesc: I18nString;
  newMsg: I18nString;
  errorMsg: I18nString;
  submitting: I18nString;
  send: I18nString;
  labels: {
    name: I18nString;
    email: I18nString;
    subject: I18nString;
    message: I18nString;
    company: I18nString;
  };
  placeholders: {
    name: I18nString;
    email: I18nString;
    subject: I18nString;
    message: I18nString;
    company: I18nString;
  };
}

export interface FooterCopy {
  description: I18nString;
  servicesTitle: I18nString;
  corporateTitle: I18nString;
  newsletterTitle: I18nString;
  newsletterDesc: I18nString;
  newsletterPlaceholder: I18nString;
  subscribe: I18nString;
  rights: I18nString;
  privacy: I18nString;
  kvkk: I18nString;
  cookies: I18nString;
  events: I18nString;
  locations: I18nString;
  careers: I18nString;
  blog: I18nString;
}

export interface CookieBannerCopy {
  text: I18nString;
  settings: I18nString;
  accept: I18nString;
  modalTitle: I18nString;
  modalDesc: I18nString;
  essential: I18nString;
  essentialDesc: I18nString;
  analytics: I18nString;
  analyticsDesc: I18nString;
  marketing: I18nString;
  marketingDesc: I18nString;
  save: I18nString;
  acceptAll: I18nString;
  alwaysActive: I18nString;
}

export interface InsightsCopy {
  badge: I18nString;
  title: I18nString;
  description: I18nString;
  viewAll: I18nString;
  readArticle: I18nString;
}

export interface SuccessStoriesCopy {
  badge: I18nString;
  title: I18nString;
  description: I18nString;
  viewAll: I18nString;
  problem: I18nString;
  solution: I18nString;
  result: I18nString;
  details: I18nString;
}

export interface KPICopy {
  titleLine1: I18nString;
  titleHighlight: I18nString;
  description: I18nString;
}

export interface ValuePropCopy {
  badge: I18nString;
  title: I18nString;
  description: I18nString;
}

export interface ServicesCopy {
  badge: I18nString;
  titleLine1: I18nString;
  titleLine2: I18nString;
  description: I18nString;
  countBadge: I18nString;
  viewDetails: I18nString;
}

export interface AboutPageCopy {
  title: I18nString;
  missionTitle: I18nString;
  missionDesc: I18nString;
  visionTitle: I18nString;
  visionDesc: I18nString;
}

export interface TeamPageCopy {
  title: I18nString;
  subtitle: I18nString;
}

export interface FaqPageCopy {
  title: I18nString;
  subtitle: I18nString;
}

export interface CareersPageCopy {
  title: I18nString;
  subtitle: I18nString;
  openPositions: I18nString;
  applyNow: I18nString;
}

export interface IndustriesPageCopy {
  title: I18nString;
  subtitle: I18nString;
}

export interface MethodologyPageCopy {
  title: I18nString;
  subtitle: I18nString;
  steps: { title: I18nString; desc: I18nString }[];
}

export interface PartnersPageCopy {
  title: I18nString;
  subtitle: I18nString;
}

export interface LegalPageCopy {
  privacyTitle: I18nString;
  termsTitle: I18nString;
  cookiesTitle: I18nString;
  lastUpdated: I18nString;
}

export interface AuthPageCopy {
  loginTitle: I18nString;
  registerTitle: I18nString;
  forgotPwTitle: I18nString;
  emailPlaceholder: I18nString;
  passwordPlaceholder: I18nString;
  namePlaceholder: I18nString;
  signInBtn: I18nString;
  signUpBtn: I18nString;
  resetBtn: I18nString;
  noAccount: I18nString;
  haveAccount: I18nString;
  recoverDesc: I18nString;
}

export interface CaseStudiesPageCopy {
  title: I18nString;
  subtitle: I18nString;
}

export interface EventsPageCopy {
  title: I18nString;
  subtitle: I18nString;
  noEvents: I18nString;
}

export interface LocationsPageCopy {
  title: I18nString;
  subtitle: I18nString;
  offices: { city: I18nString; address: I18nString; phone: string }[];
}
