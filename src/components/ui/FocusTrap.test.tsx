/**
 * M4 — FocusTrap tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

// focus-trap-react requires tabbable elements; mock it for unit tests.
vi.mock('focus-trap-react', () => ({
  default: ({
    children,
    focusTrapOptions,
  }: {
    children: React.ReactNode;
    focusTrapOptions: { onDeactivate?: () => void };
  }) => {
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') focusTrapOptions.onDeactivate?.();
    };
    return (
      // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
      <div role="dialog" data-testid="focus-trap" onKeyDown={handleKeyDown} tabIndex={-1}>
        {children}
      </div>
    );
  },
}));

import { FocusTrap } from './FocusTrap';
import { Modal } from '../admin/ui/Modal';

describe('M4 — FocusTrap', () => {
  it('renders children when active', () => {
    render(
      <FocusTrap active>
        <button>Inside trap</button>
      </FocusTrap>,
    );
    expect(screen.getByText('Inside trap')).toBeDefined();
    expect(screen.getByTestId('focus-trap')).toBeDefined();
  });

  it('renders children without trap wrapper when inactive', () => {
    render(
      <FocusTrap active={false}>
        <button>Outside trap</button>
      </FocusTrap>,
    );
    expect(screen.getByText('Outside trap')).toBeDefined();
    expect(screen.queryByTestId('focus-trap')).toBeNull();
  });

  it('calls onDeactivate when deactivated', () => {
    const onDeactivate = vi.fn();
    render(
      <FocusTrap active onDeactivate={onDeactivate}>
        <button>Trapped</button>
      </FocusTrap>,
    );
    // Simulate deactivation via Escape key in the mock
    fireEvent.keyDown(screen.getByTestId('focus-trap'), { key: 'Escape' });
    expect(onDeactivate).toHaveBeenCalledOnce();
  });

  it('Modal uses FocusTrap — dialog has role=dialog + aria-modal', () => {
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose} title="Test Modal">
        <p>Content</p>
      </Modal>,
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
  });

  it('Modal renders focus trap wrapper when open', () => {
    render(
      <Modal open onClose={vi.fn()} title="Trapping">
        <button>First focusable</button>
      </Modal>,
    );
    expect(screen.getByTestId('focus-trap')).toBeDefined();
    expect(screen.getByText('First focusable')).toBeDefined();
  });
});
