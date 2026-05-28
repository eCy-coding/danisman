/**
 * Track 1 — Notion CRM service.
 *
 * Lightweight HTTP client around Notion's REST API. Used by intake routes
 * (contact, calendly, quick-check, pricing-calculator) to upsert PROSPECTS
 * and append INTERACTIONS in the founder's Notion CRM workspace.
 *
 * KVKK m.5/2-f legal basis: legitimate-interest processing for inbound
 * commercial communication. Every Prospect create stamps a `KVKK Consent
 * At` ISO-8601 timestamp captured from the form, so consent provenance is
 * auditable inside the CRM itself.
 *
 * Design rules:
 *   - No @notionhq/client dep — plain fetch keeps the install footprint
 *     small and avoids surface-area churn on the launch path.
 *   - Missing NOTION_API_KEY → every export is a silent no-op so dev/CI
 *     environments don't depend on outbound HTTP. Logs a warning once.
 *   - All schema property names are central constants below. If founder
 *     renames a Notion column, update only this file.
 *   - Errors NEVER throw to the caller; routes must not fail the user
 *     submission because the CRM had a hiccup. Errors flow to logger +
 *     Sentry breadcrumb.
 */

import * as Sentry from '@sentry/node';
import { logger } from '../config/logger';
import { withOutboxRecord } from '../lib/outbox';

const NOTION_VERSION = '2022-06-28';
const NOTION_API = 'https://api.notion.com/v1';

const API_KEY = process.env.NOTION_API_KEY ?? '';
const PROSPECTS_DB = process.env.NOTION_DB_PROSPECTS ?? '';
const INTERACTIONS_DB = process.env.NOTION_DB_INTERACTIONS ?? '';

let warnedMissing = false;
function isConfigured(): boolean {
  if (!API_KEY || !PROSPECTS_DB) {
    if (!warnedMissing) {
      warnedMissing = true;
      logger.warn('[notion] NOTION_API_KEY or NOTION_DB_PROSPECTS not set — CRM writes are no-op');
    }
    return false;
  }
  return true;
}

// ── Column names ─────────────────────────────────────────────────────────────
// Live Prospects DB is Turkish-named. These MUST match the workspace schema
// exactly — a single mismatch makes Notion reject the whole page with a 400
// validation_error, which notionFetch swallows → silent lead loss. Verified
// against the live schema 2026-05-22.
const PROP = {
  company: 'Şirket', // title
  linkedin: 'LinkedIn', // url
  sector: 'Sektör', // select
  engagementTier: 'Engagement Tier', // select
  budgetUsd: 'Tahmini Bütçe USD', // select
  big4Auditor: 'Big4 Denetçisi', // select
  outreachStatus: 'Outreach Status', // select
  score: 'Quick-Check Skoru', // number
  quickCheckDate: 'Quick-Check Tarihi', // date
  discoveryCallDate: 'Discovery Call Tarihi', // date
  firstContactDate: 'İlk Temas Tarihi', // date
  serviceSlug: 'Service Slug', // rich_text
  notes: 'Notes', // rich_text
  decisionMaker: 'Decision Maker', // rich_text
  decisionMakerEmail: 'Decision Maker Email', // email
  tags: 'Etiketler', // multi_select
} as const;

// Interactions DB keeps its own (English) schema; out of scope for the
// Prospects contract fix, so its column names live separately here.
const IPROP = {
  name: 'Name',
  prospect: 'Prospect',
  type: 'Type',
  outcome: 'Outcome',
  occurredAt: 'Occurred At',
  notes: 'Notes',
} as const;

// ── Types ────────────────────────────────────────────────────────────────────

export interface ProspectUpsertInput {
  company?: string; // → Şirket (title); falls back to decisionMaker/email
  decisionMaker?: string; // → Decision Maker (person name)
  decisionMakerEmail: string; // → Decision Maker Email (dedup fallback key)
  sector?: string; // → Sektör
  engagementTier?: string; // → Engagement Tier
  budgetUsd?: string; // → Tahmini Bütçe USD
  big4Auditor?: string; // → Big4 Denetçisi
  outreachStatus?: string; // → Outreach Status
  quickCheckScore?: number; // → Quick-Check Skoru
  quickCheckDate?: string; // → Quick-Check Tarihi (ISO-8601)
  discoveryCallDate?: string; // → Discovery Call Tarihi (ISO-8601)
  firstContactDate?: string; // → İlk Temas Tarihi (ISO-8601)
  serviceSlug?: string; // → Service Slug
  linkedin?: string; // → LinkedIn
  notes?: string; // → Notes
  tags?: string[]; // → Etiketler
  kvkkConsentAt: string; // ISO-8601 — folded into İlk Temas Tarihi + Notes
}

export interface InteractionInput {
  prospectId: string;
  type: 'Discovery Call' | 'Email' | 'Quick-Check' | 'Pricing-Calc' | 'Contact Form' | 'Note';
  outcome: string;
  notes?: string;
  occurredAt?: string;
}

// ── HTTP layer ───────────────────────────────────────────────────────────────

async function notionFetch<T>(
  path: string,
  init: { method: 'GET' | 'POST' | 'PATCH'; body?: unknown } = { method: 'GET' },
): Promise<T | null> {
  if (!isConfigured()) return null;
  try {
    const res = await fetch(`${NOTION_API}${path}`, {
      method: init.method,
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Notion-Version': NOTION_VERSION,
        'Content-Type': 'application/json',
      },
      body: init.body ? JSON.stringify(init.body) : undefined,
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      logger.warn('[notion] non-2xx response', {
        path,
        status: res.status,
        body: text.slice(0, 240),
      });
      Sentry.addBreadcrumb({
        category: 'notion',
        message: `${init.method} ${path} → ${res.status}`,
        level: 'warning',
      });
      return null;
    }
    return (await res.json()) as T;
  } catch (err) {
    logger.warn('[notion] request failed', { path, err: String(err) });
    Sentry.captureException(err, { tags: { service: 'notion', path } });
    return null;
  }
}

// ── Builders ─────────────────────────────────────────────────────────────────

function titleProp(value: string): Record<string, unknown> {
  return { title: [{ text: { content: value.slice(0, 2000) } }] };
}

function richTextProp(value: string): Record<string, unknown> {
  return { rich_text: [{ text: { content: value.slice(0, 2000) } }] };
}

function emailProp(value: string): Record<string, unknown> {
  return { email: value };
}

function selectProp(value: string): Record<string, unknown> {
  return { select: { name: value } };
}

function multiSelectProp(values: string[]): Record<string, unknown> {
  return { multi_select: values.map((name) => ({ name })) };
}

function urlProp(value: string): Record<string, unknown> {
  return { url: value };
}

function dateProp(iso: string): Record<string, unknown> {
  return { date: { start: iso } };
}

function numberProp(value: number): Record<string, unknown> {
  return { number: value };
}

function relationProp(ids: string[]): Record<string, unknown> {
  return { relation: ids.map((id) => ({ id })) };
}

function prospectTitle(input: ProspectUpsertInput): string {
  return input.company || input.decisionMaker || input.decisionMakerEmail;
}

function buildProspectProperties(input: ProspectUpsertInput): Record<string, unknown> {
  const props: Record<string, unknown> = {
    [PROP.company]: titleProp(prospectTitle(input)),
  };
  if (input.decisionMaker) props[PROP.decisionMaker] = richTextProp(input.decisionMaker);
  if (input.decisionMakerEmail)
    props[PROP.decisionMakerEmail] = emailProp(input.decisionMakerEmail);
  if (input.sector) props[PROP.sector] = selectProp(input.sector);
  if (input.engagementTier) props[PROP.engagementTier] = selectProp(input.engagementTier);
  if (input.budgetUsd) props[PROP.budgetUsd] = selectProp(input.budgetUsd);
  if (input.big4Auditor) props[PROP.big4Auditor] = selectProp(input.big4Auditor);
  if (input.outreachStatus) props[PROP.outreachStatus] = selectProp(input.outreachStatus);
  if (typeof input.quickCheckScore === 'number')
    props[PROP.score] = numberProp(input.quickCheckScore);
  if (input.quickCheckDate) props[PROP.quickCheckDate] = dateProp(input.quickCheckDate);
  if (input.discoveryCallDate) props[PROP.discoveryCallDate] = dateProp(input.discoveryCallDate);
  if (input.serviceSlug) props[PROP.serviceSlug] = richTextProp(input.serviceSlug);
  if (input.linkedin) props[PROP.linkedin] = urlProp(input.linkedin);
  if (input.tags?.length) props[PROP.tags] = multiSelectProp(input.tags);

  // The live Prospects schema has no dedicated KVKK column. Stamp the lawful-
  // basis timestamp into İlk Temas Tarihi (first-contact date) and prepend it
  // to Notes so consent provenance stays auditable inside the CRM itself.
  props[PROP.firstContactDate] = dateProp(input.firstContactDate ?? input.kvkkConsentAt);
  const consentLine = `KVKK m.5/2-f onayı: ${input.kvkkConsentAt}`;
  props[PROP.notes] = richTextProp(input.notes ? `${consentLine}\n${input.notes}` : consentLine);

  return props;
}

// ── Public API ───────────────────────────────────────────────────────────────

interface NotionPage {
  id: string;
  properties?: Record<string, unknown>;
}

interface NotionQueryResponse {
  results: NotionPage[];
}

/**
 * Locate a Prospect for dedup. Keyed on company (Şirket title) when present —
 * the CRM identity for a B2B account — else falls back to the decision-maker
 * email. Returns null when neither key is provided.
 */
export async function findProspect(input: {
  company?: string;
  email?: string;
}): Promise<NotionPage | null> {
  if (!isConfigured()) return null;
  const filter = input.company
    ? { property: PROP.company, title: { equals: input.company } }
    : input.email
      ? { property: PROP.decisionMakerEmail, email: { equals: input.email } }
      : null;
  if (!filter) return null;
  const res = await notionFetch<NotionQueryResponse>(`/databases/${PROSPECTS_DB}/query`, {
    method: 'POST',
    body: { filter, page_size: 1 },
  });
  return res?.results?.[0] ?? null;
}

/** True when NOTION_API_KEY + NOTION_DB_PROSPECTS are present. */
export function isNotionConfigured(): boolean {
  return isConfigured();
}

/**
 * Raw Notion upsert — the un-wrapped network operation. Returns the page id or
 * null on failure (still swallows network errors internally). The retry cron
 * (server/jobs/process-outbox.ts) calls THIS directly so a replay does not
 * create a second outbox row; production traffic goes through `upsertProspect`.
 */
export async function upsertProspectRaw(input: ProspectUpsertInput): Promise<string | null> {
  if (!isConfigured()) return null;
  const existing = await findProspect({ company: input.company, email: input.decisionMakerEmail });
  if (existing) {
    const patchProps = buildProspectProperties(input);
    // Don't clobber the original first-contact / consent stamp on update.
    delete patchProps[PROP.firstContactDate];
    const updated = await notionFetch<NotionPage>(`/pages/${existing.id}`, {
      method: 'PATCH',
      body: { properties: patchProps },
    });
    return updated?.id ?? existing.id;
  }

  const created = await notionFetch<NotionPage>(`/pages`, {
    method: 'POST',
    body: {
      parent: { database_id: PROSPECTS_DB },
      properties: buildProspectProperties(input),
    },
  });
  return created?.id ?? null;
}

/**
 * Upsert a Prospect by email, recorded through the integration Outbox / WAL so
 * a Notion outage can no longer silently lose a lead (the retry cron replays
 * the FAILED row). The public contract is unchanged: returns the page id, or
 * null on failure — this never throws, so existing fire-and-forget callers
 * keep working.
 *
 * When Notion is not configured (dev / CI / unit tests) we skip the WAL
 * entirely and defer to the raw no-op, so no spurious rows accumulate.
 *
 * payload = the exact upsert input. It carries name/email/company/notes +
 * the KVKK consent timestamp (needed for a faithful replay) — but no API
 * tokens and no email bodies.
 */
export async function upsertProspect(input: ProspectUpsertInput): Promise<string | null> {
  if (!isConfigured()) return upsertProspectRaw(input);

  try {
    return await withOutboxRecord<string | null>(
      {
        service: 'NOTION',
        operation: 'upsertProspect',
        payload: input as unknown as Record<string, unknown>,
      },
      async () => {
        const id = await upsertProspectRaw(input);
        if (id === null) {
          throw new Error('Notion upsert returned null (write failed)');
        }
        return id;
      },
    );
  } catch (err) {
    // WAL row is already FAILED; preserve the never-throw contract for callers.
    logger.warn('[notion] upsertProspect failed — recorded in outbox for retry', {
      err: String(err),
    });
    return null;
  }
}

/**
 * Append an Interaction row tied to a Prospect. Silent no-op when
 * NOTION_DB_INTERACTIONS is not configured (some workspaces start
 * with only a Prospects DB and add Interactions later).
 */
export async function createInteraction(input: InteractionInput): Promise<string | null> {
  if (!isConfigured() || !INTERACTIONS_DB) return null;
  const occurredAt = input.occurredAt ?? new Date().toISOString();
  const props: Record<string, unknown> = {
    [IPROP.name]: titleProp(`${input.type} — ${input.outcome}`),
    [IPROP.prospect]: relationProp([input.prospectId]),
    [IPROP.type]: selectProp(input.type),
    [IPROP.outcome]: selectProp(input.outcome),
    [IPROP.occurredAt]: dateProp(occurredAt),
  };
  if (input.notes) props[IPROP.notes] = richTextProp(input.notes);

  const created = await notionFetch<NotionPage>(`/pages`, {
    method: 'POST',
    body: {
      parent: { database_id: INTERACTIONS_DB },
      properties: props,
    },
  });
  return created?.id ?? null;
}

export const __notionInternals = { isConfigured, buildProspectProperties };
