#!/usr/bin/env python3
"""
03_canonical_hreflang_audit.py — EcyPro Canonical + Hreflang Denetimi
Tüm sayfaların canonical tagini ve hreflang implementasyonunu doğrular.
Sorunlu URL'leri öncelik sırasıyla raporlar.

Kontroller:
  - Canonical var mı? URL ile eşleşiyor mu?
  - Hreflang: tr + en versiyonları karşılıklı olarak tanımlanmış mı?
  - Self-referencing hreflang eksik mi?
  - x-default tag mevcut mu?
  - Canonical domain www/non-www tutarlılığı

Kullanım:
  python3 scripts/03_canonical_hreflang_audit.py
  python3 scripts/03_canonical_hreflang_audit.py --base https://www.ecypro.com
"""
from __future__ import annotations

import json
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

app = typer.Typer(help="Canonical + Hreflang Audit")
console = Console()

REPORTS_DIR = Path(__file__).parent.parent / "reports"
REPORTS_DIR.mkdir(exist_ok=True)
SITEMAP_PATH = Path(__file__).parent.parent.parent / "public" / "sitemap.xml"
DEFAULT_BASE = "http://localhost:4173"
PROD_BASE    = "https://www.ecypro.com"


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
    return list(dict.fromkeys(urls))


def audit_page(fetcher: Fetcher, url: str, prod_base: str) -> dict:
    result: dict = {
        "url": url,
        "canonical": None,
        "canonical_ok": None,
        "canonical_domain_ok": None,
        "hreflang_langs": [],
        "hreflang_self_ref": False,
        "hreflang_x_default": False,
        "hreflang_tr": None,
        "hreflang_en": None,
        "issues": [],
        "status": "ok",
        "error": None,
    }
    try:
        page = fetcher.get(url, timeout=15, retries=1)
        if not page:
            result["status"] = "empty"
            result["issues"].append("EMPTY_RESPONSE")
            return result

        # Canonical
        canonical_el = page.css_first('link[rel="canonical"]')
        canonical = canonical_el.attrib.get("href", "").strip() if canonical_el else None
        result["canonical"] = canonical

        if not canonical:
            result["canonical_ok"] = False
            result["issues"].append("CANONICAL_MISSING")
        else:
            parsed_c = urlparse(canonical)
            parsed_u = urlparse(url)
            # Canonical path eşleşmeli
            if parsed_c.path.rstrip("/") != parsed_u.path.rstrip("/"):
                result["canonical_ok"] = False
                result["issues"].append(f"CANONICAL_MISMATCH: {canonical}")
            else:
                result["canonical_ok"] = True
            # Domain www tutarlılığı
            prod_netloc = urlparse(prod_base).netloc
            if canonical.startswith("http") and parsed_c.netloc and parsed_c.netloc != prod_netloc:
                result["canonical_domain_ok"] = False
                result["issues"].append(f"CANONICAL_DOMAIN: {parsed_c.netloc} (expected: {prod_netloc})")
            else:
                result["canonical_domain_ok"] = True

        # Hreflang
        hreflang_els = page.css('link[rel="alternate"][hreflang]')
        langs: dict[str, str] = {}
        for el in hreflang_els:
            lang = el.attrib.get("hreflang", "").strip()
            href = el.attrib.get("href", "").strip()
            langs[lang] = href
            result["hreflang_langs"].append(lang)

        result["hreflang_tr"] = langs.get("tr")
        result["hreflang_en"] = langs.get("en")
        result["hreflang_x_default"] = "x-default" in langs

        # Self-referencing kontrolü
        url_path = urlparse(url).path.rstrip("/")
        current_lang_href = langs.get("tr") or langs.get("en") or ""
        self_ref_path = urlparse(current_lang_href).path.rstrip("/")
        result["hreflang_self_ref"] = url_path == self_ref_path

        if not langs:
            result["issues"].append("HREFLANG_MISSING")
        else:
            if "tr" not in langs:
                result["issues"].append("HREFLANG_TR_MISSING")
            if "en" not in langs:
                result["issues"].append("HREFLANG_EN_MISSING")
            if "x-default" not in langs:
                result["issues"].append("HREFLANG_XDEFAULT_MISSING")
            if not result["hreflang_self_ref"] and langs:
                result["issues"].append("HREFLANG_SELF_REF_MISSING")

    except Exception as exc:
        result["status"] = "error"
        result["error"] = str(exc)[:200]
        result["issues"].append(f"FETCH_ERROR: {str(exc)[:80]}")

    return result


def severity(issues: list[str]) -> str:
    if not issues:
        return "✅"
    critical = {"CANONICAL_MISSING", "HREFLANG_MISSING", "EMPTY_RESPONSE", "FETCH_ERROR"}
    if any(any(c in i for c in critical) for i in issues):
        return "🔴"
    return "🟡"


def build_report(results: list[dict], base: str) -> str:
    now = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
    critical = [r for r in results if severity(r["issues"]) == "🔴"]
    warning = [r for r in results if severity(r["issues"]) == "🟡"]
    ok = [r for r in results if severity(r["issues"]) == "✅"]

    lines = [
        "# EcyPro Canonical + Hreflang Audit",
        "",
        f"**Üretildi:** {now}  ",
        f"**Base:** {base}  ",
        f"**Toplam Sayfa:** {len(results)}  ",
        f"**🔴 Kritik:** {len(critical)} · **🟡 Uyarı:** {len(warning)} · **✅ Geçer:** {len(ok)}",
        "",
        "---",
        "",
        "## 🔴 Kritik Sorunlar",
        "",
    ]
    if critical:
        lines += ["| Sayfa | Sorunlar |", "|---|---|"]
        for r in critical:
            path = urlparse(r["url"]).path
            lines.append(f"| `{path}` | {'; '.join(r['issues'])} |")
    else:
        lines.append("Kritik sorun yok.")

    lines += ["", "## 🟡 Uyarılar", ""]
    if warning:
        lines += ["| Sayfa | Sorunlar |", "|---|---|"]
        for r in warning:
            path = urlparse(r["url"]).path
            lines.append(f"| `{path}` | {'; '.join(r['issues'])} |")
    else:
        lines.append("Uyarı yok.")

    lines += [
        "",
        "---",
        "",
        "## Tam Sonuçlar",
        "",
        "| Sayfa | Canonical | Canonical OK | TR | EN | x-default | Sorunlar |",
        "|---|---|---|---|---|---|---|",
    ]
    for r in results:
        path = urlparse(r["url"]).path
        canon = (r["canonical"] or "—")[-40:]
        c_ok = "✅" if r["canonical_ok"] else ("❌" if r["canonical_ok"] is False else "—")
        tr = "✅" if r["hreflang_tr"] else "❌"
        en = "✅" if r["hreflang_en"] else "❌"
        xd = "✅" if r["hreflang_x_default"] else "❌"
        issues = "; ".join(r["issues"])[:60] or "—"
        lines.append(f"| `{path}` | `{canon}` | {c_ok} | {tr} | {en} | {xd} | {issues} |")

    lines += [
        "",
        "---",
        "",
        "## Aksiyonlar",
        "",
        "1. Canonical eksik sayfalara `<link rel='canonical' href='https://www.ecypro.com/PATH' />` ekle",
        "2. Hreflang: Her sayfaya TR + EN + x-default alternate ekle",
        "3. Canonical domain → her zaman `https://www.ecypro.com` kullan (www)",
        "4. Self-referencing hreflang: Sayfa kendi diline ait alternatif URL'i göstermeli",
        "",
        "_Rapor Scrapling ile otomatik üretilmiştir._",
    ]
    return "\n".join(lines)


@app.command()
def run(
    base: str = typer.Option(DEFAULT_BASE, "--base", "-b"),
    prod_base: str = typer.Option(PROD_BASE, "--prod"),
    delay: float = typer.Option(0.5, "--delay", "-d"),
    output: str = typer.Option("both", "--output", "-o"),
) -> None:
    """Tüm sayfaların canonical ve hreflang tag'lerini denetle."""
    console.rule("[bold cyan]Canonical + Hreflang Audit[/]")
    fetcher = Fetcher(auto_match=False)

    pages = load_sitemap_urls(base)
    if not pages:
        pages = [base + p for p in ["/", "/services", "/blog", "/about", "/contact", "/pricing", "/case-studies", "/methodology"]]

    console.print(f"[cyan]{len(pages)} sayfa kontrol edilecek[/]\n")
    all_results: list[dict] = []

    with Progress(SpinnerColumn(), TextColumn("{task.description}"), BarColumn(), TextColumn("{task.completed}/{task.total}"), console=console) as prog:
        task = prog.add_task("Taranıyor...", total=len(pages))
        for page_url in pages:
            prog.update(task, description=f"[cyan]{urlparse(page_url).path[:35]}[/]")
            r = audit_page(fetcher, page_url, prod_base)
            all_results.append(r)
            icon = severity(r["issues"])
            console.print(f"  {icon} {urlparse(page_url).path} — {'; '.join(r['issues'][:2]) or 'OK'}")
            prog.advance(task)
            time.sleep(delay)

    ts = datetime.utcnow().strftime("%Y%m%d_%H%M")
    saved = []
    if output in ("json", "both"):
        p = REPORTS_DIR / f"03_canonical_hreflang_{ts}.json"
        p.write_text(json.dumps(all_results, indent=2, ensure_ascii=False), encoding="utf-8")
        saved.append(str(p))
    if output in ("md", "both"):
        p = REPORTS_DIR / f"03_canonical_hreflang_{ts}.md"
        p.write_text(build_report(all_results, base), encoding="utf-8")
        saved.append(str(p))

    # Table
    critical_n = sum(1 for r in all_results if severity(r["issues"]) == "🔴")
    warning_n = sum(1 for r in all_results if severity(r["issues"]) == "🟡")
    ok_n = sum(1 for r in all_results if severity(r["issues"]) == "✅")
    table = Table(title="Canonical + Hreflang Özeti")
    table.add_column("Kategori", style="bold")
    table.add_column("Sayı", style="cyan")
    table.add_row("🔴 Kritik", str(critical_n))
    table.add_row("🟡 Uyarı", str(warning_n))
    table.add_row("✅ Geçer", str(ok_n))
    console.print(table)
    for p in saved:
        console.print(f"[green]✓ {p}[/]")


if __name__ == "__main__":
    app()
