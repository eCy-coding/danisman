/**
 * P57.10 — Admin help page.
 *
 * Searchable FAQ + sık iş video placeholder.
 */

import React, { useState, useMemo } from 'react';
import { Search, Keyboard, BookOpen, MessageSquare } from 'lucide-react';
import { Breadcrumb, Accordion } from '../../components/admin/ui';

interface FaqItem {
  q: string;
  a: string;
}

const HELP_FAQ: FaqItem[] = [
  {
    q: 'Yeni blog yazısı nasıl eklerim?',
    a: 'Sol menüden "Blog" → "Yeni Yazı" düğmesine basın. Başlık + Slug girin; içerik Markdown editöründe yazın. Taslak olarak kaydederseniz site\'da görünmez; "Yayında" yaparsanız anında yansır.',
  },
  {
    q: 'Bir hizmetin metnini nasıl güncellerim?',
    a: 'Sol menüden "Hizmetler" → 21 hizmet listesinden seçin → "Düzenle". Hero, içerik ve ticari sekmelerinden alanları güncelleyip kaydedin. Değişiklik canlıya 30 saniye içinde yansır.',
  },
  {
    q: 'Yeni bir bülten kampanyası nasıl gönderirim?',
    a: 'Sol menü → "Bülten" → "Kampanyalar" → "Yeni Kampanya". 4 adımlı sihirbaz: Audience → Compose → Önizleme → Gönder. Önce "Test Gönder" ile kendinize test edin.',
  },
  {
    q: "Bir lead'e nasıl not eklerim?",
    a: 'Sol menü → "Lead Yönetimi" (Contacts) → lead\'e tıklayın → Detay sayfasında "Notlar" bölümünden ekleyin. Notlar admin\'e özel — müşteri görmez.',
  },
  {
    q: 'Bir admin kullanıcısı silmek istiyorum.',
    a: 'Kullanıcı silmek yerine "İptal Et" tercih edilir. Sol menü → "Kullanıcılar" → ilgili kullanıcı → role değiştir veya devre dışı bırak. Hard delete için DB erişimi gerekir.',
  },
  {
    q: 'KVKK aydınlatma metnini nereden değiştirebilirim?',
    a: '"Ayarlar" → "Yasal" sekmesinden KVKK metnini güncelleyebilirsiniz. Değişiklik 1 dk içinde site\'a yansır.',
  },
  {
    q: 'Logo veya marka rengini nasıl değiştiririm?',
    a: '"Ayarlar" → "Marka" sekmesinden logo URL, primary/secondary/accent renkleri ve font ailesini güncelleyebilirsiniz.',
  },
  {
    q: 'Bir hatayla karşılaşırsam ne yapmalıyım?',
    a: "Önce sağ üstteki yenile düğmesine basın. Sorun devam ederse Sentry log'larına bakın veya operations@ecypro.com adresine yazın.",
  },
  {
    q: "2FA'yı nasıl aktif ederim?",
    a: '"Profilim" → "2FA" sekmesi → QR kodu Authenticator uygulaması (1Password, Google Auth, Authy) ile tarayın → 6 haneli kodu doğrulayın. Her girişte kod istenir.',
  },
  {
    q: 'Klavye kısayollarına nasıl ulaşırım?',
    a: 'Herhangi bir admin sayfasında "?" tuşuna basın — kısayol listesi açılır. Yaygın kısayollar: G+D Dashboard, G+L Leads, G+C Campaigns, / Arama.',
  },
];

const SHORTCUTS: Array<{ keys: string; desc: string }> = [
  { keys: '?', desc: 'Kısayolları göster' },
  { keys: 'G+D', desc: "Dashboard'a git" },
  { keys: 'G+L', desc: 'Lead yönetimi' },
  { keys: 'G+B', desc: 'Blog' },
  { keys: 'G+C', desc: 'Kampanyalar' },
  { keys: 'G+S', desc: 'Ayarlar' },
  { keys: '/', desc: 'Genel arama' },
  { keys: 'ESC', desc: "Modal'ı kapat" },
];

export const AdminHelpPage: React.FC = () => {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (query.trim().length < 2) return HELP_FAQ;
    const q = query.toLowerCase();
    return HELP_FAQ.filter((f) => f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q));
  }, [query]);

  return (
    <div className="space-y-6">
      <Breadcrumb />
      <header>
        <h1 className="text-2xl font-serif font-bold text-white">Yardım Merkezi</h1>
        <p className="text-sm text-slate-400 mt-1">
          Sık sorulan sorular, klavye kısayolları ve sıradan görev rehberi.
        </p>
      </header>

      <label className="relative block max-w-2xl">
        <span className="absolute inset-y-0 left-3 inline-flex items-center text-slate-400 pointer-events-none">
          <Search size={14} />
        </span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Yardım içinde ara…"
          className="w-full bg-white/[0.02] border border-white/15 rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-secondary/40"
        />
      </label>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <article className="lg:col-span-2 bg-white/[0.02] border border-white/10 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-3 inline-flex items-center gap-2">
            <BookOpen size={14} /> Sık Sorulan Sorular
          </h2>
          {filtered.length === 0 ? (
            <p className="text-slate-400 text-sm">"{query}" için eşleşme bulunamadı.</p>
          ) : (
            <Accordion
              items={filtered.map((f, idx) => ({
                id: `faq-${idx}`,
                title: f.q,
                content: <p className="text-slate-300">{f.a}</p>,
              }))}
            />
          )}
        </article>

        <aside className="space-y-4">
          <article className="bg-white/[0.02] border border-white/10 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-white mb-3 inline-flex items-center gap-2">
              <Keyboard size={14} /> Klavye Kısayolları
            </h2>
            <ul className="space-y-2 text-sm">
              {SHORTCUTS.map((s) => (
                <li key={s.keys} className="flex items-center justify-between">
                  <span className="text-slate-300">{s.desc}</span>
                  <kbd className="text-xs font-mono bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-slate-200">
                    {s.keys}
                  </kbd>
                </li>
              ))}
            </ul>
          </article>

          <article className="bg-white/[0.02] border border-white/10 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-white mb-2 inline-flex items-center gap-2">
              <MessageSquare size={14} /> Destek
            </h2>
            <p className="text-sm text-slate-300 mb-3">Yanıtını bulamadığınız bir sorun mu var?</p>
            <a
              href="mailto:operations@ecypro.com"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-secondary text-neutral font-semibold text-sm hover:bg-secondary/90"
            >
              operations@ecypro.com
            </a>
            <p className="text-xs text-slate-500 mt-3">Yanıt süresi: 1 iş günü</p>
          </article>
        </aside>
      </div>
    </div>
  );
};

export default AdminHelpPage;
