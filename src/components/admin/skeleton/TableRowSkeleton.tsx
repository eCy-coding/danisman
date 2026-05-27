import React from 'react';

interface TableRowSkeletonProps {
  cols?: number;
}

export const TableRowSkeleton: React.FC<TableRowSkeletonProps> = ({ cols = 4 }) => (
  <div
    className="animate-pulse flex items-center gap-4 px-4 py-3 border-b border-white/5"
    role="status"
    aria-busy="true"
    aria-label="Yükleniyor"
  >
    {Array.from({ length: cols }, (_, i) => (
      <div key={i} className="h-3 flex-1 bg-white/5 rounded" style={{ opacity: 1 - i * 0.1 }} />
    ))}
  </div>
);
