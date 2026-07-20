import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { SERVICES } from '../src/data/services';
import { SERVICE_DEPARTMENTS } from '../src/data/service-taxonomy';

/**
 * scripts/generate-llms-txt.ts — GEO (Generative Engine Optimization)
 *
 * Produces public/llms.txt per the llms.txt standard (https://llmstxt.org):
 *   H1 title → blockquote summary → `## Section` link lists.
 *
 * Every link + description below is derived from data that already ships
 * on the site (mirrors the scripts/generate-sitemap.ts pattern so the two
 * files can never drift):
 *   - src/data/services.ts          → real service pages (title/description/link)
 *   - src/data/service-taxonomy.ts  → department grouping labels
 *   - src/data/blog-posts.json      → real published Perspektifler articles
 *
 * No page or fact is invented here. The summary paragraph reuses the
 * verbatim root `index.html` meta description (the site's own vetted
 * self-description) instead of freehand marketing copy.
 *
 * Runs in the postbuild chain (package.json) right after gen:sitemap so it
 * stays fresh as services/articles are added.
 */

const BASE_URL = 'https://ecypro.com';

interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  lang?: 'tr' | 'en';
  date: string;
}

function truncate(s: string, max: number): string {
  const clean = s.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trimEnd()}…`;
}

async function generateLlmsTxt() {
  console.log('🤖 Generating llms.txt (GEO)...');

  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const rootDir = path.resolve(__dirname, '..');
  const publicDir = path.resolve(rootDir, 'public');

  // Reuse the root index.html meta description — the single vetted
  // "what is eCyPro" sentence already published on every page as a
  // fallback. Regex-parsed (no runtime import) to match the
  // generate-sitemap.ts convention.
  const rootIndexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf-8');
  const descMatch = rootIndexHtml.match(/name="description"\s+content="([^"]+)"/);
  const summary = descMatch
    ? descMatch[1]
    : 'eCyPro Premium Consulting — stratejik danışmanlık ve KVKK/AB regülasyon uyumu.';

  // ─── Kurumsal (core pages) ─────────────────────────────────
  // Mirrors the STATIC_ROUTES set already declared canonical by
  // scripts/generate-sitemap.ts — only the subset a GEO crawler benefits
  // from having a one-line description for.
  const CORE_PAGES: Array<{ path: string; title: string; desc: string }> = [
    {
      path: 'about',
      title: 'Hakkımızda',
      desc: 'eCyPro Premium Consulting kuruluş vizyonu, metodoloji ve pratik alanları.',
    },
    {
      path: 'services',
      title: 'Hizmetler',
      desc: 'M&A, ESG, Fintech, aile şirketi, insan & organizasyon, risk & kamu, büyüme & operasyon hizmet kataloğu.',
    },
    {
      path: 'methodology',
      title: 'Metodoloji',
      desc: 'Danışmanlık engagement sürecinin adımları ve çalışma modeli.',
    },
    {
      path: 'pricing',
      title: 'Fiyatlandırma',
      desc: 'Starter, Growth, Enterprise paket yaklaşımı ve fiyatlandırma hesaplayıcısı.',
    },
    {
      path: 'case-studies',
      title: 'Vaka Çalışmaları',
      desc: 'Tamamlanan proje ve engagement özetleri.',
    },
    {
      path: 'team',
      title: 'Ekip',
      desc: 'Liderlik kadrosu.',
    },
    {
      path: 'partners',
      title: 'Ortaklıklar',
      desc: 'Teknoloji, hukuk ve akademik kurumlarla stratejik iş birliği ağı.',
    },
    {
      path: 'industries',
      title: 'Sektörler',
      desc: 'Üretim, finans, perakende, teknoloji, ilaç-sağlık sektör çözümleri.',
    },
    {
      path: 'faq',
      title: 'Sıkça Sorulan Sorular',
      desc: 'Engagement modeli, kapsam ve süreç hakkında sık sorulan sorular.',
    },
    {
      path: 'contact',
      title: 'İletişim',
      desc: 'Ücretsiz strateji görüşmesi talebi ve iletişim kanalları.',
    },
    {
      path: 'privacy',
      title: 'Gizlilik Politikası',
      desc: 'KVKK/GDPR kapsamında kişisel veri işleme politikası.',
    },
    {
      path: 'privacy/data-rights',
      title: 'KVKK m.11 Haklar',
      desc: 'Kişisel veri sahibi başvuru ve haklar süreci.',
    },
    {
      path: 'perspektifler',
      title: 'Perspektifler',
      desc: 'Strateji, yapay zeka, finans, ESG ve liderlik üzerine makale merkezi.',
    },
  ];

  let out = `# eCyPro Premium Consulting\n\n> ${summary}\n\n`;

  out += `## Kurumsal\n`;
  for (const p of CORE_PAGES) {
    out += `- [${p.title}](${BASE_URL}/${p.path}): ${p.desc}\n`;
  }
  out += `\n`;

  // ─── Hizmetler — grouped by department, sourced from SERVICES ─
  for (const dept of SERVICE_DEPARTMENTS) {
    const items = SERVICES.filter((s) => s.category === dept.id);
    if (items.length === 0) continue;
    out += `## Hizmetler · ${dept.label.tr}\n`;
    for (const s of items) {
      out += `- [${s.title}](${BASE_URL}${s.link}): ${truncate(s.description, 160)}\n`;
    }
    out += `\n`;
  }

  // ─── Makaleler (Perspektifler) — sourced from blog-posts.json ─
  const blogDataPath = path.resolve(rootDir, 'src/data/blog-posts.json');
  if (fs.existsSync(blogDataPath)) {
    const posts = JSON.parse(fs.readFileSync(blogDataPath, 'utf-8')) as BlogPost[];
    const trPosts = posts
      .filter((p) => (p.lang ?? 'tr') === 'tr')
      .sort((a, b) => (a.date < b.date ? 1 : -1));
    const enPosts = posts.filter((p) => p.lang === 'en').sort((a, b) => (a.date < b.date ? 1 : -1));

    if (trPosts.length > 0) {
      out += `## Makaleler (Perspektifler — TR)\n`;
      for (const p of trPosts) {
        out += `- [${p.title}](${BASE_URL}/perspektifler/${p.slug}): ${truncate(p.excerpt, 160)}\n`;
      }
      out += `\n`;
    }
    if (enPosts.length > 0) {
      out += `## Articles (Perspektifler — EN)\n`;
      for (const p of enPosts) {
        out += `- [${p.title}](${BASE_URL}/en/perspektifler/${p.slug}): ${truncate(p.excerpt, 160)}\n`;
      }
      out += `\n`;
    }
  }

  out += `## Optional\n`;
  out += `- [Sitemap](${BASE_URL}/sitemap-index.xml): Tüm sayfaların makine-okunur URL indeksi.\n`;
  out += `- [robots.txt](${BASE_URL}/robots.txt): Tarayıcı erişim politikası (AI ajanları dahil).\n`;

  fs.writeFileSync(path.join(publicDir, 'llms.txt'), out);
  const distDir = path.resolve(rootDir, 'dist');
  if (fs.existsSync(distDir)) {
    fs.copyFileSync(path.join(publicDir, 'llms.txt'), path.join(distDir, 'llms.txt'));
  }

  console.log(`✅ llms.txt generated at public/llms.txt (${out.length} bytes).`);
}

generateLlmsTxt().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
