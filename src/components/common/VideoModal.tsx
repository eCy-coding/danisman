/**
 * VideoModal — Demo Video Popup
 * istek5.txt Phase 2: UI/UX + Phase 3: Media-Watcher
 *
 * - Hero "Platformu İncele" butonuna bağlanır (trigger: `data-video-modal`)
 * - Otomatik play/pause on open/close
 * - YouTube/Vimeo/native video desteği
 * - Backdrop tıklama + ESC ile kapat
 * - Reduced motion: animasyon devre dışı
 * - A11y: dialog, focus trap (focus ilk close btn'a)
 * - Autoplay muted → kullanıcı etkin etmeden ses yok
 *
 * Kullanım:
 *   const { open, setOpen } = useVideoModal();
 *   <button onClick={() => setOpen(true)}>İzle</button>
 *   <VideoModal open={open} onClose={() => setOpen(false)} videoId="dQw4w9WgXcQ" />
 */

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { X, Play } from 'lucide-react';
import { useTranslation } from '../../lib/i18n';
import { trackEvent } from '../../lib/analytics';

type VideoProvider = 'youtube' | 'vimeo' | 'native';

interface VideoModalProps {
  open: boolean;
  onClose: () => void;
  videoId?: string;
  videoUrl?: string;
  provider?: VideoProvider;
  title?: { tr: string; en: string };
}

function buildEmbedUrl(provider: VideoProvider, videoId: string): string {
  if (provider === 'youtube') {
    return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;
  }
  if (provider === 'vimeo') {
    return `https://player.vimeo.com/video/${videoId}?autoplay=1`;
  }
  return videoId;
}

export const VideoModal: React.FC<VideoModalProps> = ({
  open,
  onClose,
  videoId = 'dQw4w9WgXcQ',
  videoUrl,
  provider = 'youtube',
  title = { tr: 'Platform Demosu', en: 'Platform Demo' },
}) => {
  const { i18n } = useTranslation();
  const lang = (i18n.language || 'en').startsWith('tr') ? 'tr' : 'en';
  const prefersReduced = useReducedMotion();
  const closeRef = useRef<HTMLButtonElement>(null);

  // Focus close button on open
  useEffect(() => {
    if (open) {
      trackEvent('VideoModal', 'Open', videoId);
      setTimeout(() => closeRef.current?.focus(), 100);
    }
  }, [open, videoId]);

  // ESC key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const embedUrl = videoUrl ?? buildEmbedUrl(provider, videoId);
  const titleText = lang === 'tr' ? title.tr : title.en;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-md z-60"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Dialog */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={titleText}
            data-testid="video-modal"
            initial={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-61 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="pointer-events-auto relative w-full max-w-4xl">
              {/* Close button */}
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                aria-label={lang === 'tr' ? 'Videoyu kapat' : 'Close video'}
                className="absolute -top-12 right-0 flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary rounded-lg p-2"
              >
                <X size={18} aria-hidden="true" />
                <span>{lang === 'tr' ? 'Kapat' : 'Close'}</span>
              </button>

              {/* Video container — 16:9 */}
              <div
                className="relative w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black"
                style={{ paddingTop: '56.25%' }}
              >
                {provider === 'native' ? (
                  <video
                    className="absolute inset-0 w-full h-full"
                    src={embedUrl}
                    autoPlay
                    controls
                    muted
                    playsInline
                    aria-label={titleText}
                  />
                ) : (
                  <iframe
                    className="absolute inset-0 w-full h-full"
                    src={embedUrl}
                    title={titleText}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                )}
              </div>

              {/* Caption */}
              <p className="text-center text-xs text-slate-500 mt-3">{titleText}</p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

/** Trigger button for VideoModal — standalone kullanım için */
export const VideoTriggerButton: React.FC<{
  onClick: () => void;
  label?: { tr: string; en: string };
  className?: string;
}> = ({
  onClick,
  label = { tr: 'Demo Videosunu İzle', en: 'Watch Demo Video' },
  className = '',
}) => {
  const { i18n } = useTranslation();
  const lang = (i18n.language || 'en').startsWith('tr') ? 'tr' : 'en';

  return (
    <button
      type="button"
      onClick={onClick}
      data-testid="video-trigger-btn"
      className={`group inline-flex items-center gap-3 text-slate-300 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary rounded-lg ${className}`}
    >
      <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center group-hover:bg-secondary/20 group-hover:border-secondary/40 transition-all">
        <Play size={14} fill="currentColor" className="ml-0.5" aria-hidden="true" />
      </div>
      <span className="text-sm font-medium">{lang === 'tr' ? label.tr : label.en}</span>
    </button>
  );
};
