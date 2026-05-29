import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

const { emitMock } = vi.hoisted(() => ({ emitMock: vi.fn() }));

vi.mock('motion/react', () => ({
  motion: new Proxy(
    {},
    {
      get:
        () =>
        ({ children, ...props }: React.HTMLAttributes<HTMLElement>) =>
          React.createElement('div', props, children),
    },
  ),
  useReducedMotion: () => true,
}));
vi.mock('react-router-dom', () => ({
  Link: ({ children, to, ...props }: { children: React.ReactNode; to: string }) =>
    React.createElement('a', { href: to, ...props }, children),
}));
vi.mock('recharts', () => {
  const Pass = ({ children }: { children?: React.ReactNode }) =>
    React.createElement('div', null, children);
  const Noop = () => null;
  return {
    ResponsiveContainer: Pass,
    AreaChart: Pass,
    Area: Noop,
    XAxis: Noop,
    Tooltip: Noop,
    CartesianGrid: Noop,
  };
});
vi.mock('../../ui/smart-form/SmartSlider', () => ({
  SmartSlider: ({ name }: { name: string }) =>
    React.createElement('div', { 'data-testid': `slider-${name}` }),
}));
vi.mock('../../../lib/analytics-events', () => ({ emit: emitMock }));

import { GrowthCalculator } from './GrowthCalculator';

describe('GrowthCalculator — P34-T02 ROI conversion tracking', () => {
  beforeEach(() => emitMock.mockClear());

  it('renders the CTA as a link to /discovery-call', () => {
    render(<GrowthCalculator />);
    const cta = document.querySelector('a[href="/discovery-call"]');
    expect(cta).not.toBeNull();
  });

  it('emits roi_calc_step cta_click when the CTA is clicked', () => {
    render(<GrowthCalculator />);
    const cta = document.querySelector('a[href="/discovery-call"]') as HTMLAnchorElement;
    fireEvent.click(cta);
    expect(emitMock).toHaveBeenCalledWith(
      'roi_calc_step',
      expect.objectContaining({ step: 'cta_click' }),
    );
  });

  it('emits a debounced roi_calc_step result_view', async () => {
    render(<GrowthCalculator />);
    await waitFor(
      () =>
        expect(emitMock).toHaveBeenCalledWith(
          'roi_calc_step',
          expect.objectContaining({ step: 'result_view' }),
        ),
      { timeout: 1500 },
    );
  });
});
