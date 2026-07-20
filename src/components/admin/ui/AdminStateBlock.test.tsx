/**
 * AP4 — AdminStateBlock (ErrorState / AdminQueryState / getErrorMessage) tests.
 */
import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { ErrorState, AdminQueryState, getErrorMessage } from './AdminStateBlock';

describe('getErrorMessage', () => {
  test('extracts axios-style response.data.message', () => {
    const err = { response: { data: { message: 'Yetkisiz erişim' } } };
    expect(getErrorMessage(err)).toBe('Yetkisiz erişim');
  });

  test('extracts axios-style response.data.error', () => {
    const err = { response: { data: { error: 'Sunucu hatası' } } };
    expect(getErrorMessage(err)).toBe('Sunucu hatası');
  });

  test('falls back to Error.message', () => {
    expect(getErrorMessage(new Error('adminFetch 500: boom'))).toBe('adminFetch 500: boom');
  });

  test('passes through plain strings', () => {
    expect(getErrorMessage('network down')).toBe('network down');
  });

  test('falls back to generic Turkish message for unknown shapes', () => {
    expect(getErrorMessage(null)).toBe('Beklenmeyen bir hata oluştu.');
    expect(getErrorMessage({})).toBe('Beklenmeyen bir hata oluştu.');
    expect(getErrorMessage(undefined, 'Özel mesaj')).toBe('Özel mesaj');
  });
});

describe('ErrorState', () => {
  test('renders title, description, and role=alert', () => {
    render(<ErrorState description="Bağlantı zaman aşımına uğradı" />);
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.getByText('Veri yüklenemedi')).toBeTruthy();
    expect(screen.getByText('Bağlantı zaman aşımına uğradı')).toBeTruthy();
  });

  test('retry button calls onRetry when clicked', async () => {
    const onRetry = vi.fn();
    render(<ErrorState onRetry={onRetry} />);
    await userEvent.click(screen.getByRole('button', { name: /yeniden dene/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  test('omits retry button when onRetry not provided', () => {
    render(<ErrorState />);
    expect(screen.queryByRole('button')).toBeNull();
  });
});

describe('AdminQueryState', () => {
  test('renders loading skeleton when isLoading', () => {
    render(
      <AdminQueryState isLoading isError={false}>
        <p>content</p>
      </AdminQueryState>,
    );
    expect(screen.getByRole('status')).toBeTruthy();
    expect(screen.queryByText('content')).toBeNull();
  });

  test('renders ErrorState with derived message when isError', () => {
    const onRetry = vi.fn();
    render(
      <AdminQueryState
        isLoading={false}
        isError
        error={{ response: { data: { message: 'Bağlantı koptu' } } }}
        onRetry={onRetry}
      >
        <p>content</p>
      </AdminQueryState>,
    );
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.getByText('Bağlantı koptu')).toBeTruthy();
    expect(screen.queryByText('content')).toBeNull();
  });

  test('renders EmptyState when isEmpty', () => {
    render(
      <AdminQueryState
        isLoading={false}
        isError={false}
        isEmpty
        emptyTitle="Kayıt yok"
        emptyDescription="Henüz hiç kayıt eklenmedi."
      >
        <p>content</p>
      </AdminQueryState>,
    );
    expect(screen.getByText('Kayıt yok')).toBeTruthy();
    expect(screen.getByText('Henüz hiç kayıt eklenmedi.')).toBeTruthy();
    expect(screen.queryByText('content')).toBeNull();
  });

  test('renders children when loaded, not errored, not empty', () => {
    render(
      <AdminQueryState isLoading={false} isError={false} isEmpty={false}>
        <p>content</p>
      </AdminQueryState>,
    );
    expect(screen.getByText('content')).toBeTruthy();
  });
});
