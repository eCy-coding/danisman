import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BLOG_DATA_PATH = path.resolve(__dirname, '../src/data/blog-posts.json');
const OUTPUT_DIR = path.resolve(__dirname, '../public');
const SITE_URL = 'https://ecypro.com';

const escapeXml = (unsafe: string) => {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case "'":
        return '&apos;';
      case '"':
        return '&quot;';
      default:
        return c;
    }
  });
};

interface Post {
  title: string;
  slug: string;
  date: string;
  excerpt: string;
  author: string;
  /** EN article-parity mechanism: 'tr' (default) or 'en'. */
  lang?: string;
}

/** Renders one RSS 2.0 feed document for a language partition. */
const renderFeed = (posts: Post[], lang: 'tr' | 'en', selfPath: string): string => {
  const description =
    lang === 'en'
      ? 'Insights on Strategic Management, Digital Transformation, and Corporate Leadership.'
      : 'Strateji, dijital dönüşüm ve kurumsal liderlik üzerine eCyPro içgörüleri.';
  const articleBase = lang === 'en' ? `${SITE_URL}/en/perspektifler` : `${SITE_URL}/perspektifler`;

  let rss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
    <title>eCyPro Premium Consulting Blog</title>
    <link>${SITE_URL}</link>
    <description>${description}</description>
    <language>${lang}</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}${selfPath}" rel="self" type="application/rss+xml" />
`;

  posts.forEach((post) => {
    rss += `
    <item>
        <title>${escapeXml(post.title)}</title>
        <link>${articleBase}/${post.slug}</link>
        <guid>${articleBase}/${post.slug}</guid>
        <pubDate>${new Date(post.date).toUTCString()}</pubDate>
        <description>${escapeXml(post.excerpt)}</description>
        <author>info@ecypro.com (${post.author})</author>
    </item>`;
  });

  rss += `
</channel>
</rss>`;
  return rss;
};

const generateRSS = () => {
  console.log('📰 Generating RSS Feed...');

  if (!fs.existsSync(BLOG_DATA_PATH)) {
    console.warn('⚠️ Blog data not found. Skipping RSS generation.');
    return;
  }

  const allPosts = JSON.parse(fs.readFileSync(BLOG_DATA_PATH, 'utf-8')) as Post[];
  // EN article-parity mechanism: public/rss.xml stays the TR feed; EN posts
  // get their own public/en/rss.xml below.
  const trPosts = allPosts.filter((p) => p.lang !== 'en');
  const enPosts = allPosts.filter((p) => p.lang === 'en');

  const rss = renderFeed(trPosts, 'tr', '/rss.xml');

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  fs.writeFileSync(path.join(OUTPUT_DIR, 'rss.xml'), rss);
  console.log(`✅ RSS Feed generated at public/rss.xml with ${trPosts.length} items.`);

  // Track C #1 — Mirror to dist/ when present so the postbuild output
  // reflects the latest content. Vite's static copy stage runs before
  // postbuild, so without this mirror dist/rss.xml stays at the pre-
  // regeneration snapshot and ships stale brand casing.
  const DIST_DIR = path.resolve(__dirname, '../dist');
  if (fs.existsSync(DIST_DIR)) {
    fs.writeFileSync(path.join(DIST_DIR, 'rss.xml'), rss);
    console.log(`✅ RSS Feed mirrored to dist/rss.xml.`);
  }

  // EN feed — emitted ONLY when at least one EN post exists (no empty
  // placeholder file while the EN corpus is still in progress). The old
  // committed public/en/insights/rss.xml artifact (dead file, no generator)
  // was deleted with this change; public/en/rss.xml is its live successor.
  if (enPosts.length > 0) {
    const enRss = renderFeed(enPosts, 'en', '/en/rss.xml');
    const EN_DIR = path.join(OUTPUT_DIR, 'en');
    if (!fs.existsSync(EN_DIR)) fs.mkdirSync(EN_DIR, { recursive: true });
    fs.writeFileSync(path.join(EN_DIR, 'rss.xml'), enRss);
    console.log(`✅ EN RSS Feed generated at public/en/rss.xml with ${enPosts.length} items.`);
    if (fs.existsSync(DIST_DIR)) {
      const DIST_EN_DIR = path.join(DIST_DIR, 'en');
      if (!fs.existsSync(DIST_EN_DIR)) fs.mkdirSync(DIST_EN_DIR, { recursive: true });
      fs.writeFileSync(path.join(DIST_EN_DIR, 'rss.xml'), enRss);
      console.log(`✅ EN RSS Feed mirrored to dist/en/rss.xml.`);
    }
  } else {
    console.log('ℹ️  No EN posts yet — public/en/rss.xml not emitted (by design).');
  }
};

// Wave-3A: Insights RSS feeds (full + per-domain).
// Reads stub data today; replace with live Prisma query when Wave-1 merges.
try {
  generateRSS();
} catch (error) {
  console.error('❌ Error generating RSS feed:', error);
}
