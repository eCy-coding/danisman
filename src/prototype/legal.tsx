import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Shield, FileText, Cookie } from 'lucide-react';

// Combined legal pages: /privacy + /terms + /cookies
// In production, each is a separate route. This prototype shows all three in tabs.

const PAGES = ['privacy', 'terms', 'cookies'] as const;
type LegalPage = (typeof PAGES)[number];

const CONFIG: Record<
  LegalPage,
  {
    icon: typeof Shield;
    label: string;
    heading: string;
    lastUpdated: string;
    sections: { title: string; body: string }[];
  }
> = {
  privacy: {
    icon: Shield,
    label: 'Gizlilik Politikası',
    heading: 'Gizlilik Politikası & KVKK Aydınlatma Metni',
    lastUpdated: '2026-01-01',
    sections: [
      {
        title: 'Veri Sorumlusu',
        body: 'eCyPro Premium Consulting, 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında veri sorumlusu sıfatını haizdir.',
      },
      {
        title: 'İşlenen Kişisel Veriler',
        body: 'Ad soyad, e-posta adresi, telefon numarası, şirket bilgisi, mesaj içeriği ve iletişim tercihleri işlenmektedir. Hassas kişisel veri işlenmemektedir.',
      },
      {
        title: 'İşleme Amaçları',
        body: 'Keşif görüşmesi organizasyonu, teklif hazırlama, iletişim yönetimi, yasal yükümlülüklerin yerine getirilmesi ve meşru menfaatlerin korunması amaçlarıyla işlenmektedir.',
      },
      {
        title: 'Aktarım',
        body: "Kişisel verileriniz, yurt içi ve yurt dışında üçüncü taraflarla (altyapı sağlayıcıları, CRM sistemleri) yalnızca hizmetin sunulması amacıyla paylaşılmaktadır. Bu aktarımlar KVKK'nın 8. ve 9. maddeleri çerçevesinde gerçekleştirilmektedir.",
      },
      {
        title: 'Saklama Süresi',
        body: 'Verileriniz, ilgili ilişkinin sona ermesinden itibaren 3 yıl süreyle saklanmaktadır. Yasal yükümlülük gerektiren veriler için ilgili mevzuatta öngörülen süreler geçerlidir.',
      },
      {
        title: 'Haklarınız',
        body: "KVKK'nın 11. maddesi uyarınca; verilerin işlenip işlenmediğini öğrenme, işlenen verilere ilişkin bilgi talep etme, işlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme, yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme, eksik veya yanlış işlenmiş verilerin düzeltilmesini isteme ve silinmesini ya da yok edilmesini isteme haklarına sahipsiniz. Başvuru: kvkk@ecypro.com",
      },
    ],
  },
  terms: {
    icon: FileText,
    label: 'Hizmet Şartları',
    heading: 'Hizmet Şartları ve Koşulları',
    lastUpdated: '2026-01-01',
    sections: [
      {
        title: 'Taraflar',
        body: 'Bu hizmet şartları, eCyPro Premium Consulting ("eCyPro") ile web sitesi ziyaretçileri ve hizmet alıcıları ("Müşteri") arasındaki ilişkiyi düzenlemektedir.',
      },
      {
        title: 'Hizmet Kapsamı',
        body: 'eCyPro, yönetim danışmanlığı, M&A advisory, ESG danışmanlığı ve benzeri profesyonel hizmetleri yazılı angajman mektubu ile belirlenen kapsam dahilinde sunmaktadır.',
      },
      {
        title: 'Gizlilik',
        body: 'Tüm proje bilgileri, müşteri verileri ve ticari sırlar kesin gizlilik altında tutulur. NDA, angajman başlangıcında imzalanmaktadır.',
      },
      {
        title: 'Fikri Mülkiyet',
        body: "eCyPro tarafından üretilen metodolojiler, çerçeveler ve araçlar eCyPro'nun fikri mülkiyetidir. Proje çıktıları (raporlar, sunumlar) müşteriye teslim edilir ve müşterinin kullanımına açıktır.",
      },
      {
        title: 'Sorumluluk Sınırı',
        body: "eCyPro'nun danışmanlık önerileri bilgi ve deneyime dayalı mesleki görüştür. Nihai iş kararları müşteriye aittir. eCyPro, müşteri kararlarının sonuçlarından sorumlu tutulamaz.",
      },
      {
        title: 'Uygulanacak Hukuk',
        body: "Bu şartlar Türk Hukuku'na tabidir. Uyuşmazlıklarda İstanbul Mahkemeleri yetkilidir.",
      },
    ],
  },
  cookies: {
    icon: Cookie,
    label: 'Çerez Politikası',
    heading: 'Çerez Politikası',
    lastUpdated: '2026-01-01',
    sections: [
      {
        title: 'Çerez Nedir?',
        body: 'Çerezler, ziyaret ettiğiniz web sitesi tarafından tarayıcınıza yerleştirilen küçük metin dosyalarıdır. Web sitesinin düzgün çalışması, kullanıcı deneyiminin iyileştirilmesi ve analitik amaçlar için kullanılmaktadır.',
      },
      {
        title: 'Kullandığımız Çerezler',
        body: 'Zorunlu Çerezler: Oturum ve güvenlik çerezleri — reddedilemez. Analitik Çerezler: Google Analytics ile anonim trafik analizi (opsiyonel). Tercih Çerezleri: Dil ve görünüm tercihleri (opsiyonel).',
      },
      {
        title: 'Üçüncü Taraf Çerezleri',
        body: 'Calendly ve EmailJS gibi entegrasyon araçları kendi çerezlerini yerleştirebilir. Bu çerezler ilgili sağlayıcıların politikalarına tabidir.',
      },
      {
        title: 'Çerez Yönetimi',
        body: 'Tarayıcı ayarlarınızdan çerezleri devre dışı bırakabilirsiniz. Zorunlu çerezlerin engellenmesi site işlevselliğini olumsuz etkileyebilir. Çerez tercihlerinizi güncellemek için: cerez@ecypro.com',
      },
      {
        title: 'Güncellemeler',
        body: 'Çerez politikamız, teknoloji ve yasal düzenlemelerdeki değişiklikler doğrultusunda güncellenebilir. Güncel versiyon her zaman bu sayfada yayımlanır.',
      },
    ],
  },
};

import { useState } from 'react';

export default function LegalPrototype() {
  const [activePage, setActivePage] = useState<LegalPage>('privacy');
  const page = CONFIG[activePage];
  const PageIcon = page.icon;

  return (
    <div className="min-h-screen bg-neutral-900 text-slate-50 font-sans">
      {/* Minimal nav for legal pages */}
      <nav
        role="navigation"
        aria-label="Ana navigasyon"
        className="bg-neutral-900/95 border-b border-slate-800 px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between"
      >
        <Link to="/" className="text-lg font-bold text-amber-400">
          eCyPro
        </Link>
        <Link
          to="/"
          className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1"
        >
          <ArrowRight size={12} className="rotate-180" aria-hidden="true" /> Ana Sayfa
        </Link>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Legal page tabs */}
        <div
          className="flex gap-2 mb-10 border-b border-slate-800 pb-4"
          role="tablist"
          aria-label="Yasal sayfa seçimi"
        >
          {PAGES.map((p) => {
            const { icon: Icon, label } = CONFIG[p];
            return (
              <button
                key={p}
                role="tab"
                aria-selected={activePage === p}
                onClick={() => setActivePage(p)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${activePage === p ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-neutral-800'}`}
              >
                <Icon size={14} aria-hidden="true" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            );
          })}
        </div>

        {/* Legal content */}
        <article>
          <header className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <PageIcon size={20} className="text-amber-400" aria-hidden="true" />
              <h1 className="text-2xl font-bold">{page.heading}</h1>
            </div>
            <p className="text-xs text-slate-500">
              Son güncelleme: <time dateTime={page.lastUpdated}>{page.lastUpdated}</time>
            </p>
          </header>

          <div className="space-y-8">
            {page.sections.map(({ title, body }, i) => (
              <section key={title} aria-labelledby={`section-${activePage}-${i}`}>
                <h2
                  id={`section-${activePage}-${i}`}
                  className="text-base font-semibold text-amber-400 mb-2"
                >
                  {i + 1}. {title}
                </h2>
                <p className="text-sm text-slate-300 leading-relaxed">{body}</p>
              </section>
            ))}
          </div>

          {activePage === 'privacy' && (
            <div className="mt-10 bg-neutral-800 border border-slate-700 rounded-2xl p-6">
              <h2 className="font-semibold mb-2">Başvuru</h2>
              <p className="text-sm text-slate-400 mb-3">
                KVKK haklarınızı kullanmak veya gizlilik sorularınız için:
              </p>
              <a
                href="mailto:kvkk@ecypro.com"
                className="inline-flex items-center gap-2 text-amber-400 text-sm hover:text-amber-300"
              >
                kvkk@ecypro.com <ArrowRight size={13} />
              </a>
            </div>
          )}
        </article>
      </main>

      <footer
        role="contentinfo"
        className="bg-neutral-950 border-t border-slate-800 px-4 sm:px-6 lg:px-8 py-8 text-center"
      >
        <div className="flex justify-center gap-4 mb-3">
          <Link
            to="/privacy"
            className={`text-xs ${activePage === 'privacy' ? 'text-amber-400' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Gizlilik
          </Link>
          <Link
            to="/terms"
            className={`text-xs ${activePage === 'terms' ? 'text-amber-400' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Şartlar
          </Link>
          <Link
            to="/cookies"
            className={`text-xs ${activePage === 'cookies' ? 'text-amber-400' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Çerezler
          </Link>
        </div>
        <p className="text-xs text-slate-600">© 2026 eCyPro Premium Consulting</p>
      </footer>
    </div>
  );
}
