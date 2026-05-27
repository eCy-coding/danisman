import React from 'react';

export const AuditEntrySkeleton: React.FC = () => (
  <div
    className="animate-pulse flex items-center gap-4 px-4 py-3 border-b border-white/5"
    role="status"
    aria-busy="true"
    aria-label="Yükleniyor"
  >
    <div className="h-3 w-32 bg-white/5 rounded" />
    <div className="h-3 flex-1 bg-white/5 rounded" />
    <div className="h-3 w-24 bg-white/5 rounded" />
    <div className="h-3 w-28 bg-white/5 rounded" />
  </div>
);
