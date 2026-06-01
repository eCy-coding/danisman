/**
 * Sprint 7 P42 — canonical AudioObject schema unit tests.
 *
 * Co-located vitest (`*.test.ts`) per WEB_STANDARDS §7. Covers the helper
 * extracted from `AudioOverview.tsx` so future audio embeds reuse a single
 * verified schema builder.
 */
import { describe, it, expect } from 'vitest';

import { buildAudioObjectSchema } from './structured-data';

describe('buildAudioObjectSchema', () => {
  const base = {
    audioUrl: 'https://cdn.ecypro.com/audio/trifecta.mp3',
    title: 'Fintech Trifecta — Audio Deep Dive',
    url: 'https://ecypro.com/blog/fintech-trifecta',
  };

  it('returns @context and @type for any input', () => {
    const schema = buildAudioObjectSchema(base);
    expect(schema['@context']).toBe('https://schema.org');
    expect(schema['@type']).toBe('AudioObject');
  });

  it('includes the required name + contentUrl + url fields', () => {
    const schema = buildAudioObjectSchema(base);
    expect(schema.name).toBe(base.title);
    expect(schema.contentUrl).toBe(base.audioUrl);
    expect(schema.url).toBe(base.url);
  });

  it('auto-detects audio/mpeg for mp3 URLs', () => {
    expect(buildAudioObjectSchema(base).encodingFormat).toBe('audio/mpeg');
  });

  it('auto-detects audio/mp4 for m4a URLs', () => {
    const schema = buildAudioObjectSchema({
      ...base,
      audioUrl: 'https://cdn.ecypro.com/audio/foo.m4a',
    });
    expect(schema.encodingFormat).toBe('audio/mp4');
  });

  it('honours an explicit encodingFormat override', () => {
    const schema = buildAudioObjectSchema({ ...base, encodingFormat: 'audio/wav' });
    expect(schema.encodingFormat).toBe('audio/wav');
  });

  it('serialises durationSec to ISO-8601 PT…M…S', () => {
    expect(buildAudioObjectSchema({ ...base, durationSec: 482 }).duration).toBe('PT8M2S');
  });

  it('drops seconds when the duration is a whole minute', () => {
    expect(buildAudioObjectSchema({ ...base, durationSec: 360 }).duration).toBe('PT6M');
  });

  it('serialises sub-minute durations as PT…S', () => {
    expect(buildAudioObjectSchema({ ...base, durationSec: 45 }).duration).toBe('PT45S');
  });

  it('omits duration when durationSec is not provided', () => {
    expect(buildAudioObjectSchema(base).duration).toBeUndefined();
  });

  it('omits uploadDate when publishedAt is not provided', () => {
    expect(buildAudioObjectSchema(base).uploadDate).toBeUndefined();
  });

  it('omits description when not provided', () => {
    expect(buildAudioObjectSchema(base).description).toBeUndefined();
  });

  it('threads optional uploadDate + description through to the schema', () => {
    const schema = buildAudioObjectSchema({
      ...base,
      durationSec: 482,
      publishedAt: '2026-07-07',
      description: 'SPK + MASAK + KVKK kesişimi.',
    });
    expect(schema.duration).toBe('PT8M2S');
    expect(schema.uploadDate).toBe('2026-07-07');
    expect(schema.description).toBe('SPK + MASAK + KVKK kesişimi.');
  });
});
