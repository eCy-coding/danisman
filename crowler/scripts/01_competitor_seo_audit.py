#!/usr/bin/env python3
"""
01_competitor_seo_audit.py — EcyPro Rakip SEO Analizi
Scrapling kullanarak 10 rakip konsültanlık sitesini crawl eder.
Title, meta desc, H1-H3, canonical, schema types, word count, OG tags çıkarır.
Çıktı: crowler/reports/01_competitor_seo_audit.md + .json

Kullanım:
  python3 scripts/01_competitor_seo_audit.py
  python3 scripts/01_competitor_seo_audit.py --url https://mckinsey.com --verbose
"""
from __future__ import annotations

import json
import time
import sys
from datetime import datetime
from pathlib import Path
from typing import Optional

import typer
from rich.console import Console
from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn
from rich.table import Table
from scrapling.fetchers import Fetcher

app = typer.Typer(help="EcyPro Rakip SEO Audit")
console = Console()

REPORTS_DIR = Path(__file__).parent.parent / "reports"
REPORTS_DIR.mkdir(exist_ok=True)

# ── Rakip listesi (brain/COMPETITIVE_AUDIT.md'den alındı) ──────────────────
COMPETITORS = [
    {"name": "McKinsey & Company",    "url": "https://www.mckinsey.com",           "category": "Big 3"},
    {"name": "BCG",                   "url": "https://www.bcg.com",                "category": "Big 3"},
    {"name": "Bain & Company",        "url": "https://www.bain.com",               "category": "Big 3"},
    {"name": "Accenture Song",        "url": "https://www.accenture.com",          "category": "Digital"},
    {"name": "Deloitte Digital",      "url": "https://www.deloitte.com",           "category": "Digital"},
    {"name": "Thoughtworks",          "url": "https://www.thoughtworks.com",       "category": "Tech"},
    {"name": "IDEO",                  "url": "https://www.ideo.com",               "category": "Design"},
    {"name": "EY-Parthenon",          "url": "https://www.ey.com",                 "category": "Big 4"},
    {"name": "Kearney",               "url": "https://www.kearney.com",            "category": "Strategy"},
    {"name": "Productive.io",         "url": "https://productive.io",             "category": "SaaS Consulting"},
]

# ── SEO çıkarıcı ───────────────────────────────────────────────────────────

def extract_seo(url: str, verbose: bool = False) -> dict:
    fetcher = Fetcher(auto_match=False)
    result: dict = {
        "url": url,
        "crawled_at": datetime.utcnow().isoformat() + "Z",
        "status": "ok",
        "error": None,
        "title": None,
        "meta_description": None,
        "canonical": None,
        "og_title": None,
        "og_description": None,
        "og_image": None,
        "h1": [],
        "h2": [],
        "h3": [],
        "schema_types": [],
        "hreflang_langs": [],
        "robots_meta": None,
        "word_count": 0,
        "internal_links": 0,
        "external_links": 0,
        "images_total": 0,
        "images_no_alt": 0,
        "has_sitemap_link": False,
    }

    try:
        page = fetcher.get(url, timeout=20, retries=1)
        if not page:
            result["status"] = "empty"
            return result

        # Title
        title_el = page.css_first("title")
        result["title"] = title_el.text.strip() if title_el else None

        # Meta description
        meta_desc = page.css_first('meta[name="description"]')
        result["meta_description"] = meta_desc.attrib.get("content", "").strip() if meta_desc else None

        # Canonical
        canonical = page.css_first('link[rel="canonical"]')
        result["canonical"] = canonical.attrib.get("href", "").strip() if canonical else None

        # OG tags
        for prop, key in [("og:title", "og_title"), ("og:description", "og_description"), ("og:image", "og_image")]:
            el = page.css_first(f'meta[property="{prop}"]')
            result[key] = el.attrib.get("content", "").strip() if el else None

        # Headings
        result["h1"] = [el.text.strip() for el in page.css("h1") if el.text][:5]
        result["h2"] = [el.text.strip() for el in page.css("h2") if el.text][:8]
        result["h3"] = [el.text.strip() for el in page.css("h3") if el.text][:6]

        # Schema.org types
        schema_els = page.css('script[type="application/ld+json"]')
        schema_types: list[str] = []
        for el in schema_els:
            try:
                data = json.loads(el.text or "{}")
                if isinstance(data, list):
                    schema_types += [d.get("@type", "") for d in data if isinstance(d, dict)]
                elif isinstance(data, dict):
                    t = data.get("@type")
                    if isinstance(t, list):
                        schema_types += t
                    elif t:
                        schema_types.append(t)
            except (json.JSONDecodeError, AttributeError):
                pass
        result["schema_types"] = list({s for s in schema_types if s})

        # Hreflang
        hreflang_els = page.css('link[rel="alternate"][hreflang]')
        result["hreflang_langs"] = [el.attrib.get("hreflang", "") for el in hreflang_els]

        # Robots meta
        robots_el = page.css_first('meta[name="robots"]')
        result["robots_meta"] = robots_el.attrib.get("content", "") if robots_el else None

        # Word count (body text)
        body = page.css_first("body")
        if body:
            body_text = body.text or ""
            result["word_count"] = len(body_text.split())

        # Links
        domain = url.split("/")[2].replace("www.", "")
        all_links = page.css("a[href]")
        internal = sum(1 for a in all_links if domain in (a.attrib.get("href") or ""))
        result["internal_links"] = internal
        result["external_links"] = len(all_links) - internal

        # Images
        imgs = page.css("img")
        result["images_total"] = len(imgs)
        result["images_no_alt"] = sum(1 for img in imgs if not img.attrib.get("alt", "").strip())

        # Sitemap link
        sitemap_link = page.css_first('link[rel="sitemap"], a[href*="sitemap"]')
        result["has_sitemap_link"] = sitemap_link is not None

        if verbose:
            console.print(f"  [dim]→ title: {result['title'][:60] if result['title'] else '-'}[/]")

    except Exception as exc:
        result["status"] = "error"
        result["error"] = str(exc)[:200]

    return result


# ── Markdown rapor üretici ──────────────────────────────────────────────────

def build_markdown_report(results: list[dict], competitors: list[dict]) -> str:
    now = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
    lines = [
        f"# EcyPro Rakip SEO Audit Raporu",
        f"",
        f"**Üretildi:** {now}  ",
        f"**Araç:** Scrapling {_scrapling_version()}  ",
        f"**Analiz edilen:** {len(results)} rakip",
        f"",
        "---",
        "",
        "## Özet Tablosu",
        "",
        "| Rakip | Title Uzunluğu | Meta Desc | H1 | Schema Types | Hreflang | Kelime |",
        "|---|---|---|---|---|---|---|",
    ]
    for i, (comp, r) in enumerate(zip(competitors, results)):
        title_len = len(r.get("title") or "")
        has_meta = "✅" if r.get("meta_description") else "❌"
        h1_count = len(r.get("h1", []))
        schemas = ", ".join(r.get("schema_types", [])[:3]) or "—"
        hreflangs = ", ".join(r.get("hreflang_langs", [])[:4]) or "—"
        words = r.get("word_count", 0)
        status = "✅" if r.get("status") == "ok" else f"❌ {r.get('error','')[:40]}"
        lines.append(
            f"| [{comp['name']}]({comp['url']}) | {title_len} chars {status} | {has_meta} | {h1_count} | {schemas} | {hreflangs} | {words:,} |"
        )

    lines += ["", "---", "", "## Detaylı Analiz", ""]
    for comp, r in zip(competitors, results):
        lines += [
            f"### {comp['name']} ({comp['category']})",
            f"",
            f"**URL:** {comp['url']}  ",
            f"**Durum:** {r['status']}  ",
            f"**Title:** `{r.get('title') or '—'}`  ",
            f"**Meta Description:** {r.get('meta_description') or '—'}  ",
            f"**Canonical:** `{r.get('canonical') or '—'}`  ",
            f"",
        ]
        if r.get("h1"):
            lines.append(f"**H1 Tags:**")
            for h in r["h1"][:3]:
                lines.append(f"- {h[:100]}")
        if r.get("h2"):
            lines.append(f"")
            lines.append(f"**H2 Tags (ilk 5):**")
            for h in r["h2"][:5]:
                lines.append(f"- {h[:100]}")
        if r.get("schema_types"):
            lines.append(f"")
            lines.append(f"**Schema Types:** {', '.join(r['schema_types'])}")
        if r.get("hreflang_langs"):
            lines.append(f"**Hreflang:** {', '.join(r['hreflang_langs'])}")
        lines += [
            f"",
            f"**Link Analizi:** {r.get('internal_links', 0)} iç / {r.get('external_links', 0)} dış link  ",
            f"**Görsel:** {r.get('images_total', 0)} toplam, {r.get('images_no_alt', 0)} alt-text eksik  ",
            f"**Kelime Sayısı:** {r.get('word_count', 0):,}  ",
            f"",
            "---",
            "",
        ]

    lines += [
        "## EcyPro için Aksiyon Önerileri",
        "",
        "Bu analiz sonucuna göre öncelikli yapılacaklar:",
        "",
        "1. **Schema Types** — Rakiplerin kullandığı schema tiplerini ekle (Organization, FAQPage, Article, Service)",
        "2. **Hreflang** — TR/EN hreflang tag'leri ekle (`/tr/*` + `/en/*` URL yapısı)",
        "3. **H1 Optimizasyonu** — Her sayfada tek, keyword-rich H1 kullan",
        "4. **Meta Description** — 150-160 karakter hedefle, tüm sayfalarda mevcut olsun",
        "5. **İç Link Density** — Rakiplerle kıyasla, orphan sayfaları iç linkle destekle",
        "6. **Kelime Yoğunluğu** — Blog yazılarında rakip ortalama kelime sayısını geç",
        "",
        "_Rapor Scrapling ile otomatik üretilmiştir._",
    ]
    return "\n".join(lines)


def _scrapling_version() -> str:
    try:
        import scrapling
        return getattr(scrapling, "__version__", "?")
    except ImportError:
        return "?"


# ── CLI ─────────────────────────────────────────────────────────────────────

@app.command()
def run(
    url: Optional[str] = typer.Option(None, "--url", "-u", help="Belirli bir URL crawl et"),
    verbose: bool = typer.Option(False, "--verbose", "-v"),
    delay: float = typer.Option(1.5, "--delay", "-d", help="İstekler arası bekleme (saniye)"),
    output: str = typer.Option("md", "--output", "-o", help="Çıktı formatı: md | json | both"),
) -> None:
    """10 rakip konsültanlık sitesini SEO analizi yap."""
    targets = [{"name": url, "url": url, "category": "custom"}] if url else COMPETITORS

    console.rule("[bold cyan]EcyPro Rakip SEO Audit[/]")
    console.print(f"[dim]Scrapling {_scrapling_version()} · {len(targets)} hedef · {delay}s gecikme[/]\n")

    results: list[dict] = []
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        BarColumn(),
        TextColumn("{task.completed}/{task.total}"),
        console=console,
    ) as progress:
        task = progress.add_task("Crawling...", total=len(targets))
        for comp in targets:
            progress.update(task, description=f"[cyan]{comp['name'][:30]}[/]")
            r = extract_seo(comp["url"], verbose=verbose)
            results.append(r)
            status_icon = "✅" if r["status"] == "ok" else "❌"
            console.print(f"  {status_icon} {comp['name']} — {r.get('word_count', 0):,} kelime, {len(r.get('schema_types', []))} schema")
            progress.advance(task)
            if delay > 0:
                time.sleep(delay)

    # ── Rapor çıktıları ──────────────────────────────────────────────────
    ts = datetime.utcnow().strftime("%Y%m%d_%H%M")
    saved = []

    if output in ("json", "both"):
        json_path = REPORTS_DIR / f"01_competitor_seo_audit_{ts}.json"
        json_path.write_text(json.dumps({"generated_at": ts, "results": results}, indent=2, ensure_ascii=False), encoding="utf-8")
        saved.append(str(json_path))

    if output in ("md", "both"):
        md_path = REPORTS_DIR / f"01_competitor_seo_audit_{ts}.md"
        md_path.write_text(build_markdown_report(results, targets), encoding="utf-8")
        saved.append(str(md_path))

    # ── Özet tablo ──────────────────────────────────────────────────────
    table = Table(title="SEO Audit Özeti", show_header=True, header_style="bold magenta")
    table.add_column("Rakip", style="cyan", max_width=22)
    table.add_column("Title", max_width=10)
    table.add_column("Meta", max_width=5)
    table.add_column("H1", max_width=4)
    table.add_column("Schema", max_width=20)
    table.add_column("Kelime", max_width=8)

    for comp, r in zip(targets, results):
        table.add_row(
            comp["name"][:22],
            str(len(r.get("title") or "")) + "c",
            "✅" if r.get("meta_description") else "❌",
            str(len(r.get("h1", []))),
            ", ".join(r.get("schema_types", [])[:2]) or "—",
            f"{r.get('word_count', 0):,}",
        )

    console.print(table)
    console.print(f"\n[green]✓ Raporlar kaydedildi:[/]")
    for p in saved:
        console.print(f"  [dim]{p}[/]")


if __name__ == "__main__":
    app()
