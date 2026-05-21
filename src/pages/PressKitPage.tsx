/**
 * P51.4 — Press Kit page (/press).
 *
 * Press kit downloads: logo zipi, brand guidelines, founder bio (50w/150w/300w),
 * media contact email, press inquiry form.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Download, Mail, ArrowRight } from 'lucide-react';
import { FounderPortrait } from '../components/common/FounderPortrait';

const BIO_50 =
  "Emre Can Yalçın, eCyPro Premium Consulting'in kurucusu ve baş stratejisti. Stratejik dönüşüm, kurumsal yönetişim ve kültür mühendisliği alanlarında pratik yürütüyor.";

const BIO_150 =
  "Emre Can Yalçın, eCyPro Premium Consulting'in kurucusu ve baş stratejisti. Stratejik dönüşüm, kurumsal yönetişim, M&A advisory ve kültür mühendisliği alanlarında engagement'lar yürütüyor. eCyverse ekosisteminin premium danışmanlık kolunu kurarak, Türkiye merkezli orta-büyük ölçekli şirketlere AB pazarlarında engagement deneyimi getiriyor. Çalıştığı engagement'larda 5-katmanlı metodoloji (Vizyon Mimarı, Strateji Köprüsü, Sonuç Mühendisliği, Kültür Sürdürülebilirliği, Anonim Sonuç Loop'u) uygular.";

const BIO_300 =
  "Emre Can Yalçın, eCyPro Premium Consulting'in kurucusu ve baş stratejisti olarak Türkiye iş dünyasında premium boutique consulting pazarında pozisyon almıştır. 5+ yıllık pratik deneyimi boyunca 120+ stratejik karar oluşumuna katkıda bulunmuş, 12+ sektörde engagement yürütmüştür. eCyverse ekosisteminin premium danışmanlık kolunu kurarak, Big4 mid-market boşluğunda boutique premium pozisyonunu hedeflemiştir. Çalıştığı engagement'larda kendi geliştirdiği 5-katmanlı metodolojiyi uygular: Vizyon Mimarı (3-5 yıllık kuzey yıldızı), Strateji Köprüsü (OKR + quarterly cadence + RACI), Sonuç Mühendisliği (KPI baseline + measurement), Kültür Sürdürülebilirliği (değişim yönetimi + leadership coaching), Anonim Sonuç Loop'u (NDA-friendly retrospective). Strategic management advisory, organizational transformation, M&A advisory, family business governance ve culture engineering uzmanlık alanlarıdır. Türkiye + AB pazarlarında engagement deneyimine sahip.";

export const PressKitPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-neutral text-slate-300">
      <Helmet>
        <title>Press Kit | eCyPro Premium Consulting</title>
        <meta
          name="description"
          content="Medya kiti: logo, marka rehberi, founder bio (50w/150w/300w), basın iletişim. Medya mensupları için indirilebilir varlıklar."
        />
        <link rel="canonical" href="https://www.ecypro.com/press" />
      </Helmet>
      <section className="pt-32 pb-12 px-6 md:px-12 border-b border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="text-xs font-bold uppercase tracking-[0.25em] text-secondary mb-3">
            Medya İçin
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4 leading-tight">
            Press Kit
          </h1>
          <p className="text-lg text-slate-400 leading-relaxed">
            eCyPro Premium Consulting hakkında haber yapmak isteyen medya mensupları için bir araya
            getirdiğimiz varlık paketi. Bio versiyonları, logo, founder portretleri, marka rehberi.
          </p>
        </div>
      </section>

      <section className="py-12 px-6 md:px-12 grid md:grid-cols-3 gap-10 max-w-6xl mx-auto">
        <aside className="md:col-span-1">
          <FounderPortrait size="lg" className="mb-4" />
          <h2 className="text-xl font-serif font-bold text-white mb-1">Emre Can Yalçın</h2>
          <p className="text-sm text-slate-400 mb-4">Founder & Chief Strategist</p>
          <a
            href="mailto:press@ecypro.com"
            className="inline-flex items-center gap-2 px-5 py-3 min-h-[44px] rounded-lg bg-secondary text-neutral font-semibold hover:bg-secondary/90 transition-colors text-sm"
          >
            <Mail size={16} /> press@ecypro.com
          </a>
        </aside>

        <div className="md:col-span-2 space-y-8">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-secondary mb-3">
              Bio (50 kelime)
            </h2>
            <p className="text-slate-200 leading-relaxed">{BIO_50}</p>
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-secondary mb-3">
              Bio (150 kelime)
            </h2>
            <p className="text-slate-200 leading-relaxed">{BIO_150}</p>
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-secondary mb-3">
              Bio (300 kelime)
            </h2>
            <p className="text-slate-200 leading-relaxed">{BIO_300}</p>
          </div>
        </div>
      </section>

      <section className="py-12 px-6 md:px-12 border-t border-white/5 bg-white/[0.02]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-white mb-8">
            İndirilebilir Varlıklar
          </h2>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                name: 'Logo Paketi (SVG + PNG)',
                file: '/brand/logo-horizontal.svg',
                desc: 'Yatay, dikey, mono ve favicon varyantları',
              },
              {
                name: 'Brand Guidelines',
                file: '/brand/BRAND_GUIDE.md',
                desc: 'Renk palette, typography, anatomi',
              },
              {
                name: 'Founder Portrait (HD)',
                file: '/founder.jpg',
                desc: '1200×1200, 300dpi (yoksa SVG fallback)',
              },
              {
                name: 'OG Share Image',
                file: '/brand/og-share.svg',
                desc: '1200×630 sosyal share',
              },
              { name: 'Icon Mark', file: '/brand/icon-mark.svg', desc: 'Standalone square icon' },
              {
                name: 'Stacked Logo',
                file: '/brand/logo-stacked.svg',
                desc: '200×220 vertical lock-up',
              },
            ].map((asset) => (
              <a
                key={asset.file}
                href={asset.file}
                download
                className="group p-5 bg-white/5 border border-white/10 rounded-xl hover:border-secondary/30 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <Download size={20} className="text-secondary" />
                  <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                    İndir
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mb-2">{asset.name}</h3>
                <p className="text-xs text-slate-400">{asset.desc}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 md:px-12 border-t border-white/5">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-white mb-5">
            Medya İletişimi
          </h2>
          <p className="text-slate-400 mb-8 leading-relaxed">
            Röportaj, panel davet, podcast konuğu, expert quote talepleri için. Aynı gün içinde
            dönüyoruz.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href="mailto:press@ecypro.com"
              className="inline-flex items-center gap-2 px-8 py-4 min-h-[52px] rounded-xl bg-secondary text-neutral font-semibold hover:bg-secondary/90 transition-colors"
            >
              <Mail size={18} /> press@ecypro.com
            </a>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-8 py-4 min-h-[52px] rounded-xl border border-white/15 text-white font-semibold hover:bg-white/5 transition-colors"
            >
              İletişim Formu <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PressKitPage;
