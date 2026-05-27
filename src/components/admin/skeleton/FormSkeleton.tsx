import React from 'react';

interface FormSkeletonProps {
  fields?: number;
}

export const FormSkeleton: React.FC<FormSkeletonProps> = ({ fields = 4 }) => (
  <div className="animate-pulse space-y-5" role="status" aria-busy="true" aria-label="Yükleniyor">
    {Array.from({ length: fields }, (_, i) => (
      <div key={i}>
        <div className="h-3 w-24 bg-white/5 rounded mb-2" />
        <div className="h-9 w-full bg-white/5 rounded-lg" />
      </div>
    ))}
    <div className="flex gap-3 pt-2">
      <div className="h-9 w-24 bg-white/5 rounded-lg" />
      <div className="h-9 w-20 bg-white/5 rounded-lg" />
    </div>
  </div>
);
