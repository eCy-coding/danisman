import React, { Suspense } from 'react';
import { Hero } from '../components/sections/Hero';

// P44: trivial content change forces a new lp.js content hash/etag so Vercel's
// edge cache can no longer serve the poisoned text/plain response that broke
// every visitor's dynamic import on the homepage. See vercel.json MIME fix.
// Lazy load heavy below-fold content
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
