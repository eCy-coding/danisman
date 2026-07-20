/**
 * admin-state-block.axe.test.tsx — axe-core coverage for AdminStateBlock's
 * three states (loading / error+retry / empty).
 *
 * AP4 (src/components/admin/ui/AdminStateBlock.tsx) is now the shared
 * loading/error/empty primitive for 8 admin pages (AdminAnalyticsPage,
 * AdminDealsPage, AdminESGPage, AdminFintechCompliancePage,
 * AdminLeadDetailPage, AdminMediaLibraryPage, AdminRetainersPage,
 * AdminSuccessionPage) — the admin-pages-catalog factory exercises these
 * states indirectly through those pages, but this file scans each state in
 * isolation and asserts the specific contract called out in the AP4 audit:
 * the error state must announce via role="alert" and its retry control must
 * be a real, keyboard-operable <button> with an accessible name.
 */
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import axe from 'axe-core';

import { AdminQueryState } from '../../components/admin/ui/AdminStateBlock';
import { expectNoAxeViolations } from './admin-axe-harness';

describe('AdminStateBlock — a11y', () => {
  describe('loading state', () => {
    it('renders an aria-live status region and passes axe with 0 violations', async () => {
      const { container } = render(
        <AdminQueryState isLoading isError={false}>
          <p>content</p>
        </AdminQueryState>,
      );

      const status = screen.getByRole('status');
      expect(status).toBeInTheDocument();
      expect(status).toHaveAttribute('aria-live', 'polite');
      expect(screen.queryByText('content')).not.toBeInTheDocument();

      await expectNoAxeViolations(container);
    });
  });

  describe('error state (+ retry)', () => {
    it('announces via role="alert" and the retry control is a real named button', async () => {
      const onRetry = vi.fn();
      const { container } = render(
        <AdminQueryState
          isLoading={false}
          isError
          error={{ response: { data: { message: 'Bağlantı zaman aşımına uğradı' } } }}
          onRetry={onRetry}
        >
          <p>content</p>
        </AdminQueryState>,
      );

      // role="alert" — announces immediately without the AT needing focus.
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveTextContent('Bağlantı zaman aşımına uğradı');

      // Retry is a real <button type="button">, not a div/span with a click
      // handler — keyboard-operable and exposed with the AXTree "button" role.
      const retryButton = screen.getByRole('button', { name: /yeniden dene/i });
      expect(retryButton.tagName).toBe('BUTTON');
      expect(retryButton).toHaveAttribute('type', 'button');
      expect(retryButton).not.toHaveAttribute('disabled');

      await userEvent.click(retryButton);
      expect(onRetry).toHaveBeenCalledTimes(1);

      expect(screen.queryByText('content')).not.toBeInTheDocument();

      await expectNoAxeViolations(container);
    });

    it('omits the retry button (and stays axe-clean) when onRetry is not provided', async () => {
      const { container } = render(
        <AdminQueryState isLoading={false} isError error={new Error('boom')}>
          <p>content</p>
        </AdminQueryState>,
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();

      await expectNoAxeViolations(container);
    });
  });

  describe('empty state', () => {
    it('renders the empty-state heading/description and passes axe with 0 violations', async () => {
      const { container } = render(
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

      expect(screen.getByText('Kayıt yok')).toBeInTheDocument();
      expect(screen.getByText('Henüz hiç kayıt eklenmedi.')).toBeInTheDocument();
      expect(screen.queryByText('content')).not.toBeInTheDocument();

      await expectNoAxeViolations(container);
    });
  });

  describe('cross-state heading order (loading → error → empty in sequence)', () => {
    // Regression guard for the AP4 fix: EmptyState/ErrorState render h2 (not
    // h3) because in every real call site they sit directly under a page h1
    // with no h2 section heading between — h3 there skipped a level.
    it('EmptyState and ErrorState headings are both level 2', async () => {
      const { container: errorContainer } = render(
        <AdminQueryState isLoading={false} isError error={new Error('boom')}>
          <p>content</p>
        </AdminQueryState>,
      );
      const errorHeading = errorContainer.querySelector('h2, h3, h4');
      expect(errorHeading?.tagName).toBe('H2');

      const { container: emptyContainer } = render(
        <AdminQueryState isLoading={false} isError={false} isEmpty emptyTitle="Kayıt yok">
          <p>content</p>
        </AdminQueryState>,
      );
      const emptyHeading = emptyContainer.querySelector('h2, h3, h4');
      expect(emptyHeading?.tagName).toBe('H2');
    });
  });
});

// Sanity check that axe-core itself is wired correctly in this file (mirrors
// admin-rbac.axe.test.tsx's direct axe.run usage) — belt-and-braces beyond
// the shared expectNoAxeViolations helper.
describe('AdminStateBlock — axe-core direct sanity', () => {
  it('axe.run reports 0 violations for the error state', async () => {
    const { container } = render(
      <AdminQueryState isLoading={false} isError error={new Error('x')} onRetry={vi.fn()}>
        <p>content</p>
      </AdminQueryState>,
    );
    const results = await axe.run(container);
    expect(results.violations).toHaveLength(0);
  });
});
