/**
 * P23/T3 — EmptyState + ErrorState testleri.
 */
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { EmptyState } from './EmptyState';
import { ErrorState } from './ErrorState';

describe('<EmptyState>', () => {
  it('başlık render eder + role=status', () => {
    const { container } = render(<EmptyState title="Henüz blog yazısı yok" />);
    expect(screen.getByText('Henüz blog yazısı yok')).toBeTruthy();
    expect(container.querySelector('[role=status]')).toBeTruthy();
  });

  it('action butonu onClick tetikler', () => {
    const fn = vi.fn();
    render(<EmptyState title="Boş" action={{ label: 'Oluştur', onClick: fn }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Oluştur' }));
    expect(fn).toHaveBeenCalledOnce();
  });

  it('secondary action ile iki buton', () => {
    render(
      <EmptyState
        title="Sonuç yok"
        action={{ label: 'Yeni' }}
        secondaryAction={{ label: 'Filtreleri Temizle' }}
      />,
    );
    expect(screen.getAllByRole('button').length).toBe(2);
  });

  it('href varsa anchor render eder', () => {
    render(<EmptyState title="Boş" action={{ label: 'Anasayfa', href: '/' }} />);
    const anchor = screen.getByRole('link', { name: 'Anasayfa' });
    expect(anchor.getAttribute('href')).toBe('/');
  });
});

describe('<ErrorState>', () => {
  it('default başlık TR', () => {
    render(<ErrorState />);
    expect(screen.getByText('Bir şeyler ters gitti')).toBeTruthy();
  });

  it('role=alert + aria-live=assertive', () => {
    const { container } = render(<ErrorState />);
    const root = container.querySelector('[data-testid=error-state]') as HTMLElement;
    expect(root.getAttribute('role')).toBe('alert');
    expect(root.getAttribute('aria-live')).toBe('assertive');
  });

  it('onRetry verilince retry butonu çıkar', () => {
    const fn = vi.fn();
    render(<ErrorState onRetry={fn} retryLabel="Tekrar" />);
    fireEvent.click(screen.getByRole('button', { name: 'Tekrar' }));
    expect(fn).toHaveBeenCalledOnce();
  });

  it('onRetry yoksa buton render edilmez', () => {
    render(<ErrorState description="x" />);
    expect(screen.queryByRole('button')).toBeNull();
  });
});
