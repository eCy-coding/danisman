import React, { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, ChevronRight, User, Briefcase } from 'lucide-react';
import { SmartInput } from '../../ui/smart-form/SmartInput';
import { SmartSlider } from '../../ui/smart-form/SmartSlider';
import * as emailService from '../../../services/emailService';
import { Logger } from '@/lib/logger';
import { usePersonalizationStore } from '@/lib/stores/personalizationStore';

// Schema Definition
const step1Schema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  company: z.string().min(2, "Company name is required"),
});

const SERVICE_TYPES = ["strategy", "digital", "optimization", "training"] as const;
type ServiceType = typeof SERVICE_TYPES[number];

const step2Schema = z.object({
  serviceType: z.enum(SERVICE_TYPES),
  budget: z.number().min(5000, "Minimum budget is $5k"),
  timeline: z.enum(["immediate", "1-3months", "3plus"]).optional(),
});

const combinedSchema = step1Schema.merge(step2Schema);
type BookingFormValues = z.infer<typeof combinedSchema>;

export const BookingWizard: React.FC = () => {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { getTopInterest } = usePersonalizationStore();
  const topInterest = getTopInterest();

  const methods = useForm<BookingFormValues>({
    resolver: zodResolver(combinedSchema),
    mode: 'onChange',
    defaultValues: {
      serviceType: (topInterest as ServiceType) || undefined,
      budget: 15000,
    }
  });

  const { trigger, watch } = methods;

  const handleNext = async () => {
    let isValid = false;
    if (step === 1) {
      isValid = await trigger(['name', 'email', 'company']);
    } else {
      isValid = await trigger();
    }

    if (isValid) {
        if(step < 2) setStep(prev => prev + 1);
        else onSubmit();
    }
  };

  const onSubmit = async () => {
    const data = watch();
    setIsSubmitting(true);
    try {
        await emailService.submitBooking({
          name: data.name,
          email: data.email,
          company: data.company,
          serviceInterest: data.serviceType,
          budget: data.budget.toString(),
        });
        setIsSuccess(true);
    } catch (error) {
        Logger.error('Booking failed', error);
    } finally {
        setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
        <div className="text-center p-12 bg-emerald-500/10 rounded-3xl border border-emerald-500/20">
            <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">Request Received!</h3>
            <p className="text-emerald-300">We will review your application and get back to you within 24 hours.</p>
        </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto glass-card p-8 rounded-3xl">
        {/* reliable progress steps */}
        <div className="flex justify-between mb-8 px-4">
            {[1, 2].map((s) => (
                <div key={s} className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors
                        ${step >= s ? 'bg-primary text-white' : 'bg-white/10 text-slate-400'}
                    `}>
                        {s}
                    </div>
                    <span className={`text-sm font-medium ${step >= s ? 'text-white' : 'text-slate-400'}`}>
                        {s === 1 ? 'About You' : 'Project Details'}
                    </span>
                </div>
            ))}
        </div>

        <FormProvider {...methods}>
            <form onSubmit={(e) => e.preventDefault()} data-testid="booking-form" className="space-y-6">
                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div 
                            key="step1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-4"
                        >
                            <SmartInput name="name" label="Full Name" icon={<User size={18}/>} placeholder="John Doe" />
                            <SmartInput name="email" label="Work Email" type="email" icon={<div className="text-slate-400">@</div>} placeholder="john@company.com" />
                            <SmartInput name="company" label="Company Name" icon={<Briefcase size={18}/>} placeholder="Acme Inc." />
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Primary Goal</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                      { label: 'Strategy', value: 'strategy' },
                                      { label: 'Digital Transformation', value: 'digital' },
                                      { label: 'Process Optimization', value: 'optimization' },
                                      { label: 'Staff Training', value: 'training' }
                                    ].map((opt) => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => methods.setValue('serviceType', opt.value as ServiceType, { shouldValidate: true })}
                                            className={`p-3 text-sm rounded-xl border text-left transition-all
                                                ${watch('serviceType') === opt.value 
                                                    ? 'border-primary bg-primary/10 text-white font-medium' 
                                                    : 'border-white/10 hover:border-white/20 text-slate-400'
                                                }
                                            `}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            <SmartSlider 
                                name="budget" 
                                label="Estimated Budget" 
                                min={5000} 
                                max={100000} 
                                step={5000} 
                                formatValue={(v) => `$${v/1000}k`}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="pt-6 border-t border-white/10 flex justify-end">
                    <button
                        type="button"
                        onClick={handleNext}
                        disabled={isSubmitting}
                        className="bg-primary text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'Processing...' : step === 2 ? 'Submit Request' : 'Next Step'}
                        {!isSubmitting && <ChevronRight size={18} />}
                    </button>
                </div>
            </form>
        </FormProvider>
    </div>
  );
};
