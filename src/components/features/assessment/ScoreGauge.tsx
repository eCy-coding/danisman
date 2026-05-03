import React from 'react';
import { motion } from 'motion/react';
import { Card } from '@/components/ui/Card';

interface ScoreGaugeProps {
  score: number;
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({ score }) => {
  const getLevel = (s: number) => {
    if (s < 40) return { label: 'Başlangıç', color: 'text-red-400', desc: 'Dijital dönüşüm yolculuğunun başındasınız.' };
    if (s < 70) return { label: 'Gelişmekte', color: 'text-yellow-400', desc: 'Temel adımları attınız, optimizasyona ihtiyacınız var.' };
    return { label: 'Lider', color: 'text-green-400', desc: 'Sektör standartlarının üzerinde bir vizyona sahipsiniz.' };
  };

  const level = getLevel(score);

  return (
    <Card className="p-8 max-w-2xl mx-auto bg-white/5 backdrop-blur-sm border-white/10 text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <h3 className="text-xl text-gray-400 mb-6">Yapay Zeka Hazırlık Skoru</h3>
        
        <div className="relative w-48 h-48 mx-auto mb-6 flex items-center justify-center">
          {/* Circular Background */}
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="96"
              cy="96"
              r="88"
              stroke="currentColor"
              strokeWidth="12"
              fill="transparent"
              className="text-white/5"
            />
            {/* Progress Circle */}
            <motion.circle
              cx="96"
              cy="96"
              r="88"
              stroke="currentColor"
              strokeWidth="12"
              fill="transparent"
              className={level.color.replace('text-', 'text-')} // Keep specific color class if needed for stroke
              strokeDasharray={2 * Math.PI * 88}
              strokeDashoffset={2 * Math.PI * 88 * (1 - score / 100)}
              initial={{ strokeDashoffset: 2 * Math.PI * 88 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 88 * (1 - score / 100) }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              style={{ stroke: 'currentColor' }} // Fallback
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
             <span className={`text-4xl font-bold ${level.color}`}>{score}</span>
             <span className="text-sm text-gray-500">/ 100</span>
          </div>
        </div>

        <h4 className={`text-2xl font-bold mb-2 ${level.color}`}>{level.label}</h4>
        <p className="text-gray-300 mb-8">{level.desc}</p>

        <button 
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-white/10 text-white font-bold rounded-lg hover:bg-white/20 transition-colors"
        >
            Testi Tekrarla
        </button>
      </motion.div>
    </Card>
  );
};
