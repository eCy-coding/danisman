/**
 * scripts/generate-content.ts — Phase 20.5 R2
 *
 * Optional LLM-driven enrichment of `constants_generated.ts`.
 *
 * Behavior:
 *   - Without `OPENAI_API_KEY` (and/or `PEXELS_API_KEY`) the script logs and
 *     exits 0 — the inline fallback `constants_generated.ts` (committed during
 *     Phase 20.5 boot) keeps powering the homepage. **No file mutation.**
 *   - With both keys present, it generates 5 case studies + 5 blog posts in
 *     `legacy_types.{CaseStudy, BlogPost}` shape (bilingual `I18nString`),
 *     fetches landscape imagery from Pexels, and rewrites `constants_generated.ts`.
 *
 * Run: `npm run gen:content`
 */
import fs from 'node:fs';
import path from 'node:path';

import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), quiet: true });
dotenv.config({ quiet: true });

const OPENAI_KEY = process.env.OPENAI_API_KEY;
const PEXELS_KEY = process.env.PEXELS_API_KEY;
const MODEL = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';
const BASE_URL = process.env.OPENAI_BASE_URL;
const OUT_PATH = path.resolve(process.cwd(), 'constants_generated.ts');

type I18n = { tr: string; en: string };

interface GeneratedCaseStudy {
  id: string;
  client: string;
  sector: I18n;
  challenge: I18n;
  solution: I18n;
  result: I18n;
  description: I18n;
  image: string;
  category: I18n;
  slug: string;
}

interface GeneratedBlogPost {
  id: string;
  category: I18n;
  date: I18n;
  readTime: I18n;
  title: I18n;
  excerpt: I18n;
  image: string;
  slug: string;
}

const BLOG_TOPICS = [
  'Strategic Digital Transformation Playbook 2026',
  'The AI Revolution in Corporate Governance',
  'Strategies for Entering Global Markets',
  'The Lean-AI Convergence for Operational Excellence',
  'Boardroom Agility in an Era of Uncertainty',
];

const CASE_TOPICS = [
  'Global Retail Digital Transformation',
  'Fintech Market Entry Strategy',
  'Vertical SaaS Growth Engine',
  'Industrial IoT Transformation',
  'Hospital Network FHIR Consolidation',
];

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

async function fetchPexelsImage(query: string): Promise<string> {
  if (!PEXELS_KEY)
    return 'https://images.unsplash.com/photo-1556740758-90de374c12ad?auto=format&fit=crop&q=80&w=1200';
  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
      { headers: { Authorization: PEXELS_KEY } },
    );
    if (!res.ok) throw new Error(`Pexels HTTP ${res.status}`);
    const data = (await res.json()) as { photos?: Array<{ src?: { landscape?: string } }> };
    return data.photos?.[0]?.src?.landscape ?? 'https://via.placeholder.com/1200x675';
  } catch (err) {
    console.warn(`⚠️ Pexels fetch failed for "${query}":`, (err as Error).message);
    return 'https://via.placeholder.com/1200x675';
  }
}

async function callOpenAI(
  systemPrompt: string,
  userPrompt: string,
): Promise<Record<string, unknown>> {
  if (!OPENAI_KEY) throw new Error('OPENAI_API_KEY missing');
  const url = `${BASE_URL ?? 'https://api.openai.com/v1'}/chat/completions`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenAI HTTP ${res.status}: ${body.slice(0, 240)}`);
  }
  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const raw = data.choices?.[0]?.message?.content ?? '{}';
  return JSON.parse(raw) as Record<string, unknown>;
}

async function buildBlogPost(topic: string, idx: number): Promise<GeneratedBlogPost> {
  const json = await callOpenAI(
    'You are a senior consultant at eCyPro, a tier-1 boutique consulting firm. Output strict JSON with bilingual fields. Each bilingual field is an object {tr, en} of plain strings (no HTML).',
    `Topic: "${topic}". Return JSON: {"title":{"tr","en"},"category":{"tr","en"},"date":{"tr":"<TR human date>","en":"<EN human date>"},"readTime":{"tr":"X dk okuma","en":"X min read"},"excerpt":{"tr","en"}}.`,
  );
  const image = await fetchPexelsImage(topic);
  return {
    id: `bp-gen-${idx + 1}`,
    title: json.title as I18n,
    category: json.category as I18n,
    date: json.date as I18n,
    readTime: json.readTime as I18n,
    excerpt: json.excerpt as I18n,
    image,
    slug: slugify(topic),
  };
}

async function buildCaseStudy(topic: string, idx: number): Promise<GeneratedCaseStudy> {
  const json = await callOpenAI(
    'You are a senior consultant at eCyPro, writing a brief client case study. Output strict JSON with bilingual fields. Each bilingual field is {tr, en} plain strings.',
    `Topic: "${topic}". Return JSON: {"client":"<string>","sector":{"tr","en"},"challenge":{"tr","en"},"solution":{"tr","en"},"result":{"tr","en"},"description":{"tr","en"},"category":{"tr","en"}}.`,
  );
  const image = await fetchPexelsImage(topic);
  return {
    id: `cs-gen-${idx + 1}`,
    client: (json.client as string) ?? 'Confidential Client',
    sector: json.sector as I18n,
    challenge: json.challenge as I18n,
    solution: json.solution as I18n,
    result: json.result as I18n,
    description: json.description as I18n,
    image,
    category: json.category as I18n,
    slug: slugify(topic),
  };
}

function renderModule(blogs: GeneratedBlogPost[], cases: GeneratedCaseStudy[]): string {
  const banner = `/**
 * AUTO-GENERATED FILE — DO NOT EDIT MANUALLY.
 *
 * Generated by \`scripts/generate-content.ts\` at ${new Date().toISOString()}.
 * Regenerate with: \`npm run gen:content\` (requires OPENAI_API_KEY + PEXELS_API_KEY).
 */
import type { CaseStudy, BlogPost } from './src/types/legacy_types';\n\n`;

  return (
    banner +
    `export const GENERATED_CASE_STUDIES: CaseStudy[] = ${JSON.stringify(cases, null, 2)};\n\n` +
    `export const GENERATED_BLOG_POSTS: BlogPost[] = ${JSON.stringify(blogs, null, 2)};\n`
  );
}

async function sequential<T>(
  items: string[],
  fn: (item: string, idx: number) => Promise<T>,
  delayMs = 4200,
): Promise<T[]> {
  const results: T[] = [];
  for (const [i, item] of items.entries()) {
    if (i > 0) await new Promise((r) => setTimeout(r, delayMs));
    results.push(await fn(item, i));
  }
  return results;
}

async function main(): Promise<void> {
  if (!OPENAI_KEY) {
    console.log(
      'ℹ️  OPENAI_API_KEY missing — keeping the inline fallback `constants_generated.ts` unchanged.',
    );
    console.log(
      '   To regenerate, set OPENAI_API_KEY (and optionally PEXELS_API_KEY) and rerun `npm run gen:content`.',
    );
    return;
  }
  console.log('🚀 Generating bilingual content via OpenAI… (sequential, 4s delay between calls)');
  const blogs = await sequential(BLOG_TOPICS, buildBlogPost);
  const cases = await sequential(CASE_TOPICS, buildCaseStudy);
  fs.writeFileSync(OUT_PATH, renderModule(blogs, cases), 'utf8');
  console.log(`✅ Wrote ${blogs.length} blog posts + ${cases.length} case studies → ${OUT_PATH}`);
}

main().catch((err) => {
  console.error('❌ generate-content failed:', err);
  process.exitCode = 1;
});
