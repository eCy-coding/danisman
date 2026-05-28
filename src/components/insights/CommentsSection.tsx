import React, { useEffect, useRef, useState, useCallback } from 'react';
import { CommentItem, CommentData } from './CommentItem';
import { CommentForm } from './CommentForm';

interface CommentsSectionProps {
  postId: string;
  initialCount?: number;
}

interface CommentsResponse {
  comments: CommentData[];
  total: number;
  page: number;
  limit: number;
}

export function CommentsSection({ postId, initialCount = 0 }: CommentsSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CommentsResponse | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Lazy load — only fetch when section scrolls into view
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/insights/posts/${postId}/comments?limit=20`);
      if (!res.ok) throw new Error('Fetch failed');
      const json = await res.json();
      setData(json.data);
    } catch {
      setError('Yorumlar yüklenemedi, lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    if (visible) {
      void fetchComments();
    }
  }, [visible, refreshKey, fetchComments]);

  const handleNewComment = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const commentCount = data?.total ?? initialCount;

  return (
    <section
      ref={sectionRef}
      aria-label="Yorumlar"
      className="mt-16 pt-8 border-t border-neutral-800"
    >
      <h2 className="text-xl font-semibold text-neutral-100 mb-6">
        Yorumlar
        {commentCount > 0 && (
          <span className="ml-2 text-sm font-normal text-neutral-500">({commentCount})</span>
        )}
      </h2>

      {/* Comment form always visible */}
      <div className="mb-10">
        <h3 className="text-sm font-medium text-neutral-400 mb-4 uppercase tracking-wider">
          Yorum Yaz
        </h3>
        <CommentForm postId={postId} onSuccess={handleNewComment} />
      </div>

      {/* Comment list */}
      {!visible && (
        <div className="text-sm text-neutral-500" aria-hidden="true">
          Yorumlar yükleniyor…
        </div>
      )}

      {visible && loading && (
        <div aria-live="polite" aria-label="Yorumlar yükleniyor">
          {[1, 2, 3].map((i) => (
            <div key={i} className="mt-6 animate-pulse">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-neutral-700" />
                <div className="h-3 bg-neutral-700 rounded w-32" />
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-neutral-700 rounded w-full" />
                <div className="h-3 bg-neutral-700 rounded w-4/5" />
              </div>
            </div>
          ))}
        </div>
      )}

      {visible && error && (
        <div role="alert" className="text-sm text-red-400 py-4">
          {error}
        </div>
      )}

      {visible && !loading && !error && data && (
        <>
          {data.comments.length === 0 ? (
            <p className="text-sm text-neutral-500 italic">Henüz yorum yok. İlk yorumu sen yap!</p>
          ) : (
            <div role="list" aria-label="Yorum listesi">
              {data.comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  postId={postId}
                  onReplySubmitted={handleNewComment}
                />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
