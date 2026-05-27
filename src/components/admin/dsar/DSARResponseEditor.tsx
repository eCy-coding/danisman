import React, { useState } from 'react';
import { cn } from '../../../lib/utils';

interface DSARResponseEditorProps {
  dsarId: string;
  onSubmit: (text: string) => void;
  loading: boolean;
}

export function DSARResponseEditor({ onSubmit, loading }: DSARResponseEditorProps) {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onSubmit(text.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-fib-4">
      <label htmlFor="dsar-response" className="text-sm font-medium text-gray-300">
        Yanıt Metni
      </label>
      <textarea
        id="dsar-response"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={6}
        placeholder="İlgili kişiye iletilecek yanıt metnini giriniz..."
        disabled={loading}
        className={cn(
          'w-full rounded-lg border border-white/10 bg-white/5 px-fib-4 py-fib-3',
          'text-sm text-white placeholder-gray-500 resize-y',
          'focus:outline-none focus:ring-1 focus:ring-blue-500/60',
          'disabled:opacity-50',
        )}
      />
      <button
        type="submit"
        disabled={loading || !text.trim()}
        className={cn(
          'self-end rounded-lg px-fib-5 py-fib-3 text-sm font-medium',
          'bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white',
          'transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
        )}
      >
        {loading ? 'Gönderiliyor…' : 'Yanıt Gönder'}
      </button>
    </form>
  );
}
