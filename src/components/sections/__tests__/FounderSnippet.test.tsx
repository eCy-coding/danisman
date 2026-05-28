import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { FounderSnippet } from '../FounderSnippet';

describe('FounderSnippet', () => {
  it('renders section with testid', () => {
    render(<FounderSnippet />);
    expect(screen.getByTestId('founder-snippet')).toBeTruthy();
  });

  it('renders founder name Emre Can Yalcin', () => {
    render(<FounderSnippet />);
    expect(screen.getByText(/Emre Can Yalçın|Emre C\. Yalçın/i)).toBeTruthy();
  });

  it('renders manifesto / vision text', () => {
    render(<FounderSnippet />);
    const section = screen.getByTestId('founder-snippet');
    expect(section.textContent?.length).toBeGreaterThan(100);
  });

  it('has accessible heading', () => {
    render(<FounderSnippet />);
    expect(screen.getByRole('heading')).toBeTruthy();
  });

  it('renders Founder title badge', () => {
    render(<FounderSnippet />);
    expect(screen.getAllByText(/Founder|Kurucu/i).length).toBeGreaterThan(0);
  });
});
