 
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BLOG_DATA_PATH = path.resolve(__dirname, '../src/data/blog-posts.json');
const OUTPUT_DIR = path.resolve(__dirname, '../public');
const SITE_URL = 'https://www.ecypro.com';

const escapeXml = (unsafe: string) => {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
};

interface Post {
  title: string;
  slug: string;
  date: string;
  excerpt: string;
  author: string;
}

const generateRSS = () => {
    console.log('📰 Generating RSS Feed...');

    if (!fs.existsSync(BLOG_DATA_PATH)) {
        console.warn('⚠️ Blog data not found. Skipping RSS generation.');
        return;
    }

    const posts = JSON.parse(fs.readFileSync(BLOG_DATA_PATH, 'utf-8')) as Post[];

    let rss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
    <title>EcyPro Premium Consulting Blog</title>
    <link>${SITE_URL}</link>
    <description>Insights on Strategic Management, Digital Transformation, and Corporate Leadership.</description>
    <language>tr</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
`;

    posts.forEach((post) => {
        rss += `
    <item>
        <title>${escapeXml(post.title)}</title>
        <link>${SITE_URL}/blog/${post.slug}</link>
        <guid>${SITE_URL}/blog/${post.slug}</guid>
        <pubDate>${new Date(post.date).toUTCString()}</pubDate>
        <description>${escapeXml(post.excerpt)}</description>
        <author>info@ecypro.com (${post.author})</author>
    </item>`;
    });

    rss += `
</channel>
</rss>`;

    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    fs.writeFileSync(path.join(OUTPUT_DIR, 'rss.xml'), rss);
    console.log(`✅ RSS Feed generated at public/rss.xml with ${posts.length} items.`);
};

try {
    generateRSS();
} catch (error) {
    console.error('❌ Error generating RSS feed:', error);
}
