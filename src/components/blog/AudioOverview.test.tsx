/**
 * AudioOverview component — Sprint 3 (Audio Deep Dive embed)
 *
 * Coverage:
 *   - Renders headline + ARIA + native <audio> element
 *   - Duration badge appears only when durationSec provided
 *   - Description optional; absent when omitted
 *   - JSON-LD AudioObject only when canonicalUrl + includeSchema=true
 *   - ISO-8601 duration encoding for schema
 *   - m4a vs mp3 MIME selection
 */

import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { AudioOverview } from './AudioOverview';

describe('AudioOverview', () => {
  const baseProps = {
    audioUrl: 'https://cdn.ecypro.com/audio/trifecta.mp3',
    title: 'Fintech Trifecta — Audio Deep Dive',
  };

  it('renders title + NotebookLM eyebrow + native audio element', () => {
    render(<AudioOverview {...baseProps} />);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      'Fintech Trifecta — Audio Deep Dive',
    );
    expect(screen.getByText(/NotebookLM/i)).toBeInTheDocument();

    const section = screen.getByTestId('blog-audio-overview');
    const audio = within(section).getByLabelText(baseProps.title);
    expect(audio.tagName).toBe('AUDIO');
    expect(audio).toHaveAttribute('controls');
    expect(audio).toHaveAttribute('preload', 'metadata');
  });

  it('shows formatted duration badge when durationSec provided', () => {
    render(<AudioOverview {...baseProps} durationSec={482} />);
    expect(screen.getByText('8:02')).toBeInTheDocument();
  });

  it('omits duration badge when durationSec missing', () => {
    render(<AudioOverview {...baseProps} />);
    expect(screen.queryByText(/^\d+:\d{2}$/)).toBeNull();
  });

  it('renders description paragraph when provided', () => {
    render(
      <AudioOverview
        {...baseProps}
        description="SPK + MASAK + KVKK kesişiminde stratejik arbitraj."
      />,
    );
    expect(screen.getByText(/SPK \+ MASAK \+ KVKK/)).toBeInTheDocument();
  });

  it('emits JSON-LD AudioObject when canonicalUrl provided', () => {
    const { container } = render(
      <AudioOverview
        {...baseProps}
        durationSec={482}
        publishedAt="2026-07-07"
        canonicalUrl="https://ecypro.com/blog/fintech-trifecta"
        description="Deep dive on the 2026 trifecta."
      />,
    );
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).not.toBeNull();
    const json = JSON.parse(script!.innerHTML);
    expect(json).toMatchObject({
      '@context': 'https://schema.org',
      '@type': 'AudioObject',
      name: baseProps.title,
      contentUrl: baseProps.audioUrl,
      duration: 'PT8M2S',
      uploadDate: '2026-07-07',
      url: 'https://ecypro.com/blog/fintech-trifecta',
      encodingFormat: 'audio/mpeg',
    });
  });

  it('skips JSON-LD when canonicalUrl omitted', () => {
    const { container } = render(<AudioOverview {...baseProps} />);
    expect(container.querySelector('script[type="application/ld+json"]')).toBeNull();
  });

  it('skips JSON-LD when includeSchema=false even with canonicalUrl', () => {
    const { container } = render(
      <AudioOverview
        {...baseProps}
        canonicalUrl="https://ecypro.com/blog/foo"
        includeSchema={false}
      />,
    );
    expect(container.querySelector('script[type="application/ld+json"]')).toBeNull();
  });

  it('detects m4a encoding for AudioObject + <source>', () => {
    const { container } = render(
      <AudioOverview
        audioUrl="https://cdn.ecypro.com/audio/foo.m4a"
        title="m4a sample"
        canonicalUrl="https://ecypro.com/blog/foo"
      />,
    );
    const source = container.querySelector('source');
    expect(source).toHaveAttribute('type', 'audio/mp4');

    const script = container.querySelector('script[type="application/ld+json"]');
    const json = JSON.parse(script!.innerHTML);
    expect(json.encodingFormat).toBe('audio/mp4');
  });

  it('encodes pure-minutes duration as PT{m}M without seconds', () => {
    const { container } = render(
      <AudioOverview
        {...baseProps}
        durationSec={360}
        canonicalUrl="https://ecypro.com/blog/foo"
      />,
    );
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(JSON.parse(script!.innerHTML).duration).toBe('PT6M');
  });
});
