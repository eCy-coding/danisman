import React from 'react';
import { useFormContext } from 'react-hook-form';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle } from 'lucide-react';

interface SmartInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  name: string;
  label: string;
  icon?: React.ReactNode;
}

export const SmartInput: React.FC<SmartInputProps> = ({
  name,
  label,
  icon,
  className,
  ...props
}) => {
  const {
    register,
    formState: { errors },
  } = useFormContext();
  const error = errors[name]?.message as string | undefined;

  return (
    <div className={`space-y-1.5 ${className}`}>
      <label htmlFor={name} className="block text-sm font-medium text-slate-400">
        {label}
      </label>
      <div className="relative group">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
            {icon}
          </div>
        )}
        <input
          id={name}
          {...register(name)}
          {...props}
          className={`
                    block w-full rounded-xl border-white/10 bg-white/5 
                    ${icon ? 'pl-10' : 'pl-4'} pr-4 py-2.5
                    text-white placeholder:text-slate-400
                    focus:border-primary focus:bg-white/10 focus:ring-2 focus:ring-primary/20 
                    transition-all duration-200 ease-out outline-none
                    ${error ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-200' : ''}
                `}
        />
      </div>
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="flex items-center gap-1.5 text-xs text-red-500 font-medium pl-1"
          >
            <AlertCircle size={12} />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
