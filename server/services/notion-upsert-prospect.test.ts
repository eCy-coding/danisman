/**
 * Track 1 — Notion upsertProspect contract tests.
 *
 * Guards against the launch-blocker that silently dropped leads: the live
 * Prospects DB is Turkish-named, and any property-name mismatch makes Notion
 * reject the page with a 400 that notionFetch swallows. These tests pin the
 * exact Turkish property contract.
 *
 * Covers: happy-path create, missing-field create (only required fields),
 * and duplicate-company update (PATCH preserves first-contact stamp).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@sentry/node', () => ({
  addBreadcrumb: vi.fn(),
  captureException: vi.fn(),
}));
vi.mock('../config/logger', () => ({
  logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn() },
}));

type NotionModule = typeof import('./notion');

interface NotionPropValue {
  title?: Array<{ text: { content: string } }>;
  rich_text?: Array<{ text: { content: string } }>;
  email?: string;
  select?: { name: string };
  number?: number;
  date?: { start: string };
  multi_select?: Array<{ name: string }>;
}
type NotionProps = Record<string, NotionPropValue | undefined>;

function jsonRes(body: unknown) {
  return {
    ok: true,
    status: 200,
    json: async () => body,
    text: async () => JSON.stringify(body),
  };
}

let notion: NotionModule;
let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(async () => {
  vi.resetModules();
  vi.stubEnv('NOTION_API_KEY', 'test-key');
  vi.stubEnv('NOTION_PROSPECTS_DB_ID', 'test-db');
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  notion = await import('./notion');
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('upsertProspect — happy path create', () => {
  it('creates a Prospect with the Turkish property contract', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonRes({ results: [] })) // findProspect → no match
      .mockResolvedValueOnce(jsonRes({ id: 'new-page' })); // create

    const id = await notion.upsertProspect({
      company: 'Acme A.Ş.',
      decisionMaker: 'Jane Doe',
      decisionMakerEmail: 'jane@acme.com',
      sector: 'Teknoloji',
      outreachStatus: 'Replied',
      quickCheckScore: 18,
      serviceSlug: 'quick-check',
      kvkkConsentAt: '2026-05-22T00:00:00.000Z',
      notes: 'Quick-Check answers: AABBCC',
    });

    expect(id).toBe('new-page');
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const [url, init] = fetchMock.mock.calls[1] as [string, { method: string; body: string }];
    expect(url).toBe('https://api.notion.com/v1/pages');
    expect(init.method).toBe('POST');
    const body = JSON.parse(init.body as string);
    expect(body.parent.database_id).toBe('test-db');

    const p = body.properties as NotionProps;
    expect(p['Şirket']?.title?.[0]?.text.content).toBe('Acme A.Ş.');
    expect(p['Decision Maker']?.rich_text?.[0]?.text.content).toBe('Jane Doe');
    expect(p['Decision Maker Email']?.email).toBe('jane@acme.com');
    expect(p['Sektör']?.select?.name).toBe('Teknoloji');
    expect(p['Outreach Status']?.select?.name).toBe('Replied');
    expect(p['Quick-Check Skoru']?.number).toBe(18);
    expect(p['Service Slug']?.rich_text?.[0]?.text.content).toBe('quick-check');
    expect(p['İlk Temas Tarihi']?.date?.start).toBe('2026-05-22T00:00:00.000Z');
    expect(p['Notes']?.rich_text?.[0]?.text.content).toContain('KVKK m.5/2-f onayı');
    // None of the legacy English columns may leak through.
    expect(p['Name']).toBeUndefined();
    expect(p['Email']).toBeUndefined();
    expect(p['Stage']).toBeUndefined();
  });
});

describe('upsertProspect — missing fields', () => {
  it('builds a valid payload from only the required fields', () => {
    const props = notion.__notionInternals.buildProspectProperties({
      decisionMakerEmail: 'lead@example.com',
      kvkkConsentAt: '2026-05-22T12:00:00.000Z',
    }) as NotionProps;

    // Title falls back to the email when no company/decisionMaker is given.
    expect(props['Şirket']?.title?.[0]?.text.content).toBe('lead@example.com');
    expect(props['Decision Maker Email']?.email).toBe('lead@example.com');
    expect(props['İlk Temas Tarihi']?.date?.start).toBe('2026-05-22T12:00:00.000Z');
    expect(props['Notes']?.rich_text?.[0]?.text.content).toContain('KVKK m.5/2-f onayı');
    // Optional columns must be omitted, not sent as null/empty.
    expect(props['Sektör']).toBeUndefined();
    expect(props['Quick-Check Skoru']).toBeUndefined();
    expect(props['Decision Maker']).toBeUndefined();
    expect(props['Etiketler']).toBeUndefined();
  });
});

describe('upsertProspect — duplicate company', () => {
  it('PATCHes the existing row and preserves İlk Temas Tarihi', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonRes({ results: [{ id: 'existing-1' }] })) // findProspect → hit
      .mockResolvedValueOnce(jsonRes({ id: 'existing-1' })); // patch

    const id = await notion.upsertProspect({
      company: 'Acme A.Ş.',
      decisionMakerEmail: 'jane@acme.com',
      outreachStatus: 'Discovery Booked',
      kvkkConsentAt: '2026-05-23T00:00:00.000Z',
    });

    expect(id).toBe('existing-1');
    const [url, init] = fetchMock.mock.calls[1] as [string, { method: string; body: string }];
    expect(url).toBe('https://api.notion.com/v1/pages/existing-1');
    expect(init.method).toBe('PATCH');
    const body = JSON.parse(init.body as string);
    // First-contact / consent stamp must not be clobbered on update.
    expect(body.properties['İlk Temas Tarihi']).toBeUndefined();
    expect(body.properties['Outreach Status'].select.name).toBe('Discovery Booked');
  });
});
