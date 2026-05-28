import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, RotateCcw } from 'lucide-react';
import { QUIZ_QUESTIONS, PRICING_TIERS, scoreToTier, type TierId } from '@/data/pricing-tiers';

interface Props {
  onResult?: (tierId: TierId) => void;
}

export const PricingQuiz: React.FC<Props> = ({ onResult }) => {
  const [current, setCurrent] = useState(0);
  const [scores, setScores] = useState<number[]>([]);
  const [result, setResult] = useState<TierId | null>(null);

  const handleAnswer = useCallback(
    (score: number) => {
      const next = [...scores, score];
      setScores(next);

      if (current + 1 >= QUIZ_QUESTIONS.length) {
        const total = next.reduce((a, b) => a + b, 0);
        const tier = scoreToTier(total);
        setResult(tier);
        onResult?.(tier);
      } else {
        setCurrent((c) => c + 1);
      }
    },
    [current, scores, onResult],
  );

  const reset = useCallback(() => {
    setCurrent(0);
    setScores([]);
    setResult(null);
  }, []);

  if (result !== null) {
    const tier = PRICING_TIERS.find((t) => t.id === result)!;
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center"
        data-testid="quiz-result"
      >
        <p className="text-sm font-semibold uppercase tracking-widest text-amber-400 mb-3">
          Önerilen Plan
        </p>
        <h3 className="text-3xl font-bold text-white mb-2">{tier.name}</h3>
        <p className="text-slate-300 mb-2">{tier.tagline}</p>
        <p className="text-2xl font-semibold text-amber-400 mb-6">{tier.priceLabel}</p>
        <p className="text-slate-400 text-sm mb-8">{tier.minTerm}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href={tier.ctaHref}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-amber-500 text-neutral font-bold hover:bg-amber-400 transition-colors"
            data-testid="quiz-cta"
          >
            <span>{tier.cta}</span>
            <ArrowRight className="w-4 h-4" />
          </a>
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-white/20 text-slate-300 hover:text-white hover:border-white/40 transition-colors text-sm"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Testi Yenile</span>
          </button>
        </div>
      </motion.div>
    );
  }

  const question = QUIZ_QUESTIONS[current];
  if (!question) return null;
  const progress = (current / QUIZ_QUESTIONS.length) * 100;

  return (
    <div
      className="rounded-2xl border border-white/10 bg-white/5 p-8"
      data-testid="pricing-quiz"
      aria-live="polite"
    >
      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-slate-400 mb-2">
          <span>
            Soru {current + 1} / {QUIZ_QUESTIONS.length}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/10">
          <motion.div
            className="h-full rounded-full bg-amber-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
            role="progressbar"
            aria-valuenow={current}
            aria-valuemin={0}
            aria-valuemax={QUIZ_QUESTIONS.length}
          />
        </div>
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          <h3 className="text-lg font-semibold text-white mb-6" id={`quiz-q-${question.id}`}>
            {question.question}
          </h3>
          <div className="space-y-3" role="group" aria-labelledby={`quiz-q-${question.id}`}>
            {question.options.map((opt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleAnswer(opt.score)}
                className="w-full text-left px-5 py-4 rounded-xl border border-white/10 bg-white/5 text-slate-200 hover:border-amber-500/60 hover:bg-amber-500/10 hover:text-white transition-all text-sm font-medium"
                data-testid={`quiz-option-${i}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
