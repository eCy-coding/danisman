/**
 * P57.1 — EmptyState primitive.
 *
 * Boş tablo/liste için friendly placeholder + opsiyonel CTA.
 */

import React from 'react';
import { Inbox } from 'lucide-react';

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, description, icon, action }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4">
      <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 mb-4">
        {icon ?? <Inbox size={24} aria-hidden="true" />}
      </div>
      <h3 className="text-base font-semibold text-white mb-1">{title}</h3>
      {description && <p className="text-sm text-slate-400 max-w-md mb-5">{description}</p>}
      {action}
    </div>
  );
};

export default EmptyState;
