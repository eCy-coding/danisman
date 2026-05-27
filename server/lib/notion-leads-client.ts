/**
 * Notion CRM client for admin Aday (lead) capture.
 *
 * Separate from server/services/notion.ts (Track 1 Prospects/Interactions).
 * This module targets the NOTION_LEADS_DB_ID database for the admin panel.
 *
 * Design:
 *   - Plain fetch (no @notionhq/client) for consistency with existing notion.ts
 *   - Inline token-bucket throttle: max 3 req/s (Notion public API limit)
 *   - Inline TTL cache: 10-min in-memory Map for list queries
 *   - Error codes surfaced as typed errors so the route can map to HTTP status
 *   - Missing NOTION_API_KEY → throws NOTION_NOT_CONFIGURED
 */

import { logger } from '../config/logger';

const NOTION_VERSION = '2022-06-28';
const NOTION_API = 'https://api.notion.com/v1';

export class NotionLeadsError extends Error {
  constructor(
    message: string,
    public readonly code: 'NOTION_RATE_LIMITED' | 'NOTION_NOT_CONFIGURED' | 'NOTION_API_ERROR',
  ) {
    super(message);
    this.name = 'NotionLeadsError';
  }
}

// ── Inline throttle (3 req/s = 1 req per 334ms) ──────────────────────────────

let _lastCallAt = 0;
const MIN_INTERVAL_MS = 334;

async function throttledDelay(): Promise<void> {
  const now = Date.now();
  const wait = _lastCallAt + MIN_INTERVAL_MS - now;
  if (wait > 0) await new Promise<void>((r) => setTimeout(r, wait));
  _lastCallAt = Date.now();
}

// ── Inline TTL cache (10-min, max 100 entries) ────────────────────────────────

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const _cache = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL_MS = 10 * 60 * 1000;
const CACHE_MAX = 100;

function cacheGet<T>(key: string): T | null {
  const entry = _cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    _cache.delete(key);
    return null;
  }
  return entry.value as T;
}

function cacheSet(key: string, value: unknown): void {
  if (_cache.size >= CACHE_MAX) {
    // Evict oldest entry
    const oldest = _cache.keys().next().value;
    if (oldest) _cache.delete(oldest);
  }
  _cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
}

export function invalidateAdayCache(): void {
  _cache.clear();
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AdayInput {
  name: string;
  email: string;
  company: string;
  revenueRange: '100M-300M USD' | '301M-500M USD' | '501M-1000M USD' | '+1000M USD';
  serviceInterest: string[];
  source: 'Discovery Call' | 'LinkedIn Wave' | 'Founder Letter' | 'Direct' | 'Referral';
  purchaseAuthority?: boolean;
  kvkkConsent: true;
}

export interface AdaySummary {
  id: string;
  name: string;
  company: string;
  status: string;
  revenueRange?: string;
  createdAt?: string;
}

export interface AdayListResult {
  results: AdaySummary[];
  hasMore: boolean;
  nextCursor: string | null;
}

export interface AdayCreateResult {
  id: string;
  status: string;
}

// ── Notion property builders ──────────────────────────────────────────────────

function titleProp(v: string) {
  return { title: [{ text: { content: v.slice(0, 2000) } }] };
}
function emailProp(v: string) {
  return { email: v };
}
function richTextProp(v: string) {
  return { rich_text: [{ text: { content: v.slice(0, 2000) } }] };
}
function selectProp(v: string) {
  return { select: { name: v } };
}
function multiSelectProp(vs: string[]) {
  return { multi_select: vs.map((n) => ({ name: n })) };
}
function checkboxProp(v: boolean) {
  return { checkbox: v };
}
function dateProp(iso: string) {
  return { date: { start: iso } };
}

// ── Core fetch wrapper ────────────────────────────────────────────────────────

async function notionFetch<T>(
  path: string,
  method: 'GET' | 'POST' | 'PATCH',
  body?: unknown,
): Promise<T> {
  const apiKey = process.env.NOTION_API_KEY ?? '';
  if (!apiKey) throw new NotionLeadsError('Notion not configured', 'NOTION_NOT_CONFIGURED');

  await throttledDelay();

  const res = await fetch(`${NOTION_API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(8_000),
  });

  if (res.status === 429) {
    throw new NotionLeadsError('Rate limited', 'NOTION_RATE_LIMITED');
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    logger.warn('[notion-leads] API error', { path, status: res.status, body: text.slice(0, 240) });
    throw new NotionLeadsError(`Notion API error ${res.status}`, 'NOTION_API_ERROR');
  }

  return (await res.json()) as T;
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function createAdayInNotion(input: AdayInput): Promise<AdayCreateResult> {
  const dbId = process.env.NOTION_LEADS_DB_ID ?? '';
  if (!dbId) throw new NotionLeadsError('Notion not configured', 'NOTION_NOT_CONFIGURED');

  const properties: Record<string, unknown> = {
    Name: titleProp(input.name),
    Email: emailProp(input.email),
    Company: richTextProp(input.company),
    'Revenue Range': selectProp(input.revenueRange),
    'Service Interest': multiSelectProp(input.serviceInterest),
    Source: selectProp(input.source),
    'KVKK Consent': checkboxProp(true),
    'Consent Timestamp': dateProp(new Date().toISOString()),
    Status: selectProp('New'),
  };

  if (input.purchaseAuthority !== undefined) {
    properties['Purchase Authority'] = checkboxProp(input.purchaseAuthority);
  }

  const page = await notionFetch<{ id: string }>(`/pages`, 'POST', {
    parent: { database_id: dbId },
    properties,
  });

  invalidateAdayCache();

  return { id: page.id, status: 'New' };
}

interface NotionQueryResult {
  results: Array<{
    id: string;
    properties: Record<string, unknown>;
    created_time?: string;
  }>;
  has_more: boolean;
  next_cursor: string | null;
}

function extractTitle(prop: unknown): string {
  const p = prop as { title?: Array<{ plain_text?: string }> } | null;
  return p?.title?.[0]?.plain_text ?? '';
}
function extractEmail(prop: unknown): string {
  const p = prop as { email?: string } | null;
  return p?.email ?? '';
}
function extractSelect(prop: unknown): string {
  const p = prop as { select?: { name?: string } } | null;
  return p?.select?.name ?? '';
}
function extractRichText(prop: unknown): string {
  const p = prop as { rich_text?: Array<{ plain_text?: string }> } | null;
  return p?.rich_text?.[0]?.plain_text ?? '';
}

export async function listAdaylarFromNotion(cursor?: string): Promise<AdayListResult> {
  const cacheKey = cursor ?? 'first-page';
  const cached = cacheGet<AdayListResult>(cacheKey);
  if (cached) return cached;

  const dbId = process.env.NOTION_LEADS_DB_ID ?? '';
  if (!dbId) throw new NotionLeadsError('Notion not configured', 'NOTION_NOT_CONFIGURED');

  const body: Record<string, unknown> = { page_size: 100 };
  if (cursor) body.start_cursor = cursor;

  const res = await notionFetch<NotionQueryResult>(`/databases/${dbId}/query`, 'POST', body);

  const result: AdayListResult = {
    results: res.results.map((page) => ({
      id: page.id,
      name: extractTitle(page.properties['Name']),
      company: extractRichText(page.properties['Company']),
      status: extractSelect(page.properties['Status']),
      revenueRange: extractSelect(page.properties['Revenue Range']),
      createdAt: page.created_time,
    })),
    hasMore: res.has_more,
    nextCursor: res.next_cursor,
  };

  cacheSet(cacheKey, result);
  return result;
}

export async function getAdayFromNotion(id: string): Promise<AdaySummary & { email: string }> {
  const page = await notionFetch<{
    id: string;
    properties: Record<string, unknown>;
    created_time?: string;
  }>(`/pages/${id}`, 'GET');

  return {
    id: page.id,
    name: extractTitle(page.properties['Name']),
    email: extractEmail(page.properties['Email']),
    company: extractRichText(page.properties['Company']),
    status: extractSelect(page.properties['Status']),
    revenueRange: extractSelect(page.properties['Revenue Range']),
    createdAt: page.created_time,
  };
}
