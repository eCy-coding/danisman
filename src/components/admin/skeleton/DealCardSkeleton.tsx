import React from 'react';

export const DealCardSkeleton: React.FC = () => (
  <div
    className="animate-pulse p-4 border border-white/5 rounded-xl"
    role="status"
    aria-busy="true"
    aria-label="Yükleniyor"
  >
    <div className="h-4 bg-white/5 rounded w-3/4 mb-2" />
    <div className="h-3 bg-white/5 rounded w-1/2 mb-3" />
    <div className="flex gap-2">
      <div className="h-5 w-20 bg-white/5 rounded-full" />
      <div className="h-5 w-16 bg-white/5 rounded-full" />
    </div>
    <div className="mt-3 h-3 bg-white/5 rounded w-1/3" />
  </div>
);
