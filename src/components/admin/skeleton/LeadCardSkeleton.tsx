import React from 'react';

export const LeadCardSkeleton: React.FC = () => (
  <div
    className="animate-pulse p-4 border border-white/5 rounded-xl"
    role="status"
    aria-busy="true"
    aria-label="Yükleniyor"
  >
    <div className="flex items-center gap-3 mb-3">
      <div className="h-9 w-9 rounded-full bg-white/5" />
      <div className="flex-1">
        <div className="h-3.5 bg-white/5 rounded w-2/3 mb-1.5" />
        <div className="h-3 bg-white/5 rounded w-1/2" />
      </div>
    </div>
    <div className="h-3 bg-white/5 rounded w-full mb-1.5" />
    <div className="h-3 bg-white/5 rounded w-3/4" />
  </div>
);
