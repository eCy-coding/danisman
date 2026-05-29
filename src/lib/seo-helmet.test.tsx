import React from 'react';
import { render, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { Helmet } from '@/lib/seo-helmet';

describe('Helmet shim — title extraction', () => {
  beforeEach(() => {
    document.title = '';
  });

  it('sets document.title when children is a string literal', async () => {
    await act(async () => {
      render(
        <Helmet>
          <title>Simple Title</title>
        </Helmet>,
      );
    });
    expect(document.title).toBe('Simple Title');
  });

  it('sets document.title when children is a number', async () => {
    await act(async () => {
      render(<Helmet>{React.createElement('title', null, 42)}</Helmet>);
    });
    expect(document.title).toBe('42');
  });

  it('sets document.title when children is an evaluated ternary expression', async () => {
    const lang = 'tr';
    await act(async () => {
      render(
        <Helmet>
          <title>{lang === 'tr' ? 'Türkçe Başlık' : 'English Title'}</title>
        </Helmet>,
      );
    });
    expect(document.title).toBe('Türkçe Başlık');
  });

  it('sets document.title when children is array (expr + text literal) — BlogPostPage pattern', async () => {
    // Simulates: <title>{post.title} | eCyPro Blog</title>
    // JSX compiles to React.createElement('title', null, post.title, ' | eCyPro Blog')
    // → props.children = [post.title, ' | eCyPro Blog']
    const postTitle = 'My Post Title';
    await act(async () => {
      render(<Helmet>{React.createElement('title', null, postTitle, ' | eCyPro Blog')}</Helmet>);
    });
    expect(document.title).toBe('My Post Title | eCyPro Blog');
  });

  it('sets document.title when children is array with i18n prefix — RegisterPage pattern', async () => {
    // Simulates: <title>{t('auth.register') || 'Register'} | eCyPro</title>
    // → props.children = ['Kayıt Ol', ' | eCyPro']
    const tResult = 'Kayıt Ol';
    await act(async () => {
      render(<Helmet>{React.createElement('title', null, tResult, ' | eCyPro')}</Helmet>);
    });
    expect(document.title).toBe('Kayıt Ol | eCyPro');
  });

  it('sets document.title when children is nested array', async () => {
    // Extra resilience: deeply nested array (unlikely in practice but safe)
    await act(async () => {
      render(<Helmet>{React.createElement('title', null, ['Nested', ' Title'])}</Helmet>);
    });
    expect(document.title).toBe('Nested Title');
  });
});
