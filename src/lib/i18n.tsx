/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Logger } from './logger';

export type Language = 'tr' | 'en';
export type MultiLang = { tr: string; en: string };

export const getLang = (obj: MultiLang | string | undefined, lang: Language): string => {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  return obj[lang] || obj['tr'] || '';
};

type Translations = {
  [key in Language]: {
    [key: string]: string;
  };
};

export const translations: Translations = {
  tr: {
    // Dashboard
    'dashboard.title': 'Müşteri Deneyimi Paneli',
    'nav.overview': 'Genel Bakış',
    'nav.analytics': 'Analizler',
    'nav.consulting': 'Danışmanlık',
    'nav.settings': 'Ayarlar',
    'nav.language': 'English',
    'common.search': 'Ara...',
    'auth.logout': 'Çıkış Yap',
    'dashboard.panel': 'Panel',

    // Analytics
    'analytics.total_revenue': 'Toplam Gelir',
    'analytics.active_clients': 'Aktif Danışanlar',
    'analytics.activity_rate': 'Etkinlik Oranı',
    'analytics.revenue_analysis': 'Gelir Analizi',
    'analytics.session_stats': 'Oturum İstatistikleri',
    'analytics.restricted_title': 'Veriler Gizlendi',
    'analytics.restricted_desc': 'Bu bilgilere erişim yetkiniz bulunmamaktadır.',
    'analytics.admin_only': 'Yönetici',
    'analytics.restricted_chart':
      'Finansal grafikler sadece yetkili yöneticiler tarafından görüntülenebilir.',

    // Consulting
    'consulting.title': 'Danışmanlık Takvimi',
    'consulting.subtitle': 'Yaklaşan oturumlarınızı yönetin.',
    'consulting.new_session': 'Yeni Oturum',
    'consulting.table.client': 'Müşteri',
    'consulting.table.type': 'Hizmet Tipi',
    'consulting.table.date': 'Tarih',
    'consulting.table.time': 'Saat',
    'consulting.table.status': 'Durum',
    'consulting.dialog.new_title': 'Yeni Oturum Planla',
    'consulting.dialog.edit_title': 'Oturumu Düzenle',
    'consulting.form.client': 'Müşteri Adı',
    'consulting.form.type': 'Hizmet Tipi',
    'consulting.form.date': 'Tarih',
    'consulting.form.time': 'Saat',
    'consulting.form.status': 'Durum',
    'consulting.save': 'Kaydet',
    'consulting.cancel': 'İptal',
    'consulting.delete_confirm': 'Bu oturumu silmek istediğinize emin misiniz?',

    // Toasts & System
    'toast.session_deleted': 'Oturum silindi.',
    'toast.session_created': 'Yeni oturum oluşturuldu.',
    'toast.session_updated': 'Oturum güncellendi.',
    'toast.error_loading': 'Veriler yüklenirken bir hata oluştu.',

    // AI Widget
    'ai.analyzing': 'Analyzing...', // Keep technical terms sometimes or translate
    'ai.insight_title': 'AI Strateji Analizi',
  },
  en: {
    // Dashboard
    'dashboard.title': 'Customer Experience Dashboard',
    'nav.overview': 'Overview',
    'nav.analytics': 'Analytics',
    'nav.consulting': 'Consulting',
    'nav.settings': 'Settings',
    'nav.language': 'Türkçe',
    'common.search': 'Search...',
    'auth.logout': 'Logout',
    'dashboard.panel': 'Panel',

    // Analytics
    'analytics.total_revenue': 'Total Revenue',
    'analytics.active_clients': 'Active Clients',
    'analytics.activity_rate': 'Activity Rate',
    'analytics.revenue_analysis': 'Revenue Analysis',
    'analytics.session_stats': 'Session Statistics',
    'analytics.restricted_title': 'Data Hidden',
    'analytics.restricted_desc': 'You do not have permission to access this data.',
    'analytics.admin_only': 'Admin Only',
    'analytics.restricted_chart':
      'Financial charts can only be viewed by authorized administrators.',

    // Consulting
    'consulting.title': 'Consulting Calendar',
    'consulting.subtitle': 'Manage your upcoming sessions.',
    'consulting.new_session': 'New Session',
    'consulting.table.client': 'Client',
    'consulting.table.type': 'Service Type',
    'consulting.table.date': 'Date',
    'consulting.table.time': 'Time',
    'consulting.table.status': 'Status',
    'consulting.dialog.new_title': 'Schedule New Session',
    'consulting.dialog.edit_title': 'Edit Session',
    'consulting.form.client': 'Client Name',
    'consulting.form.type': 'Service Type',
    'consulting.form.date': 'Date',
    'consulting.form.time': 'Time',
    'consulting.form.status': 'Status',
    'consulting.save': 'Save',
    'consulting.cancel': 'Cancel',
    'consulting.delete_confirm': 'Are you sure you want to delete this session?',

    // Toasts & System
    'toast.session_deleted': 'Session deleted.',
    'toast.session_created': 'New session created.',
    'toast.session_updated': 'Session updated.',
    'toast.error_loading': 'Error loading data.',

    // AI Widget
    'ai.analyzing': 'Analyzing...',
    'ai.insight_title': 'AI Strategy Analysis',
  },
};

interface I18nContextType {
  language: Language;
  t: (key: string) => string;
  toggleLanguage: () => void;
  i18n: {
    language: Language;
    changeLanguage: (lang: Language) => void;
  };
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('ecypro-lang');
        return saved === 'tr' || saved === 'en' ? saved : 'tr';
      }
    } catch (_e) {
      Logger.warn('Failed to load language preference');
    }
    return 'tr';
  });

  React.useEffect(() => {
    try {
      localStorage.setItem('ecypro-lang', language);
    } catch (_e) {
      Logger.warn('Failed to save language preference');
    }
  }, [language]);

  const t = (key: string) => {
    return translations[language][key] || key;
  };

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'tr' ? 'en' : 'tr'));
  };

  return (
    <I18nContext.Provider
      value={{
        language,
        t,
        toggleLanguage,
        i18n: { language, changeLanguage: setLanguage },
      }}
    >
      {children}
    </I18nContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
};
