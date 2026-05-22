import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, RefreshCw, ChevronRight } from 'lucide-react';

export const AIExecutiveSummary: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<string[]>([]);

  const generateSummary = () => {
    setLoading(true);
    // Simulate AI Processing safely
    setTimeout(() => {
      setSummary([
        "Revenue is up 12% week-over-week, driven by the 'Enterprise' plan uptake.",
        'User retention has stabilized at 85%, suggesting the new onboarding flow is effective.',
        "Traffic spike detected from 'Social' channels; recommend allocating ad spend there.",
      ]);
      setLoading(false);
    }, 2500);
  };

  useEffect(() => {
    generateSummary();
  }, []);

  return (
    <div className="h-full flex flex-col p-6 bg-linear-to-br from-indigo-900/90 to-slate-900 text-white rounded-2xl relative overflow-hidden border border-white/10 shadow-2xl">
      {/* Background Ambience */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" />

      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-white/10 rounded-lg">
            <Sparkles className="w-5 h-5 text-indigo-300" />
          </div>
          <h3 className="font-bold text-lg tracking-tight">AI Executive Brief</h3>
        </div>
        <button
          type="button"
          onClick={generateSummary}
          disabled={loading}
          className={`p-2 rounded-full hover:bg-white/10 transition-all ${loading ? 'animate-spin' : ''}`}
        >
          <RefreshCw className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      <div className="grow flex flex-col justify-center relative z-10">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-4 bg-white/10 rounded animate-pulse"
                  style={{ width: `${Math.random() * 40 + 60}%` }}
                />
              ))}
              <p className="text-xs text-indigo-300/80 mt-4 animate-pulse">
                Analyzing 14,203 data points...
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {summary.map((point, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex items-start gap-3 group"
                >
                  <ChevronRight className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5 group-hover:translate-x-1 transition-transform" />
                  <p className="text-sm font-light leading-relaxed text-indigo-50/90">{point}</p>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center text-xs text-indigo-300/50">
        <span>Model: Gemini-1.5-Flash</span>
        <span>Updated: Just now</span>
      </div>
    </div>
  );
};
