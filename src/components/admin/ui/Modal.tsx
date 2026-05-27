/**
 * P57.1 — Modal + ConfirmDialog primitives.
 * M4 upgrade: FocusTrap added (focus-trap-react), focus restores on close.
 *
 * - <Modal open onClose title>...</Modal>
 * - <ConfirmDialog open onConfirm onCancel title message />
 */

import React, { useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { FocusTrap } from '../../ui/FocusTrap';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const SIZE_MAP: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  description,
  size = 'md',
  children,
  footer,
}) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <FocusTrap active={open} onDeactivate={onClose}>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-black/60"
          onClick={onClose}
          onKeyDown={(e) => {
            if (e.key === 'Escape') onClose();
          }}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? 'modal-title' : undefined}
          className={`relative z-10 w-full ${SIZE_MAP[size]} bg-neutral border border-white/15 rounded-2xl shadow-2xl overflow-hidden`}
        >
          {(title || description) && (
            <header className="px-6 pt-5 pb-3 border-b border-white/5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  {title && (
                    <h2 id="modal-title" className="text-lg font-serif font-bold text-white">
                      {title}
                    </h2>
                  )}
                  {description && <p className="text-sm text-slate-400 mt-1">{description}</p>}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Kapat"
                  className="text-slate-400 hover:text-white p-1 rounded hover:bg-white/5"
                >
                  <X size={18} />
                </button>
              </div>
            </header>
          )}
          <div className="p-6">{children}</div>
          {footer && (
            <footer className="px-6 py-4 border-t border-white/5 flex justify-end gap-2">
              {footer}
            </footer>
          )}
        </div>
      </div>
    </FocusTrap>
  );
};

export interface ConfirmDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'default';
  loading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onConfirm,
  onCancel,
  title,
  message,
  confirmLabel = 'Onayla',
  cancelLabel = 'İptal',
  variant = 'default',
  loading = false,
}) => {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      size="sm"
      footer={
        <>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-sm bg-white/5 text-white hover:bg-white/10 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 ${
              variant === 'danger'
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-secondary text-neutral hover:bg-secondary/90'
            }`}
          >
            {loading ? 'İşleniyor…' : confirmLabel}
          </button>
        </>
      }
    >
      <div className="flex items-start gap-3">
        {variant === 'danger' && (
          <div className="flex-shrink-0 w-9 h-9 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center">
            <AlertTriangle size={16} className="text-red-400" aria-hidden="true" />
          </div>
        )}
        <div>
          <h3 className="text-base font-semibold text-white mb-1">{title}</h3>
          <p className="text-sm text-slate-300">{message}</p>
        </div>
      </div>
    </Modal>
  );
};

export default Modal;
