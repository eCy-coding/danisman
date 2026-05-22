import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { QuestionCard } from './QuestionCard';
import { ScoreGauge } from './ScoreGauge';

const QUESTIONS = [
  {
    question: 'Şirketinizde veriler nasıl saklanıyor?',
    options: [
      { label: 'Kağıt ortamında veya dağınık Excel dosyalarında.', value: 10 },
      { label: 'Merkezi bir sunucuda, ancak entegre değil.', value: 30 },
      { label: 'Bulut tabanlı modern yazılımlarda (CRM/ERP).', value: 60 },
      { label: 'Tam entegre ve yapay zeka destekli veri ambarında.', value: 100 },
    ],
  },
  {
    question: 'Karar alma süreçlerinde veriden ne kadar yararlanıyorsunuz?',
    options: [
      { label: 'Tamamen sezgisel ve deneyime dayalı.', value: 10 },
      { label: 'Aylık manuel raporlara bakıyoruz.', value: 40 },
      { label: "Canlı dashboard'lar üzerinden takip ediyoruz.", value: 70 },
      { label: 'Yapay zeka öngörüleri ile proaktif kararlar alıyoruz.', value: 100 },
    ],
  },
  {
    question: 'Müşteri iletişiminiz ne kadar otomatize?',
    options: [
      { label: 'Tamamen manuel (Telefon/E-posta).', value: 10 },
      { label: 'Basit otomatik e-postalar kullanıyoruz.', value: 40 },
      { label: 'Chatbot ve CRM otomasyonları var.', value: 70 },
      { label: 'Yapay zeka kişiselleştirilmiş deneyim sunuyor.', value: 100 },
    ],
  },
];

export const AssessmentWizard: React.FC = () => {
  const [step, setStep] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const handleAnswer = (value: number) => {
    const newScore = totalScore + value;
    if (step < QUESTIONS.length - 1) {
      setTotalScore(newScore);
      setStep(step + 1);
    } else {
      // Calculate average 0-100
      const finalScore = Math.round((newScore + value) / QUESTIONS.length);
      setTotalScore(finalScore);
      setIsCompleted(true);
    }
  };

  return (
    <section className="py-20 min-h-150 flex items-center relative overflow-hidden">
      {/* Ambient Bg */}
      <div className="absolute top-0 left-0 w-full h-full bg-linear-to-br from-purple-900/20 to-black pointer-events-none -z-10" />

      <div className="container mx-auto px-4">
        <AnimatePresence mode="wait">
          {!isCompleted && QUESTIONS[step] ? (
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
            >
              <QuestionCard
                question={QUESTIONS[step].question}
                options={QUESTIONS[step].options}
                onAnswer={handleAnswer}
                currentStep={step + 1}
                totalSteps={QUESTIONS.length}
              />
            </motion.div>
          ) : isCompleted ? (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <ScoreGauge score={totalScore} />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </section>
  );
};
