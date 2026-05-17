/**
 * P34-T01: ROI Calculator — 4-step GA4 Funnel Tracking
 *
 * Funnel steps (mapped to GA4 roi_calculator events):
 *   Step 1: "start"       — component mounts in viewport (IntersectionObserver)
 *   Step 2: "input_*"     — user adjusts any input (debounced 800ms → result_view)
 *   Step 3: "result_view" — ROI result computed after 800ms idle
 *   Step 4: "cta_click"   — user clicks "Strateji Görüşmesi Planla"
 *
 * ROI Formula (financial return on consulting investment):
 *   projectedRevenue = revenue × (1 + efficiencyGain/100)
 *   profit = projectedRevenue - revenue - cost
 *   ROI = (profit / cost) × 100          [%]
 *   Payback period = cost / (profit / 12) [months]
 *
 * Lead signal: ROI calc complete + CTA click = high-intent lead (score +60 in lead-scoring)
 */
import React, { useEffect, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { CalculatorInputs } from './CalculatorInputs';
import { ResultsChart } from './ResultsChart';
import { motion } from 'motion/react';
import { trackROICalc } from '../../../lib/analytics';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LocalPersistenceService, STORAGE_KEYS } from '../../../services/persistence';
import { z } from 'zod';

type CalculatorData = {
  revenue: string;
  efficiencyGain: string;
  cost: string;
};

// P42: Conservative default'lar — kullanıcı kendi sayılarını girene kadar
// gösterge muhafazakar bir başlangıç noktası sunar.
const ROI_DEFAULTS: CalculatorData = {
  revenue: '1000000',
  efficiencyGain: '15',
  cost: '50000',
};

const ROISchema = z.object({
  revenue: z.string(),
  efficiencyGain: z.string(),
  cost: z.string(),
});

function loadSavedInputs(): CalculatorData {
  return LocalPersistenceService.load(STORAGE_KEYS.ROI_CALCULATOR, ROISchema, ROI_DEFAULTS);
}

export const ROICalculator: React.FC = () => {
  const {
    register,
    watch,
    formState: { errors },
  } = useForm<CalculatorData>({
    defaultValues: loadSavedInputs(),
  });

  const values = watch();
  const startedRef = useRef(false);
  const resultViewFiredRef = useRef(false);
  const sectionRef = useRef<HTMLElement | null>(null);
  const navigate = useNavigate();

  // Safe parsing
  const revenue = parseFloat(values.revenue) || 0;
  const efficiencyGain = parseFloat(values.efficiencyGain) || 0;
  const cost = parseFloat(values.cost) || 0;

  // ROI math
  const projectedRevenue = revenue * (1 + efficiencyGain / 100);
  const profit = projectedRevenue - revenue - cost;
  const roi = cost > 0 ? (profit / cost) * 100 : 0;
  // Payback period: months to recoup consulting cost
  const paybackMonths = profit > 0 ? Math.ceil(cost / (profit / 12)) : null;

  // Step 1: "start" — fire when section enters viewport (one-shot IO)
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      if (!startedRef.current) {
        startedRef.current = true;
        trackROICalc('start');
      }
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !startedRef.current) {
          startedRef.current = true;
          trackROICalc('start');
          observer.disconnect();
        }
      },
      { rootMargin: '100px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Steps 2+3: input change → debounced result_view (800ms idle) + persist
  useEffect(() => {
    if (!startedRef.current) return; // don't fire before step 1
    resultViewFiredRef.current = false;
    const timer = setTimeout(() => {
      resultViewFiredRef.current = true;
      trackROICalc('result_view', {
        revenue: values.revenue,
        efficiencyGain: values.efficiencyGain,
        cost: values.cost,
        roiResult: Math.round(roi),
      });
      LocalPersistenceService.save(STORAGE_KEYS.ROI_CALCULATOR, {
        revenue: values.revenue,
        efficiencyGain: values.efficiencyGain,
        cost: values.cost,
      });
    }, 800);
    return () => clearTimeout(timer);
  }, [values.revenue, values.efficiencyGain, values.cost, roi]);

  // Step 4: CTA click handler
  const handleCTAClick = useCallback(() => {
    trackROICalc('cta_click', {
      revenue: values.revenue,
      efficiencyGain: values.efficiencyGain,
      cost: values.cost,
      roiResult: Math.round(roi),
    });
    navigate('/contact');
  }, [navigate, values, roi]);

  return (
    <section ref={sectionRef} className="py-20 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-200 h-200 bg-blue-500/10 rounded-full blur-[100px] -z-10" />

      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-linear-to-r from-white to-gray-400 mb-4">
            Yatırım Getirisi Hesaplayıcı
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Dijital dönüşümün işletmenize katacağı değeri saniyeler içinde simüle edin.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <CalculatorInputs register={register} errors={errors} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <ResultsChart
              currentRevenue={revenue}
              projectedRevenue={projectedRevenue}
              profit={profit}
              roi={roi}
            />
          </motion.div>
        </div>

        {/* Step 4: CTA — Payback period + conversion bridge */}
        {roi > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-10 flex flex-col items-center gap-4"
          >
            {paybackMonths && (
              <p className="text-sm text-slate-400 text-center">
                Tahmini geri ödeme süresi:{' '}
                <span className="text-white font-semibold">{paybackMonths} ay</span> — Toplam yıllık
                kâr:{' '}
                <span className="text-green-400 font-semibold">
                  {new Intl.NumberFormat('tr-TR', {
                    style: 'currency',
                    currency: 'TRY',
                    maximumFractionDigits: 0,
                  }).format(profit)}
                </span>
              </p>
            )}
            <button
              type="button"
              onClick={handleCTAClick}
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-secondary text-neutral font-semibold rounded-xl hover:bg-secondary/90 transition-all active:scale-95 shadow-lg shadow-secondary/25"
            >
              Bu sonucu gerçeğe dönüştür
              <ArrowRight size={18} />
            </button>
            <p className="text-xs text-slate-500">
              Ücretsiz 30 dk strateji görüşmesi · Bağlayıcılık yok
            </p>
          </motion.div>
        )}
      </div>
    </section>
  );
};
