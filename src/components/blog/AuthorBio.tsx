import React from 'react';
import { Linkedin } from 'lucide-react';

interface AuthorBioProps {
  author: string;
}

export function AuthorBio({ author }: AuthorBioProps) {
  const initials = author
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2);

  return (
    <div
      data-testid="author-bio"
      className="rounded-2xl bg-white/5 border border-white/10 p-6 flex gap-5 items-start"
    >
      <div className="rounded-full w-16 h-16 bg-amber-500/20 border-2 border-amber-500/30 flex items-center justify-center shrink-0">
        <span className="text-xl font-bold text-amber-400" aria-hidden="true">
          {initials}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-white font-semibold text-base mb-0.5">{author}</p>
        <p className="text-sm text-amber-400 mb-3">Kurucu Stratejist & Danışman</p>
        <p className="text-sm text-slate-400 leading-relaxed">
          20+ yıl kurumsal strateji, M&A ve dijital dönüşüm deneyimi. Türkiye'nin önde gelen
          şirketlerine C-suite düzeyinde danışmanlık.
        </p>
        <a
          href="https://linkedin.com/in/emrecanyalcin"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 mt-3 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <Linkedin className="w-3.5 h-3.5" />
          LinkedIn
        </a>
      </div>
    </div>
  );
}
