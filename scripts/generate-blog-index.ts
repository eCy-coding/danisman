/**
 * Blog index generator — Perspektifler taxonomy edition (GATE-1).
 *
 * Reads src/content/blog/*.mdx, validates every category/tag against the
 * controlled vocabulary in src/data/taxonomy.ts and FAILS the build on any
 * unmapped value (no silent fallback — istek.md v2 §PHASE 1). Emits:
 *   - src/data/blog-posts.json   (full card metadata, date-desc)
 *   - src/data/search-index.json (lean fields for the client search module)
 */
import fs from 'fs';
import path from 'path';
import {
  CATEGORY_BY_LABEL,
  CATEGORY_MERGE_MAP,
  TAG_BY_SLUG,
  TAG_MERGE_MAP,
  MAX_TAGS_PER_POST,
  MAX_FEATURED,
} from '../src/data/taxonomy';
import { foldForSearch } from '../src/lib/slugify';

const CONTENT_DIR = path.join(process.cwd(), 'src/content/blog');
const OUTPUT_FILE = path.join(process.cwd(), 'src/data/blog-posts.json');
const SEARCH_INDEX_FILE = path.join(process.cwd(), 'src/data/search-index.json');
const WPM = 200;

interface BlogPostMetadata {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  updated?: string;
  author: string;
  coverImage?: string;
  category: string;
  categorySlug: string;
  tags: string[];
  readingTime: string;
  readTimeMin: number;
  wordCount: number;
  lang: 'tr' | 'en';
  format: 'makale' | 'vaka-analizi' | 'rapor' | 'arastirma' | 'founder-letter';
  featured: boolean;
  pairId?: string;
  seriesId?: string;
}

if (!fs.existsSync(CONTENT_DIR)) {
  console.log(`Creating content directory: ${CONTENT_DIR}`);
  fs.mkdirSync(CONTENT_DIR, { recursive: true });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const parseFrontmatter = (content: string): { data: any; content: string } => {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    return { data: {}, content };
  }

  const frontmatterRaw = match[1];
  const body = match[2];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = {};

  (frontmatterRaw || '').split('\n').forEach((line) => {
    const idx = line.indexOf(':');
    if (idx === -1) return;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1).replace(/''/g, "'");
    }
    if (value.startsWith('[') && value.endsWith(']')) {
      data[key] = value
        .slice(1, -1)
        .split(',')
        .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
        .filter(Boolean);
    } else {
      data[key] = value;
    }
  });

  return { data, content: body || '' };
};

const FOLDED_TAG_MAP = new Map<string, string | null>();
for (const [raw, target] of Object.entries(TAG_MERGE_MAP)) {
  FOLDED_TAG_MAP.set(foldForSearch(raw), target);
}

const errors: string[] = [];

const resolveTag = (file: string, raw: string): string | null => {
  if (TAG_BY_SLUG[raw]) return raw;
  if (raw in TAG_MERGE_MAP) return TAG_MERGE_MAP[raw] ?? null;
  const folded = FOLDED_TAG_MAP.get(foldForSearch(raw));
  if (folded !== undefined) return folded;
  errors.push(`${file}: unmapped tag "${raw}" — add it to TAG_MERGE_MAP or the vocabulary`);
  return null;
};

const resolveCategory = (file: string, raw: string | undefined): string | undefined => {
  if (!raw) {
    errors.push(`${file}: missing category`);
    return undefined;
  }
  if (CATEGORY_BY_LABEL[raw]) return raw;
  const mapped = CATEGORY_MERGE_MAP[raw];
  if (mapped) return mapped;
  errors.push(`${file}: unmapped category "${raw}" — add it to CATEGORY_MERGE_MAP`);
  return undefined;
};

const countWords = (body: string): number => body.split(/\s+/).filter(Boolean).length;

const generateBlogIndex = () => {
  const files = fs.readdirSync(CONTENT_DIR).filter((file) => file.endsWith('.mdx'));

  const posts: BlogPostMetadata[] = [];

  for (const filename of files) {
    const filePath = path.join(CONTENT_DIR, filename);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const { data, content: body } = parseFrontmatter(fileContent);
    const slug = filename.replace('.mdx', '');

    if (!data.title) errors.push(`${filename}: missing title`);
    if (!data.date) errors.push(`${filename}: missing date`);

    const category = resolveCategory(filename, data.category);
    const categoryDef = category ? CATEGORY_BY_LABEL[category] : undefined;

    const rawTags: string[] = Array.isArray(data.tags) ? data.tags : [];
    const tags = [
      ...new Set(
        rawTags.map((t) => resolveTag(filename, t)).filter((t): t is string => t !== null),
      ),
    ];
    if (tags.length > MAX_TAGS_PER_POST) {
      errors.push(`${filename}: ${tags.length} tags > max ${MAX_TAGS_PER_POST}`);
    }

    const format = (data.format as BlogPostMetadata['format']) || 'makale';
    if (!['makale', 'vaka-analizi', 'rapor', 'arastirma', 'founder-letter'].includes(format)) {
      errors.push(`${filename}: invalid format "${format}"`);
    }

    const wordCount = countWords(body);
    const readTimeMin = Math.max(1, Math.round(wordCount / WPM));

    posts.push({
      slug,
      title: data.title || 'Untitled',
      excerpt: data.excerpt || '',
      date: data.date ? new Date(data.date).toISOString() : new Date(0).toISOString(),
      updated: data.updated || undefined,
      author: data.author || 'eCyPro Analiz Ekibi',
      coverImage: data.coverImage || '/images/blog-default.jpg',
      category: category ?? 'Strateji',
      categorySlug: categoryDef?.slug ?? 'strateji',
      tags,
      readingTime: `${readTimeMin} dk okuma`,
      readTimeMin,
      wordCount,
      lang: (data.lang as 'tr' | 'en') || 'tr',
      format,
      featured: data.featured === true || data.featured === 'true',
      pairId: data.pair_id || undefined,
      seriesId: data.series_id || undefined,
    });
  }

  const featuredCount = posts.filter((p) => p.featured).length;
  if (featuredCount > MAX_FEATURED) {
    errors.push(`featured=${featuredCount} exceeds max ${MAX_FEATURED}`);
  }

  if (errors.length) {
    console.error(`❌ Taxonomy violations (${errors.length}):`);
    for (const e of errors) console.error(`   - ${e}`);
    process.exit(1);
  }

  posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (!fs.existsSync(path.dirname(OUTPUT_FILE))) {
    fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(posts, null, 2));

  const searchIndex = posts.map((p) => ({
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    tags: p.tags,
    tagLabels: p.tags.map((t) => TAG_BY_SLUG[t]?.labelTr ?? t),
    category: p.category,
    categorySlug: p.categorySlug,
    format: p.format,
    lang: p.lang,
    date: p.date.slice(0, 10),
    readTimeMin: p.readTimeMin,
  }));
  fs.writeFileSync(SEARCH_INDEX_FILE, JSON.stringify(searchIndex));

  console.log(`✅ Generated blog index with ${posts.length} posts at ${OUTPUT_FILE}`);
  console.log(`✅ Generated search index (${searchIndex.length} docs) at ${SEARCH_INDEX_FILE}`);
};

try {
  generateBlogIndex();
} catch (error) {
  console.error('❌ Error generating blog index:', error);
  process.exit(1);
}
