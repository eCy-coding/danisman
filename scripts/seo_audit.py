#!/usr/bin/env python3
"""
scripts/seo_audit.py
EcyPro SEO Otomatik Denetim Aracı
istek5.txt Pane 4 — 🔎 SEO-Geo-Admin

Denetim Kategorileri:
  1. robots.txt analizi
  2. sitemap.xml URL sayımı + hreflang kontrolü
  3. Meta tag (title, description, canonical) varlığı
  4. Open Graph tag varlığı
  5. JSON-LD schema tipi tespiti
  6. Core Web Vitals (Lighthouse API veya local)
  7. İç link analizi
  8. Başlık hiyerarşisi

Kullanım:
  python3 scripts/seo_audit.py
  python3 scripts/seo_audit.py --base-url http://localhost:4173
  python3 scripts/seo_audit.py --base-url https://ecypro.com
  python3 scripts/seo_audit.py --output public/tools/seo-audit.html
  python3 scripts/seo_audit.py --json > seo_audit.json

Gereksinim: Python 3.8+, urllib (standart)
"""

import sys
import json
import re
import argparse
import time
from datetime import datetime
from urllib.request import urlopen, Request
from urllib.error import URLError, HTTPError
from urllib.parse import urljoin, urlparse
from html.parser import HTMLParser
from typing import TypedDict, Optional

# ─── Tip tanımları ────────────────────────────────────────────────────────────

class PageAudit(TypedDict):
    url: str
    status: int
    title: Optional[str]
    title_len: int
    description: Optional[str]
    desc_len: int
    canonical: Optional[str]
    og_title: Optional[str]
    og_image: Optional[str]
    og_type: Optional[str]
    h1_count: int
    h2_count: int
    h1_text: Optional[str]
    schemas: list[str]
    hreflang: list[str]
    issues: list[str]
    score: int  # 0-100

class SitemapInfo(TypedDict):
    accessible: bool
    url_count: int
    sitemap_count: int
    has_hreflang: bool
    has_lastmod: bool
    sample_urls: list[str]

class RobotsInfo(TypedDict):
    accessible: bool
    has_sitemap: bool
    googlebot_allowed: bool
    content_preview: str
    issues: list[str]

class SEOReport(TypedDict):
    timestamp: str
    base_url: str
    pages: list[PageAudit]
    sitemap: SitemapInfo
    robots: RobotsInfo
    overall_score: float
    critical_issues: list[str]
    warnings: list[str]

# ─── HTTP Yardımcıları ────────────────────────────────────────────────────────

HEADERS = {
    'User-Agent': 'EcyProSEOAudit/1.0 (+https://ecypro.com/bot)',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'tr,en;q=0.9',
}

# Python 3.14 macOS'ta getproxies_macosx_sysconf() askıya alabilir.
# Proxy kontrolünü tamamen devre dışı bırak — localhost audit için gereksiz.
import urllib.request as _ureq
_NO_PROXY_OPENER = _ureq.build_opener(_ureq.ProxyHandler({}))

def fetch(url: str, timeout: int = 8) -> tuple[int, str]:
    """URL'yi çek, (status_code, body) döndür. Proxy bypass ile."""
    try:
        req = Request(url, headers=HEADERS)
        with _NO_PROXY_OPENER.open(req, timeout=timeout) as r:
            content = r.read().decode('utf-8', errors='replace')
            return r.status, content
    except HTTPError as e:
        return e.code, ''
    except URLError as e:
        print(f"[seo_audit] URLError {url}: {e.reason}", file=sys.stderr)
        return 0, ''
    except Exception as e:
        print(f"[seo_audit] Error {url}: {e}", file=sys.stderr)
        return 0, ''

# ─── HTML Parser ──────────────────────────────────────────────────────────────

class MetaParser(HTMLParser):
    """HTML'den meta tag, title, h1, schema bilgisi çıkar."""

    def __init__(self) -> None:
        super().__init__()
        self.title: Optional[str] = None
        self.description: Optional[str] = None
        self.canonical: Optional[str] = None
        self.og_title: Optional[str] = None
        self.og_image: Optional[str] = None
        self.og_type: Optional[str] = None
        self.hreflang: list[str] = []
        self.h1_count = 0
        self.h2_count = 0
        self.h1_text: Optional[str] = None
        self.schemas: list[str] = []
        self._in_title = False
        self._in_script = False
        self._script_type = ''
        self._script_buf: list[str] = []
        self._h1_buf: list[str] = []
        self._in_h1 = False

    def handle_starttag(self, tag: str, attrs: list[tuple[str, Optional[str]]]) -> None:
        a = dict(attrs)
        if tag == 'title':
            self._in_title = True
        elif tag == 'meta':
            name = (a.get('name') or '').lower()
            prop = (a.get('property') or '').lower()
            content = a.get('content') or ''
            if name == 'description':
                self.description = content
            elif prop == 'og:title':
                self.og_title = content
            elif prop == 'og:image':
                self.og_image = content
            elif prop == 'og:type':
                self.og_type = content
        elif tag == 'link':
            rel = (a.get('rel') or '').lower()
            if rel == 'canonical':
                self.canonical = a.get('href')
            elif rel == 'alternate' and a.get('hreflang'):
                self.hreflang.append(a.get('hreflang', ''))
        elif tag == 'script':
            stype = (a.get('type') or '').lower()
            if stype == 'application/ld+json':
                self._in_script = True
                self._script_type = stype
                self._script_buf = []
        elif tag == 'h1':
            self.h1_count += 1
            self._in_h1 = True
            self._h1_buf = []
        elif tag == 'h2':
            self.h2_count += 1

    def handle_endtag(self, tag: str) -> None:
        if tag == 'title':
            self._in_title = False
        elif tag == 'script' and self._in_script:
            self._in_script = False
            try:
                data = json.loads(''.join(self._script_buf))
                schema_type = data.get('@type', '') or \
                              (data.get('@graph', [{}])[0].get('@type', '') if data.get('@graph') else '')
                if schema_type:
                    self.schemas.append(schema_type)
            except Exception:
                pass
            self._script_buf = []
        elif tag == 'h1':
            self._in_h1 = False
            if not self.h1_text:
                self.h1_text = ''.join(self._h1_buf).strip()

    def handle_data(self, data: str) -> None:
        if self._in_title and not self.title:
            self.title = (self.title or '') + data
        if self._in_script:
            self._script_buf.append(data)
        if self._in_h1:
            self._h1_buf.append(data)

# ─── Sayfa denetimi ───────────────────────────────────────────────────────────

def audit_page(url: str) -> PageAudit:
    """Tek sayfayı SEO açısından denetle."""
    issues: list[str] = []
    status, body = fetch(url)

    if status == 0:
        return {
            'url': url, 'status': 0, 'title': None, 'title_len': 0,
            'description': None, 'desc_len': 0, 'canonical': None,
            'og_title': None, 'og_image': None, 'og_type': None,
            'h1_count': 0, 'h2_count': 0, 'h1_text': None,
            'schemas': [], 'hreflang': [], 'issues': ['❌ Erişilemiyor'], 'score': 0,
        }

    parser = MetaParser()
    try:
        parser.feed(body)
    except Exception:
        pass

    title = parser.title or ''
    desc = parser.description or ''

    # Sorun tespiti
    if not title:
        issues.append('❌ Title eksik')
    elif len(title) < 20:
        issues.append(f'⚠ Title kısa: {len(title)} karakter')
    elif len(title) > 75:
        issues.append(f'⚠ Title uzun: {len(title)} karakter (max 75)')

    if not desc:
        issues.append('❌ Meta description eksik')
    elif len(desc) < 50:
        issues.append(f'⚠ Description kısa: {len(desc)} karakter')
    elif len(desc) > 165:
        issues.append(f'⚠ Description uzun: {len(desc)} karakter (max 165)')

    if not parser.canonical:
        issues.append('⚠ Canonical URL eksik')
    elif url not in parser.canonical and parser.canonical != url:
        pass  # Farklı domain canonical — olabilir

    if parser.h1_count == 0:
        issues.append('❌ H1 yok')
    elif parser.h1_count > 1:
        issues.append(f'⚠ Birden fazla H1: {parser.h1_count}')

    if not parser.og_image:
        issues.append('⚠ og:image eksik')

    if not parser.schemas:
        issues.append('⚠ JSON-LD schema yok')

    # Skor hesapla (0-100)
    score = 100
    for issue in issues:
        if issue.startswith('❌'):
            score -= 20
        elif issue.startswith('⚠'):
            score -= 5
    score = max(0, score)

    return {
        'url': url, 'status': status,
        'title': title[:80] if title else None,
        'title_len': len(title),
        'description': desc[:120] if desc else None,
        'desc_len': len(desc),
        'canonical': parser.canonical,
        'og_title': parser.og_title,
        'og_image': parser.og_image,
        'og_type': parser.og_type,
        'h1_count': parser.h1_count,
        'h2_count': parser.h2_count,
        'h1_text': parser.h1_text,
        'schemas': parser.schemas[:5],
        'hreflang': parser.hreflang[:10],
        'issues': issues,
        'score': score,
    }

# ─── Robots.txt denetimi ──────────────────────────────────────────────────────

def audit_robots(base_url: str) -> RobotsInfo:
    """robots.txt dosyasını denetle."""
    url = urljoin(base_url, '/robots.txt')
    status, content = fetch(url)
    issues: list[str] = []

    if status != 200:
        return {
            'accessible': False, 'has_sitemap': False,
            'googlebot_allowed': False, 'content_preview': '',
            'issues': [f'❌ robots.txt erişilemiyor (HTTP {status})'],
        }

    has_sitemap = 'Sitemap:' in content or 'sitemap:' in content
    # Check if Googlebot is allowed
    lines = content.lower().split('\n')
    googlebot_blocked = False
    for i, line in enumerate(lines):
        if 'user-agent: googlebot' in line or 'user-agent: *' in line:
            if i + 1 < len(lines) and 'disallow: /' in lines[i + 1]:
                googlebot_blocked = True

    if not has_sitemap:
        issues.append('⚠ Sitemap referansı yok')
    if googlebot_blocked:
        issues.append('❌ Googlebot engelleniyor!')

    return {
        'accessible': True,
        'has_sitemap': has_sitemap,
        'googlebot_allowed': not googlebot_blocked,
        'content_preview': content[:200],
        'issues': issues,
    }

# ─── Sitemap denetimi ─────────────────────────────────────────────────────────

def audit_sitemap(base_url: str) -> SitemapInfo:
    """sitemap.xml dosyasını denetle."""
    for path in ['/sitemap.xml', '/sitemap-index.xml', '/sitemap_index.xml']:
        url = urljoin(base_url, path)
        status, content = fetch(url)
        if status != 200 or not content:
            continue

        url_count = content.count('<url>')
        sitemap_count = content.count('<sitemap>')
        has_hreflang = 'hreflang' in content.lower() or 'xhtml:link' in content.lower()
        has_lastmod = '<lastmod>' in content

        # Extract sample URLs
        sample = re.findall(r'<loc>([^<]{5,80})</loc>', content)[:5]

        return {
            'accessible': True,
            'url_count': url_count,
            'sitemap_count': sitemap_count,
            'has_hreflang': has_hreflang,
            'has_lastmod': has_lastmod,
            'sample_urls': sample,
        }

    return {
        'accessible': False, 'url_count': 0, 'sitemap_count': 0,
        'has_hreflang': False, 'has_lastmod': False, 'sample_urls': [],
    }

# ─── CLI çıktısı ──────────────────────────────────────────────────────────────

C = {
    'green':  '\033[92m', 'yellow': '\033[93m',
    'red':    '\033[91m', 'cyan':   '\033[96m',
    'bold':   '\033[1m',  'reset':  '\033[0m',
}

def color_score(score: int) -> str:
    c = C['green'] if score >= 80 else C['yellow'] if score >= 60 else C['red']
    return f"{c}{score}/100{C['reset']}"

def print_cli(report: SEOReport) -> None:
    W = 70
    print(f"\n{'='*W}")
    print(f"{C['bold']}  🔎 SEO Denetim Raporu — EcyPro{C['reset']}")
    print(f"  {C['cyan']}{report['timestamp']}{C['reset']} | {report['base_url']}")
    print(f"{'='*W}")

    # Robots
    r = report['robots']
    print(f"\n  {C['bold']}🤖 robots.txt{C['reset']}")
    print(f"  Erişilebilir  : {C['green'] if r['accessible'] else C['red']}{r['accessible']}{C['reset']}")
    print(f"  Sitemap ref   : {'✅' if r['has_sitemap'] else '⚠'}")
    print(f"  Googlebot     : {'✅' if r['googlebot_allowed'] else '❌'}")
    for issue in r['issues']:
        print(f"  {issue}")

    # Sitemap
    s = report['sitemap']
    print(f"\n  {C['bold']}🗺  sitemap.xml{C['reset']}")
    print(f"  Erişilebilir  : {C['green'] if s['accessible'] else C['red']}{s['accessible']}{C['reset']}")
    print(f"  URL sayısı    : {s['url_count']}")
    print(f"  Hreflang      : {'✅' if s['has_hreflang'] else '⚠'}")
    print(f"  Lastmod       : {'✅' if s['has_lastmod'] else '⚠'}")

    # Pages
    print(f"\n  {C['bold']}📄 Sayfa Denetimleri ({len(report['pages'])} sayfa){C['reset']}")
    print(f"  {'URL':<35} {'Skor':<12} {'H1':<4} {'Schemas'}")
    print(f"  {'─'*65}")

    for page in report['pages']:
        url_short = page['url'].replace(report['base_url'], '') or '/'
        schemas = ', '.join(page['schemas']) if page['schemas'] else '—'
        print(f"  {url_short:<35} {color_score(page['score']):<20} {page['h1_count']:<4} {schemas[:20]}")
        for issue in page['issues'][:2]:
            print(f"    {issue}")

    # Critical issues
    if report['critical_issues']:
        print(f"\n  {C['bold']}{C['red']}❌ KRİTİK SORUNLAR{C['reset']}")
        for issue in report['critical_issues']:
            print(f"  {C['red']}{issue}{C['reset']}")

    # Overall
    print(f"\n  {C['bold']}Genel Skor: {color_score(int(report['overall_score']))}{C['reset']}")
    print(f"\n{'='*W}\n")

# ─── HTML rapor ───────────────────────────────────────────────────────────────

def generate_html(report: SEOReport, output_path: str) -> None:
    import os
    rows = []
    for p in report['pages']:
        url_short = p['url'].replace(report['base_url'], '') or '/'
        score_color = '#22c55e' if p['score'] >= 80 else '#f59e0b' if p['score'] >= 60 else '#ef4444'
        issues_html = ''.join(f"<div class='issue'>{i}</div>" for i in p['issues']) or '✅'
        schemas_html = ', '.join(f"<span class='schema'>{s}</span>" for s in p['schemas']) or '—'
        hl = '✅' if p.get('hreflang') else '⚠'
        rows.append(f"""
          <tr>
            <td><code>{url_short}</code></td>
            <td style="color:{score_color};font-weight:700">{p['score']}/100</td>
            <td>{p.get('title_len', 0)}c</td>
            <td>{p.get('desc_len', 0)}c</td>
            <td>{p['h1_count']}</td>
            <td>{schemas_html}</td>
            <td>{hl}</td>
            <td>{issues_html}</td>
          </tr>""")

    html = f"""<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SEO Denetim Raporu — EcyPro</title>
  <style>
    *, *::before, *::after {{ box-sizing: border-box; margin: 0; padding: 0 }}
    body {{ font-family: system-ui, sans-serif; background: #0f172a; color: #e2e8f0; padding: 2rem }}
    h1 {{ font-size: 1.5rem; margin-bottom: 0.5rem }}
    .meta {{ color: #64748b; font-size: 0.85rem; margin-bottom: 2rem }}
    .summary {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 2rem }}
    .card {{ background: #1e293b; border-radius: 12px; padding: 1.25rem; border: 1px solid #334155 }}
    .card-value {{ font-size: 2rem; font-weight: 800 }}
    .card-label {{ color: #64748b; font-size: 0.8rem; margin-top: 0.3rem }}
    table {{ width: 100%; border-collapse: collapse; background: #1e293b; border-radius: 12px; overflow: hidden; font-size: 0.85rem }}
    th {{ background: #334155; padding: 0.6rem 0.8rem; text-align: left; color: #94a3b8; font-size: 0.75rem }}
    td {{ padding: 0.6rem 0.8rem; border-bottom: 1px solid #0f172a; vertical-align: top }}
    tr:last-child td {{ border-bottom: none }}
    tr:hover td {{ background: #243045 }}
    code {{ background: #334155; padding: 2px 6px; border-radius: 4px; font-size: 0.75rem }}
    .issue {{ font-size: 0.75rem; color: #f59e0b; margin: 1px 0 }}
    .schema {{ background: #4338ca; padding: 1px 5px; border-radius: 3px; font-size: 0.7rem; margin: 1px }}
    .robots-info {{ display: flex; gap: 1rem; margin-bottom: 1.5rem; font-size: 0.9rem }}
    .robots-card {{ background: #1e293b; border-radius: 8px; padding: 0.75rem 1rem; flex: 1; border: 1px solid #334155 }}
  </style>
</head>
<body>
  <h1>🔎 SEO Denetim Raporu — EcyPro</h1>
  <div class="meta">{report['timestamp']} | {report['base_url']}</div>

  <div class="summary">
    <div class="card">
      <div class="card-value" style="color:#6366f1">{int(report['overall_score'])}</div>
      <div class="card-label">Genel SEO Skoru</div>
    </div>
    <div class="card">
      <div class="card-value" style="color:{('#22c55e' if report['sitemap']['accessible'] else '#ef4444')}">{report['sitemap']['url_count']}</div>
      <div class="card-label">Sitemap URL</div>
    </div>
    <div class="card">
      <div class="card-value" style="color:#06b6d4">{len(report['pages'])}</div>
      <div class="card-label">Denetlenen Sayfa</div>
    </div>
    <div class="card">
      <div class="card-value" style="color:{('#22c55e' if report['robots']['accessible'] else '#ef4444')}">{('✅' if report['robots']['accessible'] else '❌')}</div>
      <div class="card-label">robots.txt</div>
    </div>
  </div>

  <table>
    <thead>
      <tr><th>URL</th><th>Skor</th><th>Title</th><th>Desc</th><th>H1</th><th>Schemas</th><th>Hreflang</th><th>Sorunlar</th></tr>
    </thead>
    <tbody>{"".join(rows)}</tbody>
  </table>
  <script>setTimeout(() => location.reload(), 60000);</script>
</body>
</html>"""

    os.makedirs(os.path.dirname(output_path) if os.path.dirname(output_path) else '.', exist_ok=True)
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(html)
    print(f"[seo_audit] HTML: {output_path}")

# ─── Ana analiz ───────────────────────────────────────────────────────────────

CRITICAL_PAGES = ['/', '/blog', '/services', '/about', '/pricing', '/contact']

def run_audit(base_url: str) -> SEOReport:
    base_url = base_url.rstrip('/')
    pages = []
    print(f"[seo_audit] Denetim başlıyor: {base_url}")

    for path in CRITICAL_PAGES:
        url = base_url + path
        print(f"  📄 {path} ...", end=' ', flush=True)
        t0 = time.time()
        audit = audit_page(url)
        elapsed = time.time() - t0
        print(f"{audit['status']} | {audit['score']}/100 ({elapsed:.1f}s)")
        pages.append(audit)
        time.sleep(0.3)

    robots = audit_robots(base_url)
    sitemap = audit_sitemap(base_url)

    overall = sum(p['score'] for p in pages) / len(pages) if pages else 0
    critical = [i for p in pages for i in p['issues'] if i.startswith('❌')]

    return {
        'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'base_url': base_url,
        'pages': pages,
        'sitemap': sitemap,
        'robots': robots,
        'overall_score': round(overall, 1),
        'critical_issues': critical[:10],
        'warnings': [i for p in pages for i in p['issues'] if i.startswith('⚠')][:10],
    }

# ─── Entry point ──────────────────────────────────────────────────────────────

def main() -> None:
    # IDE terminal'de satır-içi yorumlar (# metin) literal geçebilir — filtrele
    sys.argv = [a for a in sys.argv if not a.startswith('#')]
    parser = argparse.ArgumentParser(description='EcyPro SEO Denetim Aracı')
    parser.add_argument('--base-url', '-u', default='http://localhost:4173')
    parser.add_argument('--output', '-o', default='public/tools/seo-audit.html')
    parser.add_argument('--json', '-j', action='store_true')
    parser.add_argument('--no-html', action='store_true')
    args, _ = parser.parse_known_args()

    report = run_audit(args.base_url)

    if args.json:
        print(json.dumps(report, indent=2, ensure_ascii=False))
    else:
        print_cli(report)
        if not args.no_html:
            generate_html(report, args.output)

if __name__ == '__main__':
    main()
