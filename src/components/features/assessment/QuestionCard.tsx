import React from 'react';
import { motion } from 'motion/react';
import { Card } from '@/components/ui/Card';

interface QuestionCardProps {
  question: string;
  options: { label: string; value: number }[];
  onAnswer: (value: number) => void;
  currentStep: number;
  totalSteps: number;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({ 
  question, 
  options, 
  onAnswer, 
  currentStep, 
  totalSteps 
}) => {
  return (
    <Card className="p-8 max-w-2xl mx-auto bg-white/5 backdrop-blur-sm border-white/10">
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-400 mb-2">
          <span>Soru {currentStep} / {totalSteps}</span>
          <span>{Math.round((currentStep / totalSteps) * 100)}%</span>
        </div>
        <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-blue-500"
            initial={{ width: 0 }}
            animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      <h3 className="text-2xl font-bold text-white mb-8">{question}</h3>

      <div className="space-y-3">
        {options.map((option, idx) => (
          <motion.button
            key={idx}
            whileHover={{ scale: 1.02, backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onAnswer(option.value)}
            className="w-full p-4 text-left rounded-lg bg-black/40 border border-white/10 text-gray-300 hover:text-white hover:border-blue-500/50 transition-all group"
          >
            <div className="flex items-center">
              <span className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center mr-4 group-hover:border-blue-500 group-hover:text-blue-500 text-sm">
                {String.fromCharCode(65 + idx)}
              </span>
              {option.label}
            </div>
          </motion.button>
        ))}
      </div>
    </Card>
  );
};
