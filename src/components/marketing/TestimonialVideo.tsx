/**
 * P51.3 — Lazy testimonial video player.
 *
 * YouTube/Vimeo embed sadece poster click ile yüklenir (perf — iframe 500KB+).
 * Poster image: anonymized client portrait SVG. Optional caption/transcript link.
 */

import React, { useState } from 'react';
import { Play, ExternalLink } from 'lucide-react';
import { trackWidgetInteraction } from '../../lib/integrations/analytics';

interface TestimonialVideoProps {
  videoUrl: string; // YouTube veya Vimeo embed URL
  title: string;
  speaker: string;
  speakerTitle: string;
  posterSrc?: string;
  transcriptUrl?: string;
  durationSec?: number;
  className?: string;
}

export const TestimonialVideo: React.FC<TestimonialVideoProps> = ({
  videoUrl,
  title,
  speaker,
  speakerTitle,
  posterSrc = '/brand/founder-fallback.svg',
  transcriptUrl,
  durationSec,
  className = '',
}) => {
  const [playing, setPlaying] = useState(false);

  const onPlay = () => {
    setPlaying(true);
    trackWidgetInteraction('testimonial-video', 'play', title);
  };

  const fmtDuration = durationSec
    ? `${Math.floor(durationSec / 60)}:${String(durationSec % 60).padStart(2, '0')}`
    : null;

  return (
    <figure
      className={`bg-white/5 border border-white/10 rounded-2xl overflow-hidden ${className}`}
      data-testid="testimonial-video"
    >
      <div className="relative aspect-video bg-neutral">
        {playing ? (
          <iframe
            src={`${videoUrl}${videoUrl.includes('?') ? '&' : '?'}autoplay=1`}
            title={`Müşteri görüşü — ${speaker}`}
            className="absolute inset-0 w-full h-full"
            frameBorder="0"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        ) : (
          <button
            type="button"
            onClick={onPlay}
            aria-label={`Müşteri görüşünü oynat: ${speaker}`}
            className="absolute inset-0 group focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
          >
            <img
              src={posterSrc}
              alt=""
              className="w-full h-full object-cover opacity-60"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral via-neutral/40 to-transparent" />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-secondary text-neutral flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xl shadow-secondary/30">
                <Play size={28} className="ml-1" />
              </div>
              {fmtDuration && (
                <span className="mt-3 text-xs text-slate-300 font-semibold tracking-widest uppercase">
                  {fmtDuration}
                </span>
              )}
            </div>
          </button>
        )}
      </div>
      <figcaption className="p-5">
        <p className="text-base text-white font-serif italic mb-3 leading-relaxed">{title}</p>
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-sm font-semibold text-white">{speaker}</div>
            <div className="text-xs text-slate-400">{speakerTitle}</div>
          </div>
          {transcriptUrl && (
            <a
              href={transcriptUrl}
              className="inline-flex items-center gap-1 text-xs text-secondary hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Transkript <ExternalLink size={11} />
            </a>
          )}
        </div>
      </figcaption>
    </figure>
  );
};
