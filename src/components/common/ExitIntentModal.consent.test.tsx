/**
 * Sprint 9 P44-T07 — ExitIntentModal KVKK consent BLOCKER fix.
 *
 * Verifies the KVKK m.5 + GDPR Art.4(11) açık rıza contract:
 *   1. Submit button is disabled until both email AND consent checkbox are checked.
 *   2. A direct submit (e.g. Enter) without consent does NOT call fetch.
 *   3. When the user gives consent + email, the submitted body carries `consent: true`
 *      (sourced from real state, not hardcoded).
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../lib/analytics', () => ({ trackEvent: vi.fn() }));

// `motion/react` ships ESM that vitest jsdom handles, but the animations
// add no behavioural value here. Stubbing AnimatePresence keeps the test
// focused on the consent gate.
vi.mock('motion/react', async () => {
  const React = await import('react');
  return {
    motion: { div: (props: Record<string, unknown>) => React.createElement('div', props) },
    AnimatePresence: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    useReducedMotion: () => true,
  };
});

import { ExitIntentModal } from './ExitIntentModal';

const SHOWN_KEY = 'exit_intent_shown';

function renderOpen(): void {
  // Force the modal open by clearing the shown flag and dispatching
  // a mousemove near the top of the viewport (desktop exit-intent trigger).
  window.localStorage.removeItem(SHOWN_KEY);
  render(
    <MemoryRouter initialEntries={['/']}>
      <ExitIntentModal />
    </MemoryRouter>,
  );
  fireEvent.mouseMove(document, { clientY: 5 });
}

describe('ExitIntentModal — KVKK consent gate (Sprint 9 P44-T07)', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it('disables the submit button until both email and consent checkbox are set', async () => {
    renderOpen();
    const submit = (await screen.findByTestId('exit-intent-submit')) as HTMLButtonElement;
    expect(submit.disabled).toBe(true);

    fireEvent.change((screen.getByRole('textbox', { name: /email/i }) as HTMLInputElement), { target: { value: 'a@b.com' } });
    expect(submit.disabled).toBe(true); // consent still missing

    fireEvent.click(screen.getByTestId('exit-intent-consent'));
    expect(submit.disabled).toBe(false);
  });

  it('does NOT call fetch when the user submits without checking the consent box', async () => {
    const fetchSpy = vi.spyOn(window, 'fetch' as never).mockResolvedValue(new Response(null) as never);
    renderOpen();

    fireEvent.change((screen.getByRole('textbox', { name: /email/i }) as HTMLInputElement), { target: { value: 'a@b.com' } });
    // Bypass the disabled-button guard with a programmatic submit on the form.
    const form = (screen.getByTestId('exit-intent-submit') as HTMLButtonElement).closest('form');
    expect(form).not.toBeNull();
    fireEvent.submit(form as HTMLFormElement);

    await waitFor(() => {
      expect(fetchSpy).not.toHaveBeenCalled();
    });
    expect(screen.getByRole('alert')).toBeTruthy();
  });

  it('submits `consent: true` from real state when the box is checked', async () => {
    const fetchSpy = vi.spyOn(window, 'fetch' as never).mockResolvedValue(
      new Response(null, { status: 200 }) as never,
    );
    renderOpen();

    fireEvent.change((screen.getByRole('textbox', { name: /email/i }) as HTMLInputElement), { target: { value: 'a@b.com' } });
    fireEvent.click(screen.getByTestId('exit-intent-consent'));

    const form = (screen.getByTestId('exit-intent-submit') as HTMLButtonElement).closest('form');
    fireEvent.submit(form as HTMLFormElement);

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });
    const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string) as { email: string; consent: boolean };
    expect(body.email).toBe('a@b.com');
    expect(body.consent).toBe(true);
  });
});
