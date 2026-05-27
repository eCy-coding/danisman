import React from 'react';
import { X } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface RetainerDetailDrawerProps {
  retainerId: string | null;
  onClose: () => void;
}

export function RetainerDetailDrawer({ retainerId, onClose }: RetainerDetailDrawerProps) {
  const isOpen = retainerId !== null;

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} aria-hidden="true" />
      )}

      {/* Drawer */}
      <div
        data-testid="retainer-detail-drawer"
        className={cn(
          'fixed inset-y-0 right-0 z-50 w-[480px] transform bg-[#1E1F20] shadow-xl transition-transform duration-300',
          isOpen ? 'translate-x-0' : 'translate-x-full',
        )}
        role="dialog"
        aria-modal="true"
        aria-hidden={!isOpen}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#374151] px-fib-6 py-fib-5">
            <h2 className="text-lg font-semibold text-[#E5E7EB]">Aylık Anlaşma Detayı</h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded p-fib-2 text-[#9CA3AF] hover:bg-[#2A2B2C] hover:text-white"
              aria-label="Kapat"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-fib-6 py-fib-5">
            {retainerId ? <p className="text-sm text-[#9CA3AF]">Anlaşma ID: {retainerId}</p> : null}
          </div>
        </div>
      </div>
    </>
  );
}
