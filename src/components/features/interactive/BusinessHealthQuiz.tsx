import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Check,
  ArrowRight,
  Activity,
  ShieldCheck,
  Zap,
  LineChart,
  FileText,
  Target,
} from 'lucide-react';
import { useInteractionStore } from '../../../lib/stores/interactionStore';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';

const QUESTIONS = [
  {
    id: 1,
    dimension: 'Strategy',
    icon: <ShieldCheck className="w-5 h-5" />,
    question: 'How defined is your digital strategy?',
    options: [
      { text: 'Non-existent', score: 20 },
      { text: 'Ad-hoc / Reactive', score: 40 },
      { text: 'Documented but not followed', score: 70 },
      { text: 'Fully integrated and automated', score: 100 },
    ],
  },
  {
    id: 2,
    dimension: 'Marketing',
    icon: <Activity className="w-5 h-5" />,
    question: 'What is your main customer acquisition channel?',
    options: [
      { text: 'Word of Mouth (Passive)', score: 30 },
      { text: 'Cold Outreach', score: 50 },
      { text: 'Paid Ads', score: 75 },
      { text: 'Inbound Content Engine', score: 100 },
    ],
  },
  {
    id: 3,
    dimension: 'Analytics',
    icon: <LineChart className="w-5 h-5" />,
    question: 'How do you track key performance indicators (KPIs)?',
    options: [
      { text: "We don't track specifically", score: 20 },
      { text: 'Spreadsheets (Manual)', score: 50 },
      { text: 'Basic Analytics Tools', score: 75 },
      { text: 'Real-time Custom Dashboards', score: 100 },
    ],
  },
  {
    id: 4,
    dimension: 'Operations',
    icon: <Zap className="w-5 h-5" />,
    question: 'What represents your biggest bottleneck?',
    options: [
      { text: 'Lead Generation', score: 60 },
      { text: 'Operational Efficiency', score: 40 },
      { text: 'Talent Retention', score: 70 },
      { text: 'Product Innovation', score: 90 },
    ],
  },
  {
    id: 5,
    dimension: 'Scale',
    icon: <Target className="w-5 h-5" />,
    question: 'Are you ready to scale your operations?',
    options: [
      { text: 'Not sure / Struggling', score: 20 },
      { text: 'Stable but stagnant', score: 50 },
      { text: 'Growing slowly', score: 75 },
      { text: 'Ready for hyper-growth', score: 100 },
    ],
  },
];

export const BusinessHealthQuiz: React.FC = () => {
  const { setQuizStep, updateQuizScore, updateQuizData } = useInteractionStore();
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  const [dimensionScores, setDimensionScores] = useState<Record<string, number>>({
    Strategy: 0,
    Marketing: 0,
    Analytics: 0,
    Operations: 0,
    Scale: 0,
  });

  const handleNext = () => {
    const currentQuestion = QUESTIONS[currentQuestionIdx];
    if (!currentQuestion || selectedOption === null) return;

    const option = currentQuestion.options[selectedOption];
    if (!option) return;

    setDimensionScores((prev) => ({
      ...prev,
      [currentQuestion.dimension]: option.score,
    }));

    updateQuizData({ [`q${currentQuestionIdx + 1}`]: option.text });

    if (currentQuestionIdx < QUESTIONS.length - 1) {
      setSelectedOption(null);
      setCurrentQuestionIdx((prev) => prev + 1);
      setQuizStep(currentQuestionIdx + 1);
    } else {
      const finalTotal =
        Object.values({
          ...dimensionScores,
          [currentQuestion.dimension]: option.score,
        }).reduce((a, b) => a + b, 0) / QUESTIONS.length;

      setIsCompleted(true);
      updateQuizScore(Math.round(finalTotal));
    }
  };

  const totalScore = useMemo(() => {
    return Math.round(Object.values(dimensionScores).reduce((a, b) => a + b, 0) / QUESTIONS.length);
  }, [dimensionScores]);

  const chartData = useMemo(() => {
    return Object.entries(dimensionScores).map(([key, value]) => ({
      subject: key,
      A: value,
      fullMark: 100,
    }));
  }, [dimensionScores]);

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const getHealthTier = (score: number) => {
    if (score < 50)
      return {
        title: 'Foundational Phase',
        color: 'text-orange-400',
        bg: 'bg-orange-500/10',
        stroke: '#fb923c',
      };
    if (score < 80)
      return {
        title: 'Growth Phase',
        color: 'text-blue-400',
        bg: 'bg-blue-500/10',
        stroke: '#60a5fa',
      };
    return {
      title: 'Optimization Phase',
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      stroke: '#34d399',
    };
  };

  if (isCompleted) {
    const tier = getHealthTier(totalScore);
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl mx-auto p-1 glass-card rounded-3xl bg-white/5 border border-white/10 overflow-hidden relative"
      >
        <div
          className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px] pointer-events-none"
          aria-hidden="true"
        />

        <div className="p-8 md:p-12 relative z-10 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="mb-8">
              <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-semibold tracking-widest text-slate-400 uppercase mb-4 inline-block">
                Assessment Result
              </span>
              <h2 className="text-4xl md:text-5xl font-serif font-medium text-white mb-4">
                Digital Maturity Score
              </h2>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-6xl font-bold text-transparent bg-clip-text bg-linear-to-r from-white to-white/60">
                  {totalScore}
                </span>
                <span className="text-xl text-slate-400">/ 100</span>
              </div>
              <div
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${tier.bg} ${tier.color} font-medium`}
              >
                <Activity className="w-5 h-5" />
                {tier.title}
              </div>
            </div>

            <div className="bg-neutral-900/50 rounded-2xl p-6 border border-white/5 mb-8">
              <h4 className="font-semibold text-white mb-3">Executive Summary</h4>
              <p className="text-slate-400 leading-relaxed text-sm">
                Based on your multi-dimensional analysis, your organization shows strong potential
                but requires strategic alignment in
                {Object.entries(dimensionScores).sort((a, b) => a[1] - b[1])[0]?.[0] ||
                  'Strategy'}{' '}
                to unlock the next stage of growth.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                type="button"
                className="flex-1 px-6 py-4 bg-primary text-white font-medium rounded-xl hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
              >
                <FileText className="w-5 h-5" />
                Generate Full PDF
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-6 py-4 text-slate-400 font-medium hover:bg-white/5 border border-white/10 rounded-xl transition-colors"
              >
                Retake
              </button>
            </div>
          </div>

          <div className="h-100 w-full bg-black/20 rounded-2xl border border-white/5 p-4 relative">
            {isMounted && (
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                  />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar
                    name="Score"
                    dataKey="A"
                    stroke={tier.stroke}
                    fill={tier.stroke}
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  const currentQuestion = QUESTIONS[currentQuestionIdx];
  if (!currentQuestion) return null;

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="mb-12">
        <div className="flex justify-between items-end mb-4">
          <div>
            <span className="text-slate-400 text-sm font-medium tracking-widest uppercase mb-2 block">
              Strategic Audit
            </span>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-primary">
                {currentQuestion.icon}
              </div>
              <h3 className="text-xl font-semibold text-white">{currentQuestion.dimension}</h3>
            </div>
          </div>
          <div className="text-right">
            <span className="text-3xl font-light text-white">0{currentQuestionIdx + 1}</span>
            <span className="text-slate-400"> / 0{QUESTIONS.length}</span>
          </div>
        </div>

        <div className="flex gap-2 h-1.5">
          {QUESTIONS.map((_, idx) => (
            <div key={idx} className="flex-1 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: 0 }}
                animate={{
                  width:
                    idx < currentQuestionIdx ? '100%' : idx === currentQuestionIdx ? '50%' : '0%',
                }}
                transition={{ duration: 0.5 }}
              />
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestionIdx}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="glass-card rounded-3xl p-8 md:p-12 border border-white/10 bg-white/5"
        >
          <h2 className="text-2xl md:text-3xl font-serif font-medium text-white mb-10 leading-tight">
            {currentQuestion.question}
          </h2>

          <div className="grid sm:grid-cols-2 gap-4">
            {currentQuestion.options.map((option, idx) => (
              <button
                type="button"
                key={idx}
                onClick={() => setSelectedOption(idx)}
                className={`
                                    w-full text-left p-6 rounded-2xl border-2 transition-all duration-300 relative overflow-hidden group
                                    ${
                                      selectedOption === idx
                                        ? 'border-primary bg-primary/10'
                                        : 'border-white/5 bg-neutral-900/50 hover:border-white/20 hover:bg-white/5'
                                    }
                                `}
              >
                <div
                  className={`
                                    absolute top-6 right-6 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors
                                    ${selectedOption === idx ? 'border-primary bg-primary' : 'border-slate-600 group-hover:border-slate-400'}
                                `}
                >
                  {selectedOption === idx && <Check className="w-3 h-3 text-white" />}
                </div>

                <span
                  className={`
                                    font-medium pr-8 block
                                    ${selectedOption === idx ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}
                                `}
                >
                  {option.text}
                </span>
              </button>
            ))}
          </div>

          <div className="mt-12 flex justify-between items-center border-t border-white/5 pt-8">
            <button
              type="button"
              onClick={() => {
                if (currentQuestionIdx > 0) {
                  setCurrentQuestionIdx((prev) => prev - 1);
                  setSelectedOption(null);
                }
              }}
              className={`text-sm font-medium transition-colors ${currentQuestionIdx === 0 ? 'text-transparent cursor-default' : 'text-slate-400 hover:text-white'}`}
            >
              Back
            </button>

            <button
              type="button"
              onClick={handleNext}
              disabled={selectedOption === null}
              className={`
                                flex items-center gap-3 px-8 py-4 rounded-xl font-medium transition-all duration-300
                                ${
                                  selectedOption !== null
                                    ? 'bg-white text-neutral hover:bg-slate-200 hover:scale-105 shadow-lg'
                                    : 'bg-white/5 text-slate-400 cursor-not-allowed'
                                }
                            `}
            >
              {currentQuestionIdx === QUESTIONS.length - 1 ? 'Analyze Results' : 'Continue'}
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
