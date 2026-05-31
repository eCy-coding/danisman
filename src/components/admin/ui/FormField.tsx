/**
 * P57.1 — FormField primitive (input / textarea / select / date / color sarmalayıcı).
 *
 * Easy-to-use: label + opsiyonel help tooltip + error mesajı + required *.
 *
 * Usage:
 *   <FormField label="E-posta" required tooltip="Aktif e-posta adresiniz" error={errors.email?.message}>
 *     <input type="email" {...register('email')} />
 *   </FormField>
 */

import React from 'react';
import { HelpCircle } from 'lucide-react';

export interface FormFieldProps {
  label: string;
  required?: boolean;
  tooltip?: string;
  error?: string;
  hint?: string;
  htmlFor?: string;
  children: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  required,
  tooltip,
  error,
  hint,
  htmlFor,
  children,
}) => {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <label htmlFor={htmlFor} className="text-sm font-semibold text-slate-200">
          {label}
          {required && (
            <span className="text-red-400 ml-0.5" aria-hidden="true">
              *
            </span>
          )}
        </label>
        {tooltip && (
          <span
            className="group relative inline-flex"
            tabIndex={0}
            role="button"
            aria-label={tooltip}
          >
            <HelpCircle
              size={13}
              className="text-slate-500 hover:text-slate-300 cursor-help"
              aria-hidden="true"
            />
            <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block group-focus:block pointer-events-none bg-neutral border border-white/15 rounded-lg px-3 py-2 text-xs text-slate-300 w-64 z-10 shadow-2xl">
              {tooltip}
            </span>
          </span>
        )}
      </div>
      {children}
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
      {error && (
        <p role="alert" className="text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  );
};

/** Tailwind preset for native <input>/<textarea>/<select> elements. */
export const fieldClassName =
  'w-full bg-neutral border border-white/15 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary/30 disabled:opacity-50 disabled:cursor-not-allowed';

export default FormField;
