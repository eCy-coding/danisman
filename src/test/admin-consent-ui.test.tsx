/**
 * M3 — KVKK Rıza Defteri: frontend component tests
 *
 * Covers:
 *   1. ConsentTimeline: renders opt-in event for active subscriber
 *   2. ConsentTimeline: renders opt-out event for unsubscribed subscriber
 *   3. ConsentRevokeAction: shows "Rıza Aktif" and "Rıza Geri Alındı"
 *   4. ReConsentCampaign: correct count + button enabled when dueCount > 0
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { ConsentTimeline } from '../components/admin/consent/ConsentTimeline';
import { ConsentRevokeAction } from '../components/admin/consent/ConsentRevokeAction';
import { ReConsentCampaign } from '../components/admin/consent/ReConsentCampaign';

describe('ConsentTimeline', () => {
  it('renders opt-in event for active subscriber', () => {
    const recentDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    render(<ConsentTimeline email="user@example.com" subscribedAt={recentDate} consent={true} />);

    expect(screen.getByText('Rıza Verildi (Opt-in)')).toBeDefined();
    expect(screen.getByText('Onaylı Rıza')).toBeDefined();
    expect(screen.queryByText('Rıza Geri Alındı (Opt-out)')).toBeNull();
  });

  it('renders opt-out event for unsubscribed subscriber', () => {
    const subscribedDate = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
    const unsubscribedDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();

    render(
      <ConsentTimeline
        email="user@example.com"
        subscribedAt={subscribedDate}
        unsubscribedAt={unsubscribedDate}
        consent={false}
      />,
    );

    expect(screen.getByText('Rıza Verildi (Opt-in)')).toBeDefined();
    expect(screen.getByText('Rıza Geri Alındı (Opt-out)')).toBeDefined();
  });
});

describe('ConsentRevokeAction', () => {
  it('shows "Rıza Aktif" for active subscriber', () => {
    render(<ConsentRevokeAction email="active@example.com" />);
    expect(screen.getByText('Rıza Aktif')).toBeDefined();
  });

  it('shows "Rıza Geri Alındı" for revoked subscriber', () => {
    const revokeDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
    render(<ConsentRevokeAction email="revoked@example.com" unsubscribedAt={revokeDate} />);
    expect(screen.getByText(/Rıza Geri Alındı/)).toBeDefined();
  });
});

describe('ReConsentCampaign', () => {
  it('shows correct count and enabled button when dueCount > 0', () => {
    const onTrigger = vi.fn();
    render(<ReConsentCampaign dueCount={7} onTriggerCampaign={onTrigger} loading={false} />);

    expect(screen.getByText(/7 abone yeniden onay gerektiriyor/)).toBeDefined();

    const button = screen.getByRole('button', { name: /Yeniden Rıza Kampanyası Başlat/ });
    expect(button).toBeDefined();
    expect((button as HTMLButtonElement).disabled).toBe(false);
  });

  it('shows "Tüm rızalar güncel" when dueCount is 0', () => {
    render(<ReConsentCampaign dueCount={0} onTriggerCampaign={vi.fn()} loading={false} />);
    expect(screen.getByText('Tüm rızalar güncel')).toBeDefined();
    expect(screen.queryByRole('button')).toBeNull();
  });
});
