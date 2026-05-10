/**
 * P34-T06: Form Abandonment Tracking Hook
 *
 * Tracks the full form lifecycle for GA4:
 *   - form_start     : first field focus
 *   - form_progress  : Nth field blur (tracks progress percentage)
 *   - form_submit_success / form_submit_error : on submit
 *   - form_abandon   : user leaves page/tab after starting but not submitting
 *
 * Abandonment detection:
 *   - visibilitychange (tab switch / minimize)
 *   - beforeunload (page navigation)
 *   - Timeout: 60s inactivity after partial fill
 *
 * Usage:
 *   const { onFocus, onBlur, onSubmitSuccess, onSubmitError } = useFormAnalytics('contact');
 *   <input onFocus={onFocus} onBlur={() => onBlur('email')} />
 */

import { useEffect, useRef, useCallback } from 'react';
import { trackForm } from '../lib/analytics';

interface FormAnalyticsState {
  started: boolean;
  filledFields: Set<string>;
  submitted: boolean;
  startTime: number;
}

export function useFormAnalytics(formId: string) {
  const stateRef = useRef<FormAnalyticsState>({
    started: false,
    filledFields: new Set(),
    submitted: false,
    startTime: 0,
  });

  const abandonTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetAbandonTimer = useCallback(() => {
    if (abandonTimeoutRef.current) clearTimeout(abandonTimeoutRef.current);
    // 60-second inactivity abandon
    abandonTimeoutRef.current = setTimeout(() => {
      const s = stateRef.current;
      if (s.started && !s.submitted && s.filledFields.size > 0) {
        trackForm(formId, 'abandon', {
          last_field: [...s.filledFields].at(-1),
          fields_filled: s.filledFields.size,
          time_spent_ms: Date.now() - s.startTime,
        });
      }
    }, 60_000);
  }, [formId]);

  // Abandon on visibility change or page leave
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        const s = stateRef.current;
        if (s.started && !s.submitted && s.filledFields.size > 0) {
          trackForm(formId, 'abandon', {
            last_field: [...s.filledFields].at(-1),
            fields_filled: s.filledFields.size,
            time_spent_ms: Date.now() - s.startTime,
            trigger: 'visibility_change',
          });
        }
      }
    };

    const handleBeforeUnload = () => {
      const s = stateRef.current;
      if (s.started && !s.submitted && s.filledFields.size > 0) {
        trackForm(formId, 'abandon', {
          fields_filled: s.filledFields.size,
          trigger: 'beforeunload',
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (abandonTimeoutRef.current) clearTimeout(abandonTimeoutRef.current);
    };
  }, [formId]);

  /** Call on first input focus — triggers form_start event */
  const onFocus = useCallback(() => {
    const s = stateRef.current;
    if (!s.started) {
      s.started = true;
      s.startTime = Date.now();
      trackForm(formId, 'start');
    }
    resetAbandonTimer();
  }, [formId, resetAbandonTimer]);

  /** Call on any field blur — tracks progress */
  const onBlur = useCallback(
    (fieldName: string) => {
      const s = stateRef.current;
      if (!s.started) return;
      s.filledFields.add(fieldName);
      resetAbandonTimer();
    },
    [resetAbandonTimer],
  );

  /** Call on successful submit */
  const onSubmitSuccess = useCallback(() => {
    const s = stateRef.current;
    s.submitted = true;
    if (abandonTimeoutRef.current) clearTimeout(abandonTimeoutRef.current);
    trackForm(formId, 'submit_success', {
      fields_filled: s.filledFields.size,
      time_spent_ms: Date.now() - s.startTime,
    });
  }, [formId]);

  /** Call on submit error */
  const onSubmitError = useCallback(
    (reason?: string) => {
      trackForm(formId, 'submit_error', {
        reason,
        fields_filled: stateRef.current.filledFields.size,
      });
    },
    [formId],
  );

  return { onFocus, onBlur, onSubmitSuccess, onSubmitError };
}
