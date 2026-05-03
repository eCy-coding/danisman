import React, { Suspense } from 'react';
import { Hero } from '../components/sections/Hero';

// Lazy load heavy below-fold content
// Using @ if it's in src, or ../ if in root. Assuming src based on 'lazy loading efficiency' context of previous edits
const LandingContent = React.lazy(() => import('@/components/sections/LandingContent'));

export const LandingPage: React.FC = () => {
  return (
    <>
        <Hero />
        <Suspense fallback={<div className="min-h-screen" />}>
          <LandingContent />
        </Suspense>
    </>
  );
};
