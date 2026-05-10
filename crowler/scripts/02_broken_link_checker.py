#!/usr/bin/env python3
"""
02_broken_link_checker.py — EcyPro Kırık Link Denetçisi
Sitemap.xml'den veya URL listesinden tüm sayfaları crawl eder.
Her sayfadaki iç/dış linkleri kontrol eder, 404/5xx olanları raporlar.
Çıktı: crowler/reports/02_broken_links_*.md + .json

Kullanım:
  python3 scripts/02_broken_link_checker.py                        # sitemap'ten URL al
  python3 scripts/02_broken_link_checker.py --base https://ecypro.com
  python3 scripts/02_broken_link_checker.py --local --port 4173   # preview server
"""
from __future__ import annotations

import json
import time
import xml.etree.ElementTree as ET
from collections import defaultdict
from datetime import datetime
from pathlib import Path
from typing import Optional
from urllib.parse import urljoin, urlparse

import typer
from rich.console import Console
from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn, TimeElapsedColumn
from rich.table import Table
from scrapling.fetchers import Fetcher

app = typer.Typer(help="EcyPro Kırık Link Tarayıcısı")
console = Console()

REPORTS_DIR = Path(__file__).parent.parent / "reports"
REPORTS_DIR.mkdir(exist_ok=True)

DEFAULT_BASE   = "http://localhost:4173"
SITEMAP_PATH   = Path(__file__).parent.parent.parent / "public" / "sitemap.xml"
TIMEOUT        = 12
DELAY          = 0.4


def load_urls_from_sitemap(sitemap_path: Path, base: str) -> list[str]:
    """Sitemap.xml'den URL listesi çıkar."""
    if not sitemap_path.exists():
        console.print(f"[yellow]⚠ Sitemap bulunamadı: {sitemap_path}[/]")
        return []
    try:
        tree = ET.parse(sitemap_path)
        root = tree.getroot()
        ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
        urls = []
        for loc in root.findall(".//sm:loc", ns):
            loc_url = (loc.text or "").strip()
            if "ecypro.com" in loc_url:
                path = urlparse(loc_url).path
                urls.append(urljoin(base, path))
            elif loc_url.startswith("/"):
                urls.append(urljoin(base, loc_url))
            else:
                urls.append(loc_url)
        return list(dict.fromkeys(urls))  # dedupe preserving order
    except ET.ParseError as e:
        console.print(f"[red]Sitemap parse hatası: {e}[/]")
        return []


def check_url_status(fetcher: Fetcher, url: str) -> dict:
    try:
        page = fetcher.get(url, timeout=TIMEOUT, retries=0)
        if page is None:
            return {"url": url, "status": 0, "ok": False, "error": "empty_response"}
        raw = getattr(page, "status", None)
        status = int(raw) if raw else 200
        return {"url": url, "status": status, "ok": status < 400, "error": None}
    except Exception as exc:
        msg = str(exc)[:120]
        return {"url": url, "status": 0, "ok": False, "error": msg}


def extract_links_from_page(fetcher: Fetcher, page_url: str, base_domain: str) -> dict:
    """Bir sayfadaki tüm linkleri çıkar, iç/dış ayır."""
    result = {
        "page": page_url,
        "internal": [],
        "external": [],
        "broken": [],
        "status": "ok",
        "error": None,
    }
    try:
        page = fetcher.get(page_url, timeout=TIMEOUT, retries=1)
        if page is None:
            result["status"] = "empty"
            return result

        anchors = page.css("a[href]")
        seen: set[str] = set()
        for a in anchors:
            href = (a.attrib.get("href") or "").strip()
            if not href or href.startswith("#") or href.startswith("mailto:") or href.startswith("tel:"):
                continue
            abs_url = urljoin(page_url, href)
            parsed = urlparse(abs_url)
            if parsed.scheme not in ("http", "https"):
                continue
            if abs_url in seen:
                continue
            seen.add(abs_url)

            if base_domain in parsed.netloc:
                result["internal"].append(abs_url)
            else:
                result["external"].append(abs_url)

    except Exception as exc:
        result["status"] = "error"
        result["error"] = str(exc)[:150]

    return result


def build_report(all_results: list[dict], broken: list[dict], base: str) -> str:
    now = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
    total_checked = sum(len(r["internal"]) + len(r["external"]) for r in all_results)
    lines = [
        "# EcyPro Kırık Link Raporu",
        "",
        f"**Üretildi:** {now}  ",
        f"**Base URL:** {base}  ",
        f"**Taranan Sayfa:** {len(all_results)}  ",
        f"**Kontrol Edilen Link:** {total_checked}  ",
        f"**Kırık Link:** {len(broken)}  ",
        "",
        "---",
        "",
    ]
    if not broken:
        lines.append("## ✅ Kırık link bulunamadı!")
    else:
        lines += ["## ❌ Kırık Linkler", "", "| Sayfa | Kırık URL | HTTP Durum | Hata |", "|---|---|---|---|"]
        by_page: dict[str, list] = defaultdict(list)
        for b in broken:
            by_page[b.get("found_on", "?")].append(b)
        for page, items in by_page.items():
            for item in items:
                status = item.get("status", 0)
                error = (item.get("error") or "—")[:60]
                lines.append(f"| `{page}` | `{item['url']}` | {status} | {error} |")

    lines += [
        "",
        "---",
        "",
        "## Sayfa Başına Link Sayısı",
        "",
        "| Sayfa | İç Link | Dış Link |",
        "|---|---|---|",
    ]
    for r in all_results[:20]:
        page = r["page"].replace(base, "")
        lines.append(f"| `{page}` | {len(r['internal'])} | {len(r['external'])} |")

    return "\n".join(lines)


@app.command()
def run(
    base: str = typer.Option(DEFAULT_BASE, "--base", "-b", help="Base URL (preview veya production)"),
    local: bool = typer.Option(True, "--local/--no-local", help="Localhost preview server"),
    port: int = typer.Option(4173, "--port", "-p"),
    check_external: bool = typer.Option(False, "--ext/--no-ext", help="Dış linkleri de kontrol et"),
    delay: float = typer.Option(DELAY, "--delay", "-d"),
    output: str = typer.Option("both", "--output", "-o"),
) -> None:
    """EcyPro'nun tüm sayfalarındaki linkleri kontrol et, kırık olanları raporla."""
    if local:
        base = f"http://localhost:{port}"

    base_domain = urlparse(base).netloc
    console.rule(f"[bold cyan]EcyPro Kırık Link Tarayıcısı[/]")
    console.print(f"[dim]Base: {base} · Dış link kontrolü: {check_external}[/]\n")

    fetcher = Fetcher(auto_match=False)

    # Sayfa listesini al
    pages = load_urls_from_sitemap(SITEMAP_PATH, base)
    if not pages:
        console.print("[yellow]Sitemap bulunamadı, varsayılan sayfa listesi kullanılıyor...[/]")
        pages = [
            f"{base}/", f"{base}/services", f"{base}/blog", f"{base}/about",
            f"{base}/contact", f"{base}/case-studies", f"{base}/pricing",
            f"{base}/methodology", f"{base}/industries", f"{base}/team",
        ]

    console.print(f"[cyan]{len(pages)} sayfa taranacak[/]\n")

    all_page_results: list[dict] = []
    all_links_to_check: dict[str, str] = {}  # url -> found_on

    # 1. Tüm sayfalardan linkleri çıkar
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        BarColumn(),
        TextColumn("{task.completed}/{task.total}"),
        TimeElapsedColumn(),
        console=console,
    ) as prog:
        task = prog.add_task("Sayfa taranıyor...", total=len(pages))
        for page_url in pages:
            prog.update(task, description=f"[cyan]{page_url.replace(base,'')[:35]}[/]")
            r = extract_links_from_page(fetcher, page_url, base_domain)
            all_page_results.append(r)
            for link in r["internal"]:
                if link not in all_links_to_check:
                    all_links_to_check[link] = page_url
            if check_external:
                for link in r["external"]:
                    if link not in all_links_to_check:
                        all_links_to_check[link] = page_url
            prog.advance(task)
            time.sleep(delay)

    console.print(f"\n[cyan]{len(all_links_to_check)} unique link kontrol edilecek[/]")

    # 2. Linklerin durumunu kontrol et
    broken_links: list[dict] = []
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        BarColumn(),
        TextColumn("{task.completed}/{task.total}"),
        TimeElapsedColumn(),
        console=console,
    ) as prog:
        task2 = prog.add_task("Link kontrol...", total=len(all_links_to_check))
        for url, found_on in all_links_to_check.items():
            prog.update(task2, description=f"[dim]{url[-40:]}[/]")
            status_r = check_url_status(fetcher, url)
            if not status_r["ok"]:
                status_r["found_on"] = found_on
                broken_links.append(status_r)
                console.print(f"  [red]❌ {status_r['status']} {url[:60]}[/] [dim](found: {found_on})[/]")
            prog.advance(task2)
            time.sleep(delay * 0.5)

    # 3. Rapor
    console.print(f"\n[bold]Sonuç:[/] {len(broken_links)} kırık link / {len(all_links_to_check)} toplam")

    ts = datetime.utcnow().strftime("%Y%m%d_%H%M")
    saved = []
    payload = {
        "generated_at": ts,
        "base": base,
        "pages_scanned": len(all_page_results),
        "links_checked": len(all_links_to_check),
        "broken_count": len(broken_links),
        "broken": broken_links,
    }

    if output in ("json", "both"):
        p = REPORTS_DIR / f"02_broken_links_{ts}.json"
        p.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
        saved.append(str(p))

    if output in ("md", "both"):
        p = REPORTS_DIR / f"02_broken_links_{ts}.md"
        p.write_text(build_report(all_page_results, broken_links, base), encoding="utf-8")
        saved.append(str(p))

    # Summary table
    table = Table(title="Kırık Link Özeti")
    table.add_column("Durum", style="bold")
    table.add_column("Sayı", style="cyan")
    table.add_row("Taranan Sayfa", str(len(all_page_results)))
    table.add_row("Kontrol Edilen Link", str(len(all_links_to_check)))
    table.add_row("Kırık Link", str(len(broken_links)))
    table.add_row("Başarı Oranı", f"{100 - (len(broken_links)/max(len(all_links_to_check),1)*100):.1f}%")
    console.print(table)

    for p in saved:
        console.print(f"[green]✓ {p}[/]")


if __name__ == "__main__":
    app()
