/**
 * Sprint 7 P42 — FormErrorSummary canonical pattern tests.
 *
 * Co-located vitest (WEB_STANDARDS §7). Covers the contract documented by
 * NotebookLM Architect: render-null when empty, a11y attributes wired,
 * fieldIdPrefix anchoring, ref-forwarded focus.
 */
import { createRef } from 'react';
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';

import { FormErrorSummary } from './FormErrorSummary';

describe('FormErrorSummary', () => {
  it('renders nothing when the errors map is empty', () => {
    const { container } = render(<FormErrorSummary heading="head" errors={{}} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders one <li> per error entry', () => {
    render(
      <FormErrorSummary
        heading="Lütfen düzeltin"
        errors={{ email: 'E-posta gerekli', name: 'Ad gerekli' }}
      />,
    );
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('E-posta gerekli');
    expect(items[1]).toHaveTextContent('Ad gerekli');
  });

  it('wires role="alert" + aria-live="polite" + aria-labelledby', () => {
    render(<FormErrorSummary heading="Lütfen düzeltin" errors={{ email: 'gerekli' }} />);
    const region = screen.getByRole('alert');
    expect(region).toHaveAttribute('aria-live', 'polite');
    expect(region).toHaveAttribute('tabindex', '-1');
    const headingId = region.getAttribute('aria-labelledby');
    expect(headingId).toBeTruthy();
    const headingEl = region.querySelector(`#${CSS.escape(headingId!)}`);
    expect(headingEl).toHaveTextContent('Lütfen düzeltin');
  });

  it('renders messages as plain text when no fieldIdPrefix is provided', () => {
    render(<FormErrorSummary heading="head" errors={{ email: 'gerekli' }} />);
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('renders anchor links to fieldIdPrefix-field when supplied', () => {
    render(
      <FormErrorSummary
        heading="head"
        errors={{ email: 'gerekli', message: 'çok kısa' }}
        fieldIdPrefix="contact"
      />,
    );
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute('href', '#contact-email');
    expect(links[1]).toHaveAttribute('href', '#contact-message');
  });

  it('forwards ref so callers can programmatically focus the summary', () => {
    const ref = createRef<HTMLDivElement>();
    render(<FormErrorSummary ref={ref} heading="head" errors={{ email: 'gerekli' }} />);
    expect(ref.current).not.toBeNull();
    expect(ref.current?.getAttribute('role')).toBe('alert');
    ref.current?.focus();
    expect(document.activeElement).toBe(ref.current);
  });

  it('applies the optional className to the wrapper', () => {
    render(
      <FormErrorSummary
        heading="head"
        errors={{ email: 'gerekli' }}
        className="rounded-2xl bg-[#1E1F20]"
      />,
    );
    expect(screen.getByRole('alert')).toHaveClass('rounded-2xl');
    expect(screen.getByRole('alert')).toHaveClass('bg-[#1E1F20]');
  });
});
