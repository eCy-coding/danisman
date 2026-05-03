import React, { Suspense } from 'react';
import { TrustMarquee } from '@/components/sections/TrustMarquee';
import { ValueProp } from '@/components/sections/ValueProp';
import { Services } from '@/components/sections/Services';
import { KPI } from '@/components/sections/KPI';
import { SuccessStories } from '@/components/sections/SuccessStories';
import { Insights } from '@/components/sections/Insights';
import { Certifications } from '@/components/sections/Certifications';
import { Contact } from '@/components/sections/Contact';

const ROICalculator = React.lazy(() => import('@/components/features/roi/ROICalculator').then(m => ({ default: m.ROICalculator })));

export const LandingContent: React.FC = () => {
  return (
    <>
      <TrustMarquee />
      <ValueProp />
      <Services />
      <div className="below-fold"><KPI /></div>
      <div className="below-fold"><SuccessStories /></div>
      <div className="below-fold">
        <Suspense fallback={<div className="min-h-64 bg-neutral" />}>
          <ROICalculator />
        </Suspense>
      </div>
      <div className="below-fold"><Insights /></div>
      <div className="below-fold"><Certifications /></div>
      <Contact />
    </>
  );
};

export default LandingContent;
