/**
 * Sprint 7 P42 — canonical form-wide error summary.
 *
 * NotebookLM Architect CONVERGENT spec (Sprint 7):
 *   • Shape: `Record<string, string>` field→message map (works with Zod
 *     formatted errors AND server-side error envelopes).
 *   • A11y: `role="alert" aria-live="polite" tabindex="-1"` so screen
 *     readers announce the summary on mount without interrupting; the
 *     `tabindex="-1"` lets callers `.focus()` it programmatically.
 *   • Heading id wired via `aria-labelledby` so AT users hear the section
 *     title (`heading` prop) before the per-field list.
 *   • Renders nothing when there are no entries — callers can mount it
 *     unconditionally without polluting the DOM.
 *
 * DoD #16 — Loading/empty/error states present.
 * WEB_STANDARDS §Accessibility — Form labels + error messages bound.
 *
 * Usage:
 *   <FormErrorSummary
 *     ref={summaryRef}
 *     heading={t('forms:summary.heading')}
 *     errors={{ email: t('forms:errors.email_required') }}
 *   />
 *   …
 *   if (Object.keys(errors).length) summaryRef.current?.focus();
 */
import { forwardRef, useId, type ReactElement } from 'react';

export interface FormErrorSummaryProps {
  /** Pre-translated `{ field: message }` map. Empty → component renders null. */
  errors: Record<string, string>;
  /** Pre-translated section heading (e.g. "Lütfen aşağıdaki hataları düzeltin"). */
  heading: string;
  /**
   * Optional className applied to the wrapper so callers can theme the
   * surface (eCyPro M3 brand) without re-implementing the a11y semantics.
   */
  className?: string;
  /**
   * When provided, each list entry links to `#${id-prefix}-${field}` so
   * keyboard users can jump to the offending input. Falls back to plain
   * text when omitted (e.g. for forms that don't expose anchorable ids).
   */
  fieldIdPrefix?: string;
}

const FormErrorSummary = forwardRef<HTMLDivElement, FormErrorSummaryProps>(function FormErrorSummary(
  { errors, heading, className, fieldIdPrefix },
  ref,
): ReactElement | null {
  const headingId = useId();
  const entries = Object.entries(errors);
  if (entries.length === 0) return null;

  return (
    <div
      ref={ref}
      role="alert"
      aria-live="polite"
      aria-labelledby={headingId}
      tabIndex={-1}
      data-testid="form-error-summary"
      className={className}
    >
      <p id={headingId}>{heading}</p>
      <ul>
        {entries.map(([field, message]) => (
          <li key={field}>
            {fieldIdPrefix ? <a href={`#${fieldIdPrefix}-${field}`}>{message}</a> : message}
          </li>
        ))}
      </ul>
    </div>
  );
});

export { FormErrorSummary };
export default FormErrorSummary;
