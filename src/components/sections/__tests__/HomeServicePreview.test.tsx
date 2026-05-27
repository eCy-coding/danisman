import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { HomeServicePreview } from '../HomeServicePreview';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>{children}</MemoryRouter>
);

describe('HomeServicePreview', () => {
  it('renders section with testid', () => {
    render(<HomeServicePreview />, { wrapper });
    expect(screen.getByTestId('home-service-preview')).toBeTruthy();
  });

  it('renders 4 service cluster cards', () => {
    render(<HomeServicePreview />, { wrapper });
    const cards = screen.getAllByTestId(/service-cluster-/);
    expect(cards.length).toBe(4);
  });

  it('renders M&A cluster', () => {
    render(<HomeServicePreview />, { wrapper });
    expect(screen.getByTestId('service-cluster-ma')).toBeTruthy();
  });

  it('renders ESG cluster', () => {
    render(<HomeServicePreview />, { wrapper });
    expect(screen.getByTestId('service-cluster-esg')).toBeTruthy();
  });

  it('renders Fintech cluster', () => {
    render(<HomeServicePreview />, { wrapper });
    expect(screen.getByTestId('service-cluster-fintech')).toBeTruthy();
  });

  it('renders Aile cluster', () => {
    render(<HomeServicePreview />, { wrapper });
    expect(screen.getByTestId('service-cluster-aile')).toBeTruthy();
  });

  it('each cluster has a CTA link to /services', () => {
    render(<HomeServicePreview />, { wrapper });
    const links = screen.getAllByRole('link');
    const serviceLinks = links.filter((l) => l.getAttribute('href')?.includes('services'));
    expect(serviceLinks.length).toBeGreaterThan(0);
  });

  it('renders accessible section heading', () => {
    render(<HomeServicePreview />, { wrapper });
    expect(screen.getByRole('heading', { level: 2 })).toBeTruthy();
  });
});
