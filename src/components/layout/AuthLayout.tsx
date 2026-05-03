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
      <SEO title={seoTitle} />
      <FadeIn>
        <div className="glass-card p-8 rounded-xl w-full max-w-md">
           {children}
        </div>
      </FadeIn>
    </div>
  );
};
