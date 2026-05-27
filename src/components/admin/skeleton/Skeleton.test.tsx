/**
 * M6 — Skeleton library tests
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { LeadCardSkeleton } from './LeadCardSkeleton';
import { DealCardSkeleton } from './DealCardSkeleton';
import { TableRowSkeleton } from './TableRowSkeleton';
import { FormSkeleton } from './FormSkeleton';
import { AuditEntrySkeleton } from './AuditEntrySkeleton';
import { DSARRequestSkeleton } from './DSARRequestSkeleton';

describe('M6 — Skeleton library', () => {
  it('all 6 skeleton components render with aria-busy=true', () => {
    const { unmount: u1 } = render(<LeadCardSkeleton />);
    expect(screen.getAllByRole('status')[0].getAttribute('aria-busy')).toBe('true');
    u1();

    const { unmount: u2 } = render(<DealCardSkeleton />);
    expect(screen.getAllByRole('status')[0].getAttribute('aria-busy')).toBe('true');
    u2();

    const { unmount: u3 } = render(<TableRowSkeleton />);
    expect(screen.getAllByRole('status')[0].getAttribute('aria-busy')).toBe('true');
    u3();

    const { unmount: u4 } = render(<FormSkeleton />);
    expect(screen.getAllByRole('status')[0].getAttribute('aria-busy')).toBe('true');
    u4();

    const { unmount: u5 } = render(<AuditEntrySkeleton />);
    expect(screen.getAllByRole('status')[0].getAttribute('aria-busy')).toBe('true');
    u5();

    const { unmount: u6 } = render(<DSARRequestSkeleton />);
    expect(screen.getAllByRole('status')[0].getAttribute('aria-busy')).toBe('true');
    u6();
  });

  it('TableRowSkeleton renders correct number of columns', () => {
    render(<TableRowSkeleton cols={6} />);
    // 6 flex divs inside the status element
    const status = screen.getByRole('status');
    // The internal divs aren't role-exposed, but we can count direct children
    expect(status.children.length).toBe(6);
  });

  it('FormSkeleton renders correct number of fields', () => {
    render(<FormSkeleton fields={3} />);
    const status = screen.getByRole('status');
    // fields + 1 button row
    expect(status.children.length).toBe(4);
  });
});
