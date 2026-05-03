
import fs from 'fs';
import path from 'path';

const DOMAIN = 'https://ecypro.com';
const ROUTES = [
  '/',
  '/about',
  '/services',
  '/case-studies',
  '/contact',
  '/privacy',
  '/terms'
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${ROUTES.map(route => `
  <url>
    <loc>${DOMAIN}${route}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${route === '/' ? '1.0' : '0.8'}</priority>
  </url>
  `).join('')}
</urlset>`;

const publicDir = path.resolve(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
}
fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemap);
console.log('✅ Sitemap generated at public/sitemap.xml');
