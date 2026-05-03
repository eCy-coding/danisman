 
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
  /** Phase 20 B3: single primary category. */
  category?: string;
  tags: string[];
  readingTime: string;
}

if (!fs.existsSync(CONTENT_DIR)) {
  console.log(`Creating content directory: ${CONTENT_DIR}`);
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
      // Remove wrapping quotes if present (supports '...' and "...")
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      // Handle array syntax [a, b] fairly simply
      if (value.startsWith('[') && value.endsWith(']')) {
         data[key.trim()] = value
          .slice(1, -1)
          .split(',')
          .map(s => s.trim().replace(/^['"]|['"]$/g, ''));
      } else {
         data[key.trim()] = value.replace(/^['"]|['"]$/g, '');
      }
    }
  });
  
  return { data, content: body || '' };
};

const generateBlogIndex = () => {
  const files = fs.readdirSync(CONTENT_DIR).filter(file => file.endsWith('.mdx'));
  
  const posts: BlogPostMetadata[] = files.map(filename => {
    const filePath = path.join(CONTENT_DIR, filename);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const { data } = parseFrontmatter(fileContent);
    const slug = filename.replace('.mdx', '');

    return {
      slug,
      title: data.title || 'Untitled',
      excerpt: data.excerpt || '',
      date: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
      author: data.author || 'EcyPro Team',
      coverImage: data.coverImage || '/images/blog-default.jpg',
      category: data.category || undefined,
      tags: data.tags || [],
      readingTime: data.readingTime || '5 min read',
    };
  });

  // Sort by date descending
  posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (!fs.existsSync(path.dirname(OUTPUT_FILE))) {
    fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(posts, null, 2));
  console.log(`✅ Generated blog index with ${posts.length} posts at ${OUTPUT_FILE}`);
};

try {
  generateBlogIndex();
} catch (error) {
  console.error('❌ Error generating blog index:', error);
  process.exit(1);
}

