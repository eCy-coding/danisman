import React, { useEffect, useRef } from 'react';
import FocusTrapLib from 'focus-trap-react';

export interface FocusTrapProps {
  active: boolean;
  children: React.ReactNode;
  /** Element to return focus to when trap deactivates. Defaults to document.activeElement at mount. */
  returnFocusTo?: HTMLElement | null;
  onDeactivate?: () => void;
}

/**
 * M4 — FocusTrap wraps focus-trap-react.
 * Traps keyboard focus within children when `active=true`.
 * Restores focus to `returnFocusTo` (or the pre-mount active element) on deactivate.
 */
export const FocusTrap: React.FC<FocusTrapProps> = ({
  active,
  children,
  returnFocusTo,
  onDeactivate,
}) => {
  const triggerRef = useRef<Element | null>(null);

  useEffect(() => {
    if (active) {
      triggerRef.current = document.activeElement;
    }
  }, [active]);

  if (!active) return <>{children}</>;

  return (
    <FocusTrapLib
      focusTrapOptions={{
        returnFocusOnDeactivate: false,
        onDeactivate: () => {
          const target = returnFocusTo ?? (triggerRef.current as HTMLElement | null);
          if (target && typeof target.focus === 'function') {
            target.focus();
          }
          onDeactivate?.();
        },
        escapeDeactivates: false,
        allowOutsideClick: true,
      }}
    >
      <div>{children}</div>
    </FocusTrapLib>
  );
};
