import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { motion } from 'motion/react';
import { ArrowRight, DollarSign, Users, Target } from 'lucide-react';
import { useInteractionStore } from '../../../lib/stores/interactionStore';
import { SmartSlider } from '../../ui/smart-form/SmartSlider';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { emit } from '../../../lib/analytics-events';

const calculatorSchema = z.object({
  revenue: z.number().min(100000).max(100000000),
  teamSize: z.number().min(1).max(500),
});

type CalculatorForm = z.infer<typeof calculatorSchema>;

// Utility to animate numbers (simple counting effect)
const AnimatedNumber = ({ value }: { value: number }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime: number;
    const duration = 1000;
    const startValue = displayValue;
    const change = value - startValue;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);

      // Easing function (easeOutExpo)
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setDisplayValue(startValue + change * ease);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
    // displayValue intentionally omitted to prevent re-triggering the animation loop on every frame
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <>{new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(displayValue)}</>;
};

export const GrowthCalculator: React.FC = () => {
  const { calculator, updateCalculator } = useInteractionStore();
  const [isMounted, setIsMounted] = useState(false);
  const startedRef = useRef(false);
  const revenueTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const teamTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setIsMounted(true);
    return () => {
      if (revenueTimerRef.current) clearTimeout(revenueTimerRef.current);
      if (teamTimerRef.current) clearTimeout(teamTimerRef.current);
    };
  }, []);

  const methods = useForm<CalculatorForm>({
    resolver: zodResolver(calculatorSchema),
    defaultValues: {
      revenue: calculator.revenue,
      teamSize: calculator.teamSize,
    },
    mode: 'onChange',
  });

  const { watch } = methods;
  const values = watch();

  const activeRevenue = values.revenue || calculator.revenue;
  const activeTeam = values.teamSize || calculator.teamSize;

  const projection = useMemo(() => {
    const revenueImpact = activeRevenue * 0.15;
    const productivityImpact = activeTeam * 5000;
    return revenueImpact + productivityImpact;
  }, [activeRevenue, activeTeam]);

  // Generate chart data
  const chartData = useMemo(() => {
    return Array.from({ length: 5 }).map((_, i) => {
      const baseGrowth = activeRevenue * Math.pow(1.05, i); // 5% organic growth
      const optimizedGrowth = activeRevenue * Math.pow(1.15, i) + activeTeam * 5000 * (i + 1); // 15% growth + productivity compounding
      return {
        name: `Year ${i + 1}`,
        Organic: Math.round(baseGrowth),
        Optimized: Math.round(optimizedGrowth),
      };
    });
  }, [activeRevenue, activeTeam]);

  useEffect(() => {
    if (values.revenue && values.teamSize) {
      updateCalculator({ revenue: values.revenue, teamSize: values.teamSize });

      if (!startedRef.current) {
        startedRef.current = true;
        emit('roi_calc_step', { step: 'start', values: { revenue: String(values.revenue) } });
      }

      if (revenueTimerRef.current) clearTimeout(revenueTimerRef.current);
      revenueTimerRef.current = setTimeout(() => {
        emit('roi_calc_step', {
          step: 'input_revenue',
          values: { revenue: String(values.revenue) },
        });
      }, 500);

      if (teamTimerRef.current) clearTimeout(teamTimerRef.current);
      teamTimerRef.current = setTimeout(() => {
        emit('roi_calc_step', {
          step: 'input_efficiency',
          values: { efficiencyGain: String(values.teamSize) },
        });
      }, 500);
    }
  }, [values.revenue, values.teamSize, updateCalculator]);

  return (
    <div className="w-full max-w-6xl mx-auto p-1 glass-card rounded-3xl bg-white/5 border border-white/10 overflow-hidden relative">
      {/* Background Ambience */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-secondary/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="p-8 md:p-12 relative z-10">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6"
          >
            <Target className="w-4 h-4" />
            ROI Projector
          </motion.div>
          <h2 className="text-3xl md:text-5xl font-serif font-medium text-white mb-4 tracking-tight">
            Data-Driven{' '}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-secondary">
              Growth
            </span>
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">
            Simulate the compounded impact of strategic digital transformation and process
            optimization on your bottom line.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-12">
          {/* Controls - Left Side */}
          <div className="lg:col-span-5 space-y-8">
            <FormProvider {...methods}>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-8"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium">Current Revenue</h3>
                      <p className="text-xs text-slate-400">Annual baseline (USD)</p>
                    </div>
                  </div>
                  <SmartSlider
                    name="revenue"
                    label="Current Revenue (USD)"
                    min={100000}
                    max={10000000}
                    step={50000}
                    formatValue={(val) => `$${(val / 1000).toFixed(0)}k`}
                  />
                </div>

                <div className="w-full h-px bg-linear-to-r from-transparent via-white/10 to-transparent" />

                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-secondary/20 flex items-center justify-center">
                      <Users className="w-5 h-5 text-secondary" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium">Team Size</h3>
                      <p className="text-xs text-slate-400">Total FTEs</p>
                    </div>
                  </div>
                  <SmartSlider
                    name="teamSize"
                    label="Team Size (FTEs)"
                    min={1}
                    max={100}
                    step={1}
                  />
                </div>
              </motion.div>
            </FormProvider>

            {/* Micro Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-2 gap-4"
            >
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-slate-400 text-xs uppercase tracking-wider font-semibold">
                  Efficiency Lift
                </span>
                <div className="text-2xl font-bold text-white mt-1">
                  +$
                  <AnimatedNumber value={activeTeam * 5000} />
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-slate-400 text-xs uppercase tracking-wider font-semibold">
                  Revenue Boost
                </span>
                <div className="text-2xl font-bold text-white mt-1">
                  +$
                  <AnimatedNumber value={activeRevenue * 0.15} />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Visualization - Right Side */}
          <div className="lg:col-span-7 flex flex-col justify-between">
            {/* Big Impact Number */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="mb-8"
            >
              <h3 className="text-slate-400 text-sm uppercase tracking-[0.2em] font-semibold mb-3">
                Projected Annual Impact
              </h3>
              <div className="text-6xl md:text-7xl font-bold text-transparent bg-clip-text bg-linear-to-b from-white to-white/60 tracking-tight flex items-baseline gap-2">
                $<AnimatedNumber value={projection} />
                <span className="text-2xl font-medium text-slate-400">/yr</span>
              </div>
            </motion.div>

            {/* Chart */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="h-64 w-full mt-4"
            >
              {isMounted && (
                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                  <AreaChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorOptimized" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorOrganic" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#64748b" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#64748b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.05)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      stroke="rgba(255,255,255,0.2)"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(5, 8, 16, 0.9)',
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        color: '#fff',
                      }}
                      itemStyle={{ color: '#fff' }}
                      formatter={(value) =>
                        [
                          `$${new Intl.NumberFormat('en-US').format(Number(value) || 0)}`,
                          'Revenue',
                        ] as [string, 'Revenue']
                      }
                    />
                    <Area
                      type="monotone"
                      dataKey="Organic"
                      stroke="#64748b"
                      fillOpacity={1}
                      fill="url(#colorOrganic)"
                    />
                    <Area
                      type="monotone"
                      dataKey="Optimized"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorOptimized)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </motion.div>

            {/* Action Area */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-8 pt-8 border-t border-white/10 flex items-center justify-between"
            >
              <p className="text-sm text-slate-400 max-w-xs">
                Numbers are estimates based on average client results in the first 12 months.
              </p>
              <button
                type="button"
                className="group relative px-6 py-3 bg-white text-neutral font-medium rounded-xl hover:bg-slate-100 transition-colors overflow-hidden flex items-center gap-2"
                onClick={() =>
                  emit('roi_calc_step', {
                    step: 'cta_click',
                    values: {
                      revenue: String(activeRevenue),
                      roiResult: Math.round(projection),
                    },
                  })
                }
              >
                <span className="relative z-10">Get Detailed Blueprint</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform relative z-10" />
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GrowthCalculator;
