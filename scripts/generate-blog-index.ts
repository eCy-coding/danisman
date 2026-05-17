 
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONTENT_DIR = path.join(process.cwd(), 'src/content/blog');
const OUTPUT_FILE = path.join(process.cwd(), 'src/data/blog-posts.json');

interface BlogPostMetadata {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  author: string;
  coverImage?: string;
  category?: string;
  tags: string[];
  readingTime: string;
}

if (!fs.existsSync(CONTENT_DIR)) {
  console.log('Creating content directory: ' + CONTENT_DIR);
  fs.mkdirSync(CONTENT_DIR, { recursive: true });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const parseFrontmatter = (content: string): { data: any, content: string } => {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    return { data: {}, content };
  }
  const frontmatterRaw = match[1];
  const body = match[2];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = {};
  (frontmatterRaw || '').split('\n').forEach(line => {
    const [key, ...valueParts] = line.split(':');
    if (key && valueParts.length > 0) {
      let value = valueParts.join(':').trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (value.startsWith('[') && value.endsWith(']')) {
        data[key.trim()] = value.slice(1, -1).split(',').map(s => s.trim().replace(/^['"]|['"]$/g, ''));
      } else {
        data[key.trim()] = value.replace(/^['"]|['"]$/g, '');
      }
    }
  });
  return { data, content: body || '' };
};

// P45: Title / excerpt fallbacks parsed directly from the MDX body when the
// YAML frontmatter is absent. Most posts use a # H1 opening line and a
// **Kategori:** ... | **Okuma Suresi:** N dk | **Yazar:** ... metadata strip.
const extractFromBody = (body: string) => {
  const titleMatch = body.match(/^\s*#\s+(.+?)\s*$/m);
  const title = titleMatch?.[1]?.replace(/\*\*/g, '').trim();
  const lines = body.split('\n');
  let i = 0;
  while (i < lines.length && !/^\s*#\s/.test(lines[i] ?? '')) i++;
  i++;
  let excerpt = '';
  while (i < lines.length) {
    const line = (lines[i] ?? '').trim();
    i++;
    if (!line) continue;
    if (/^---+$/.test(line)) continue;
    if (/^\*\*Kategori:|^\*\*Okuma|^\*\*Yazar:/.test(line)) continue;
    if (/^[#>*\-]/.test(line)) continue;
    excerpt = line.replace(/[*_`]/g, '').slice(0, 220);
    break;
  }
  const metaLine = lines.find((l) => /\*\*Kategori:/.test(l)) ?? '';
  const category = metaLine.match(/\*\*Kategori:\*\*\s*([^|]+)/)?.[1]?.trim();
  const readingTime = metaLine.match(/\*\*Okuma S[uü]resi:\*\*\s*([^|]+)/)?.[1]?.trim();
  const author = metaLine.match(/\*\*Yazar:\*\*\s*([^|]+)/)?.[1]?.trim();
  return { title, excerpt, category, readingTime, author };
};

const generateBlogIndex = () => {
  const files = fs.readdirSync(CONTENT_DIR).filter(file => file.endsWith('.mdx'));
  const posts: BlogPostMetadata[] = files.map(filename => {
    const filePath = path.join(CONTENT_DIR, filename);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const { data, content: body } = parseFrontmatter(fileContent);
    const slug = filename.replace('.mdx', '');
    const fallback = extractFromBody(body || fileContent);
    return {
      slug,
      title: data.title || fallback.title || 'Untitled',
      excerpt: data.excerpt || fallback.excerpt || '',
      date: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
      author: data.author || fallback.author || 'EcyPro Analiz Ekibi',
      coverImage: data.coverImage || '/images/blog-default.jpg',
      category: data.category || fallback.category || undefined,
      tags: data.tags || [],
      readingTime: data.readingTime || fallback.readingTime || '5 dk okuma',
    };
  });
  posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  if (!fs.existsSync(path.dirname(OUTPUT_FILE))) {
    fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  }
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(posts, null, 2));
  console.log('Generated blog index with ' + posts.length + ' posts at ' + OUTPUT_FILE);
};

try {
  generateBlogIndex();
} catch (error) {
  console.error('Error generating blog index:', error);
  process.exit(1);
}
