/**
 * P34-T04: GrowthBook Provider wrapper
 *
 * Wrap the app tree with this so that useFeatureIsOn / useFeatureValue
 * hooks work anywhere in the component tree.
 *
 * Feature loading is handled by AnalyticsProvider (consent-gated).
 * This provider simply makes the singleton `gb` instance available.
 */

import React from 'react';
import { GrowthBookProvider as _GrowthBookProvider } from '@growthbook/growthbook-react';
import { gb } from '../../lib/growthbook';

interface Props {
  children: React.ReactNode;
}

export const GrowthBookProvider: React.FC<Props> = ({ children }) => {
  return <_GrowthBookProvider growthbook={gb}>{children}</_GrowthBookProvider>;
};
