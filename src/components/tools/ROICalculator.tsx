
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Slider } from '../ui/Slider';
import { Calculator, ArrowRight, Download } from 'lucide-react';
import { useTranslation } from '../../lib/i18n';

export const ROICalculator: React.FC = () => {
  const { t, language } = useTranslation();
  
  const [revenue, setRevenue] = useState([1000000]); // Annual Revenue
  const [efficiency, setEfficiency] = useState([15]); // Efficiency Gain %
  const [duration, setDuration] = useState([12]); // Project Duration (months)

  // Calculation Logic (Simplified for Demo)
  // Formula: Revenue * (Efficiency / 100)
  const annualSavings = Math.round((revenue[0] || 0) * ((efficiency[0] || 0) / 100));
  const fiveYearROI = annualSavings * 5;
  const implementationCost = Math.round(annualSavings * 0.2); // Assumed 20% of first year savings
  const netFirstYear = annualSavings - implementationCost;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat(language === 'tr' ? 'tr-TR' : 'en-US', {
      style: 'currency',
      currency: language === 'tr' ? 'TRY' : 'USD',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <section className="py-24 bg-transparent" id="roi-calculator">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Inputs Section */}
          <div className="space-y-12">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-900 rounded-full text-xs font-bold uppercase tracking-widest">
                <Calculator size={14} />
                {language === 'tr' ? 'Etki Analizi' : 'Impact Analysis'}
              </div>
              <h2 className="text-3xl font-bold text-white">
                {language === 'tr' ? 'Yatırım Getirisi Hesapla' : 'Calculate Your ROI'}
              </h2>
              <p className="text-slate-400">
                {language === 'tr' 
                  ? 'Danışmanlık hizmetlerimizin işletmenize katacağı potansiyel değeri gerçek zamanlı hesaplayın.' 
                  : 'Real-time calculation of the potential value our consulting services will add to your business.'}
              </p>
            </div>

            <div className="space-y-8 bg-white/5 p-8 rounded-2xl shadow-sm border border-white/10">
              
              {/* Revenue Slider */}
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-white/5 p-3 rounded-lg">
                  <label className="text-sm font-bold text-slate-300">
                    {language === 'tr' ? 'Yıllık Ciro' : 'Annual Revenue'}
                  </label>
                  <span className="text-primary font-mono font-bold">
                    {formatCurrency(revenue[0] || 0)}
                  </span>
                </div>
                <Slider
                  defaultValue={[1000000]}
                  max={10000000}
                  step={100000}
                  value={revenue}
                  onValueChange={setRevenue}
                  className="py-4"
                  aria-label={language === 'tr' ? 'Yıllık Ciro' : 'Annual Revenue'}
                />
                 <div className="flex justify-between text-xs text-slate-400">
                    <span>{formatCurrency(100000)}</span>
                    <span>{formatCurrency(10000000)}</span>
                </div>
              </div>

              {/* Efficiency Slider */}
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-white/5 p-3 rounded-lg">
                  <label className="text-sm font-bold text-slate-300">
                    {language === 'tr' ? 'Hedeflenen Verimlilik Artışı' : 'Target Efficiency Gain'}
                  </label>
                  <span className="text-primary font-mono font-bold">
                    {efficiency[0]}%
                  </span>
                </div>
                <Slider
                  defaultValue={[15]}
                  max={50}
                  step={1}
                  value={efficiency}
                  onValueChange={setEfficiency}
                  className="py-4"
                  aria-label="Efficiency Gain"
                />
                <div className="flex justify-between text-xs text-slate-400">
                    <span>1%</span>
                    <span>50%</span>
                </div>
              </div>

            </div>
          </div>

          {/* Results Section */}
          <div className="relative">
             {/* Decorative Background for Results */}
            <div className="absolute -inset-4 bg-linear-to-r from-blue-500 to-indigo-600 rounded-4xl opacity-30 blur-2xl"></div>
            
            <div className="relative bg-linear-to-br from-slate-900 to-slate-800 text-white rounded-4xl p-10 shadow-2xl overflow-hidden border border-slate-700/50">
                {/* Result Cards */}
                <div className="grid grid-cols-1 gap-8 mb-10">
                    <div>
                        <p className="text-slate-200 text-sm uppercase tracking-wider font-bold mb-2">
                            {language === 'tr' ? 'Tahmini Yıllık Tasarruf' : 'Estimated Annual Savings'}
                        </p>
                        <AnimatePresence mode="wait">
                            <motion.h3 
                                key={annualSavings}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="text-5xl font-bold text-transparent bg-clip-text bg-linear-to-r from-blue-200 to-white"
                            >
                                {formatCurrency(annualSavings)}
                            </motion.h3>
                        </AnimatePresence>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-8 border-t border-slate-700/50">
                        <div>
                            <p className="text-slate-200 text-xs uppercase tracking-wider font-bold mb-1">
                                {language === 'tr' ? '5 Yıllık ROI' : '5-Year ROI'}
                            </p>
                             <AnimatePresence mode="wait">
                                <motion.p 
                                    key={fiveYearROI}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-2xl font-bold text-green-400"
                                >
                                    {formatCurrency(fiveYearROI)}
                                </motion.p>
                            </AnimatePresence>
                        </div>
                        <div>
                             <p className="text-slate-200 text-xs uppercase tracking-wider font-bold mb-1">
                                {language === 'tr' ? 'İlk Yıl Net Getiri' : 'Net First Year'}
                            </p>
                             <AnimatePresence mode="wait">
                                <motion.p 
                                    key={netFirstYear}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-2xl font-bold text-blue-400"
                                >
                                    {formatCurrency(netFirstYear)}
                                </motion.p>
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* CTAs */}
                <div className="space-y-4">
                    <button className="w-full py-4 bg-white/10 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-white/20 transition-colors shadow-lg group">
                        {language === 'tr' ? 'Detaylı Raporu İndir' : 'Download Detailed Report'}
                        <Download size={18} className="text-slate-400 group-hover:text-white transition-colors" />
                    </button>
                    <button onClick={() => window.location.href='/contact'} className="w-full py-4 bg-transparent border border-slate-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors">
                        {language === 'tr' ? 'Uzmanımıza Danışın' : 'Consult an Expert'}
                        <ArrowRight size={18} />
                    </button>
                </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
