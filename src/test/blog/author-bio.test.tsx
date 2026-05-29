import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuthorBio } from '../../components/blog/AuthorBio';

describe('atom-9-3: AuthorBio component', () => {
  it('renders author-bio section', () => {
    render(<AuthorBio author="Emre Can Yalçın" />);
    expect(screen.getByTestId('author-bio')).toBeDefined();
  });

  it('displays author name', () => {
    render(<AuthorBio author="Emre Can Yalçın" />);
    expect(screen.getByTestId('author-bio').textContent).toContain('Emre Can Yalçın');
  });

  it('has avatar element', () => {
    render(<AuthorBio author="Emre Can Yalçın" />);
    const bio = screen.getByTestId('author-bio');
    const avatar = bio.querySelector('img') ?? bio.querySelector('[aria-hidden]');
    expect(avatar ?? bio.querySelector('.rounded-full')).toBeTruthy();
  });

  it('has title/role text', () => {
    render(<AuthorBio author="Emre Can Yalçın" />);
    const bio = screen.getByTestId('author-bio');
    expect(bio.textContent).toMatch(/stratejist|founder|danışman/i);
  });
});
