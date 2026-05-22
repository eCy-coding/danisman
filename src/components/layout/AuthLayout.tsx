import React from 'react';
import { FadeIn } from '../common/FadeIn';
import { SEO } from '../common/SEO';

interface AuthLayoutProps {
  children: React.ReactNode;
  seoTitle: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, seoTitle }) => {
  return (
    <div className="min-h-screen bg-neutral flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      {/* P15 — auth route'ları SERP'te değer üretmez, noindex. */}
      <SEO title={seoTitle} noIndex />
      <FadeIn>
        {/* P45 D4: glass-card → solid surface (CLAUDE.md doktrini: glassmorphism YOK). */}
        <div className="bg-white/5 border border-white/10 p-8 rounded-2xl w-full max-w-md shadow-2xl">
          {children}
        </div>
      </FadeIn>
    </div>
  );
};
