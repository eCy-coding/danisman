#!/usr/bin/env python3
"""
05_backlink_opportunity_finder.py — EcyPro Backlink Fırsat Bulucu
Rakip sitelerdeki "resources", "partners", "links", "tools" gibi
linklist sayfalarını keşfeder ve EcyPro için backlink fırsatı oluşturabilecek
sayfaları raporlar.

Strateji (White-Hat, istek3.txt'ten):
  1. Rakip sitedeki link sayfalarını bul
  2. Sektör dizinlerini tara
  3. "stratejik danışmanlık" veya "consulting resources" sayfalarını keşfet
  4. Outreach için CSV/MD rapor üret

Kullanım:
  python3 scripts/05_backlink_opportunity_finder.py
  python3 scripts/05_backlink_opportunity_finder.py --site mckinsey.com
"""
from __future__ import annotations

import json
import re
import time
from datetime import datetime
from pathlib import Path
from urllib.parse import urljoin, urlparse
from typing import Optional

import typer
from rich.console import Console
from rich.progress import Progress, SpinnerColumn, TextColumn
from rich.table import Table
from scrapling.fetchers import Fetcher

app = typer.Typer(help="Backlink Fırsat Bulucu")
console = Console()

REPORTS_DIR = Path(__file__).parent.parent / "reports"
REPORTS_DIR.mkdir(exist_ok=True)

# Backlink fırsatı içeren URL pattern'leri
OPPORTUNITY_PATTERNS = [
    r"/resources?",
    r"/links?",
    r"/partners?",
    r"/tools?",
    r"/directory",
    r"/useful-links?",
    r"/consultants?",
    r"/agencies",
    r"/recommended",
    r"/ecosystem",
    r"/community",
    r"/insights",
]

# Sektör dizinleri ve toplulukları
INDUSTRY_DIRECTORIES = [
    {"name": "Consulting.com Directory",      "url": "https://www.consulting.com/list-of-consulting-firms"},
    {"name": "ISO Certified Consultants",     "url": "https://www.iso.org/certification.html"},
    {"name": "LinkedIn Service Pages",        "url": "https://www.linkedin.com/services/management-consulting"},
    {"name": "Clutch Consulting Directory",   "url": "https://clutch.co/tr/business-consulting"},
    {"name": "G2 Consulting Category",        "url": "https://www.g2.com/categories/consulting-services"},
    {"name": "Trustpilot Consulting",         "url": "https://www.trustpilot.com/categories/management_consulting"},
    {"name": "HackerNews Who's Hiring",       "url": "https://hn.algolia.com/?q=consulting+remote"},
    {"name": "Product Hunt Consulting Tools", "url": "https://www.producthunt.com/topics/consulting"},
]

COMPETITORS = [
    {"name": "BCG",         "url": "https://www.bcg.com"},
    {"name": "Kearney",     "url": "https://www.kearney.com"},
    {"name": "Thoughtworks","url": "https://www.thoughtworks.com"},
    {"name": "Productive",  "url": "https://productive.io"},
]


def find_link_pages(fetcher: Fetcher, base_url: str, depth: int = 1) -> list[dict]:
    """Bir sitedeki backlink-worthy sayfaları bul."""
    opportunities = []
    domain = urlparse(base_url).netloc

    try:
        page = fetcher.get(base_url, timeout=15, retries=1)
        if not page:
            return []

        anchors = page.css("a[href]")
        for a in anchors:
            href = (a.attrib.get("href") or "").strip()
            if not href:
                continue
            abs_url = urljoin(base_url, href)
            parsed = urlparse(abs_url)
            if parsed.netloc and domain not in parsed.netloc:
                continue

            path = parsed.path.lower()
            for pattern in OPPORTUNITY_PATTERNS:
                if re.search(pattern, path):
                    text = (a.text or "").strip()[:60]
                    opportunities.append({
                        "url": abs_url,
                        "anchor_text": text,
                        "pattern_matched": pattern,
                        "domain": domain,
                    })
                    break

    except Exception as exc:
        console.print(f"  [dim red]Hata: {str(exc)[:60]}[/]")

    return opportunities


def check_existing_backlink(fetcher: Fetcher, page_url: str, our_domain: str = "ecypro.com") -> bool:
    """Sayfada ecypro.com linki var mı kontrol et."""
    try:
        page = fetcher.get(page_url, timeout=12, retries=0)
        if not page:
            return False
        anchors = page.css(f'a[href*="{our_domain}"]')
        return len(anchors) > 0
    except Exception:
        return False


def audit_directory(fetcher: Fetcher, directory: dict) -> dict:
    """Bir sektör dizinini değerlendir."""
    result = {
        "name": directory["name"],
        "url": directory["url"],
        "accessible": False,
        "has_listing_form": False,
        "estimated_da": "?",
        "opportunity_score": 0,
        "notes": "",
    }
    try:
        page = fetcher.get(directory["url"], timeout=15, retries=1)
        if not page:
            return result
        result["accessible"] = True

        # Listing form var mı?
        forms = page.css('form, a[href*="submit"], a[href*="add-listing"], a[href*="register"]')
        result["has_listing_form"] = len(forms) > 0

        # Basit DA tahmini (domain yaşı/popülerliği)
        domain = urlparse(directory["url"]).netloc
        known_da = {
            "clutch.co": "DA 70+",
            "g2.com": "DA 80+",
            "linkedin.com": "DA 95+",
            "trustpilot.com": "DA 75+",
            "producthunt.com": "DA 90+",
        }
        result["estimated_da"] = next((v for k, v in known_da.items() if k in domain), "Bilinmiyor")

        # Fırsat skoru
        score = 0
        if result["accessible"]:
            score += 30
        if result["has_listing_form"]:
            score += 40
        if "DA" in result["estimated_da"]:
            score += 30
        result["opportunity_score"] = score

    except Exception as exc:
        result["notes"] = f"Erişim hatası: {str(exc)[:60]}"

    return result


def build_report(competitor_opps: list[dict], directory_results: list[dict]) -> str:
    now = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
    lines = [
        "# EcyPro Backlink Fırsat Raporu",
        "",
        f"**Üretildi:** {now}  ",
        f"**Strateji:** White-Hat Outreach (istek3.txt tabanlı)  ",
        "",
        "---",
        "",
        "## 1. Sektör Dizini Fırsatları",
        "",
        "| Dizin | Erişilebilir | Form | DA | Skor |",
        "|---|---|---|---|---|",
    ]
    for d in sorted(directory_results, key=lambda x: x["opportunity_score"], reverse=True):
        acc = "✅" if d["accessible"] else "❌"
        form = "✅" if d["has_listing_form"] else "—"
        lines.append(f"| [{d['name']}]({d['url']}) | {acc} | {form} | {d['estimated_da']} | {d['opportunity_score']}/100 |")

    lines += [
        "",
        "---",
        "",
        "## 2. Rakip Sitelerindeki Link Sayfaları",
        "",
        "Bu sayfalar outreach için öncelikli hedeflerdir:",
        "",
        "| Rakip | Sayfa URL | Bağlantı Metni | Pattern |",
        "|---|---|---|---|",
    ]
    for opp in competitor_opps[:30]:
        domain = opp["domain"]
        url = opp["url"]
        anchor = opp.get("anchor_text", "—")
        pattern = opp.get("pattern_matched", "—")
        lines.append(f"| `{domain}` | {url[:60]} | {anchor} | `{pattern}` |")

    lines += [
        "",
        "---",
        "",
        "## 3. Outreach Mesaj Şablonu",
        "",
        "```",
        "Konu: EcyPro Premium Consulting — Kaynaklar Sayfanız",
        "",
        "Merhaba [İsim],",
        "",
        "EcyPro Premium Consulting olarak [Konu Alanı] konusunda kurumsal",
        "müşterilere hizmet veriyoruz. Kaynaklar sayfanızı inceledim ve",
        "hedef kitleniz için değer katacak içeriklerimizi paylaşmak istedim:",
        "",
        "- [İçerik Başlığı]: https://ecypro.com/blog/[slug]",
        "- [Case Study]: https://ecypro.com/case-studies/[slug]",
        "",
        "Sayfanıza eklemeyi değerlendirmenizi rica ederim.",
        "Karşılıklı işbirliği için de açığız.",
        "",
        "İyi çalışmalar,",
        "Emre — EcyPro Premium Consulting",
        "https://ecypro.com",
        "```",
        "",
        "---",
        "",
        "## 4. Hızlı Kazanım Listesi",
        "",
        "1. **LinkedIn Company Page** — Hizmetleri ekle, 'Website' alanına ecypro.com",
        "2. **Clutch.co listing** — Ücretsiz; danışmanlık firmaları için DA 70+",
        "3. **G2 Consulting Profile** — Profil oluştur, case study yükle",
        "4. **Product Hunt** — Consulting araç/metodoloji olarak launch",
        "5. **Sektör dernekleri** — Türkiye: TÜSİAD, YASAD, MÜSİAD üyelik dizinleri",
        "",
        "_Rapor Scrapling ile otomatik üretilmiştir._",
    ]
    return "\n".join(lines)


@app.command()
def run(
    site: Optional[str] = typer.Option(None, "--site", help="Sadece bu domaini tara"),
    skip_competitors: bool = typer.Option(False, "--skip-comp"),
    skip_directories: bool = typer.Option(False, "--skip-dir"),
    delay: float = typer.Option(1.5, "--delay"),
    output: str = typer.Option("both", "--output"),
) -> None:
    """Backlink fırsatlarını keşfet: dizinler + rakip linkleri."""
    console.rule("[bold cyan]Backlink Fırsat Bulucu[/]")
    fetcher = Fetcher(auto_match=False)

    competitor_opps: list[dict] = []
    directory_results: list[dict] = []

    # Rakip sitelerden link sayfalarını bul
    if not skip_competitors:
        targets = [{"name": site, "url": f"https://{site}"}] if site else COMPETITORS
        console.print(f"\n[cyan]{len(targets)} rakip sitesi taranıyor...[/]")
        with Progress(SpinnerColumn(), TextColumn("{task.description}"), console=console) as prog:
            task = prog.add_task("Rakipler...", total=len(targets))
            for comp in targets:
                prog.update(task, description=f"[cyan]{comp['name'][:30]}[/]")
                opps = find_link_pages(fetcher, comp["url"])
                console.print(f"  ✓ {comp['name']} → {len(opps)} link sayfası bulundu")
                competitor_opps.extend(opps)
                prog.advance(task)
                time.sleep(delay)

    # Sektör dizinlerini değerlendir
    if not skip_directories:
        console.print(f"\n[cyan]{len(INDUSTRY_DIRECTORIES)} dizin değerlendiriliyor...[/]")
        with Progress(SpinnerColumn(), TextColumn("{task.description}"), console=console) as prog:
            task2 = prog.add_task("Dizinler...", total=len(INDUSTRY_DIRECTORIES))
            for d in INDUSTRY_DIRECTORIES:
                prog.update(task2, description=f"[cyan]{d['name'][:30]}[/]")
                r = audit_directory(fetcher, d)
                directory_results.append(r)
                console.print(f"  {'✅' if r['accessible'] else '❌'} {d['name']} — {r['opportunity_score']}/100")
                prog.advance(task2)
                time.sleep(delay)

    ts = datetime.utcnow().strftime("%Y%m%d_%H%M")
    saved = []
    payload = {"competitor_opportunities": competitor_opps, "directories": directory_results}
    if output in ("json", "both"):
        p = REPORTS_DIR / f"05_backlink_opportunities_{ts}.json"
        p.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
        saved.append(str(p))
    if output in ("md", "both"):
        p = REPORTS_DIR / f"05_backlink_opportunities_{ts}.md"
        p.write_text(build_report(competitor_opps, directory_results), encoding="utf-8")
        saved.append(str(p))

    table = Table(title="Backlink Özeti")
    table.add_column("Kategori")
    table.add_column("Sayı", style="cyan")
    table.add_row("Rakip Link Sayfaları", str(len(competitor_opps)))
    table.add_row("Değerlendirilen Dizin", str(len(directory_results)))
    table.add_row("Erişilebilir Dizin", str(sum(1 for d in directory_results if d["accessible"])))
    table.add_row("Form Bulunan Dizin", str(sum(1 for d in directory_results if d["has_listing_form"])))
    console.print(table)
    for p in saved:
        console.print(f"[green]✓ {p}[/]")


if __name__ == "__main__":
    app()
