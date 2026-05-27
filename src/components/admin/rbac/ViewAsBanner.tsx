/**
 * M4: ViewAsBanner — sticky top banner shown while in View-As simulation mode.
 *
 * Why sticky: user must always know they are in simulation mode, even when scrolling.
 * High-contrast amber background ensures the banner is impossible to miss.
 * "Çık" button ends the simulation session immediately.
 */

import React from 'react';
import { Eye, X } from 'lucide-react';
import { useViewAs } from '../../../lib/view-as-context';

export const ViewAsBanner: React.FC = () => {
  const { activeRole, isViewAsMode, endViewAs } = useViewAs();

  if (!isViewAsMode || !activeRole) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sticky top-0 z-50 w-full bg-yellow-300 text-black px-5 py-2 flex items-center justify-between gap-4"
    >
      <div className="flex items-center gap-2 text-sm font-medium">
        <Eye size={15} aria-hidden="true" />
        <span>
          Şu an <strong className="font-bold">{activeRole}</strong> olarak görüntülüyorsunuz — tüm
          değişiklik işlemleri engellenmiştir.
        </span>
      </div>

      <button
        type="button"
        onClick={endViewAs}
        className="flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-lg bg-black/10 hover:bg-black/20 transition-colors focus:outline-none focus:ring-2 focus:ring-black/30 whitespace-nowrap"
        aria-label="View-As modundan çık"
      >
        <X size={12} aria-hidden="true" />
        Çık
      </button>
    </div>
  );
};
