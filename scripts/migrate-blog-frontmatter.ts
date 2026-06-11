/**
 * One-shot frontmatter migration for the Perspektifler taxonomy (GATE-1).
 *
 * - Normalizes `category` via CATEGORY_MERGE_MAP (28 raw strings → 10 canonical).
 * - Normalizes `tags` via TAG_MERGE_MAP → canonical vocabulary slugs (≤5, deduped).
 * - `founder-notes` tag → format: 'founder-letter' (tag retired).
 * - Synthesizes YAML frontmatter for the 13 body-meta-only files (title from H1,
 *   excerpt from first paragraph, date from first git commit of the file).
 * - Marks the 4 newest posts (distinct categories) as featured.
 *
 * Body content below the frontmatter is preserved byte-for-byte.
 * Run: npx tsx scripts/migrate-blog-frontmatter.ts [--dry]
 */
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import {
  CATEGORY_BY_LABEL,
  CATEGORY_MERGE_MAP,
  TAG_MERGE_MAP,
  TAG_BY_SLUG,
  MAX_TAGS_PER_POST,
  MAX_FEATURED,
} from '../src/data/taxonomy';
import { foldForSearch } from '../src/lib/slugify';

const CONTENT_DIR = path.join(process.cwd(), 'src/content/blog');
const DRY = process.argv.includes('--dry');

interface Fm {
  [key: string]: string | string[] | boolean | undefined;
}

const FOLDED_TAG_MAP = new Map<string, string | null>();
for (const [raw, target] of Object.entries(TAG_MERGE_MAP)) {
  FOLDED_TAG_MAP.set(foldForSearch(raw), target);
}

function mapTag(raw: string): string | null {
  if (raw in TAG_MERGE_MAP) return TAG_MERGE_MAP[raw] ?? null;
  if (TAG_BY_SLUG[raw]) return raw;
  const folded = FOLDED_TAG_MAP.get(foldForSearch(raw));
  if (folded !== undefined) return folded;
  throw new Error(`Unmapped tag: "${raw}"`);
}

function mapCategory(raw: string): string {
  if (CATEGORY_BY_LABEL[raw]) return raw;
  const mapped = CATEGORY_MERGE_MAP[raw];
  if (mapped) return mapped;
  throw new Error(`Unmapped category: "${raw}"`);
}

function parseFm(content: string): { fm: Fm; body: string; hadFm: boolean } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { fm: {}, body: content, hadFm: false };
  const fm: Fm = {};
  for (const line of (match[1] ?? '').split('\n')) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if (
      (value.startsWith("'") && value.endsWith("'")) ||
      (value.startsWith('"') && value.endsWith('"'))
    ) {
      value = value.slice(1, -1);
    }
    if (value.startsWith('[') && value.endsWith(']')) {
      fm[key] = value
        .slice(1, -1)
        .split(',')
        .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
        .filter(Boolean);
    } else {
      fm[key] = value;
    }
  }
  return { fm, body: match[2] ?? '', hadFm: true };
}

function extractBodyMeta(body: string) {
  const title = body
    .match(/^\s*#\s+(.+?)\s*$/m)?.[1]
    ?.replace(/\*\*/g, '')
    .trim();
  const metaLine = body.split('\n').find((l) => /\*\*Kategori:/.test(l)) ?? '';
  const category = metaLine.match(/\*\*Kategori:\*\*\s*([^|]+)/)?.[1]?.trim();
  const readingTime = metaLine.match(/\*\*Okuma S[uü]resi:\*\*\s*([^|]+)/)?.[1]?.trim();
  const author = metaLine.match(/\*\*Yazar:\*\*\s*([^|]+)/)?.[1]?.trim();

  const lines = body.split('\n');
  let i = lines.findIndex((l) => /^\s*#\s/.test(l)) + 1;
  let excerpt = '';
  while (i < lines.length) {
    const line = (lines[i] ?? '').trim();
    i++;
    if (!line || /^---+$/.test(line) || /^\*\*Kategori:/.test(line) || /^[#>*-]/.test(line)) {
      continue;
    }
    excerpt = line.replace(/[*_`]/g, '').trim();
    break;
  }
  if (excerpt.length > 160) {
    excerpt = `${excerpt.slice(0, 157).replace(/\s+\S*$/, '')}…`;
  }
  return { title, category, readingTime, author, excerpt };
}

function gitFirstCommitDate(filePath: string): string {
  try {
    const out = execFileSync(
      'git',
      ['log', '--follow', '--format=%aI', '--reverse', '--', filePath],
      { encoding: 'utf-8' },
    ).trim();
    const first = out.split('\n')[0];
    if (first) return first.slice(0, 10);
  } catch {
    /* fall through */
  }
  return '2026-01-01';
}

function yamlValue(v: string | string[] | boolean): string {
  if (Array.isArray(v)) return `[${v.map((s) => `'${s.replace(/'/g, "''")}'`).join(', ')}]`;
  if (typeof v === 'boolean') return String(v);
  return `'${v.replace(/'/g, "''")}'`;
}

function serializeFm(fm: Fm): string {
  const order = [
    'title',
    'excerpt',
    'date',
    'updated',
    'author',
    'coverImage',
    'category',
    'tags',
    'format',
    'featured',
    'readingTime',
    'lang',
    'pair_id',
    'series_id',
    'status',
  ];
  const keys = [
    ...order.filter((k) => fm[k] !== undefined),
    ...Object.keys(fm).filter((k) => !order.includes(k)),
  ];
  const lines = keys.map((k) => `${k}: ${yamlValue(fm[k] as string | string[] | boolean)}`);
  return `---\n${lines.join('\n')}\n---\n`;
}

const files = fs
  .readdirSync(CONTENT_DIR)
  .filter((f) => f.endsWith('.mdx'))
  .sort();

interface Result {
  file: string;
  fm: Fm;
  body: string;
  date: string;
  category: string;
}
const results: Result[] = [];
const report: string[] = [];

for (const file of files) {
  const filePath = path.join(CONTENT_DIR, file);
  const raw = fs.readFileSync(filePath, 'utf-8');
  const { fm, body, hadFm } = parseFm(raw);
  const meta = extractBodyMeta(hadFm ? body : raw);

  const rawCategory = (fm.category as string) || meta.category;
  if (!rawCategory) throw new Error(`${file}: no category in frontmatter or body meta`);
  const category = mapCategory(rawCategory);

  const rawTags = (fm.tags as string[]) || [];
  const mapped = rawTags.map((t) => ({ raw: t, slug: mapTag(t) }));
  const isFounderLetter = mapped.some((m) => m.raw === 'founder-notes');
  const tags = [...new Set(mapped.map((m) => m.slug).filter((s): s is string => s !== null))].slice(
    0,
    MAX_TAGS_PER_POST,
  );

  const next: Fm = {
    title: (fm.title as string) || meta.title || 'Untitled',
    excerpt: (fm.excerpt as string) || meta.excerpt || '',
    date: (fm.date as string) || gitFirstCommitDate(filePath),
    author: (fm.author as string) || meta.author || 'eCyPro Analiz Ekibi',
    coverImage: (fm.coverImage as string) || undefined,
    category,
    tags,
    format: isFounderLetter ? 'founder-letter' : 'makale',
    readingTime: (fm.readingTime as string) || meta.readingTime || undefined,
    lang: (fm.lang as string) || 'tr',
    status: (fm.status as string) || 'published',
  };

  const changes: string[] = [];
  if (!hadFm) changes.push('frontmatter synthesized');
  if (rawCategory !== category) changes.push(`category "${rawCategory}" → "${category}"`);
  const tagDelta = rawTags.filter((t) => !tags.includes(t));
  if (tagDelta.length) changes.push(`tags [${tagDelta.join(', ')}] → [${tags.join(', ')}]`);
  if (changes.length) report.push(`${file}: ${changes.join(' · ')}`);

  results.push({ file, fm: next, body: hadFm ? body : raw, date: next.date as string, category });
}

// Featured: newest 4 across distinct categories.
const byDate = [...results].sort((a, b) => b.date.localeCompare(a.date));
const seenCats = new Set<string>();
let featuredCount = 0;
for (const r of byDate) {
  if (featuredCount >= MAX_FEATURED) break;
  if (seenCats.has(r.category)) continue;
  seenCats.add(r.category);
  r.fm.featured = true;
  featuredCount++;
}

for (const r of results) {
  const out = serializeFm(r.fm) + '\n' + r.body.replace(/^\n+/, '');
  if (!DRY) fs.writeFileSync(path.join(CONTENT_DIR, r.file), out);
}

console.log(report.join('\n'));
console.log(
  `\n${DRY ? '[DRY] ' : ''}migrated ${results.length} files · ${report.length} changed · featured=${featuredCount}`,
);
