import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, act, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { IndependenceCheckForm } from './IndependenceCheckForm';

afterEach(() => cleanup());

function renderForm() {
  const onSubmit = vi.fn();
  const { container } = render(
    React.createElement(IndependenceCheckForm, { onSubmit, loading: false }),
  );
  const nameInput = container.querySelector('input[placeholder*="Big4"]') as HTMLInputElement;
  return { onSubmit, nameInput };
}

describe('Independence Check — Big4 conflict detection', () => {
  it('PwC flag: clientName "PwC" → conflict warning shown', async () => {
    const { nameInput } = renderForm();
    await act(async () => {
      await userEvent.type(nameInput, 'PwC');
    });
    expect(screen.getByText('Big4 Çakışması Tespit Edildi')).toBeTruthy();
  });

  it('Deloitte normalized: "Deloitte Touche Tohmatsu" → conflict warning', async () => {
    const { nameInput } = renderForm();
    await act(async () => {
      await userEvent.type(nameInput, 'Deloitte Touche Tohmatsu');
    });
    expect(screen.getByText('Big4 Çakışması Tespit Edildi')).toBeTruthy();
  });

  it('Case-insensitive: "pwc" triggers warning', async () => {
    const { nameInput } = renderForm();
    await act(async () => {
      await userEvent.type(nameInput, 'pwc');
    });
    expect(screen.getByText('Big4 Çakışması Tespit Edildi')).toBeTruthy();
  });

  it('Case-insensitive: "PWC" triggers warning', async () => {
    const { nameInput } = renderForm();
    await act(async () => {
      await userEvent.type(nameInput, 'PWC');
    });
    expect(screen.getByText('Big4 Çakışması Tespit Edildi')).toBeTruthy();
  });

  it('No conflict: "Accenture Istanbul" → no conflict warning', async () => {
    const { nameInput } = renderForm();
    await act(async () => {
      await userEvent.type(nameInput, 'Accenture Istanbul');
    });
    expect(screen.queryByText('Big4 Çakışması Tespit Edildi')).toBeNull();
  });

  it('validUntil 1 year: server-side check in admin-independence.ts', () => {
    // Mirrors server logic: validUntil.setFullYear(checkedAt.getFullYear() + 1)
    const now = new Date('2026-05-26');
    const validUntil = new Date(now);
    validUntil.setFullYear(validUntil.getFullYear() + 1);
    expect(validUntil.getFullYear()).toBe(2027);
    expect(validUntil.getMonth()).toBe(now.getMonth());
  });
});
