import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, StopCircle, Bot, User, Cpu, ChevronDown, Trash2, Copy, Check } from 'lucide-react';
import { useOllama } from '../../hooks/useOllama';
import type { OllamaChatMessage } from '../../lib/ollama-client';

// ─── Types ────────────────────────────────────────────────

interface ChatEntry {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  streaming?: boolean;
  model?: string;
  ts: number;
}

const AVAILABLE_MODELS = [
  { id: 'qwen2.5-coder:14b', label: 'Qwen2.5-Coder 14B' },
  { id: 'qwen2.5-coder:32b', label: 'Qwen2.5-Coder 32B' },
  { id: 'gemma4:e2b', label: 'Gemma4 E2B' },
  { id: 'phi4:latest', label: 'Phi4' },
  { id: 'ecycode-orchestrator:latest', label: 'EcyCode Orchestrator' },
  { id: 'ecycode-math:latest', label: 'EcyCode Math' },
];

const SYSTEM_PROMPTS: Record<string, string> = {
  assistant:
    'You are eCyPro AI, a premium consulting assistant. Be concise, professional, and data-driven.',
  coder:
    'You are a senior TypeScript/React expert. Write clean, production-ready code. Prefer named exports, motion/react for animations, Tailwind v4 utilities.',
  analyst:
    'You are a McKinsey-level strategy analyst. Provide structured frameworks, quantified insights, and actionable recommendations.',
  writer:
    'You are an expert business content writer. Write in a premium, authoritative tone suitable for enterprise consulting.',
};

// ─── Message Bubble ───────────────────────────────────────

const MessageBubble: React.FC<{ entry: ChatEntry }> = ({ entry }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = useCallback(async () => {
    await navigator.clipboard.writeText(entry.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [entry.content]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex gap-3 group ${entry.role === 'user' ? 'justify-end' : 'justify-start'}`}
      data-testid={`chat-message-${entry.role}`}
    >
      {entry.role === 'assistant' && (
        <div className="shrink-0 w-8 h-8 rounded-full bg-secondary/20 border border-secondary/30 flex items-center justify-center">
          <Bot size={14} className="text-secondary" />
        </div>
      )}

      <div className={`relative max-w-[75%] ${entry.role === 'user' ? 'order-1' : ''}`}>
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
            entry.role === 'user'
              ? 'bg-secondary text-black rounded-br-sm'
              : 'bg-white/5 border border-white/10 text-slate-200 rounded-bl-sm'
          }`}
        >
          {entry.content}
          {entry.streaming && (
            <span className="inline-block w-1.5 h-4 bg-secondary animate-pulse ml-1 rounded-sm" />
          )}
        </div>

        {entry.role === 'assistant' && entry.content && !entry.streaming && (
          <button
            type="button"
            onClick={copyToClipboard}
            className="absolute -bottom-6 right-0 opacity-0 group-hover:opacity-100 text-slate-500 hover:text-white transition-all flex items-center gap-1 text-xs"
            aria-label="Copy response"
          >
            {copied ? <Check size={11} className="text-green-400" /> : <Copy size={11} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        )}

        <p className="text-xs text-slate-600 mt-1 px-1">
          {new Date(entry.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          {entry.model && entry.role === 'assistant' && (
            <span className="ml-2 font-mono">[{entry.model}]</span>
          )}
        </p>
      </div>

      {entry.role === 'user' && (
        <div className="shrink-0 w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center order-2">
          <User size={14} className="text-blue-400" />
        </div>
      )}
    </motion.div>
  );
};

// ─── Main Component ───────────────────────────────────────

export const OllamaAssistant: React.FC = () => {
  const [entries, setEntries] = useState<ChatEntry[]>([]);
  const [input, setInput] = useState('');
  const [model, setModel] = useState(AVAILABLE_MODELS[0]!.id);
  const [sysMode, setSysMode] = useState<keyof typeof SYSTEM_PROMPTS>('assistant');
  const [showModels, setShowModels] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { chatStream, isStreaming, abort, error, clearError } = useOllama({
    model,
    onChunk: useCallback((chunk: string) => {
      setEntries((prev) => {
        const last = prev[prev.length - 1];
        if (last?.streaming) {
          return [...prev.slice(0, -1), { ...last, content: last.content + chunk }];
        }
        return prev;
      });
    }, []),
    onComplete: useCallback(
      (full: string) => {
        setEntries((prev) => {
          const last = prev[prev.length - 1];
          if (last?.streaming) {
            return [...prev.slice(0, -1), { ...last, content: full, streaming: false, model }];
          }
          return prev;
        });
      },
      [model],
    ),
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries]);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;

    const userEntry: ChatEntry = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmed,
      ts: Date.now(),
    };
    const assistantEntry: ChatEntry = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      streaming: true,
      ts: Date.now(),
    };

    setEntries((prev) => [...prev, userEntry, assistantEntry]);
    setInput('');
    clearError();

    const messages: OllamaChatMessage[] = [
      { role: 'system', content: SYSTEM_PROMPTS[sysMode] ?? SYSTEM_PROMPTS.assistant! },
      ...entries
        .filter((e) => !e.streaming)
        .map((e) => ({ role: e.role as 'user' | 'assistant', content: e.content })),
      { role: 'user', content: trimmed },
    ];

    await chatStream(messages);
  }, [input, isStreaming, entries, sysMode, chatStream, clearError]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        void handleSend();
      }
    },
    [handleSend],
  );

  const clearChat = useCallback(() => {
    abort();
    setEntries([]);
  }, [abort]);

  return (
    <div
      data-testid="ollama-assistant"
      className="flex flex-col bg-[#0A101F]/80 border border-white/5 rounded-2xl shadow-xl overflow-hidden"
      style={{ height: '600px' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-secondary/20 border border-secondary/30 flex items-center justify-center">
              <Cpu size={16} className="text-secondary" />
            </div>
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-[#0A101F] ${
                isStreaming ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'
              }`}
            />
          </div>
          <div>
            <h2 className="text-base font-serif text-white" data-testid="assistant-title">
              AI Assistant
            </h2>
            <p className="text-xs text-slate-500 font-mono">{model}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* System Prompt Mode */}
          <select
            value={sysMode}
            onChange={(e) => setSysMode(e.target.value as keyof typeof SYSTEM_PROMPTS)}
            className="text-xs bg-black/30 border border-white/10 rounded-lg px-2 py-1.5 text-slate-300 focus:outline-none focus:border-secondary"
            aria-label="AI mode selector"
          >
            {Object.keys(SYSTEM_PROMPTS).map((k) => (
              <option key={k} value={k}>
                {k.charAt(0).toUpperCase() + k.slice(1)}
              </option>
            ))}
          </select>

          {/* Model Selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowModels((p) => !p)}
              className="flex items-center gap-1 text-xs bg-black/30 border border-white/10 rounded-lg px-2 py-1.5 text-slate-300 hover:border-secondary/50 transition-colors"
              aria-label="Select model"
            >
              <span className="max-w-24 truncate">
                {AVAILABLE_MODELS.find((m) => m.id === model)?.label ?? model}
              </span>
              <ChevronDown size={10} />
            </button>
            <AnimatePresence>
              {showModels && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute right-0 top-full mt-1 bg-[#050810] border border-white/10 rounded-xl shadow-2xl z-50 py-1 min-w-48"
                >
                  {AVAILABLE_MODELS.map((m) => (
                    <button
                      type="button"
                      key={m.id}
                      onClick={() => {
                        setModel(m.id);
                        setShowModels(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-xs transition-colors ${
                        model === m.id
                          ? 'text-secondary bg-secondary/10'
                          : 'text-slate-300 hover:bg-white/5'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            type="button"
            onClick={clearChat}
            className="p-1.5 text-slate-500 hover:text-red-400 transition-colors rounded-lg hover:bg-red-900/20"
            title="Clear chat"
            aria-label="Clear chat"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {entries.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center gap-4 select-none">
            <div className="w-16 h-16 rounded-2xl bg-secondary/10 border border-secondary/20 flex items-center justify-center">
              <Bot size={28} className="text-secondary/60" />
            </div>
            <div>
              <p className="text-slate-400 font-serif text-lg">eCyPro AI Assistant</p>
              <p className="text-slate-600 text-sm mt-1">
                Ask anything — strategy, code, content, analysis
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 mt-2 max-w-sm">
              {[
                'Write a blog post about AI in consulting',
                'Explain ROI measurement frameworks',
                'Create a case study outline for SaaS',
              ].map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setInput(s)}
                  className="text-xs px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-slate-400 hover:text-white hover:border-white/20 transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {entries.map((entry) => (
            <MessageBubble key={entry.id} entry={entry} />
          ))}
        </AnimatePresence>

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-red-400 bg-red-900/20 border border-red-900/30 rounded-lg px-4 py-2"
          >
            {error}
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 px-4 py-3 border-t border-white/10">
        <div className="flex items-end gap-3 bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus-within:border-secondary/40 transition-colors">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask the AI assistant… (⏎ send, Shift+⏎ newline)"
            rows={1}
            className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-600 resize-none focus:outline-none max-h-32 leading-relaxed"
            style={{ fieldSizing: 'content' } as React.CSSProperties}
            data-testid="assistant-input"
            disabled={isStreaming}
            aria-label="Message input"
          />
          {isStreaming ? (
            <button
              type="button"
              onClick={abort}
              className="shrink-0 p-2 text-red-400 hover:text-red-300 transition-colors"
              aria-label="Stop generation"
              data-testid="assistant-stop"
            >
              <StopCircle size={18} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void handleSend()}
              disabled={!input.trim()}
              className="shrink-0 p-2 text-secondary disabled:text-slate-600 hover:text-secondary/80 transition-colors"
              aria-label="Send message"
              data-testid="assistant-send"
            >
              <Send size={18} />
            </button>
          )}
        </div>
        <p className="text-xs text-slate-700 mt-1.5 text-center">
          Powered by Ollama local inference — data stays on device
        </p>
      </div>
    </div>
  );
};
