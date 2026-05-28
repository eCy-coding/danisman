import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

const BOOKMARK_KEY = 'ecypro_bookmarks';

interface ShareRailProps {
  postId: string;
  postTitle: string;
  readingTimeMin: number;
  className?: string;
}

export function ShareRail({ postId, postTitle, readingTimeMin, className }: ShareRailProps) {
  const [copied, setCopied] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);

  useEffect(() => {
    try {
      const bookmarks: string[] = JSON.parse(localStorage.getItem(BOOKMARK_KEY) ?? '[]');
      setBookmarked(bookmarks.includes(postId));
    } catch {
      setBookmarked(false);
    }
  }, [postId]);

  useEffect(() => {
    const onScroll = () => {
      const body = document.querySelector('.article-body');
      if (!body) return;
      const rect = body.getBoundingClientRect();
      const pct = Math.min(100, Math.max(0, (-rect.top / body.scrollHeight) * 100));
      setReadingProgress(pct);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const remainingMin = Math.ceil(readingTimeMin * (1 - readingProgress / 100));

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const encodedUrl = encodeURIComponent(currentUrl);
  const encodedTitle = encodeURIComponent(postTitle);

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [currentUrl]);

  const toggleBookmark = useCallback(() => {
    try {
      const bookmarks: string[] = JSON.parse(localStorage.getItem(BOOKMARK_KEY) ?? '[]');
      let updated: string[];
      if (bookmarks.includes(postId)) {
        updated = bookmarks.filter((id) => id !== postId);
        setBookmarked(false);
      } else {
        updated = [...bookmarks, postId];
        setBookmarked(true);
      }
      localStorage.setItem(BOOKMARK_KEY, JSON.stringify(updated));
    } catch {
      /* ignore */
    }
  }, [postId]);

  const shareLinks = [
    {
      id: 'twitter',
      label: 'X (Twitter)',
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
    {
      id: 'linkedin',
      label: 'LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      ),
    },
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
        </svg>
      ),
    },
    {
      id: 'email',
      label: 'E-posta',
      href: `mailto:?subject=${encodedTitle}&body=${encodedUrl}`,
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect width="20" height="16" x="2" y="4" rx="2" />
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
      ),
    },
    {
      id: 'print',
      label: 'Yazdır',
      href: '#',
      onClick: () => window.print(),
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="6 9 6 2 18 2 18 9" />
          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
          <rect width="12" height="8" x="6" y="14" />
        </svg>
      ),
    },
  ];

  return (
    <aside
      className={cn(
        'hidden lg:flex fixed left-4 top-1/2 -translate-y-1/2 z-30',
        'flex-col items-center gap-fib-3',
        className,
      )}
      aria-label="Paylaşım araçları"
      data-testid="share-rail"
    >
      <span className="text-xs text-slate-400 font-medium mb-1 writing-mode-vertical">
        {remainingMin > 0 ? `${remainingMin} dk kaldı` : 'Bitti ✓'}
      </span>

      {shareLinks.map((link) => (
        <a
          key={link.id}
          href={link.href}
          target={link.href.startsWith('http') ? '_blank' : undefined}
          rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
          onClick={
            link.onClick
              ? (e) => {
                  e.preventDefault();
                  link.onClick!();
                }
              : undefined
          }
          className="flex items-center justify-center w-9 h-9 rounded-full bg-white border border-slate-200 text-slate-500 shadow-sm hover:border-amber-400 hover:text-amber-600 hover:shadow-md transition-all"
          aria-label={link.label}
          data-testid={`share-${link.id}`}
        >
          {link.icon}
        </a>
      ))}

      <button
        onClick={copyLink}
        className="flex items-center justify-center w-9 h-9 rounded-full bg-white border border-slate-200 text-slate-500 shadow-sm hover:border-amber-400 hover:text-amber-600 hover:shadow-md transition-all relative"
        aria-label="Bağlantıyı kopyala"
        data-testid="share-copy"
      >
        {copied ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-emerald-500"
            aria-hidden="true"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
        )}
        {copied && (
          <span
            className="absolute left-11 bg-slate-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap"
            data-testid="copy-toast"
          >
            Kopyalandı!
          </span>
        )}
      </button>

      <button
        onClick={toggleBookmark}
        className={cn(
          'flex items-center justify-center w-9 h-9 rounded-full border shadow-sm transition-all',
          bookmarked
            ? 'bg-amber-50 border-amber-400 text-amber-600'
            : 'bg-white border-slate-200 text-slate-500 hover:border-amber-400 hover:text-amber-600 hover:shadow-md',
        )}
        aria-label={bookmarked ? 'Yer imini kaldır' : 'Yer imine ekle'}
        aria-pressed={bookmarked}
        data-testid="share-bookmark"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill={bookmarked ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
        </svg>
      </button>
    </aside>
  );
}
