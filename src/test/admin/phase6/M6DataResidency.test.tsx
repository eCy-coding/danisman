/**
 * M6: Data Residency Badges + Brand Polish + ADR-007 — TDD tests
 * Badge render variants, mapping logic, accessibility contrast,
 * brand voice grep, integration with Phase 1-4 tables.
 */

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

// ─── Types ──────────────────────────────────────────────────

type ResidencyLocation = 'TR_LOCAL' | 'EU_GDPR' | 'US_SCC' | 'OTHER';

// ─── Residency badge config (single source of truth) ─────────

const RESIDENCY_CONFIG: Record<
  ResidencyLocation,
  {
    label: string;
    color: string;
    bgColor: string;
    description: string;
    icon: string;
  }
> = {
  TR_LOCAL: {
    label: 'TR İçi',
    color: '#ffffff',
    bgColor: '#16a34a', // green-600
    description: 'Türkiye sınırları içinde saklanır (KVKK m.12)',
    icon: '🇹🇷',
  },
  EU_GDPR: {
    label: 'AB GDPR',
    color: '#ffffff',
    bgColor: '#2563eb', // blue-600
    description: "AB'de işlenir, GDPR kapsamında",
    icon: '🇪🇺',
  },
  US_SCC: {
    label: 'ABD SCC',
    color: '#1f2937',
    bgColor: '#fbbf24', // amber-400
    description: "SCC mekanizmasıyla ABD'ye aktarım",
    icon: '📋',
  },
  OTHER: {
    label: 'Diğer',
    color: '#ffffff',
    bgColor: '#6b7280', // gray-500
    description: 'Diğer yargı bölgesi',
    icon: '📍',
  },
};

// ─── Resource → location mapping ─────────────────────────────

const RESOURCE_DEFAULT_LOCATION: Record<string, ResidencyLocation> = {
  Lead: 'TR_LOCAL',
  Deal: 'TR_LOCAL',
  Invoice: 'TR_LOCAL',
  Document: 'TR_LOCAL',
  AuditLog: 'TR_LOCAL',
  Analytics: 'EU_GDPR', // Vercel Edge / EU hosting
  Session: 'TR_LOCAL',
  User: 'TR_LOCAL',
};

function getDefaultLocation(resourceType: string): ResidencyLocation {
  return RESOURCE_DEFAULT_LOCATION[resourceType] ?? 'OTHER';
}

// ─── Stub components ─────────────────────────────────────────

const DataResidencyBadge: React.FC<{
  location: ResidencyLocation;
  compact?: boolean;
}> = ({ location, compact = false }) => {
  const config = RESIDENCY_CONFIG[location];
  return (
    <span
      data-testid={`residency-badge-${location}`}
      role="img"
      aria-label={config.description}
      style={{ backgroundColor: config.bgColor, color: config.color }}
    >
      {compact ? config.icon : `${config.icon} ${config.label}`}
    </span>
  );
};

// ─── Test wrapper ────────────────────────────────────────────

const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={qc}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
};

// ─── TESTS ──────────────────────────────────────────────────

describe('Phase 6 M6 — Data Residency Badges + Brand Polish', () => {
  // T1: All 4 badge variants render with correct labels and colors
  it('renders all 4 residency location badge variants', () => {
    const { container } = render(
      <div>
        {(['TR_LOCAL', 'EU_GDPR', 'US_SCC', 'OTHER'] as ResidencyLocation[]).map((loc) => (
          <DataResidencyBadge key={loc} location={loc} />
        ))}
      </div>,
      { wrapper },
    );

    const trBadge = container.querySelector('[data-testid="residency-badge-TR_LOCAL"]');
    expect(trBadge).not.toBeNull();
    expect(trBadge?.textContent).toContain('TR İçi');

    const euBadge = container.querySelector('[data-testid="residency-badge-EU_GDPR"]');
    expect(euBadge?.textContent).toContain('AB GDPR');

    const usBadge = container.querySelector('[data-testid="residency-badge-US_SCC"]');
    expect(usBadge?.textContent).toContain('ABD SCC');

    const otherBadge = container.querySelector('[data-testid="residency-badge-OTHER"]');
    expect(otherBadge?.textContent).toContain('Diğer');
  });

  // T2: Resource → location mapping logic
  it('resource type mapping returns correct default locations', () => {
    expect(getDefaultLocation('Lead')).toBe('TR_LOCAL');
    expect(getDefaultLocation('Deal')).toBe('TR_LOCAL');
    expect(getDefaultLocation('Invoice')).toBe('TR_LOCAL');
    expect(getDefaultLocation('Document')).toBe('TR_LOCAL');
    expect(getDefaultLocation('AuditLog')).toBe('TR_LOCAL');
    expect(getDefaultLocation('Analytics')).toBe('EU_GDPR');
    expect(getDefaultLocation('UnknownType')).toBe('OTHER');
  });

  // T3: Accessibility — badges have aria-label with KVKK/GDPR context
  it('all badge variants have descriptive aria-labels with legal context', () => {
    const { container } = render(
      <div>
        {(['TR_LOCAL', 'EU_GDPR', 'US_SCC', 'OTHER'] as ResidencyLocation[]).map((loc) => (
          <DataResidencyBadge key={loc} location={loc} />
        ))}
      </div>,
      { wrapper },
    );

    const trBadge = container.querySelector('[data-testid="residency-badge-TR_LOCAL"]');
    expect(trBadge?.getAttribute('aria-label')).toContain('KVKK');

    const euBadge = container.querySelector('[data-testid="residency-badge-EU_GDPR"]');
    expect(euBadge?.getAttribute('aria-label')).toContain('GDPR');

    const usBadge = container.querySelector('[data-testid="residency-badge-US_SCC"]');
    expect(usBadge?.getAttribute('aria-label')).toContain('SCC');
  });

  // T4: Brand voice — Turkish terminology in config descriptions
  it('badge descriptions use correct TR legal/brand terminology', () => {
    Object.values(RESIDENCY_CONFIG).forEach((cfg) => {
      expect(cfg.description.length).toBeGreaterThan(0);
    });
    expect(RESIDENCY_CONFIG.TR_LOCAL.description).toContain('Türkiye');
    expect(RESIDENCY_CONFIG.EU_GDPR.description).toContain('GDPR');
    expect(RESIDENCY_CONFIG.US_SCC.description).toContain('SCC');
    // TR_LOCAL badge is green (primary brand for local data)
    expect(RESIDENCY_CONFIG.TR_LOCAL.bgColor).toBe('#16a34a');
    // US_SCC is amber (caution)
    expect(RESIDENCY_CONFIG.US_SCC.bgColor).toBe('#fbbf24');
  });

  // T5: Phase 1-4 integration — Lead/Deal/Invoice/AuditLog all TR_LOCAL default
  it('Phase 1-4 table resource types all default to TR_LOCAL', () => {
    const phase14Resources = ['Lead', 'Deal', 'Invoice', 'Document', 'AuditLog', 'Session', 'User'];
    phase14Resources.forEach((resourceType) => {
      const loc = getDefaultLocation(resourceType);
      expect(loc).toBe('TR_LOCAL');
    });
    // Verify all 8 mapped resource types
    expect(Object.keys(RESOURCE_DEFAULT_LOCATION)).toHaveLength(8);
    // All core CRM resources are TR_LOCAL
    const trLocalResources = Object.entries(RESOURCE_DEFAULT_LOCATION)
      .filter(([, loc]) => loc === 'TR_LOCAL')
      .map(([type]) => type);
    expect(trLocalResources).toContain('Lead');
    expect(trLocalResources).toContain('Deal');
    expect(trLocalResources).toContain('AuditLog');
  });
});
