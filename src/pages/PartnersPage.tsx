import React from 'react';
import { Link } from 'react-router-dom';
import { Handshake } from 'lucide-react';
import { FadeIn } from '../components/common/FadeIn';

/**
 * P45: Sahte Oracle/Microsoft/Salesforce/SAP "Platinum/Gold/Strategic/Global
 * Partner" kartları kaldırıldı — gerçek partnership olmadan markaları kullanmak
 * yanıltıcı. Sayfa şu an "Coming Soon" placeholder + iletişim CTA.
 * Gerçek partnership anlaşmaları imzalandıkça burada listelenecektir.
 */
export const PartnersPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-neutral pt-32 pb-24 text-slate-300 font-sans">
      <div className="max-w-3xl mx-auto px-6 md:px-12 text-center">
        <FadeIn>
          <span className="text-secondary font-bold tracking-widest uppercase text-xs mb-4 inline-block">
            Stratejik İş Birliği
          </span>
          <h1 className="text-4xl md:text-6xl font-serif font-medium text-white mb-6">
            Birlikte <span className="text-primary">Değer Yaratırız</span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-slate-400 font-light mb-12">
            eCyverse Premium Consulting; teknoloji sağlayıcıları, hukuk firmaları, akademik
            kurumlar ve sektörel uzmanlarla iş birliği yapar. Ortaklık ağımız ihtiyaca göre
            engagement bazında kurulur. Gerçek partnership anlaşmaları aktive oldukça bu
            sayfada şeffaf biçimde paylaşılacaktır.
          </p>
        </FadeIn>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-12 md:p-20 text-center mt-16">
          <div className="w-16 h-16 rounded-2xl bg-secondary/10 border border-secondary/20 flex items-center justify-center mx-auto mb-8">
            <Handshake className="w-8 h-8 text-secondary" />
          </div>
          <h2 className="text-3xl font-serif font-bold text-white mb-6">
            Ortaklık Görüşmesi
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto mb-10">
            Premium consulting ekosistemine değer katacak bir iş birliği önerin var mı?
            Sizinle birlikte engagement çerçevesini konuşalım.
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center justify-center rounded-2xl bg-secondary px-8 py-4 font-semibold text-neutral hover:bg-secondary/90 transition-colors"
          >
            İletişime Geçin
          </Link>
        </div>
      </div>
    </div>
  );
};
