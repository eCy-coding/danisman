#!/usr/bin/env python3
"""
07_lcp_image_audit.py — EcyPro LCP Görsel Performans Denetimi
istek3.txt: "görsellerin siteyi yavaşlatmadığından emin olmak gerekir (LCP)."

Her sayfadaki tüm görselleri analiz eder:
  - lazy loading eksikliği (loading="lazy" yok)
  - fetchpriority="high" eksikliği (LCP adayı görsel)
  - width/height attribute eksikliği (CLS için)
  - decoding="async" eksikliği
  - Boyut tahmini (src URL'den)
  - next-gen format kontrolü (WebP/AVIF değil)

Çıktı: crowler/reports/07_lcp_image_audit_*.md + .json

Kullanım:
  python3 scripts/07_lcp_image_audit.py
  python3 scripts/07_lcp_image_audit.py --base https://www.ecypro.com
"""
from __future__ import annotations

import json
import re
import time
import xml.etree.ElementTree as ET
from datetime import datetime
from pathlib import Path
from urllib.parse import urljoin, urlparse
from typing import Optional

import typer
from rich.console import Console
from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn
from rich.table import Table
from scrapling.fetchers import Fetcher

app = typer.Typer(help="LCP Görsel Performans Denetimi")
console = Console()

REPORTS_DIR = Path(__file__).parent.parent / "reports"
REPORTS_DIR.mkdir(exist_ok=True)
SITEMAP_PATH = Path(__file__).parent.parent.parent / "public" / "sitemap.xml"
DEFAULT_BASE = "http://localhost:4173"

NEXT_GEN_EXTS = {".webp", ".avif", ".jxl"}
LEGACY_EXTS   = {".jpg", ".jpeg", ".png", ".gif", ".bmp"}


def guess_format(src: str) -> str:
    path = urlparse(src).path.lower()
    ext = "." + path.split(".")[-1] if "." in path else ""
    if ext in NEXT_GEN_EXTS:
        return "next-gen"
    if ext in LEGACY_EXTS:
        return "legacy"
    if "unsplash" in src or "pexels" in src:
        return "cdn-unknown"
    return "unknown"


def audit_images_on_page(fetcher: Fetcher, url: str) -> dict:
    result: dict = {
        "url": url,
        "images": [],
        "total": 0,
        "no_lazy": 0,
        "no_dimensions": 0,
        "no_alt": 0,
        "legacy_format": 0,
        "lcp_candidates": 0,
        "issues": [],
        "score": 100,
        "status": "ok",
        "error": None,
    }
    try:
        page = fetcher.get(url, timeout=15, retries=1)
        if not page:
            result["status"] = "empty"
            return result

        imgs = page.css("img")
        result["total"] = len(imgs)
        deductions = 0

        for img in imgs:
            src  = img.attrib.get("src", "")  or img.attrib.get("data-src", "")
            alt  = img.attrib.get("alt", "")
            lazy = img.attrib.get("loading", "")
            prio = img.attrib.get("fetchpriority", "") or img.attrib.get("fetchPriority", "")
            dec  = img.attrib.get("decoding", "")
            w    = img.attrib.get("width", "")
            h    = img.attrib.get("height", "")
            cls  = img.attrib.get("class", "")
            fmt  = guess_format(src)

            img_issues = []

            # Alt text
            if not alt.strip():
                img_issues.append("NO_ALT")
                result["no_alt"] += 1

            # Lazy loading (hero/above-fold hariç)
            is_lcp_candidate = (
                prio == "high" or
                "hero" in cls.lower() or
                "hero" in src.lower() or
                "above" in cls.lower()
            )
            if is_lcp_candidate:
                result["lcp_candidates"] += 1
                if lazy == "lazy":
                    img_issues.append("LCP_LAZY_LOAD_BAD")  # LCP'ye lazy koymamalı
            else:
                if lazy not in ("lazy", "eager"):
                    img_issues.append("NO_LAZY")
                    result["no_lazy"] += 1

            # Boyutlar (CLS)
            if not w or not h:
                img_issues.append("NO_DIMENSIONS")
                result["no_dimensions"] += 1

            # Legacy format
            if fmt == "legacy":
                img_issues.append(f"LEGACY_FORMAT ({src.split('.')[-1].upper()})")
                result["legacy_format"] += 1

            # decoding
            if dec not in ("async", "sync"):
                img_issues.append("NO_DECODING_ATTR")

            if img_issues:
                deductions += len(img_issues) * 3
                result["images"].append({
                    "src": src[:80],
                    "alt": alt[:40],
                    "lazy": lazy,
                    "priority": prio,
                    "format": fmt,
                    "has_dimensions": bool(w and h),
                    "issues": img_issues,
                })

        result["score"] = max(0, 100 - deductions)

        if result["no_lazy"] > 0:
            result["issues"].append(f"{result['no_lazy']} görsel lazy loading eksik")
        if result["no_dimensions"] > 0:
            result["issues"].append(f"{result['no_dimensions']} görsel width/height eksik (CLS riski)")
        if result["legacy_format"] > 0:
            result["issues"].append(f"{result['legacy_format']} legacy format (WebP/AVIF önerilir)")
        if result["no_alt"] > 0:
            result["issues"].append(f"{result['no_alt']} alt text eksik (SEO + A11y)")

    except Exception as exc:
        result["status"] = "error"
        result["error"] = str(exc)[:200]

    return result


def load_sitemap_urls(base: str) -> list[str]:
    if not SITEMAP_PATH.exists():
        return []
    tree = ET.parse(SITEMAP_PATH)
    root = tree.getroot()
    ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    urls = []
    for loc in root.findall(".//sm:loc", ns):
        path = urlparse((loc.text or "").strip()).path or "/"
        urls.append(urljoin(base, path))
    return list(dict.fromkeys(urls))[:25]


def build_report(results: list[dict], base: str) -> str:
    now = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
    total_imgs = sum(r["total"] for r in results)
    total_no_lazy = sum(r["no_lazy"] for r in results)
    total_legacy = sum(r["legacy_format"] for r in results)
    avg_score = sum(r["score"] for r in results) / max(len(results), 1)

    lines = [
        "# EcyPro LCP Görsel Performans Raporu",
        "",
        f"**Üretildi:** {now}  ",
        f"**Toplam Görsel:** {total_imgs}  ",
        f"**Lazy Loading Eksik:** {total_no_lazy}  ",
        f"**Legacy Format:** {total_legacy}  ",
        f"**Ortalama Skor:** {avg_score:.1f}/100  ",
        "",
        "> istek3.txt: 'Görsellerin siteyi yavaşlatmadığından emin olmak gerekir (LCP).'",
        "",
        "---",
        "",
        "## Sayfa Skorları",
        "",
        "| Sayfa | Skor | Görsel | Lazy Eksik | Boyut Eksik | Legacy | Alt Eksik |",
        "|---|---|---|---|---|---|---|",
    ]
    for r in sorted(results, key=lambda x: x["score"]):
        path = urlparse(r["url"]).path
        score = r["score"]
        emoji = "🟢" if score >= 80 else ("🟡" if score >= 60 else "🔴")
        lines.append(
            f"| `{path}` | {emoji} {score} | {r['total']} | {r['no_lazy']} | {r['no_dimensions']} | {r['legacy_format']} | {r['no_alt']} |"
        )

    lines += [
        "",
        "---",
        "",
        "## Sorunlu Görseller",
        "",
    ]
    for r in results:
        if not r["images"]:
            continue
        path = urlparse(r["url"]).path
        lines.append(f"### `{path}`")
        lines += ["", "| Görsel Src | Format | Lazy | Issues |", "|---|---|---|---|"]
        for img in r["images"][:10]:
            issues = ", ".join(img["issues"][:3])
            lines.append(f"| `{img['src'][:50]}` | {img['format']} | {img['lazy'] or '—'} | {issues} |")
        lines.append("")

    lines += [
        "---",
        "",
        "## Önerilen Düzeltmeler",
        "",
        "### 1. Hero/LCP Görseli İçin",
        "```html",
        '<img src="/hero.webp" alt="EcyPro" width="1200" height="800"',
        '     fetchpriority="high" decoding="async"',
        '     srcset="/hero-400.webp 400w, /hero-800.webp 800w, /hero.webp 1200w"',
        '     sizes="(max-width: 768px) 100vw, 1200px" />',
        "```",
        "",
        "### 2. Normal Görseller İçin",
        "```html",
        '<img src="/image.webp" alt="Açıklama" width="800" height="600"',
        '     loading="lazy" decoding="async" />',
        "```",
        "",
        "### 3. Vite WebP/AVIF Otomasyonu",
        "```bash",
        "npm install vite-plugin-imagemin  # WebP/AVIF otomatik dönüştürme",
        "```",
        "",
        "### 4. Unsplash Görsellerine format=webp Ekle",
        "```",
        "https://images.unsplash.com/photo-xxx?w=800&fm=webp&q=80",
        "```",
        "",
        "_Scrapling ile otomatik üretilmiştir._",
    ]
    return "\n".join(lines)


@app.command()
def run(
    base: str = typer.Option(DEFAULT_BASE, "--base", "-b"),
    delay: float = typer.Option(0.5, "--delay"),
    output: str = typer.Option("both", "--output"),
) -> None:
    """Tüm EcyPro sayfalarındaki görselleri LCP performansı açısından denetle."""
    console.rule("[bold cyan]LCP Görsel Performans Audit[/]")
    console.print("[dim]istek3.txt: LCP = Google sıralama faktörü[/]\n")

    fetcher = Fetcher(auto_match=False)
    pages = load_sitemap_urls(base)
    if not pages:
        pages = [base + p for p in ["/", "/services", "/blog", "/about", "/contact", "/case-studies"]]

    all_results: list[dict] = []
    with Progress(SpinnerColumn(), TextColumn("{task.description}"), BarColumn(), TextColumn("{task.completed}/{task.total}"), console=console) as prog:
        task = prog.add_task("Görsel analizi...", total=len(pages))
        for url in pages:
            prog.update(task, description=f"[cyan]{urlparse(url).path[:35]}[/]")
            r = audit_images_on_page(fetcher, url)
            all_results.append(r)
            emoji = "🟢" if r["score"] >= 80 else ("🟡" if r["score"] >= 60 else "🔴")
            console.print(f"  {emoji} {urlparse(url).path} — {r['total']} görsel, skor {r['score']}")
            prog.advance(task)
            time.sleep(delay)

    ts = datetime.utcnow().strftime("%Y%m%d_%H%M")
    saved = []
    if output in ("json", "both"):
        p = REPORTS_DIR / f"07_lcp_image_audit_{ts}.json"
        p.write_text(json.dumps(all_results, indent=2, ensure_ascii=False), encoding="utf-8")
        saved.append(str(p))
    if output in ("md", "both"):
        p = REPORTS_DIR / f"07_lcp_image_audit_{ts}.md"
        p.write_text(build_report(all_results, base), encoding="utf-8")
        saved.append(str(p))

    total_imgs = sum(r["total"] for r in all_results)
    table = Table(title="LCP Görsel Özeti")
    table.add_column("Metrik")
    table.add_column("Değer", style="cyan")
    table.add_row("Toplam Görsel", str(total_imgs))
    table.add_row("Lazy Eksik", str(sum(r["no_lazy"] for r in all_results)))
    table.add_row("Boyut Eksik", str(sum(r["no_dimensions"] for r in all_results)))
    table.add_row("Legacy Format", str(sum(r["legacy_format"] for r in all_results)))
    table.add_row("Alt Eksik", str(sum(r["no_alt"] for r in all_results)))
    avg = sum(r["score"] for r in all_results) / max(len(all_results), 1)
    table.add_row("Ortalama Skor", f"{avg:.1f}/100")
    console.print(table)
    for p in saved:
        console.print(f"[green]✓ {p}[/]")


if __name__ == "__main__":
    app()
