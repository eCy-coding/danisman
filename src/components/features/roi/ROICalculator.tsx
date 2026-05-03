import React from 'react';
import { useForm } from 'react-hook-form';
import { CalculatorInputs } from './CalculatorInputs';
import { ResultsChart } from './ResultsChart';
import { motion } from 'motion/react';

type CalculatorData = {
  revenue: string;
  efficiencyGain: string;
  cost: string;
};

export const ROICalculator: React.FC = () => {
    // Lead Magnet State - We can extend this to capture email later
  const { register, watch, formState: { errors } } = useForm<CalculatorData>({
    defaultValues: {
      revenue: '1000000',
      efficiencyGain: '20',
      cost: '50000'
    }
  });

  const values = watch();
  
  // Safe parsing
  const revenue = parseFloat(values.revenue) || 0;
  const efficiencyGain = parseFloat(values.efficiencyGain) || 0;
  const cost = parseFloat(values.cost) || 0;

  // Logic
  const projectedRevenue = revenue * (1 + efficiencyGain / 100);
  const profit = projectedRevenue - revenue - cost;
  // Prevent division by zero
  const roi = cost > 0 ? (profit / cost) * 100 : 0;

  return (
    <section className="py-20 relative overflow-hidden">
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
      </div>
    </section>
  );
};
