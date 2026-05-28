import React, { useState } from 'react';
import { CommentForm } from './CommentForm';

export interface CommentData {
  id: string;
  authorName: string;
  bodyMd: string;
  createdAt: string;
  replies?: Omit<CommentData, 'replies'>[];
}

interface CommentItemProps {
  comment: CommentData;
  postId: string;
  depth?: number;
  onReplySubmitted?: () => void;
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'az önce';
  if (min < 60) return `${min} dakika önce`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} saat önce`;
  const day = Math.floor(hr / 24);
  return `${day} gün önce`;
}

export function CommentItem({ comment, postId, depth = 0, onReplySubmitted }: CommentItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);

  const canReply = depth < 1;

  return (
    <article
      className={`border-l-2 border-amber-500/20 pl-4 py-3 ${depth > 0 ? 'ml-6 mt-3' : 'mt-6'}`}
      aria-label={`${comment.authorName} yorumu`}
    >
      <header className="flex items-center gap-2 mb-2">
        <div
          className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 text-sm font-semibold select-none"
          aria-hidden="true"
        >
          {comment.authorName.charAt(0).toUpperCase()}
        </div>
        <div>
          <span className="text-sm font-medium text-neutral-200">{comment.authorName}</span>
          <time
            className="text-xs text-neutral-500 ml-2"
            dateTime={comment.createdAt}
            title={new Date(comment.createdAt).toLocaleString('tr-TR')}
          >
            {relativeTime(comment.createdAt)}
          </time>
        </div>
      </header>

      <p className="text-sm text-neutral-300 leading-relaxed whitespace-pre-wrap break-words">
        {comment.bodyMd}
      </p>

      {canReply && (
        <button
          type="button"
          className="mt-2 text-xs text-amber-400 hover:text-amber-300 transition-colors"
          onClick={() => setShowReplyForm((v) => !v)}
          aria-expanded={showReplyForm}
        >
          {showReplyForm ? 'İptal' : 'Yanıtla'}
        </button>
      )}

      {showReplyForm && (
        <div className="mt-4">
          <CommentForm
            postId={postId}
            parentId={comment.id}
            onSuccess={() => {
              setShowReplyForm(false);
              onReplySubmitted?.();
            }}
          />
        </div>
      )}

      {comment.replies && comment.replies.length > 0 && (
        <div role="list" aria-label="Yanıtlar">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={{ ...reply, replies: [] }}
              postId={postId}
              depth={depth + 1}
              onReplySubmitted={onReplySubmitted}
            />
          ))}
        </div>
      )}
    </article>
  );
}
