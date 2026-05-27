import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NewsletterSidebar } from '../../components/blog/NewsletterSidebar';

describe('atom-8-3: NewsletterSidebar', () => {
  it('renders newsletter-sidebar section', () => {
    render(<NewsletterSidebar />);
    expect(screen.getByTestId('newsletter-sidebar')).toBeDefined();
  });

  it('contains subscribe button', () => {
    render(<NewsletterSidebar />);
    const btn = screen.getByRole('button');
    expect(btn).toBeDefined();
  });

  it('has KVKK badge / privacy notice', () => {
    render(<NewsletterSidebar />);
    const sidebar = screen.getByTestId('newsletter-sidebar');
    expect(sidebar.textContent?.toLowerCase()).toMatch(/kvkk|gizlilik|privacy/i);
  });

  it('has email input field', () => {
    render(<NewsletterSidebar />);
    expect(screen.getByRole('textbox')).toBeDefined();
  });
});
