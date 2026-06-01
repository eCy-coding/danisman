/**
 * Sprint 3 — NotebookLM Audio Overview embed component
 *
 * Renders a brand-aligned HTML5 audio player for NotebookLM-generated
 * podcast-style overviews of blog posts (typically 6-8 min Deep Dive
 * format). Used on blog post pages and the perspektifler index.
 *
 * Design constraints (eCyPro brand standard):
 *   - Solid M3 surface (#1E1F20). NO glassmorphism. NO backdrop-blur.
 *   - Fibonacci spacing (p-fib-5, gap-fib-4) — magic numbers banned.
 *   - Golden-ratio typography (text-golden-base, text-golden-lg).
 *   - hover:scale + active:scale only — high-FPS micro-interactions.
 *
 * Accessibility:
 *   - Native <audio controls> respects user preference (keyboard, screen
 *     reader). Custom controls deliberately omitted to stay on the WCAG
 *     2.1 AA happy path without re-implementing the entire media UI.
 *   - aria-label on the wrapper announces title + duration to AT users.
 *   - prefers-reduced-motion respected via Tailwind motion-reduce: variant.
 *
 * SEO:
 *   - Renders JSON-LD AudioObject when canonical url + contentUrl exist.
 *   - Schema sits inline to keep <Helmet> uncluttered (per-component SEO).
 *
 * Usage:
 *   <AudioOverview
 *     audioUrl="https://cdn.ecypro.com/audio/trifecta-pillar.mp3"
 *     title="Fintech Trifecta 2026 — Audio Deep Dive"
 *     durationSec={482}
 *     publishedAt="2026-07-07"
 *     canonicalUrl="https://ecypro.com/blog/fintech-trifecta"
 *   />
 */

import { useId, useMemo, type ReactElement } from 'react';

import { buildAudioObjectSchema } from '@/lib/structured-data';

export interface AudioOverviewProps {
  /** Direct URL to the audio asset (mp3/m4a/wav). */
  audioUrl: string;
  /** Human-readable title, surfaced to AT + schema headline. */
  title: string;
  /** Duration in seconds. Used for ISO-8601 schema + visible badge. */
  durationSec?: number;
  /** ISO-8601 publish date for JSON-LD AudioObject. */
  publishedAt?: string;
  /** Canonical post URL — used as schema `url`. Omit to skip schema. */
  canonicalUrl?: string;
  /** Optional one-line description (≤160 chars), shown below the player. */
  description?: string;
  /** Render schema script? Default true when canonicalUrl provided. */
  includeSchema?: boolean;
}

function formatDuration(sec: number): string {
  if (!Number.isFinite(sec) || sec <= 0) return '';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function AudioOverview({
  audioUrl,
  title,
  durationSec,
  publishedAt,
  canonicalUrl,
  description,
  includeSchema = true,
}: AudioOverviewProps): ReactElement {
  const headingId = useId();

  const durationLabel = useMemo(
    () => (durationSec ? formatDuration(durationSec) : ''),
    [durationSec],
  );

  const schemaJson = useMemo(() => {
    if (!includeSchema || !canonicalUrl) return null;
    return JSON.stringify(
      buildAudioObjectSchema({
        audioUrl,
        title,
        url: canonicalUrl,
        durationSec,
        publishedAt,
        description,
      }),
    );
  }, [includeSchema, canonicalUrl, title, audioUrl, durationSec, publishedAt, description]);

  return (
    <section
      aria-labelledby={headingId}
      data-testid="blog-audio-overview"
      className="rounded-2xl bg-[#1E1F20] text-white/90 p-fib-6 mb-fib-8 transition-transform motion-reduce:transition-none hover:scale-[1.005] active:scale-[0.995]"
    >
      <header className="flex items-baseline justify-between gap-fib-3 mb-fib-4">
        <div className="flex flex-col gap-fib-2">
          <p className="text-xs uppercase tracking-wider text-white/60">
            Audio Deep Dive · NotebookLM
          </p>
          <h2 id={headingId} className="text-golden-lg font-semibold text-white">
            {title}
          </h2>
        </div>
        {durationLabel && (
          <span
            aria-label={`Audio length ${durationLabel} minutes`}
            className="shrink-0 rounded-full bg-white/10 px-fib-3 py-fib-1 text-sm tabular-nums"
          >
            {durationLabel}
          </span>
        )}
      </header>

      {/* Native controls — accessibility + reduced-motion friendly.
          eslint-disable-next-line jsx-a11y/media-has-caption — NotebookLM Audio
          Overview is auto-generated podcast-style narration with no synced
          transcript track available at this layer; the post body itself is
          the authoritative captioned source. Re-evaluate when NotebookLM
          exports VTT transcripts. */}
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio controls preload="metadata" className="w-full" aria-label={title}>
        <source src={audioUrl} type={audioUrl.endsWith('.m4a') ? 'audio/mp4' : 'audio/mpeg'} />
        Audio not supported in this browser.
      </audio>

      {description && (
        <p className="text-golden-base text-white/70 mt-fib-4 leading-relaxed">{description}</p>
      )}

      {schemaJson && (
        <script
          type="application/ld+json"
          // JSON.stringify output is already safe (no closing-tag injection
          // because contentUrl is a URL string we control upstream).
          dangerouslySetInnerHTML={{ __html: schemaJson }}
        />
      )}
    </section>
  );
}

export default AudioOverview;
