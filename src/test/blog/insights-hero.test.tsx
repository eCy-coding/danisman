import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';

vi.mock('../../components/blog/BlogList', () => ({
  default: () => <div data-testid="blog-list-stub" />,
}));
vi.mock('../../components/layout/Navbar', () => ({ Navbar: () => <nav /> }));
vi.mock('../../components/layout/Footer', () => ({ Footer: () => <footer /> }));

import BlogPage from '../../pages/BlogPage';

function renderBlog() {
  return render(
    <HelmetProvider>
      <MemoryRouter>
        <BlogPage />
      </MemoryRouter>
    </HelmetProvider>,
  );
}

describe('atom-8-1: Blog/Insights hero section', () => {
  it('renders insights-hero section', () => {
    renderBlog();
    expect(screen.getByTestId('insights-hero')).toBeDefined();
  });

  it('hero contains h1 heading', () => {
    renderBlog();
    const hero = screen.getByTestId('insights-hero');
    expect(hero.querySelector('h1')).toBeTruthy();
  });

  it('hero contains "İçgörüler" text', () => {
    renderBlog();
    const hero = screen.getByTestId('insights-hero');
    expect(hero.textContent).toContain('İçgörüler');
  });

  it('hero has an eyebrow label', () => {
    renderBlog();
    const hero = screen.getByTestId('insights-hero');
    const eyebrow = hero.querySelector('p');
    expect(eyebrow).toBeTruthy();
  });
});
