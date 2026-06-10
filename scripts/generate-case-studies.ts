import fs from 'fs';
import path from 'path';
import { marked } from 'marked';

/**
 * Build-time case-study index generator (mirrors generate-blog-index.ts).
 *
 * Reads every `src/content/case-studies/<slug>/index.mdoc` (Keystatic's
 * YAML-frontmatter + Markdown document format), converts the body to HTML
 * via `marked`, and emits `src/data/case-studies.json` shaped as the
 * `CaseStudy` interface. The runtime loader (`getCaseStudies` in
 * `src/lib/data.ts`) reads this JSON and merges it over the legacy mock so
 * real, editor-authored content (Keystatic) renders instead of placeholders.
 */

const CONTENT_DIR = path.join(process.cwd(), 'src/content/case-studies');
const OUTPUT_FILE = path.join(process.cwd(), 'src/data/case-studies.json');

interface CaseStudyRecord {
  slug: string;
  title: string;
  client: string;
  industry: string;
  result: string;
  image?: string;
  content: string;
  duration?: string;
  goLive?: string;
  challenge?: string;
}

// Minimal YAML-frontmatter parser — identical strategy to the blog index
// generator (scripts/generate-blog-index.ts) so behaviour stays consistent.
const parseFrontmatter = (raw: string): { data: Record<string, string>; body: string } => {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { data: {}, body: raw };
  const data: Record<string, string> = {};
  (match[1] || '').split('\n').forEach((line) => {
    const idx = line.indexOf(':');
    if (idx === -1) return;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (key) data[key] = value;
  });
  return { data, body: match[2] || '' };
};

const generateCaseStudyIndex = async (): Promise<void> => {
  if (!fs.existsSync(CONTENT_DIR)) {
    fs.mkdirSync(CONTENT_DIR, { recursive: true });
  }

  // Each case study is a directory containing an `index.mdoc` document.
  const slugs = fs
    .readdirSync(CONTENT_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  const records: CaseStudyRecord[] = [];
  for (const slug of slugs) {
    const file = path.join(CONTENT_DIR, slug, 'index.mdoc');
    if (!fs.existsSync(file)) continue;
    const { data, body } = parseFrontmatter(fs.readFileSync(file, 'utf-8'));
    const html = (await marked.parse(body.trim())).toString();
    records.push({
      slug,
      title: data.title || slug,
      client: data.client || 'Anonymized client',
      industry: data.industry || 'General',
      result: data.result || '',
      content: html,
      ...(data.image ? { image: data.image } : {}),
      ...(data.duration ? { duration: data.duration } : {}),
      ...(data.goLive ? { goLive: data.goLive } : {}),
      ...(data.challenge ? { challenge: data.challenge } : {}),
    });
  }

  records.sort((a, b) => a.slug.localeCompare(b.slug));

  if (!fs.existsSync(path.dirname(OUTPUT_FILE))) {
    fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  }
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(records, null, 2) + '\n');
  console.log(`✅ Generated case-study index with ${records.length} entries at ${OUTPUT_FILE}`);
};

generateCaseStudyIndex().catch((error) => {
  console.error('❌ Error generating case-study index:', error);
  process.exit(1);
});
