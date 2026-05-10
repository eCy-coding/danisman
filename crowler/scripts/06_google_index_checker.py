#!/usr/bin/env python3
"""
06_google_index_checker.py — EcyPro Google Index Durumu Kontrol
Sitemap.xml'deki her URL için Google'da "site:ecypro.com/PATH" araması yapar.
Indexlenmiş / Indexlenmemiş sayfaları raporlar.

NOT: Google'ın index durumu sadece "site:" aramasıyla kesin değil.
     Google Search Console'dan kesin veri için GSC API kullanılmalı.
     Bu script yaklaşık bir gösterge sunar.

Kullanım:
  python3 scripts/06_google_index_checker.py
  python3 scripts/06_google_index_checker.py --domain ecypro.com --delay 3
"""
from __future__ import annotations

import json
import time
import xml.etree.ElementTree as ET
from datetime import datetime
from pathlib import Path
from urllib.parse import urljoin, urlparse, quote_plus

import typer
from rich.console import Console
from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn
from rich.table import Table
from scrapling.fetchers import Fetcher, StealthyFetcher

app = typer.Typer(help="Google Index Durumu Kontrol")
console = Console()

REPORTS_DIR = Path(__file__).parent.parent / "reports"
REPORTS_DIR.mkdir(exist_ok=True)
SITEMAP_PATH = Path(__file__).parent.parent.parent / "public" / "sitemap.xml"
GOOGLE_SEARCH = "https://www.google.com/search"

# istek3.txt: arkadaş "site:..." ile indexlenmediğini gördü
PROD_DOMAIN = "ecypro.com"
PROD_BASE   = "https://www.ecypro.com"


def load_sitemap_paths() -> list[str]:
    if not SITEMAP_PATH.exists():
        return []
    tree = ET.parse(SITEMAP_PATH)
    root = tree.getroot()
    ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    paths = []
    for loc in root.findall(".//sm:loc", ns):
        text = (loc.text or "").strip()
        path = urlparse(text).path or "/"
        paths.append(path)
    return list(dict.fromkeys(paths))


def check_indexed_via_google(fetcher: StealthyFetcher, url_path: str, domain: str, delay: float) -> dict:
    """Google'da site: araması yap, sonuç var mı kontrol et."""
    full_url = f"https://www.{domain}{url_path}".rstrip("/")
    query = f"site:{domain}{url_path}"
    search_url = f"{GOOGLE_SEARCH}?q={quote_plus(query)}&hl=en&gl=us&num=5"

    result: dict = {
        "path": url_path,
        "full_url": full_url,
        "query": query,
        "indexed": None,
        "result_count": 0,
        "first_result_url": None,
        "status": "ok",
        "error": None,
        "note": "",
    }

    try:
        # StealthyFetcher: Google bot-detection'a karşı
        page = fetcher.fetch(search_url, headless=True, network_idle=True, timeout=25)
        if not page:
            result["status"] = "empty"
            result["note"] = "Boş yanıt"
            return result

        # "did not match any documents" veya "No results found"
        page_text = (page.text or "").lower()
        no_results = (
            "did not match any documents" in page_text
            or "no results found" in page_text
            or "hiçbir sonuç bulunamadı" in page_text
            or "herhangi bir belge bulunamadı" in page_text
        )

        if no_results:
            result["indexed"] = False
            result["result_count"] = 0
            return result

        # Sonuç linkleri
        result_links = page.css('a[href*="ecypro.com"]')
        result["result_count"] = len(result_links)
        result["indexed"] = len(result_links) > 0

        if result_links:
            result["first_result_url"] = result_links[0].attrib.get("href", "")[:100]

        # Sonuç sayısı (stats bar)
        stats = page.css_first("#result-stats, .LHJvCe")
        if stats:
            result["note"] = (stats.text or "")[:80]

    except Exception as exc:
        result["status"] = "error"
        result["error"] = str(exc)[:150]
        result["note"] = "Headless browser hatası (Playwright kurulu değil)"

    return result


def build_report(results: list[dict], domain: str) -> str:
    now = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
    indexed = [r for r in results if r.get("indexed") is True]
    not_indexed = [r for r in results if r.get("indexed") is False]
    unknown = [r for r in results if r.get("indexed") is None]

    lines = [
        "# EcyPro Google Index Durumu Raporu",
        "",
        f"**Üretildi:** {now}  ",
        f"**Domain:** `{domain}`  ",
        f"**Analiz Edilen:** {len(results)} URL  ",
        f"**✅ Indexlendi:** {len(indexed)} · **❌ Indexlenmedi:** {len(not_indexed)} · **❓ Bilinmiyor:** {len(unknown)}",
        "",
        "> ⚠️ Bu kontrol Google'ın `site:` aramasına dayalıdır.",
        "> Kesin veri için Google Search Console API kullanın.",
        "",
        "---",
        "",
        "## ❌ Indexlenmemiş Sayfalar (Aksiyon Gerekli)",
        "",
    ]
    if not_indexed:
        lines += ["| Sayfa | Tam URL |", "|---|---|"]
        for r in not_indexed:
            lines.append(f"| `{r['path']}` | {r['full_url']} |")
    else:
        lines.append("Indexlenmemiş sayfa tespit edilmedi. ✅")

    lines += [
        "",
        "## ✅ Indexlenmiş Sayfalar",
        "",
    ]
    if indexed:
        lines += ["| Sayfa | İlk Sonuç |", "|---|---|"]
        for r in indexed:
            first = (r.get("first_result_url") or "—")[:60]
            lines.append(f"| `{r['path']}` | {first} |")

    lines += [
        "",
        "---",
        "",
        "## Indexleme Hızlandırma Adımları",
        "",
        "1. **Google Search Console** → Sitemap ekle: `https://ecypro.com/sitemap.xml`",
        "2. **IndexNow** → `npm run seo:indexnow` ile Bing/Yandex'e anlık bildir",
        "3. **GSC URL Inspection** → Indexlenmemiş her URL için 'Request Indexing' tıkla",
        "4. **Backlink** → Sektör dizinlerine kayıt olarak crawl bütçesini artır",
        "5. **Canonical** → Tüm sayfalarda canonical tag doğru mu? (`npm run audit:canonical`)",
        "6. **robots.txt** → `Disallow:` kuralları yanlış sayfa engelliyor mu?",
        "",
        "_Scrapling + StealthyFetcher (Google bot-detection bypass) ile üretilmiştir._",
    ]
    return "\n".join(lines)


@app.command()
def run(
    domain: str = typer.Option(PROD_DOMAIN, "--domain"),
    delay: float = typer.Option(4.0, "--delay", "-d", help="Google sorguları arası bekleme (saniye)"),
    max_pages: int = typer.Option(20, "--max", help="Kontrol edilecek max sayfa"),
    headless: bool = typer.Option(False, "--headless/--no-headless", help="StealthyFetcher kullan"),
    output: str = typer.Option("both", "--output"),
) -> None:
    """
    Google'da her EcyPro sayfasının indexlenip indexlenmediğini kontrol et.
    
    NOT: Headless mod (--headless) Playwright gerektirir.
         pip install scrapling[playwright] && scrapling install
    """
    console.rule("[bold cyan]Google Index Kontrol[/]")
    console.print(f"[dim]Domain: {domain} · Gecikme: {delay}s · Max: {max_pages}[/]\n")

    if not headless:
        console.print("[yellow]⚠ Headless mod kapalı — Basit Fetcher kullanılıyor (sonuçlar sınırlı)[/]")
        console.print("[dim]Kesin kontrol için: python3 scripts/06_google_index_checker.py --headless[/]\n")

    paths = load_sitemap_paths()[:max_pages]
    if not paths:
        paths = ["/", "/services", "/blog", "/about", "/contact", "/pricing", "/case-studies", "/methodology"]
        console.print(f"[yellow]Sitemap bulunamadı, {len(paths)} varsayılan URL kullanılıyor[/]")

    console.print(f"[cyan]{len(paths)} sayfa kontrol edilecek[/]\n")

    results: list[dict] = []

    if headless:
        try:
            fetcher = StealthyFetcher()
        except Exception:
            console.print("[red]StealthyFetcher başlatılamadı. Playwright kurulu mu?[/]")
            console.print("[dim]Çözüm: pip install scrapling[playwright] && scrapling install[/]")
            raise typer.Exit(1)
    else:
        fetcher = Fetcher(auto_match=False)  # type: ignore

    with Progress(SpinnerColumn(), TextColumn("{task.description}"), BarColumn(), TextColumn("{task.completed}/{task.total}"), console=console) as prog:
        task = prog.add_task("Kontrol ediliyor...", total=len(paths))
        for path in paths:
            prog.update(task, description=f"[cyan]{path[:40]}[/]")
            if headless:
                r = check_indexed_via_google(fetcher, path, domain, delay)  # type: ignore
            else:
                r = {
                    "path": path,
                    "full_url": f"https://www.{domain}{path}",
                    "query": f"site:{domain}{path}",
                    "indexed": None,
                    "result_count": 0,
                    "first_result_url": None,
                    "status": "skipped",
                    "error": None,
                    "note": "Headless mod kapalı — Manuel kontrol gerekli",
                }
            icon = "✅" if r.get("indexed") else ("❌" if r.get("indexed") is False else "❓")
            console.print(f"  {icon} {path} — {r.get('note','')[:40]}")
            results.append(r)
            prog.advance(task)
            time.sleep(delay)

    ts = datetime.utcnow().strftime("%Y%m%d_%H%M")
    saved = []
    if output in ("json", "both"):
        p = REPORTS_DIR / f"06_google_index_{ts}.json"
        p.write_text(json.dumps(results, indent=2, ensure_ascii=False), encoding="utf-8")
        saved.append(str(p))
    if output in ("md", "both"):
        p = REPORTS_DIR / f"06_google_index_{ts}.md"
        p.write_text(build_report(results, domain), encoding="utf-8")
        saved.append(str(p))

    indexed_n = sum(1 for r in results if r.get("indexed") is True)
    table = Table(title="Google Index Özeti")
    table.add_column("Durum")
    table.add_column("Sayı", style="cyan")
    table.add_row("✅ Indexlendi",     str(indexed_n))
    table.add_row("❌ Indexlenmedi",   str(sum(1 for r in results if r.get("indexed") is False)))
    table.add_row("❓ Bilinmiyor",     str(sum(1 for r in results if r.get("indexed") is None)))
    table.add_row("Toplam Kontrol",    str(len(results)))
    console.print(table)
    for p in saved:
        console.print(f"[green]✓ {p}[/]")


if __name__ == "__main__":
    app()
