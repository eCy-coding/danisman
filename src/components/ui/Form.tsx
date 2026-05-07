import React from 'react';
import {
  useFormContext,
  Controller,
  FieldValues,
  FieldError,
  Path,
  RegisterOptions,
  get,
} from 'react-hook-form';
import { Input } from './Input';
import { cn } from '@/lib/utils';

// Wrapper for the form context
interface FormFieldProps<T extends FieldValues> {
  name: Path<T>;
  label?: string;
  placeholder?: string;
  type?: string;
  rules?: RegisterOptions;
  className?: string;
}

export const FormField = <T extends FieldValues>({
  name,
  label,
  placeholder,
  type = 'text',
  className,
}: FormFieldProps<T>) => {
  const {
    control,
    formState: { errors },
  } = useFormContext<T>();

  // Use react-hook-form's `get` helper for dot-path nested error access
  const error = get(errors, name) as FieldError | undefined;

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label htmlFor={name} className="text-sm font-medium text-slate-400">
          {label}
        </label>
      )}
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <Input
            {...field}
            id={name}
            type={type}
            placeholder={placeholder}
            error={error?.message || ''}
          />
        )}
      />
    </div>
  );
};
