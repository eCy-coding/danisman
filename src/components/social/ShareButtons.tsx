/**
 * P51.1 — Social share buttons (LinkedIn primary, Twitter/X, copy-link).
 *
 * Blog post + case study detail sayfalarında inline yerleştirilir.
 * LinkedIn = Türk B2B audience primary channel.
 */

import React, { useState } from 'react';
import { Linkedin, Twitter, Link2, Check } from 'lucide-react';
import { trackCtaClick } from '../../lib/integrations/analytics';

interface ShareButtonsProps {
  url: string;
  title: string;
  summary?: string;
  className?: string;
}

export const ShareButtons: React.FC<ShareButtonsProps> = ({
  url,
  title,
  summary = '',
  className = '',
}) => {
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedSummary = encodeURIComponent(summary);

  const links = {
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&title=${encodedTitle}&summary=${encodedSummary}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
  };

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      trackCtaClick('copy-link', 'share-buttons');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <div
      className={`inline-flex items-center gap-2 ${className}`}
      role="group"
      aria-label="Bu içeriği paylaş"
    >
      <span className="text-xs font-bold uppercase tracking-widest text-slate-500 mr-2">
        Paylaş
      </span>
      <a
        href={links.linkedin}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackCtaClick('linkedin-share', 'share-buttons')}
        aria-label="LinkedIn'de paylaş"
        className="w-10 h-10 min-h-[40px] min-w-[40px] rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-secondary hover:border-secondary/30 transition-colors"
      >
        <Linkedin size={16} />
      </a>
      <a
        href={links.twitter}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackCtaClick('twitter-share', 'share-buttons')}
        aria-label="Twitter/X'te paylaş"
        className="w-10 h-10 min-h-[40px] min-w-[40px] rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-secondary hover:border-secondary/30 transition-colors"
      >
        <Twitter size={16} />
      </a>
      <button
        type="button"
        onClick={onCopy}
        aria-label="Bağlantıyı kopyala"
        className="w-10 h-10 min-h-[40px] min-w-[40px] rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-secondary hover:border-secondary/30 transition-colors"
      >
        {copied ? <Check size={16} className="text-emerald-400" /> : <Link2 size={16} />}
      </button>
    </div>
  );
};
