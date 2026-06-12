import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>{children}</MemoryRouter>
);

// taxonomy v2 (ADR-services-taxonomy-v2): hardcoded 4-cluster section replaced
// by the registry-driven lifecycle visualizer — assertions track the new ids.
describe('ServicesClusterSection — atom-2-2/3/4/5 (lifecycle v2)', () => {
  it('renders the cluster section shell', async () => {
    const { ServicesClusterSection } = await import('../ServicesClusterSection');
    render(<ServicesClusterSection />, { wrapper });
    expect(screen.getByTestId('services-cluster-section')).toBeTruthy();
  });

  it('renders 7 lifecycle cluster groups', async () => {
    const { ServicesClusterSection } = await import('../ServicesClusterSection');
    render(<ServicesClusterSection />, { wrapper });
    const clusters = screen.getAllByTestId(/lifecycle-cluster-/);
    expect(clusters.length).toBe(7);
  });

  it('renders M&A cluster group', async () => {
    const { ServicesClusterSection } = await import('../ServicesClusterSection');
    render(<ServicesClusterSection />, { wrapper });
    expect(screen.getByTestId('lifecycle-cluster-ma')).toBeTruthy();
  });

  it('renders ESG cluster group', async () => {
    const { ServicesClusterSection } = await import('../ServicesClusterSection');
    render(<ServicesClusterSection />, { wrapper });
    expect(screen.getByTestId('lifecycle-cluster-esg')).toBeTruthy();
  });

  it('renders Fintech cluster group', async () => {
    const { ServicesClusterSection } = await import('../ServicesClusterSection');
    render(<ServicesClusterSection />, { wrapper });
    expect(screen.getByTestId('lifecycle-cluster-fintech')).toBeTruthy();
  });

  it('renders Aile cluster group', async () => {
    const { ServicesClusterSection } = await import('../ServicesClusterSection');
    render(<ServicesClusterSection />, { wrapper });
    expect(screen.getByTestId('lifecycle-cluster-aile')).toBeTruthy();
  });

  it('each cluster group has numbered lifecycle steps', async () => {
    const { ServicesClusterSection } = await import('../ServicesClusterSection');
    render(<ServicesClusterSection />, { wrapper });
    const items = screen.getAllByTestId(/lifecycle-step-/);
    expect(items.length).toBe(35);
  });
});

describe('ServicesDiscoveryCTA — atom-2-6', () => {
  it('renders discovery CTA section', async () => {
    const { ServicesDiscoveryCTA } = await import('../ServicesDiscoveryCTA');
    render(<ServicesDiscoveryCTA />, { wrapper });
    expect(screen.getByTestId('services-discovery-cta')).toBeTruthy();
  });

  it('has Discovery Call / Keşif Görüşmesi text', async () => {
    const { ServicesDiscoveryCTA } = await import('../ServicesDiscoveryCTA');
    render(<ServicesDiscoveryCTA />, { wrapper });
    expect(screen.getAllByText(/Keşif Görüşmesi|Discovery Call/i).length).toBeGreaterThan(0);
  });

  it('has KVKKBadge discovery variant', async () => {
    const { ServicesDiscoveryCTA } = await import('../ServicesDiscoveryCTA');
    render(<ServicesDiscoveryCTA />, { wrapper });
    expect(screen.getByTestId('kvkk-badge-discovery')).toBeTruthy();
  });
});
