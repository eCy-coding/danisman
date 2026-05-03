import React from 'react';
import { BusinessHealthQuiz } from '@/components/features/interactive/BusinessHealthQuiz';

export const AssessmentPage: React.FC = () => {
  return (
    <div className="grow min-h-screen bg-neutral pt-20">
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-linear-to-r from-blue-400 to-purple-500 mb-6">
          Yapay Zeka Hazırlık Testi
        </h1>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-12">
          İşletmenizin dijital olgunluk seviyesini ölçün ve size özel yapay zeka entegrasyon önerilerini sadece 2 dakikada öğrenin.
        </p>
        
        <BusinessHealthQuiz />
      </div>
    </div>
  );
};
