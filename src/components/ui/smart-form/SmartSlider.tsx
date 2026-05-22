import React from 'react';
import { useFormContext } from 'react-hook-form';

interface SmartSliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
  name: string;
  label: string;
  min: number;
  max: number;
  step?: number;
  formatValue?: (value: number) => string;
}

export const SmartSlider: React.FC<SmartSliderProps> = ({
  name,
  label,
  min,
  max,
  step = 1,
  formatValue,
  ...props
}) => {
  const { register, watch } = useFormContext();
  const value = watch(name);

  return (
    <div className="space-y-4 p-4 bg-white/5 rounded-xl border border-white/10">
      <div className="flex justify-between items-center">
        <label htmlFor={name} className="text-sm font-medium text-slate-400">
          {label}
        </label>
        <span className="text-sm font-bold text-primary bg-primary/10 px-2 py-1 rounded-md min-w-[3rem] text-center">
          {formatValue ? formatValue(Number(value || min)) : value}
        </span>
      </div>

      <div className="relative h-6 flex items-center">
        <input
          type="range"
          id={name}
          min={min}
          max={max}
          step={step}
          {...register(name, { valueAsNumber: true })}
          {...props}
          className="
            absolute w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer
            focus:outline-none focus:ring-2 focus:ring-primary/20
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-6
            [&::-webkit-slider-thumb]:h-6
            [&::-webkit-slider-thumb]:bg-white
            [&::-webkit-slider-thumb]:border-2
            [&::-webkit-slider-thumb]:border-primary
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:shadow-md
            [&::-webkit-slider-thumb]:transition-transform
            [&::-webkit-slider-thumb]:hover:scale-110
          "
        />
      </div>
      <div className="flex justify-between text-xs text-slate-400 font-medium px-1">
        <span>{formatValue ? formatValue(min) : min}</span>
        <span>{formatValue ? formatValue(max) : max}</span>
      </div>
    </div>
  );
};
