#!/usr/bin/env python3
"""
08_internal_link_graph.py — EcyPro İç Link Graf + Orphan Sayfa Tespiti
Sitenin iç link yapısını tam olarak haritar:
  - Her sayfanın hangi sayfaları linkle bağladığını çıkarır
  - PageRank benzeri link authority hesaplar
  - Orphan sayfaları (hiç iç linki olmayan) tespit eder
  - Çıkmaz sokakları (linkten çıkılamayan sayfalar) bulur
  - Graf verisi JSON + Markdown rapor olarak export eder

Kullanım:
  python3 scripts/08_internal_link_graph.py
  python3 scripts/08_internal_link_graph.py --base https://www.ecypro.com --depth 2
"""
from __future__ import annotations

import json
import time
import xml.etree.ElementTree as ET
from collections import defaultdict, deque
from datetime import datetime
from pathlib import Path
from urllib.parse import urljoin, urlparse

import typer
from rich.console import Console
from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn
from rich.table import Table
from scrapling.fetchers import Fetcher

app = typer.Typer(help="İç Link Graf Analizi")
console = Console()

REPORTS_DIR = Path(__file__).parent.parent / "reports"
REPORTS_DIR.mkdir(exist_ok=True)
SITEMAP_PATH = Path(__file__).parent.parent.parent / "public" / "sitemap.xml"
DEFAULT_BASE = "http://localhost:4173"


def load_sitemap_paths(base: str) -> list[str]:
    if not SITEMAP_PATH.exists():
        return []
    tree = ET.parse(SITEMAP_PATH)
    root = tree.getroot()
    ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    urls = []
    for loc in root.findall(".//sm:loc", ns):
        path = urlparse((loc.text or "").strip()).path or "/"
        urls.append(urljoin(base, path))
    return list(dict.fromkeys(urls))


def normalize_url(url: str, base: str) -> str | None:
    """URL'i normalize et, fragment/query sil."""
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https", ""):
        return None
    if not parsed.netloc and not url.startswith("/"):
        return None
    base_domain = urlparse(base).netloc
    abs_url = urljoin(base, url)
    abs_parsed = urlparse(abs_url)
    if abs_parsed.netloc and abs_parsed.netloc != base_domain:
        return None  # dış link
    # Path normalize: trailing slash kaldır (root hariç)
    path = abs_parsed.path.rstrip("/") or "/"
    return urljoin(base, path)


def crawl_page(fetcher: Fetcher, url: str, base: str) -> tuple[list[str], list[str]]:
    """Sayfadaki iç linkleri çıkar. (internal, external) döndür."""
    internal: list[str] = []
    external: list[str] = []
    base_domain = urlparse(base).netloc

    try:
        page = fetcher.get(url, timeout=15, retries=1)
        if not page:
            return [], []
        for a in page.css("a[href]"):
            href = (a.attrib.get("href") or "").strip()
            if not href or href.startswith("#") or href.startswith("mailto:") or href.startswith("tel:"):
                continue
            norm = normalize_url(href, base)
            if norm:
                internal.append(norm)
            else:
                abs_href = urljoin(url, href)
                if urlparse(abs_href).netloc != base_domain:
                    external.append(abs_href[:80])
    except Exception:
        pass
    return list(dict.fromkeys(internal)), external


def simple_pagerank(graph: dict[str, list[str]], iterations: int = 20, damping: float = 0.85) -> dict[str, float]:
    """Simplified PageRank hesaplama."""
    pages = list(graph.keys())
    n = len(pages)
    if n == 0:
        return {}
    rank = {p: 1.0 / n for p in pages}

    for _ in range(iterations):
        new_rank: dict[str, float] = {}
        for page in pages:
            incoming = [p for p, links in graph.items() if page in links]
            incoming_sum = sum(rank[p] / max(len(graph[p]), 1) for p in incoming)
            new_rank[page] = (1 - damping) / n + damping * incoming_sum
        rank = new_rank

    return rank


def build_report(
    graph: dict[str, list[str]],
    page_ranks: dict[str, float],
    orphans: list[str],
    dead_ends: list[str],
    sitemap_urls: list[str],
    base: str,
) -> str:
    now = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
    total_links = sum(len(v) for v in graph.values())
    lines = [
        "# EcyPro İç Link Graf Raporu",
        "",
        f"**Üretildi:** {now}  ",
        f"**Base URL:** {base}  ",
        f"**Taranan Sayfa:** {len(graph)}  ",
        f"**Toplam İç Link:** {total_links}  ",
        f"**Orphan Sayfa:** {len(orphans)}  ",
        f"**Çıkmaz Sokak:** {len(dead_ends)}  ",
        "",
        "---",
        "",
        "## PageRank Sıralaması (İlk 20)",
        "",
        "| Sıra | Sayfa | PageRank | Link Alan | Link Veren |",
        "|---|---|---|---|---|",
    ]
    sorted_pages = sorted(page_ranks.items(), key=lambda x: x[1], reverse=True)[:20]
    for i, (page, rank) in enumerate(sorted_pages, 1):
        path = urlparse(page).path or "/"
        inbound = sum(1 for links in graph.values() if page in links)
        outbound = len(graph.get(page, []))
        lines.append(f"| {i} | `{path}` | {rank:.4f} | {inbound} | {outbound} |")

    lines += [
        "",
        "---",
        "",
        "## ⚠️ Orphan Sayfalar",
        "",
        "Bu sayfalar hiçbir iç linkten erişilemiyor — SEO bütçesi boşa gidiyor:",
        "",
    ]
    if orphans:
        lines += ["| Orphan Sayfa | Sitemap'te |", "|---|---|"]
        for o in orphans:
            path = urlparse(o).path
            in_sitemap = "✅" if any(urlparse(s).path == path for s in sitemap_urls) else "❌"
            lines.append(f"| `{path}` | {in_sitemap} |")
    else:
        lines.append("✅ Orphan sayfa yok!")

    lines += [
        "",
        "## 🔚 Çıkmaz Sokak Sayfaları",
        "",
        "Bu sayfalar hiçbir yere link vermiyor (dead ends):",
        "",
    ]
    if dead_ends:
        for d in dead_ends[:15]:
            lines.append(f"- `{urlparse(d).path}`")
    else:
        lines.append("✅ Çıkmaz sokak yok!")

    lines += [
        "",
        "---",
        "",
        "## İç Link Density Tablosu",
        "",
        "| Sayfa | Gelen | Giden | Oran |",
        "|---|---|---|---|",
    ]
    all_pages = list(graph.keys())
    for page in sorted(all_pages, key=lambda p: sum(1 for links in graph.values() if p in links), reverse=True)[:20]:
        path = urlparse(page).path or "/"
        inb = sum(1 for links in graph.values() if page in links)
        outb = len(graph.get(page, []))
        ratio = f"{inb / max(outb, 1):.2f}"
        lines.append(f"| `{path}` | {inb} | {outb} | {ratio} |")

    lines += [
        "",
        "---",
        "",
        "## Öneriler",
        "",
        "1. **Orphan sayfaları** ilgili blog yazıları veya servis sayfalarından linkle",
        "2. **Dead end sayfalar**a 'İlgili İçerikler' veya 'Sonraki Adımlar' bölümü ekle",
        "3. **Blog yazıları** case study'lere link versin (cross-linking)",
        "4. **Homepage** en kritik sayfalara doğrudan link vermeli (PageRank dağılımı)",
        "5. **Footer** sık ziyaret edilen sayfalara link içermeli",
        "",
        "_Scrapling ile otomatik üretilmiştir._",
    ]
    return "\n".join(lines)


@app.command()
def run(
    base: str = typer.Option(DEFAULT_BASE, "--base", "-b"),
    delay: float = typer.Option(0.4, "--delay"),
    max_pages: int = typer.Option(50, "--max"),
    output: str = typer.Option("both", "--output"),
) -> None:
    """Sitenin iç link yapısını haritalandır, orphan ve dead end sayfaları bul."""
    console.rule("[bold cyan]İç Link Graf Analizi[/]")
    fetcher = Fetcher(auto_match=False)
    base_domain = urlparse(base).netloc

    sitemap_urls = load_sitemap_paths(base)
    seed_pages = sitemap_urls[:max_pages] if sitemap_urls else [
        base + p for p in ["/", "/services", "/blog", "/about", "/contact", "/pricing",
                           "/case-studies", "/methodology", "/industries", "/team"]
    ]
    console.print(f"[cyan]{len(seed_pages)} sayfa taranacak[/]\n")

    # Adjacency graph: sayfa → [linkler]
    graph: dict[str, list[str]] = {}
    visited: set[str] = set()
    queue: deque[str] = deque(seed_pages)

    with Progress(SpinnerColumn(), TextColumn("{task.description}"), BarColumn(), TextColumn("{task.completed}"), console=console) as prog:
        task = prog.add_task("Graf oluşturuluyor...", total=len(seed_pages))
        while queue and len(visited) < max_pages:
            url = queue.popleft()
            if url in visited:
                continue
            visited.add(url)
            prog.update(task, description=f"[cyan]{urlparse(url).path[:35]}[/]")
            internal, _ = crawl_page(fetcher, url, base)
            graph[url] = internal
            console.print(f"  → {urlparse(url).path}: {len(internal)} iç link")
            prog.advance(task)
            time.sleep(delay)

    # PageRank
    page_ranks = simple_pagerank(graph)

    # Orphan sayfalar: grafın değerlerinde hiç görünmeyen, ama grafda olan
    all_linked: set[str] = set()
    for links in graph.values():
        all_linked.update(links)
    orphans = [p for p in graph if p not in all_linked and urlparse(p).path != "/"]

    # Dead ends: hiç link vermeyen sayfalar
    dead_ends = [p for p, links in graph.items() if not links]

    ts = datetime.utcnow().strftime("%Y%m%d_%H%M")
    saved = []
    graph_data = {
        "generated_at": ts,
        "base": base,
        "pages": len(graph),
        "total_links": sum(len(v) for v in graph.values()),
        "orphans": orphans,
        "dead_ends": dead_ends,
        "page_ranks": {urlparse(p).path: round(r, 5) for p, r in sorted(page_ranks.items(), key=lambda x: x[1], reverse=True)[:30]},
        "adjacency": {urlparse(k).path: [urlparse(v).path for v in vs] for k, vs in graph.items()},
    }

    if output in ("json", "both"):
        p = REPORTS_DIR / f"08_internal_link_graph_{ts}.json"
        p.write_text(json.dumps(graph_data, indent=2, ensure_ascii=False), encoding="utf-8")
        saved.append(str(p))
    if output in ("md", "both"):
        p = REPORTS_DIR / f"08_internal_link_graph_{ts}.md"
        p.write_text(build_report(graph, page_ranks, orphans, dead_ends, sitemap_urls, base), encoding="utf-8")
        saved.append(str(p))

    table = Table(title="İç Link Graf Özeti")
    table.add_column("Metrik")
    table.add_column("Değer", style="cyan")
    table.add_row("Taranan Sayfa", str(len(graph)))
    table.add_row("Toplam İç Link", str(sum(len(v) for v in graph.values())))
    table.add_row("Orphan Sayfa", str(len(orphans)))
    table.add_row("Dead End Sayfa", str(len(dead_ends)))
    pr_sorted = sorted(page_ranks.items(), key=lambda x: x[1], reverse=True)
    if pr_sorted:
        top_path = urlparse(pr_sorted[0][0]).path
        table.add_row("En Yüksek PageRank", f"{top_path} ({pr_sorted[0][1]:.4f})")
    console.print(table)
    for p in saved:
        console.print(f"[green]✓ {p}[/]")


if __name__ == "__main__":
    app()
