import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>{children}</MemoryRouter>
);

describe('ServicesClusterSection — atom-2-2/3/4/5', () => {
  it('renders M&A cluster with heading', async () => {
    const { ServicesClusterSection } = await import('../ServicesClusterSection');
    render(<ServicesClusterSection />, { wrapper });
    expect(screen.getByTestId('services-cluster-section')).toBeTruthy();
  });

  it('renders 4 cluster groups', async () => {
    const { ServicesClusterSection } = await import('../ServicesClusterSection');
    render(<ServicesClusterSection />, { wrapper });
    const clusters = screen.getAllByTestId(/cluster-group-/);
    expect(clusters.length).toBe(4);
  });

  it('renders M&A cluster group', async () => {
    const { ServicesClusterSection } = await import('../ServicesClusterSection');
    render(<ServicesClusterSection />, { wrapper });
    expect(screen.getByTestId('cluster-group-ma')).toBeTruthy();
  });

  it('renders ESG cluster group', async () => {
    const { ServicesClusterSection } = await import('../ServicesClusterSection');
    render(<ServicesClusterSection />, { wrapper });
    expect(screen.getByTestId('cluster-group-esg')).toBeTruthy();
  });

  it('renders Fintech cluster group', async () => {
    const { ServicesClusterSection } = await import('../ServicesClusterSection');
    render(<ServicesClusterSection />, { wrapper });
    expect(screen.getByTestId('cluster-group-fintech')).toBeTruthy();
  });

  it('renders Aile cluster group', async () => {
    const { ServicesClusterSection } = await import('../ServicesClusterSection');
    render(<ServicesClusterSection />, { wrapper });
    expect(screen.getByTestId('cluster-group-aile')).toBeTruthy();
  });

  it('each cluster group has service items', async () => {
    const { ServicesClusterSection } = await import('../ServicesClusterSection');
    render(<ServicesClusterSection />, { wrapper });
    const items = screen.getAllByTestId(/cluster-item-/);
    expect(items.length).toBeGreaterThanOrEqual(4);
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
