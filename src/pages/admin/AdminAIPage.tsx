import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Sparkles, FileText, Briefcase, BarChart2, RefreshCw, Copy, Check, Zap, Bot } from 'lucide-react';
import { OllamaAssistant } from '../../components/admin/OllamaAssistant';
import { useOllama } from '../../hooks/useOllama';

// ─── Content Templates ────────────────────────────────────

const CONTENT_TEMPLATES = [
  {
    id:       'blog',
    icon:     FileText,
    label:    'Blog Post',
    color:    'text-blue-400',
    bg:       'bg-blue-900/20',
    border:   'border-blue-900/30',
    prompt:   (topic: string) =>
      `Write a premium consulting blog post about "${topic}". Include: executive summary, 3-4 key insights, data-backed recommendations, and a strong CTA. Tone: authoritative, data-driven, McKinsey-style.`,
  },
  {
    id:       'case-study',
    icon:     Briefcase,
    label:    'Case Study',
    color:    'text-green-400',
    bg:       'bg-green-900/20',
    border:   'border-green-900/30',
    prompt:   (topic: string) =>
      `Create a B2B consulting case study for "${topic}". Structure: Client Challenge → Our Approach → Methodology → Quantified Results → Key Learnings. Include 3+ specific metrics.`,
  },
  {
    id:       'analysis',
    icon:     BarChart2,
    label:    'SWOT Analysis',
    color:    'text-purple-400',
    bg:       'bg-purple-900/20',
    border:   'border-purple-900/30',
    prompt:   (topic: string) =>
      `Perform a structured SWOT analysis for "${topic}" from a premium consulting perspective. Each quadrant: 4-5 specific, actionable points. End with 3 strategic recommendations.`,
  },
  {
    id:       'service-desc',
    icon:     Sparkles,
    label:    'Service Description',
    color:    'text-secondary',
    bg:       'bg-secondary/10',
    border:   'border-secondary/20',
    prompt:   (topic: string) =>
      `Write an enterprise-grade service description for "${topic}" consulting service. Include: value proposition, methodology overview, deliverables, and ROI promise. 150-200 words.`,
  },
] as const;

// ─── Content Generator Panel ──────────────────────────────

const ContentGenerator: React.FC = () => {
  const [selected, setSelected] = useState<typeof CONTENT_TEMPLATES[number]['id']>('blog');
  const [topic,    setTopic]    = useState('');
  const [output,   setOutput]   = useState('');
  const [copied,   setCopied]   = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);

  const template = CONTENT_TEMPLATES.find(t => t.id === selected)!;

  const { generateStream, isStreaming, abort, error } = useOllama({
    onChunk: useCallback((chunk: string) => {
      setOutput(prev => prev + chunk);
    }, []),
    onComplete: useCallback(() => {
      outputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, []),
  });

  useEffect(() => {
    if (output && outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  const handleGenerate = useCallback(async () => {
    if (!topic.trim() || isStreaming) return;
    setOutput('');
    await generateStream(template.prompt(topic));
  }, [topic, isStreaming, template, generateStream]);

  const copyOutput = useCallback(async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [output]);

  return (
    <div
      data-testid="content-generator"
      className="bg-[#0A101F]/80 border border-white/5 rounded-2xl p-6 backdrop-blur-sm space-y-5"
    >
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-secondary/10 border border-secondary/20">
          <Sparkles size={18} className="text-secondary" />
        </div>
        <div>
          <h3 className="text-lg font-serif text-white" data-testid="generator-title">Content Generator</h3>
          <p className="text-xs text-slate-500">AI-powered premium consulting content</p>
        </div>
      </div>

      {/* Template Selection */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {CONTENT_TEMPLATES.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setSelected(t.id)}
              className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-xs font-medium transition-all ${
                selected === t.id
                  ? `${t.bg} ${t.border} ${t.color}`
                  : 'bg-white/3 border-white/5 text-slate-500 hover:border-white/15'
              }`}
              data-testid={`template-${t.id}`}
            >
              <Icon size={18} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Topic Input */}
      <div className="flex gap-3">
        <input
          type="text"
          value={topic}
          onChange={e => setTopic(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && void handleGenerate()}
          placeholder={`Enter topic for ${template.label}...`}
          className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-secondary/50 transition-colors"
          data-testid="generator-topic"
          disabled={isStreaming}
        />
        {isStreaming ? (
          <button
            onClick={abort}
            className="px-5 py-3 bg-red-900/30 border border-red-900/30 text-red-400 rounded-xl text-sm font-medium hover:bg-red-900/50 transition-colors"
            data-testid="generator-stop"
          >
            Stop
          </button>
        ) : (
          <button
            onClick={() => void handleGenerate()}
            disabled={!topic.trim()}
            className="px-5 py-3 bg-secondary text-black rounded-xl text-sm font-semibold hover:bg-secondary/80 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            data-testid="generator-submit"
          >
            <Zap size={14} />
            Generate
          </button>
        )}
      </div>

      {/* Output */}
      {(output || isStreaming) && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          <div
            ref={outputRef}
            className="bg-black/60 border border-white/10 rounded-xl p-4 text-sm text-slate-300 leading-relaxed whitespace-pre-wrap max-h-80 overflow-y-auto font-mono"
            data-testid="generator-output"
          >
            {output}
            {isStreaming && (
              <span className="inline-block w-1.5 h-4 bg-secondary animate-pulse ml-1 rounded-sm align-middle" />
            )}
          </div>

          {!isStreaming && output && (
            <div className="absolute top-3 right-3 flex gap-2">
              <button
                onClick={copyOutput}
                className="p-1.5 bg-black/50 border border-white/10 rounded-lg text-slate-400 hover:text-white hover:border-white/20 transition-all"
                aria-label="Copy output"
              >
                {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
              </button>
              <button
                onClick={() => void handleGenerate()}
                className="p-1.5 bg-black/50 border border-white/10 rounded-lg text-slate-400 hover:text-white hover:border-white/20 transition-all"
                aria-label="Regenerate"
              >
                <RefreshCw size={13} />
              </button>
            </div>
          )}
        </motion.div>
      )}

      {error && (
        <p className="text-xs text-red-400 bg-red-900/20 border border-red-900/30 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
    </div>
  );
};

// ─── Admin AI Page ────────────────────────────────────────

export const AdminAIPage: React.FC = () => (
  <div
    data-testid="admin-ai-page"
    className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700"
  >
    {/* Header */}
    <div className="flex items-end justify-between">
      <div>
        <h1 className="text-3xl font-serif text-white mb-2 flex items-center gap-3">
          <Bot size={28} className="text-secondary" />
          Sovereign Creator
        </h1>
        <p className="text-slate-400 font-light">
          Phase 32 — Ollama-powered AI content generation & intelligent assistant
        </p>
      </div>
      <div className="flex items-center gap-2 text-xs font-mono text-secondary bg-secondary/10 px-3 py-1.5 rounded-full border border-secondary/20">
        <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
        Local Inference Active
      </div>
    </div>

    {/* Stats Row */}
    <div className="grid grid-cols-3 gap-4">
      {[
        { label: 'Privacy',     value: '100%', desc: 'Data stays local' },
        { label: 'Latency',     value: '< 1s',  desc: 'First token (14B)' },
        { label: 'Models',      value: '11',    desc: 'Available locally' },
      ].map(s => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0A101F]/80 border border-white/5 rounded-2xl p-5 backdrop-blur-sm"
          data-testid={`ai-stat-${s.label.toLowerCase()}`}
        >
          <p className="text-2xl font-serif text-secondary">{s.value}</p>
          <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mt-1">{s.label}</p>
          <p className="text-xs text-slate-600 mt-0.5">{s.desc}</p>
        </motion.div>
      ))}
    </div>

    {/* Content Generator */}
    <ContentGenerator />

    {/* AI Chat */}
    <div>
      <h2 className="text-lg font-serif text-white mb-4 flex items-center gap-2">
        <Bot size={18} className="text-secondary" />
        AI Chat Assistant
      </h2>
      <OllamaAssistant />
    </div>
  </div>
);
