import React from 'react';

export const HeroPattern: React.FC = () => {
  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true">
      <svg
        className="absolute top-0 right-0 w-full md:w-2/3 h-full text-slate-200/40 fill-current opacity-60"
        viewBox="0 0 800 800"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M400 0L800 400L400 800L0 400L400 0Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.5"
        />
        <circle cx="600" cy="200" r="150" fill="none" stroke="currentColor" strokeWidth="1" />
        <path d="M600 50L600 350" stroke="currentColor" strokeWidth="0.5" />
        <path d="M450 200L750 200" stroke="currentColor" strokeWidth="0.5" />
        <rect
          x="100"
          y="500"
          width="100"
          height="100"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
        />
        <path d="M50 50L200 200" stroke="currentColor" strokeWidth="0.5" />
      </svg>
    </div>
  );
};
