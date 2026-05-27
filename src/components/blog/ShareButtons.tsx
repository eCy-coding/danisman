import React, { useState } from 'react';
import { Copy, Check, Twitter, Linkedin } from 'lucide-react';

interface ShareButtonsProps {
  url: string;
  title: string;
}

export function ShareButtons({ url, title }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const twitterHref = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
  const linkedinHref = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;

  const copyUrl = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div data-testid="share-buttons" className="flex items-center gap-3">
      <span className="text-sm text-slate-400">Paylaş:</span>

      <a
        href={twitterHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Twitter'da paylaş"
        className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition-colors"
      >
        <Twitter className="w-4 h-4" />
      </a>

      <a
        href={linkedinHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="LinkedIn'de paylaş"
        className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition-colors"
      >
        <Linkedin className="w-4 h-4" />
      </a>

      <button
        type="button"
        onClick={copyUrl}
        aria-label="Bağlantıyı kopyala"
        className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition-colors"
      >
        {copied ? <Check className="w-4 h-4 text-amber-400" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
  );
}
