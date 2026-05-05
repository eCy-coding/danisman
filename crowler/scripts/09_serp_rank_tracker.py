#!/usr/bin/env python3
"""
09_serp_rank_tracker.py — EcyPro SERP Anahtar Kelime Sıralama Takipçisi
istek3.txt: "ilerleyen aşamalarda ahrefs veya semrush kullanılması faydalı olur."

Bu script onların ücretsiz alternatifi: Google SERP'ten doğrudan sıralama çeker.
  - Her hedef keyword için Google'da arama yapar
  - ecypro.com'un sıralamasını tespit eder
  - Rakiplerin sıralamalarını da kaydeder
  - Zaman serisi ile sıralama değişimini izler (CSV tarih damgası)

Kullanım:
  python3 scripts/09_serp_rank_tracker.py
  python3 scripts/09_serp_rank_tracker.py --headless  # StealthyFetcher ile gerçek SERP
  python3 scripts/09_serp_rank_tracker.py --keyword "dijital dönüşüm danışmanlığı"
"""
from __future__ import annotations

import json
import time
import csv
from datetime import datetime
from pathlib import Path
from typing import Optional
from urllib.parse import quote_plus, urlparse

import typer
from rich.console import Console
from rich.progress import Progress, SpinnerColumn, TextColumn
from rich.table import Table
from scrapling.fetchers import Fetcher

app = typer.Typer(help="SERP Sıralama Takipçisi")
console = Console()

REPORTS_DIR = Path(__file__).parent.parent / "reports"
REPORTS_DIR.mkdir(exist_ok=True)
TRACKER_CSV = REPORTS_DIR / "09_serp_rank_history.csv"

TARGET_DOMAIN = "ecypro.com"
GOOGLE_SEARCH = "https://www.google.com/search"

# istek3.txt'ten çıkartılmış + sektör araştırması
TARGET_KEYWORDS = [
    # Türkçe (birincil pazar)
    "stratejik danışmanlık",
    "kurumsal danışmanlık istanbul",
    "dijital dönüşüm danışmanlığı",
    "yönetim danışmanlığı",
    "operasyonel verimlilik danışmanlığı",
    "yapay zeka danışmanlığı",
    "CFO danışmanlık hizmetleri",
    # İngilizce (uluslararası)
    "strategic consulting istanbul",
    "management consulting turkey",
    "digital transformation consulting",
    "AI strategy consulting",
    "ecypro consulting",
]


def search_google(fetcher: Fetcher, keyword: str, num_results: int = 30, headless: bool = False) -> list[dict]:
    """Google arama yap, ilk N sonucu çek."""
    query = quote_plus(keyword)
    url = f"{GOOGLE_SEARCH}?q={query}&hl=tr&gl=tr&num={num_results}&pws=0"

    results: list[dict] = []
    try:
        if headless:
            from scrapling.fetchers import StealthyFetcher  # type: ignore
            page = StealthyFetcher.fetch(url, headless=True, network_idle=True, timeout=30)
        else:
            page = fetcher.get(url, timeout=20, retries=1)

        if not page:
            return []

        # Google sonuç linkleri — birden fazla selector dene
        result_links = (
            page.css('div.g a[href^="http"]') or
            page.css('a[data-ved][href^="http"]') or
            page.css('h3 ~ a') or
            page.css('.yuRUbf a')
        )

        seen: set[str] = set()
        rank = 0
        for link in result_links:
            href = link.attrib.get("href", "")
            if not href or "google.com" in href:
                continue
            domain = urlparse(href).netloc.replace("www.", "")
            if href in seen:
                continue
            seen.add(href)
            rank += 1
            title_el = link.css_first("h3")
            title = (title_el.text or "").strip() if title_el else ""
            results.append({
                "rank": rank,
                "url": href[:100],
                "domain": domain,
                "title": title[:80],
            })
            if rank >= num_results:
                break

    except Exception as exc:
        console.print(f"  [red]SERP hata: {str(exc)[:60]}[/]")

    return results


def find_position(results: list[dict], domain: str = TARGET_DOMAIN) -> Optional[int]:
    for r in results:
        if domain in r.get("domain", ""):
            return r["rank"]
    return None


def append_to_history(data: list[dict]) -> None:
    """Sıralama geçmişini CSV'ye ekle."""
    exists = TRACKER_CSV.exists()
    with TRACKER_CSV.open("a", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["date", "keyword", "position", "domain", "top_url"])
        if not exists:
            writer.writeheader()
        for row in data:
            writer.writerow(row)


def load_history() -> list[dict]:
    if not TRACKER_CSV.exists():
        return []
    rows = []
    with TRACKER_CSV.open(encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append(dict(row))
    return rows


def build_report(keyword_results: list[dict], history: list[dict], date: str) -> str:
    lines = [
        "# EcyPro SERP Sıralama Raporu",
        "",
        f"**Tarih:** {date}  ",
        f"**Domain:** {TARGET_DOMAIN}  ",
        f"**Anahtar Kelime:** {len(keyword_results)}  ",
        "",
        "> istek3.txt: 'İlerleyen aşamalarda ahrefs veya semrush kullanılması faydalı olur.'",
        "> Bu rapor bedava Scrapling tabanlı alternatiftir.",
        "",
        "---",
        "",
        "## Sıralama Tablosu",
        "",
        "| Anahtar Kelime | Sıralama | URL | Top 1 Domain |",
        "|---|---|---|---|",
    ]
    for r in keyword_results:
        pos = r["position"]
        pos_str = f"**#{pos}**" if pos and pos <= 10 else (f"#{pos}" if pos else "❌ Bulunamadı")
        kw = r["keyword"]
        url = r.get("our_url", "—")[:50]
        top1 = r.get("top_domain", "—")
        lines.append(f"| {kw} | {pos_str} | `{url}` | {top1} |")

    lines += ["", "---", "", "## Rakip Karşılaştırması", ""]
    for r in keyword_results[:5]:
        if not r.get("competitors"):
            continue
        lines.append(f"### Keyword: `{r['keyword']}`")
        lines += ["", "| Sıra | Domain | Title |", "|---|---|---|"]
        for c in r["competitors"][:5]:
            row_str = f"| {c['rank']} | **{c['domain']}**" if TARGET_DOMAIN in c['domain'] else f"| {c['rank']} | {c['domain']}"
            lines.append(f"{row_str} | {c['title'][:50]} |")
        lines.append("")

    if history:
        lines += [
            "---",
            "",
            "## Sıralama Trendi (Son 10 Kayıt)",
            "",
            "| Tarih | Keyword | Pozisyon |",
            "|---|---|---|",
        ]
        for h in history[-10:]:
            pos_val = h.get("position", "?")
            lines.append(f"| {h.get('date','')} | {h.get('keyword','')} | #{pos_val} |")

    lines += [
        "",
        "---",
        "",
        "## Aksiyon Planı",
        "",
        "**Sıralama Yok / Düşük (>50):**",
        "1. On-page SEO: keyword'ü title + H1 + meta desc'e ekle",
        "2. Content: 1500+ kelime, keyword yoğunluğu %1-3",
        "3. Backlink: Bu keyword için outreach başlat",
        "4. İç linking: Ana keyword sayfasına diğer sayfalardan link ver",
        "",
        "**Sıralama Var (11-50):**",
        "1. Click-through rate optimizasyonu: meta desc iyileştir",
        "2. İçerik derinleştir: Rakip içerikleri analiz et (Script 01)",
        "3. Yapılandırılmış veri: FAQ schema ekle (zengin snippet için)",
        "",
        "_Scrapling ile otomatik üretilmiştir._",
    ]
    return "\n".join(lines)


@app.command()
def run(
    keyword: Optional[str] = typer.Option(None, "--keyword", "-k"),
    headless: bool = typer.Option(False, "--headless", help="StealthyFetcher (Playwright gerekir)"),
    delay: float = typer.Option(5.0, "--delay", "-d", help="SERP sorguları arası bekleme"),
    num_results: int = typer.Option(30, "--num", help="Kontrol edilecek SERP derinliği"),
    output: str = typer.Option("both", "--output"),
) -> None:
    """
    Hedef anahtar kelimeler için Google sıralamalarını takip et.
    
    NOT: Headless mod Playwright gerektirir.
         python3 -m pip install scrapling playwright
         python3 -m scrapling install
    """
    if not headless:
        console.print("[yellow]⚠ Headless mod kapalı — Sınırlı sonuçlar (Google bot-detection)[/]")
        console.print("[dim]Tam sıralama için: --headless (Playwright kurulu olmalı)[/]\n")

    keywords = [keyword] if keyword else TARGET_KEYWORDS
    console.rule("[bold cyan]SERP Sıralama Takipçisi[/]")
    console.print(f"[dim]{len(keywords)} keyword · {delay}s gecikme · {num_results} SERP derinliği[/]\n")

    fetcher = Fetcher(auto_match=False)
    date_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
    date_short = datetime.utcnow().strftime("%Y-%m-%d")

    all_results: list[dict] = []
    history_rows: list[dict] = []

    with Progress(SpinnerColumn(), TextColumn("{task.description}"), console=console) as prog:
        task = prog.add_task("SERP sorgulanıyor...", total=len(keywords))
        for kw in keywords:
            prog.update(task, description=f"[cyan]{kw[:40]}[/]")
            serp = search_google(fetcher, kw, num_results=num_results, headless=headless)
            position = find_position(serp, TARGET_DOMAIN)
            our_result = next((r for r in serp if TARGET_DOMAIN in r.get("domain", "")), None)
            top_result = serp[0] if serp else {}

            icon = "🟢" if position and position <= 10 else ("🟡" if position and position <= 30 else "❌")
            console.print(f"  {icon} '{kw}' → {f'#{position}' if position else 'Bulunamadı'}")

            result_entry: dict = {
                "keyword": kw,
                "position": position,
                "our_url": our_result.get("url", "") if our_result else "",
                "top_domain": top_result.get("domain", ""),
                "competitors": serp[:10],
            }
            all_results.append(result_entry)
            history_rows.append({
                "date": date_short,
                "keyword": kw,
                "position": str(position) if position else "—",
                "domain": TARGET_DOMAIN,
                "top_url": our_result.get("url", "") if our_result else "",
            })

            prog.advance(task)
            time.sleep(delay)

    # Geçmişe ekle
    append_to_history(history_rows)
    history = load_history()

    ts = datetime.utcnow().strftime("%Y%m%d_%H%M")
    saved = []
    if output in ("json", "both"):
        p = REPORTS_DIR / f"09_serp_rank_{ts}.json"
        p.write_text(json.dumps(all_results, indent=2, ensure_ascii=False), encoding="utf-8")
        saved.append(str(p))
    if output in ("md", "both"):
        p = REPORTS_DIR / f"09_serp_rank_{ts}.md"
        p.write_text(build_report(all_results, history, date_str), encoding="utf-8")
        saved.append(str(p))

    # Özet tablo
    table = Table(title="SERP Sıralama Özeti")
    table.add_column("Keyword", max_width=35)
    table.add_column("Sıralama", style="cyan")
    table.add_column("Top 1")
    for r in all_results:
        pos = r["position"]
        pos_str = f"#{pos}" if pos else "—"
        style = "green" if pos and pos <= 10 else ("yellow" if pos and pos <= 30 else "red")
        table.add_row(r["keyword"][:35], f"[{style}]{pos_str}[/]", r.get("top_domain", "—")[:20])
    console.print(table)

    ranked = sum(1 for r in all_results if r["position"])
    console.print(f"\n[cyan]Sonuç:[/] {ranked}/{len(all_results)} keyword'de sıralama tespit edildi")
    console.print(f"[dim]Tarih geçmişi: {TRACKER_CSV}[/]")
    for p in saved:
        console.print(f"[green]✓ {p}[/]")


if __name__ == "__main__":
    app()
