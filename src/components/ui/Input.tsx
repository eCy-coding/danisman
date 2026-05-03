import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, id, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label 
            htmlFor={id} 
            className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2"
          >
            {label}
          </label>
        )}
        <input
          id={id}
          ref={ref}
          className={`
            w-full bg-white/5 border rounded-lg px-4 py-3 text-white 
            focus:outline-none focus:ring-1 focus:ring-secondary focus:border-secondary 
            transition-all shadow-sm placeholder-slate-500 disabled:opacity-50 disabled:bg-white/5
            ${error ? 'border-red-400/50 focus:ring-red-500 focus:border-red-500' : 'border-white/10'}
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-red-500">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
