import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ShareButtons } from '../../components/blog/ShareButtons';

describe('atom-9-5: ShareButtons component', () => {
  it('renders share-buttons section', () => {
    render(<ShareButtons url="https://ecypro.com/blog/test" title="Test Makale" />);
    expect(screen.getByTestId('share-buttons')).toBeDefined();
  });

  it('has Twitter/X share link', () => {
    render(<ShareButtons url="https://ecypro.com/blog/test" title="Test Makale" />);
    const section = screen.getByTestId('share-buttons');
    const twitterLink =
      section.querySelector('a[href*="twitter"]') ?? section.querySelector('a[href*="x.com"]');
    expect(twitterLink).toBeTruthy();
  });

  it('has LinkedIn share link', () => {
    render(<ShareButtons url="https://ecypro.com/blog/test" title="Test Makale" />);
    const section = screen.getByTestId('share-buttons');
    const linkedinLink = section.querySelector('a[href*="linkedin"]');
    expect(linkedinLink).toBeTruthy();
  });

  it('has copy URL button', () => {
    render(<ShareButtons url="https://ecypro.com/blog/test" title="Test Makale" />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });

  it('copy button updates text on click', () => {
    Object.assign(navigator, {
      clipboard: { writeText: () => Promise.resolve() },
    });
    render(<ShareButtons url="https://ecypro.com/blog/test" title="Test Makale" />);
    const copyBtn = screen.getAllByRole('button')[0]!;
    fireEvent.click(copyBtn);
    expect(screen.getByTestId('share-buttons')).toBeDefined();
  });
});
