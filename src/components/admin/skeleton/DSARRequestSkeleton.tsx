import React from 'react';

export const DSARRequestSkeleton: React.FC = () => (
  <div
    className="animate-pulse flex items-center gap-4 px-4 py-3 border-b border-white/5"
    role="status"
    aria-busy="true"
    aria-label="Yükleniyor"
  >
    <div className="h-3 bg-white/5 rounded flex-1" />
    <div className="h-5 w-20 bg-white/5 rounded-full" />
    <div className="h-3 w-24 bg-white/5 rounded" />
    <div className="h-3 w-20 bg-white/5 rounded" />
  </div>
);
