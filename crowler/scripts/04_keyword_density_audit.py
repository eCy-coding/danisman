#!/usr/bin/env python3
"""
04_keyword_density_audit.py — EcyPro Keyword Yoğunluk & Meta Analizi
Her sayfadaki H1/H2/H3 etiketlerini, meta title/desc karakterlerini,
hedef keyword varlığını ve on-page SEO skoru hesaplar.

On-Page SEO Skoru (0-100):
  - Title mevcut +10 | 50-60 karakter +10
  - Meta desc mevcut +10 | 130-160 karakter +10
  - H1 mevcut +15 | H1 tek +5
  - Keyword in title +10
  - Keyword in meta desc +10
  - Keyword in H1 +10
  - Word count > 300 +5 | > 600 +5

Kullanım:
  python3 scripts/04_keyword_density_audit.py
  python3 scripts/04_keyword_density_audit.py --keyword "stratejik danışmanlık"
"""
from __future__ import annotations

import json
import re
import time
import xml.etree.ElementTree as ET
from collections import Counter
from datetime import datetime
from pathlib import Path
from urllib.parse import urljoin, urlparse
from typing import Optional

import typer
from rich.console import Console
from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn
from rich.table import Table
from scrapling.fetchers import Fetcher

app = typer.Typer(help="Keyword Yoğunluk & Meta SEO Analizi")
console = Console()

REPORTS_DIR = Path(__file__).parent.parent / "reports"
REPORTS_DIR.mkdir(exist_ok=True)
SITEMAP_PATH = Path(__file__).parent.parent.parent / "public" / "sitemap.xml"
DEFAULT_BASE = "http://localhost:4173"

# EcyPro'nun hedef anahtar kelimeleri (istek3.txt'ten + sektör araştırması)
TARGET_KEYWORDS = [
    "stratejik danışmanlık",
    "strategic consulting",
    "kurumsal danışmanlık",
    "dijital dönüşüm",
    "digital transformation",
    "operasyonel verimlilik",
    "operational excellence",
    "yönetim danışmanlığı",
    "management consulting",
    "ecypro",
]

STOPWORDS_TR = {"ve", "bir", "bu", "ile", "de", "da", "için", "olan", "olan", "var", "daha", "en", "çok", "gibi", "ya", "ya", "biz", "siz", "onlar", "ben", "o"}
STOPWORDS_EN = {"the", "a", "an", "in", "on", "at", "of", "for", "to", "is", "are", "was", "and", "or", "but", "with", "from", "by", "as", "it", "that", "this", "be"}


def seo_score(audit: dict, keyword: str) -> int:
    score = 0
    title = (audit.get("title") or "").lower()
    meta_d = (audit.get("meta_description") or "").lower()
    h1s = [h.lower() for h in audit.get("h1", [])]
    words = audit.get("word_count", 0)
    kw = keyword.lower()

    if title:
        score += 10
        tlen = len(title)
        if 50 <= tlen <= 70:
            score += 10
    if meta_d:
        score += 10
        mlen = len(meta_d)
        if 130 <= mlen <= 165:
            score += 10
    if h1s:
        score += 15
        if len(h1s) == 1:
            score += 5
    if kw and kw in title:
        score += 10
    if kw and kw in meta_d:
        score += 10
    if kw and any(kw in h for h in h1s):
        score += 10
    if words > 300:
        score += 5
    if words > 600:
        score += 5
    return min(score, 100)


def extract_top_keywords(text: str, n: int = 15) -> list[tuple[str, int]]:
    words = re.findall(r"\b[a-züğışöçA-ZÜĞİŞÖÇ]{4,}\b", text.lower())
    filtered = [w for w in words if w not in STOPWORDS_TR and w not in STOPWORDS_EN]
    return Counter(filtered).most_common(n)


def audit_page(fetcher: Fetcher, url: str, primary_keyword: str) -> dict:
    result: dict = {
        "url": url,
        "title": None,
        "title_len": 0,
        "meta_description": None,
        "meta_desc_len": 0,
        "h1": [],
        "h2": [],
        "h3": [],
        "word_count": 0,
        "top_keywords": [],
        "keyword_in_title": False,
        "keyword_in_meta": False,
        "keyword_in_h1": False,
        "seo_score": 0,
        "issues": [],
        "status": "ok",
        "error": None,
    }
    try:
        page = fetcher.get(url, timeout=15, retries=1)
        if not page:
            result["status"] = "empty"
            return result

        # Title
        title_el = page.css_first("title")
        title = title_el.text.strip() if title_el else ""
        result["title"] = title
        result["title_len"] = len(title)
        if not title:
            result["issues"].append("TITLE_MISSING")
        elif len(title) < 30:
            result["issues"].append(f"TITLE_TOO_SHORT ({len(title)}c)")
        elif len(title) > 70:
            result["issues"].append(f"TITLE_TOO_LONG ({len(title)}c)")

        # Meta description
        meta_el = page.css_first('meta[name="description"]')
        meta_desc = meta_el.attrib.get("content", "").strip() if meta_el else ""
        result["meta_description"] = meta_desc
        result["meta_desc_len"] = len(meta_desc)
        if not meta_desc:
            result["issues"].append("META_DESC_MISSING")
        elif len(meta_desc) < 100:
            result["issues"].append(f"META_DESC_SHORT ({len(meta_desc)}c)")
        elif len(meta_desc) > 170:
            result["issues"].append(f"META_DESC_LONG ({len(meta_desc)}c)")

        # Headings
        result["h1"] = [el.text.strip() for el in page.css("h1") if el.text][:5]
        result["h2"] = [el.text.strip() for el in page.css("h2") if el.text][:8]
        result["h3"] = [el.text.strip() for el in page.css("h3") if el.text][:8]

        if not result["h1"]:
            result["issues"].append("H1_MISSING")
        elif len(result["h1"]) > 1:
            result["issues"].append(f"MULTIPLE_H1 ({len(result['h1'])})")

        # Word count from body text
        body = page.css_first("body")
        if body:
            text = body.text or ""
            words = text.split()
            result["word_count"] = len(words)
            result["top_keywords"] = [(k, c) for k, c in extract_top_keywords(text)]
            if len(words) < 300:
                result["issues"].append(f"LOW_WORD_COUNT ({len(words)})")

        # Keyword presence
        kw = primary_keyword.lower()
        result["keyword_in_title"] = kw in title.lower()
        result["keyword_in_meta"] = kw in meta_desc.lower()
        result["keyword_in_h1"] = any(kw in h.lower() for h in result["h1"])

        if kw and not result["keyword_in_title"]:
            result["issues"].append("KEYWORD_NOT_IN_TITLE")
        if kw and not result["keyword_in_h1"] and result["h1"]:
            result["issues"].append("KEYWORD_NOT_IN_H1")

        result["seo_score"] = seo_score(result, primary_keyword)

    except Exception as exc:
        result["status"] = "error"
        result["error"] = str(exc)[:200]

    return result


def score_color(score: int) -> str:
    if score >= 80:
        return "green"
    if score >= 60:
        return "yellow"
    return "red"


def load_sitemap_urls(base: str) -> list[str]:
    if not SITEMAP_PATH.exists():
        return []
    tree = ET.parse(SITEMAP_PATH)
    root = tree.getroot()
    ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    urls = []
    for loc in root.findall(".//sm:loc", ns):
        text = (loc.text or "").strip()
        path = urlparse(text).path or "/"
        urls.append(urljoin(base, path))
    return list(dict.fromkeys(urls))[:30]  # ilk 30 sayfa


def build_report(results: list[dict], keyword: str, base: str) -> str:
    now = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
    avg_score = sum(r["seo_score"] for r in results) / max(len(results), 1)
    lines = [
        "# EcyPro Keyword Yoğunluk & Meta SEO Raporu",
        "",
        f"**Üretildi:** {now}  ",
        f"**Hedef Keyword:** `{keyword}`  ",
        f"**Analiz Edilen:** {len(results)} sayfa  ",
        f"**Ortalama SEO Skoru:** {avg_score:.1f}/100  ",
        "",
        "---",
        "",
        "## SEO Skoru Tablosu",
        "",
        "| Sayfa | SEO Skoru | Title (c) | Meta (c) | H1 | Keyword in Title | Word Count |",
        "|---|---|---|---|---|---|---|",
    ]
    for r in sorted(results, key=lambda x: x["seo_score"]):
        path = urlparse(r["url"]).path
        score = r["seo_score"]
        emoji = "🟢" if score >= 80 else ("🟡" if score >= 60 else "🔴")
        kit = "✅" if r["keyword_in_title"] else "❌"
        h1_text = r["h1"][0][:35] + "…" if r["h1"] and len(r["h1"][0]) > 35 else (r["h1"][0] if r["h1"] else "—")
        lines.append(f"| `{path}` | {emoji} {score} | {r['title_len']} | {r['meta_desc_len']} | {h1_text} | {kit} | {r['word_count']:,} |")

    lines += ["", "---", "", "## Sayfa Detayları", ""]
    for r in results:
        path = urlparse(r["url"]).path
        issues_str = ", ".join(r["issues"]) if r["issues"] else "Sorun yok"
        lines += [
            f"### `{path}` — {r['seo_score']}/100",
            f"",
            f"**Title:** `{r['title'] or '—'}` ({r['title_len']}c)  ",
            f"**Meta:** {(r['meta_description'] or '—')[:100]}… ({r['meta_desc_len']}c)  ",
            f"**H1:** {r['h1'][0][:80] if r['h1'] else '—'}  ",
            f"**Kelime:** {r['word_count']:,}  ",
            f"**Sorunlar:** {issues_str}  ",
        ]
        if r.get("top_keywords"):
            top5 = ", ".join(f"{k}({c})" for k, c in r["top_keywords"][:5])
            lines.append(f"**Top Keywords:** {top5}  ")
        lines.append("")

    lines += [
        "---",
        "",
        "## Genel Öneriler",
        "",
        f"- Hedef keyword `{keyword}` tüm sayfa title'larına eklenmelidir",
        "- Meta description 130-160 karakter arasında olmalı",
        "- Her sayfa için tek ve benzersiz H1 kullanın",
        "- Blog yazıları için 800+ kelime hedefleyin (rakip ortalaması 1200+)",
        "- Title 50-60 karakter (Google SERP snippet için optimal)",
        "",
        "_Scrapling ile otomatik üretilmiştir._",
    ]
    return "\n".join(lines)


@app.command()
def run(
    base: str = typer.Option(DEFAULT_BASE, "--base", "-b"),
    keyword: str = typer.Option("stratejik danışmanlık", "--keyword", "-k", help="Hedef keyword"),
    delay: float = typer.Option(0.5, "--delay"),
    output: str = typer.Option("both", "--output"),
) -> None:
    """Tüm EcyPro sayfalarının on-page SEO analizini yap."""
    console.rule("[bold cyan]Keyword Yoğunluk & Meta Audit[/]")
    console.print(f"[dim]Hedef keyword: '{keyword}' · Base: {base}[/]\n")

    fetcher = Fetcher(auto_match=False)
    pages = load_sitemap_urls(base)
    if not pages:
        pages = [base + p for p in ["/", "/services", "/blog", "/about", "/contact", "/pricing", "/methodology", "/case-studies"]]

    all_results: list[dict] = []
    with Progress(SpinnerColumn(), TextColumn("{task.description}"), BarColumn(), TextColumn("{task.completed}/{task.total}"), console=console) as prog:
        task = prog.add_task("Analiz...", total=len(pages))
        for url in pages:
            prog.update(task, description=f"[cyan]{urlparse(url).path[:35]}[/]")
            r = audit_page(fetcher, url, keyword)
            all_results.append(r)
            score = r["seo_score"]
            emoji = "🟢" if score >= 80 else ("🟡" if score >= 60 else "🔴")
            console.print(f"  {emoji} {urlparse(url).path} — {score}/100 — {len(r['issues'])} sorun")
            prog.advance(task)
            time.sleep(delay)

    ts = datetime.utcnow().strftime("%Y%m%d_%H%M")
    saved = []
    if output in ("json", "both"):
        p = REPORTS_DIR / f"04_keyword_audit_{ts}.json"
        data_out = [{k: v for k, v in r.items() if k != "top_keywords"} | {"top5_keywords": r.get("top_keywords", [])[:5]} for r in all_results]
        p.write_text(json.dumps(data_out, indent=2, ensure_ascii=False), encoding="utf-8")
        saved.append(str(p))
    if output in ("md", "both"):
        p = REPORTS_DIR / f"04_keyword_audit_{ts}.md"
        p.write_text(build_report(all_results, keyword, base), encoding="utf-8")
        saved.append(str(p))

    avg = sum(r["seo_score"] for r in all_results) / max(len(all_results), 1)
    table = Table(title=f"SEO Özeti — Keyword: '{keyword}'")
    table.add_column("Metrik")
    table.add_column("Değer", style="cyan")
    table.add_row("Analiz Edilen", str(len(all_results)))
    table.add_row("Ortalama SEO Skoru", f"{avg:.1f}/100")
    table.add_row("🟢 80+", str(sum(1 for r in all_results if r["seo_score"] >= 80)))
    table.add_row("🟡 60-79", str(sum(1 for r in all_results if 60 <= r["seo_score"] < 80)))
    table.add_row("🔴 <60", str(sum(1 for r in all_results if r["seo_score"] < 60)))
    console.print(table)
    for p in saved:
        console.print(f"[green]✓ {p}[/]")


if __name__ == "__main__":
    app()
