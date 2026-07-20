/**
 * admin-pages-catalog.axe.test.tsx — parametrized axe-core coverage for
 * every admin page that can render without a live backend.
 *
 * Prior to this file, admin a11y coverage was one hand-written suite per
 * surface (admin-{deals,leads,pages,rbac}.axe.test.tsx = 4 suites for ~49
 * pages under src/pages/admin/). This factory iterates PAGES below instead
 * — adding a page to the table is the whole cost of adding coverage.
 *
 * Shared render/mocks live in ./admin-axe-harness.tsx. Page components are
 * loaded through `import.meta.glob` (Vite-native lazy module map) rather
 * than static imports so the harness's `vi.mock` calls are guaranteed to be
 * registered first — see that file's header comment for why.
 */
import { describe, it, beforeEach } from 'vitest';
import React from 'react';
import {
  renderAdminPage,
  expectNoAxeViolations,
  resetAdminMocks,
  settle,
  apiGetMock,
  adminFetchMock,
  genericOkEnvelope,
  type RenderAdminPageOptions,
} from './admin-axe-harness';
import { ViewAsProvider } from '../../lib/view-as-context';

// ─── Page module map ────────────────────────────────────────────────────────

const pageModules = import.meta.glob('../../pages/admin/*.tsx') as Record<
  string,
  () => Promise<Record<string, unknown>>
>;

function jsonResponse(body: unknown, ok = true, status = 200) {
  return Promise.resolve({
    ok,
    status,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  });
}

interface PageEntry {
  /** Table label — also the axe test's describe name. */
  name: string;
  /** Glob key into `pageModules`, relative to this file. */
  modulePath: string;
  /** Named export to render; 'default' for a default export. */
  exportName: string;
  route?: RenderAdminPageOptions;
  /** Optional per-page mock overrides, applied after resetAdminMocks(). */
  configure?: () => void;
  /**
   * Wraps the rendered page element in an extra provider the real app tree
   * supplies at a level this factory doesn't reconstruct generically (e.g.
   * ViewAsProvider for AdminRBACPage).
   */
  wrapElement?: (el: React.ReactElement) => React.ReactElement;
}

const PAGES: PageEntry[] = [
  {
    name: 'AdminAIPage',
    modulePath: '../../pages/admin/AdminAIPage.tsx',
    exportName: 'AdminAIPage',
  },
  {
    name: 'AdminAnalyticsPage',
    modulePath: '../../pages/admin/AdminAnalyticsPage.tsx',
    exportName: 'AdminAnalyticsPage',
    configure: () => {
      // Mirrors AdminAnalyticsPage.test.tsx — /admin/stats and
      // /bookings/analytics have a fixed nested shape (summary/trend/
      // byService) the generic empty-array envelope doesn't satisfy.
      apiGetMock.mockImplementation((url: string) => {
        if (url === '/admin/stats') {
          return Promise.resolve({
            data: {
              status: 'ok',
              data: {
                unreadContacts: 0,
                totalContacts: 0,
                activeSubscribers: 0,
                pendingBookings: 0,
                weeklyInteractions: 0,
              },
            },
          });
        }
        if (url === '/bookings/analytics') {
          return Promise.resolve({
            data: {
              status: 'ok',
              data: {
                summary: {
                  total: 0,
                  confirmed: 0,
                  completed: 0,
                  cancelled: 0,
                  noShow: 0,
                  cancelRate: 0,
                  noShowRate: 0,
                },
                last30: { total: 0, byStatus: {} },
                trend: [],
                byService: [],
              },
            },
          });
        }
        return Promise.reject(new Error(`unexpected url ${url}`));
      });
    },
  },
  {
    name: 'AdminAuditLogPage',
    modulePath: '../../pages/admin/AdminAuditLogPage.tsx',
    exportName: 'AdminAuditLogPage',
  },
  {
    name: 'AdminBlogEditPage',
    modulePath: '../../pages/admin/AdminBlogEditPage.tsx',
    exportName: 'default',
    route: { route: '/blog/:slug/edit', initialEntries: ['/blog/test-post/edit'] },
    configure: () => {
      // enabled: !!slug always fetches (this factory picked a real-looking
      // slug rather than a "new post" sentinel), so `query.data.data.meta`
      // needs a real object — the generic envelope leaves it undefined and
      // the mount effect crashes on `meta.title`.
      apiGetMock.mockImplementation((url: string) => {
        if (url === '/admin/blog/test-post') {
          return Promise.resolve({
            data: {
              status: 'ok',
              data: {
                slug: 'test-post',
                meta: {
                  title: 'Test Post',
                  date: '2026-01-01',
                  category: 'Strateji',
                  readTime: '5 dk',
                  excerpt: '',
                  author: 'eCyPro Consulting',
                  lang: 'tr',
                  status: 'draft',
                },
                content: '',
              },
            },
          });
        }
        return Promise.resolve(genericOkEnvelope());
      });
    },
  },
  {
    name: 'AdminBlogPage',
    modulePath: '../../pages/admin/AdminBlogPage.tsx',
    exportName: 'AdminBlogPage',
  },
  {
    name: 'AdminBookingsPage',
    modulePath: '../../pages/admin/AdminBookingsPage.tsx',
    exportName: 'AdminBookingsPage',
  },
  {
    name: 'AdminBreachPage',
    modulePath: '../../pages/admin/AdminBreachPage.tsx',
    exportName: 'AdminBreachPage',
    configure: () => {
      // `data?.incidents.find(...)` only guards `data` itself, not
      // `.incidents` — needs the key present, not just `data` truthy.
      adminFetchMock.mockImplementation(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ status: 'ok', incidents: [] }),
          text: () => Promise.resolve(''),
        }),
      );
    },
  },
  {
    name: 'AdminCampaignWizardPage',
    modulePath: '../../pages/admin/AdminCampaignWizardPage.tsx',
    exportName: 'AdminCampaignWizardPage',
  },
  {
    name: 'AdminCampaignsPage',
    modulePath: '../../pages/admin/AdminCampaignsPage.tsx',
    exportName: 'AdminCampaignsPage',
    configure: () => {
      // `metrics?.counters.sent` only guards `metrics`, not `.counters`.
      apiGetMock.mockImplementation((url: string) => {
        if (url === '/admin/newsletter/campaigns') {
          return Promise.resolve({
            data: { status: 'ok', data: { items: [], total: 0, limit: 20, offset: 0 } },
          });
        }
        if (url === '/admin/newsletter/campaigns/metrics') {
          return Promise.resolve({
            data: {
              status: 'ok',
              data: { queue: 0, dlq: 0, counters: { sent: 0, failed: 0, dlq: 0, enqueued: 0 } },
            },
          });
        }
        return Promise.resolve(genericOkEnvelope());
      });
    },
  },
  {
    name: 'AdminCollectionPage',
    modulePath: '../../pages/admin/AdminCollectionPage.tsx',
    exportName: 'AdminCollectionPage',
    route: { route: '/collections/:type', initialEntries: ['/collections/testimonials'] },
  },
  {
    name: 'AdminConsentLedgerPage',
    modulePath: '../../pages/admin/AdminConsentLedgerPage.tsx',
    exportName: 'AdminConsentLedgerPage',
  },
  {
    name: 'AdminContactsPage',
    modulePath: '../../pages/admin/AdminContactsPage.tsx',
    exportName: 'AdminContactsPage',
    configure: () => {
      apiGetMock.mockImplementation(() =>
        Promise.resolve({
          data: { status: 'ok', data: { items: [], total: 0, page: 1, limit: 100 } },
        }),
      );
    },
  },
  {
    name: 'AdminCrmPage',
    modulePath: '../../pages/admin/AdminCrmPage.tsx',
    exportName: 'AdminCrmPage',
    configure: () => {
      // PipelineFunnelChart reads contacts/newsletter/bookings/funnel with
      // no optional chaining at all on some fields (e.g. `funnel.step1_contact`).
      apiGetMock.mockImplementation((url: string) => {
        if (url === '/crm/pipeline-stats') {
          return Promise.resolve({
            data: {
              status: 'success',
              data: {
                contacts: { total: 0, unread: 0, last30: 0 },
                newsletter: { total: 0, active: 0 },
                bookings: { total: 0, confirmed: 0, conversionRate: 0 },
                funnel: { step1_contact: 0, step2_subscribed: 0, step3_booked: 0 },
              },
            },
          });
        }
        return Promise.resolve(genericOkEnvelope());
      });
    },
  },
  {
    name: 'AdminDSARPage',
    modulePath: '../../pages/admin/AdminDSARPage.tsx',
    exportName: 'AdminDSARPage',
    configure: () => {
      adminFetchMock.mockImplementation(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ status: 'ok', dsarRequests: [] }),
          text: () => Promise.resolve(''),
        }),
      );
    },
  },
  {
    name: 'AdminDashboard',
    modulePath: '../../pages/admin/AdminDashboard.tsx',
    exportName: 'AdminDashboard',
    configure: () => {
      // PipelineWidget reads `data?.data.bookings.conversionRate` — the
      // optional chain only guards `data`, not `.bookings`.
      apiGetMock.mockImplementation((url: string) => {
        if (url === '/crm/pipeline-stats') {
          return Promise.resolve({
            data: {
              status: 'ok',
              data: {
                funnel: { step1_contact: 0, step2_subscribed: 0, step3_booked: 0 },
                bookings: { conversionRate: 0 },
              },
            },
          });
        }
        return Promise.resolve(genericOkEnvelope());
      });
    },
  },
  {
    name: 'AdminDealsPage',
    modulePath: '../../pages/admin/AdminDealsPage.tsx',
    exportName: 'default',
  },
  {
    name: 'AdminDevAnalyticsPage',
    modulePath: '../../pages/admin/AdminDevAnalyticsPage.tsx',
    exportName: 'AdminDevAnalyticsPage',
  },
  {
    name: 'AdminESGPage',
    modulePath: '../../pages/admin/AdminESGPage.tsx',
    exportName: 'AdminESGPage',
    configure: () => {
      adminFetchMock.mockImplementation(() => jsonResponse({ data: [] }));
    },
  },
  {
    name: 'AdminFintechCompliancePage',
    modulePath: '../../pages/admin/AdminFintechCompliancePage.tsx',
    exportName: 'AdminFintechCompliancePage',
    configure: () => {
      adminFetchMock.mockImplementation(() => jsonResponse({ data: [] }));
    },
  },
  {
    name: 'AdminFounderLetterPage',
    modulePath: '../../pages/admin/AdminFounderLetterPage.tsx',
    exportName: 'AdminFounderLetterPage',
    configure: () => {
      adminFetchMock.mockImplementation(() => jsonResponse({ data: [] }));
    },
  },
  {
    name: 'AdminHelpPage',
    modulePath: '../../pages/admin/AdminHelpPage.tsx',
    exportName: 'AdminHelpPage',
  },
  {
    name: 'AdminInsightsCategoriesPage',
    modulePath: '../../pages/admin/AdminInsightsCategoriesPage.tsx',
    exportName: 'AdminInsightsCategoriesPage',
  },
  {
    name: 'AdminInsightsMetadataPage',
    modulePath: '../../pages/admin/AdminInsightsMetadataPage.tsx',
    exportName: 'AdminInsightsMetadataPage',
  },
  {
    name: 'AdminInsightsPage',
    modulePath: '../../pages/admin/AdminInsightsPage.tsx',
    exportName: 'AdminInsightsPage',
    configure: () => {
      // PipelinePanel indexes `data[key as keyof PipelineData]` with no
      // guard on `data` itself — the dashboard-stats query must resolve to
      // a real object, not the generic empty-array envelope.
      apiGetMock.mockImplementation((url: string) => {
        if (url === '/v1/admin/insights/dashboard/stats') {
          return Promise.resolve({
            data: {
              status: 'ok',
              data: {
                pipeline: {
                  DRAFT: 0,
                  IN_REVIEW: 0,
                  COPY_EDIT: 0,
                  SEO_REVIEW: 0,
                  LEGAL_REVIEW: 0,
                  SCHEDULED: 0,
                  PUBLISHED: 0,
                  ARCHIVED: 0,
                },
                topPosts: [],
                recentPosts: [],
              },
            },
          });
        }
        return Promise.resolve(genericOkEnvelope());
      });
    },
  },
  {
    name: 'AdminInsightsPostEditPage (new)',
    modulePath: '../../pages/admin/AdminInsightsPostEditPage.tsx',
    exportName: 'AdminInsightsPostEditPage',
    route: { route: '/insights/posts/new', initialEntries: ['/insights/posts/new'] },
  },
  {
    name: 'AdminInsightsPostEditPage (edit)',
    modulePath: '../../pages/admin/AdminInsightsPostEditPage.tsx',
    exportName: 'AdminInsightsPostEditPage',
    route: { route: '/insights/posts/:id/edit', initialEntries: ['/insights/posts/post-1/edit'] },
  },
  {
    name: 'AdminInsightsPostsPage',
    modulePath: '../../pages/admin/AdminInsightsPostsPage.tsx',
    exportName: 'AdminInsightsPostsPage',
  },
  {
    name: 'AdminLeadDetailPage',
    modulePath: '../../pages/admin/AdminLeadDetailPage.tsx',
    exportName: 'AdminLeadDetailPage',
    route: { route: '/leads/:id', initialEntries: ['/leads/lead-1'] },
    configure: () => {
      // The generic empty envelope leaves `c.email`/`c.phone` undefined;
      // the page always builds `mailto:${c.email}` / `tel:${c.phone}` links
      // regardless, producing an <a> with a real href but empty text — a
      // mock-shape artifact, not a real missing-link-name bug. A realistic
      // contact record is closer to what /admin/contacts/:id actually returns.
      apiGetMock.mockImplementation((url: string) => {
        if (url === '/leads/lead-1/notes' || url === '/admin/leads/lead-1/notes') {
          return Promise.resolve({ data: { status: 'ok', data: [] } });
        }
        return Promise.resolve({
          data: {
            status: 'ok',
            data: {
              id: 'lead-1',
              fullName: 'Test Aday',
              email: 'aday@example.com',
              phone: '+90 555 000 0000',
              company: 'Test A.Ş.',
              isRead: true,
              createdAt: new Date().toISOString(),
            },
          },
        });
      });
    },
  },
  {
    name: 'AdminLeadsPage',
    modulePath: '../../pages/admin/AdminLeadsPage.tsx',
    exportName: 'AdminLeadsPage',
  },
  {
    name: 'AdminLogin',
    modulePath: '../../pages/admin/AdminLogin.tsx',
    exportName: 'AdminLoginPage',
  },
  {
    name: 'AdminMediaLibraryPage',
    modulePath: '../../pages/admin/AdminMediaLibraryPage.tsx',
    exportName: 'AdminMediaLibraryPage',
  },
  {
    name: 'AdminNewsletterPage',
    modulePath: '../../pages/admin/AdminNewsletterPage.tsx',
    exportName: 'AdminNewsletterPage',
  },
  {
    name: 'AdminOutreachPage',
    modulePath: '../../pages/admin/AdminOutreachPage.tsx',
    exportName: 'AdminOutreachPage',
  },
  {
    name: 'AdminOverviewPage',
    modulePath: '../../pages/admin/AdminOverviewPage.tsx',
    exportName: 'AdminOverviewPage',
    configure: () => {
      // `c.sourceBreakdown.length` — the charts query's `data.data` must be
      // a real object (kpi/charts/activity/health each have distinct shapes).
      apiGetMock.mockImplementation((url: string) => {
        if (url === '/admin/dashboard/kpi') {
          return Promise.resolve({
            data: {
              status: 'ok',
              data: {
                totalLeads30d: 0,
                leadsDelta: 0,
                newSubscribers7d: 0,
                subscribersDelta: 0,
                hotLeads: 0,
                discoveryCallsThisMonth: 0,
                conversionRate: 0,
                avgLeadScore: 0,
              },
            },
          });
        }
        if (url === '/admin/dashboard/charts') {
          return Promise.resolve({
            data: {
              status: 'ok',
              data: { leadTrend30d: [], sourceBreakdown: [], funnel: [] },
            },
          });
        }
        if (url === '/admin/dashboard/activity') {
          return Promise.resolve({ data: { status: 'ok', data: [] } });
        }
        if (url === '/admin/dashboard/health') {
          return Promise.resolve({
            data: {
              status: 'ok',
              data: { backend: 'ok', db: 'ok', queue: 'ok', errorRate: 0, uptime: 0 },
            },
          });
        }
        return Promise.resolve(genericOkEnvelope());
      });
    },
  },
  {
    name: 'AdminPageEditPage',
    modulePath: '../../pages/admin/AdminPageEditPage.tsx',
    exportName: 'AdminPageEditPage',
    route: { route: '/pages/:id/edit', initialEntries: ['/pages/page-1/edit'] },
  },
  {
    name: 'AdminPagesListPage',
    modulePath: '../../pages/admin/AdminPagesListPage.tsx',
    exportName: 'AdminPagesListPage',
  },
  {
    name: 'AdminProfilePage',
    modulePath: '../../pages/admin/AdminProfilePage.tsx',
    exportName: 'AdminProfilePage',
  },
  {
    name: 'AdminRBACPage',
    modulePath: '../../pages/admin/AdminRBACPage.tsx',
    exportName: 'AdminRBACPage',
    // ViewAsBanner (rendered by this page) calls useViewAs(), which throws
    // without a <ViewAsProvider> ancestor. NOTE: ViewAsProvider is not
    // actually mounted anywhere in the real app tree either (see
    // src/App.tsx / AdminLayout.tsx) — this looks like a genuine
    // pre-existing production bug (AdminRBACPage would crash for real
    // users), out of scope for this a11y-coverage pass to fix. Wrapping
    // here only unblocks *this* test so the page's actual a11y surface can
    // still be scanned.
    wrapElement: (el) => React.createElement(ViewAsProvider, null, el),
    configure: () => {
      // PermissionMatrixGrid fetches via adminFetch and reduces
      // `data.permissions` unconditionally — mirrors the MOCK_RESPONSE shape
      // already established in admin-rbac.axe.test.tsx.
      adminFetchMock.mockImplementation(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              status: 'ok',
              data: { permissions: [], matrix: {} },
            }),
          text: () => Promise.resolve(''),
        }),
      );
    },
  },
  {
    name: 'AdminROPAPage',
    modulePath: '../../pages/admin/AdminROPAPage.tsx',
    exportName: 'AdminROPAPage',
  },
  {
    name: 'AdminRetainersPage',
    modulePath: '../../pages/admin/AdminRetainersPage.tsx',
    exportName: 'AdminRetainersPage',
  },
  {
    name: 'AdminRetentionPage',
    modulePath: '../../pages/admin/AdminRetentionPage.tsx',
    exportName: 'AdminRetentionPage',
  },
  {
    name: 'AdminSecurityPage',
    modulePath: '../../pages/admin/AdminSecurityPage.tsx',
    exportName: 'AdminSecurityPage',
  },
  {
    name: 'AdminServiceEditPage',
    modulePath: '../../pages/admin/AdminServiceEditPage.tsx',
    exportName: 'AdminServiceEditPage',
    route: { route: '/services/:slug/edit', initialEntries: ['/services/new/edit'] },
  },
  {
    name: 'AdminServicesPage',
    modulePath: '../../pages/admin/AdminServicesPage.tsx',
    exportName: 'AdminServicesPage',
  },
  {
    name: 'AdminSessionsPage',
    modulePath: '../../pages/admin/AdminSessionsPage.tsx',
    exportName: 'AdminSessionsPage',
  },
  {
    name: 'AdminSettingsPage',
    modulePath: '../../pages/admin/AdminSettingsPage.tsx',
    exportName: 'AdminSettingsPage',
  },
  {
    name: 'AdminSettingsTabsPage',
    modulePath: '../../pages/admin/AdminSettingsTabsPage.tsx',
    exportName: 'AdminSettingsTabsPage',
  },
  {
    name: 'AdminSuccessionPage',
    modulePath: '../../pages/admin/AdminSuccessionPage.tsx',
    exportName: 'AdminSuccessionPage',
    configure: () => {
      adminFetchMock.mockImplementation(() => jsonResponse({ data: [] }));
    },
  },
  {
    name: 'AdminUsersPage',
    modulePath: '../../pages/admin/AdminUsersPage.tsx',
    exportName: 'AdminUsersPage',
  },
  {
    name: 'AdminVERBISPage',
    modulePath: '../../pages/admin/AdminVERBISPage.tsx',
    exportName: 'AdminVERBISPage',
  },
];

// AdminMediaLibraryPage — canvas-cropper dependency (react-easy-crop draws to
// a <canvas> during the crop-modal path); the *list* view itself renders
// fine, so it stays in PAGES above. No exclusions needed yet — this comment
// documents the check, updated below if runtime reveals otherwise.

describe.each(PAGES)('Admin a11y factory — $name', (entry) => {
  beforeEach(() => {
    resetAdminMocks();
    entry.configure?.();
  });

  // Rendering a full admin page and running a complete axe pass over its DOM
  // legitimately exceeds Vitest's 5s default — the heaviest pages measured
  // 7–29s on CI hardware. The assertion is unchanged; only the clock is
  // realistic for what this test actually does.
  it('renders and passes axe-core with 0 violations', { timeout: 60_000 }, async () => {
    const loader = pageModules[entry.modulePath];
    if (!loader) {
      throw new Error(`No module found for glob key ${entry.modulePath}`);
    }
    const mod = await loader();
    const Component = mod[entry.exportName] as React.ComponentType;
    if (!Component) {
      throw new Error(`Export '${entry.exportName}' not found on ${entry.modulePath}`);
    }

    const element = entry.wrapElement
      ? entry.wrapElement(React.createElement(Component))
      : React.createElement(Component);
    const { container } = renderAdminPage(element, entry.route);
    await settle();
    await expectNoAxeViolations(container);
  });
});
