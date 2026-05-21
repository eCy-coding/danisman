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

const NOTION_VERSION = '2022-06-28';
const NOTION_API = 'https://api.notion.com/v1';

const API_KEY = process.env.NOTION_API_KEY ?? '';
const PROSPECTS_DB = process.env.NOTION_PROSPECTS_DB_ID ?? '';
const INTERACTIONS_DB = process.env.NOTION_INTERACTIONS_DB_ID ?? '';

let warnedMissing = false;
function isConfigured(): boolean {
  if (!API_KEY || !PROSPECTS_DB) {
    if (!warnedMissing) {
      warnedMissing = true;
      logger.warn(
        '[notion] NOTION_API_KEY or NOTION_PROSPECTS_DB_ID not set — CRM writes are no-op',
      );
    }
    return false;
  }
  return true;
}

// ── Column names ─────────────────────────────────────────────────────────────
// Centralized so a Notion schema rename only touches this block.
const PROP = {
  name: 'Name',
  email: 'Email',
  company: 'Company',
  sector: 'Sector',
  source: 'Source',
  stage: 'Stage',
  priority: 'Priority',
  consentAt: 'KVKK Consent At',
  notes: 'Notes',
  score: 'Score',
  tier: 'Tier',
  prospect: 'Prospect',
  type: 'Type',
  outcome: 'Outcome',
  occurredAt: 'Occurred At',
} as const;

// ── Types ────────────────────────────────────────────────────────────────────

export type ProspectStage =
  | 'Lead'
  | 'Discovery Booked'
  | 'Discovery Done'
  | 'Proposal'
  | 'Active'
  | 'Closed Won'
  | 'Closed Lost';

export type ProspectPriority = 'Low' | 'Medium' | 'High';

export interface ProspectUpsertInput {
  name: string;
  email: string;
  company?: string;
  sector?: string;
  source: string;
  stage: ProspectStage;
  priority?: ProspectPriority;
  kvkkConsentAt: string; // ISO-8601 — required for KVKK provenance
  notes?: string;
  score?: number;
  tier?: string;
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

function statusProp(value: string): Record<string, unknown> {
  return { status: { name: value } };
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

function buildProspectProperties(input: ProspectUpsertInput): Record<string, unknown> {
  const props: Record<string, unknown> = {
    [PROP.name]: titleProp(input.name),
    [PROP.email]: emailProp(input.email),
    [PROP.source]: selectProp(input.source),
    [PROP.stage]: statusProp(input.stage),
    [PROP.consentAt]: dateProp(input.kvkkConsentAt),
  };
  if (input.company) props[PROP.company] = richTextProp(input.company);
  if (input.sector) props[PROP.sector] = richTextProp(input.sector);
  if (input.priority) props[PROP.priority] = selectProp(input.priority);
  if (input.notes) props[PROP.notes] = richTextProp(input.notes);
  if (typeof input.score === 'number') props[PROP.score] = numberProp(input.score);
  if (input.tier) props[PROP.tier] = selectProp(input.tier);
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

export async function findProspectByEmail(email: string): Promise<NotionPage | null> {
  if (!isConfigured()) return null;
  const res = await notionFetch<NotionQueryResponse>(`/databases/${PROSPECTS_DB}/query`, {
    method: 'POST',
    body: {
      filter: { property: PROP.email, email: { equals: email } },
      page_size: 1,
    },
  });
  return res?.results?.[0] ?? null;
}

/**
 * Upsert a Prospect by email. If a row exists we PATCH stage/priority/notes
 * but never overwrite the original `KVKK Consent At` (preserving the first
 * lawful basis timestamp). Returns the page id, or null on failure.
 */
export async function upsertProspect(input: ProspectUpsertInput): Promise<string | null> {
  if (!isConfigured()) return null;
  const existing = await findProspectByEmail(input.email);
  if (existing) {
    const patchProps = buildProspectProperties(input);
    // Don't clobber original consent timestamp on update.
    delete patchProps[PROP.consentAt];
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
 * Append an Interaction row tied to a Prospect. Silent no-op when
 * NOTION_INTERACTIONS_DB_ID is not configured (some workspaces start
 * with only a Prospects DB and add Interactions later).
 */
export async function createInteraction(input: InteractionInput): Promise<string | null> {
  if (!isConfigured() || !INTERACTIONS_DB) return null;
  const occurredAt = input.occurredAt ?? new Date().toISOString();
  const props: Record<string, unknown> = {
    [PROP.name]: titleProp(`${input.type} — ${input.outcome}`),
    [PROP.prospect]: relationProp([input.prospectId]),
    [PROP.type]: selectProp(input.type),
    [PROP.outcome]: selectProp(input.outcome),
    [PROP.occurredAt]: dateProp(occurredAt),
  };
  if (input.notes) props[PROP.notes] = richTextProp(input.notes);

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
