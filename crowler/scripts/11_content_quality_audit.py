"""
crowler/scripts/11_content_quality_audit.py
P32-T13/T14/T18/T20 — İçerik kalitesi denetimi (Scrapling tabanlı).

Scrapling'in Fetcher'ı ile gerçek HTTP istekleri atar, lxml ile parse eder.
JavaScript render gerektirmez — statik HTML analizi yapılır.

Çıktı:
  crowler/reports/11_content_quality_<timestamp>.json

Çalıştır:
  python3 scripts/11_content_quality_audit.py --base http://localhost:4173
  python3 scripts/11_content_quality_audit.py --base https://www.ecypro.com
"""
import argparse
import json
import os
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Any
from urllib.parse import urljoin, urlparse

try:
    from scrapling.fetchers import Fetcher
    SCRAPLING_OK = True
except Exception:
    SCRAPLING_OK = False

try:
    from lxml import html as lxml_html
    LXML_OK = True
except ImportError:
    LXML_OK = False

SITEMAP_PATH = Path(__file__).parents[2] / "public" / "sitemap.xml"
REPORTS_DIR  = Path(__file__).parent.parent / "reports"

PAGE_KEYWORDS: dict[str, list[str]] = {
    "/":              ["stratejik danışmanlık", "danışmanlık", "strateji"],
    "/services":      ["danışmanlık", "yönetim", "hizmet"],
    "/about":         ["ecypro", "danışmanlık"],
    "/blog":          ["strateji", "blog", "yönetim"],
    "/pricing":       ["paket", "fiyat", "danışmanlık"],
    "/contact":       ["iletişim", "görüşme"],
    "/case-studies":  ["vaka", "başarı"],
    "/methodology":   ["metodoloji", "yöntem", "strateji"],
    "/faq":           ["soru", "danışmanlık"],
}

MIN_WORDS: dict[str, int] = {
    "/":             150,
    "/services":     150,
    "/about":        100,
    "/methodology":  150,
    "/pricing":       80,
    "/contact":       40,
}


def load_sitemap(base_url: str) -> list[str]:
    paths = []
    if SITEMAP_PATH.exists():
        import re
        xml = SITEMAP_PATH.read_text(encoding="utf-8")
        for m in re.finditer(r"<loc>([^<]+)</loc>", xml):
            try:
                p = urlparse(m.group(1).strip()).path
                paths.append(p)
            except Exception:
                pass
    if not paths:
        paths = list(PAGE_KEYWORDS.keys())
    return list(dict.fromkeys(paths))[:46]


def text_word_count(tree: Any) -> int:
    if not LXML_OK:
        return 0
    main = tree.xpath("//main | //article | //*[@role='main']")
    container = main[0] if main else tree
    raw = " ".join(container.text_content().split())
    words = [w for w in raw.split() if len(w) > 2]
    return len(words)


def keyword_in(text: str, keywords: list[str]) -> bool:
    t = text.lower()
    return any(kw.lower() in t for kw in keywords)


def audit_page(fetcher: Any, base_url: str, path: str) -> dict[str, Any]:
    url = base_url.rstrip("/") + path
    issues: list[str] = []

    try:
        parsed_url = urlparse(url)
        is_local = parsed_url.hostname in ("localhost", "127.0.0.1", "0.0.0.0")

        if SCRAPLING_OK and not is_local:
            # Scrapling: production URL için anti-bot bypass
            page = fetcher.get(url, timeout=15, stealthy_headers=True)
            raw_html = page.content if hasattr(page, "content") else page.text
        else:
            # localhost veya Scrapling eksik: standart urllib (SPA index.html)
            import urllib.request
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 EcyProCrawler/1.0"})
            with urllib.request.urlopen(req, timeout=15) as r:
                raw_html = r.read().decode("utf-8", errors="replace")

        tree = lxml_html.fromstring(raw_html) if LXML_OK else None

        if tree is None:
            return {"url": url, "path": path, "error": "lxml not available", "issues": issues}

        # Temel SEO alanları
        title = tree.findtext(".//title") or ""
        desc_el = tree.xpath("//meta[@name='description']/@content")
        meta_desc = desc_el[0] if desc_el else ""
        h1_els = tree.xpath("//h1")
        h1_texts = [h.text_content().strip() for h in h1_els]
        h2_count = len(tree.xpath("//h2"))
        h3_count = len(tree.xpath("//h3"))

        # Kelime sayısı
        word_count = text_word_count(tree)

        # Görseller
        imgs = tree.xpath("//img")
        img_no_alt = [img for img in imgs if not (img.get("alt") or "").strip()]

        # İç linkler
        links = tree.xpath("//a[@href]")
        base_domain = urlparse(base_url).netloc
        internal_links = [
            a for a in links
            if (a.get("href") or "").startswith("/")
            or base_domain in (a.get("href") or "")
        ]

        # Keyword kontrolü
        kws = PAGE_KEYWORDS.get(path, ["ecypro"])
        kw_in_title = keyword_in(title, kws)
        kw_in_h1 = keyword_in(" ".join(h1_texts), kws) if h1_texts else False
        kw_in_meta = keyword_in(meta_desc, kws)

        # H hiyerarşisi
        h1_count = len(h1_els)
        h_hierarchy_ok = not (h3_count > 0 and h2_count == 0) and not (h2_count > 0 and h1_count == 0)

        # Issue tespiti
        if not kw_in_title:
            issues.append("KW_NOT_IN_TITLE")
        if h1_count > 0 and not kw_in_h1:
            issues.append("KW_NOT_IN_H1")
        if not kw_in_meta:
            issues.append("KW_NOT_IN_META")
        if not h_hierarchy_ok:
            issues.append("H_HIERARCHY_BROKEN")
        if img_no_alt:
            issues.append(f"IMG_NO_ALT:{len(img_no_alt)}")
        if h1_count == 0:
            issues.append("NO_H1")
        if h1_count > 1:
            issues.append(f"MULTIPLE_H1:{h1_count}")
        min_w = MIN_WORDS.get(path, 0)
        if min_w > 0 and word_count < min_w:
            issues.append(f"LOW_WORD_COUNT:{word_count}<{min_w}")
        if len(internal_links) < 3 and path not in ["/login", "/register", "/contact"]:
            issues.append(f"LOW_INTERNAL_LINKS:{len(internal_links)}")

        # Skor hesapla (100 puan)
        score = 100
        score_deductions = {
            "KW_NOT_IN_TITLE": 20,
            "KW_NOT_IN_H1": 10,
            "KW_NOT_IN_META": 15,
            "H_HIERARCHY_BROKEN": 15,
            "NO_H1": 20,
        }
        for issue in issues:
            for key, val in score_deductions.items():
                if issue.startswith(key):
                    score -= val
        if img_no_alt:
            score -= min(len(img_no_alt) * 3, 15)

        return {
            "url": url,
            "path": path,
            "title": title[:80],
            "h1": h1_texts[0][:60] if h1_texts else None,
            "h1_count": h1_count,
            "h2_count": h2_count,
            "h3_count": h3_count,
            "word_count": word_count,
            "internal_links": len(internal_links),
            "img_count": len(imgs),
            "img_no_alt": len(img_no_alt),
            "meta_desc_len": len(meta_desc),
            "kw_in_title": kw_in_title,
            "kw_in_h1": kw_in_h1,
            "kw_in_meta": kw_in_meta,
            "h_hierarchy_ok": h_hierarchy_ok,
            "content_score": max(0, score),
            "issues": issues,
        }

    except Exception as exc:
        return {"url": url, "path": path, "error": str(exc)[:120], "issues": ["FETCH_ERROR"]}


def main() -> None:
    parser = argparse.ArgumentParser(description="EcyPro Content Quality Audit")
    parser.add_argument("--base", default="http://localhost:4173", help="Base URL")
    parser.add_argument("--output", choices=["json", "console"], default="console")
    parser.add_argument("--max", type=int, default=20, help="Max page sayısı")
    args = parser.parse_args()

    if not LXML_OK:
        print("HATA: lxml yüklü değil — pip install lxml", file=sys.stderr)
        sys.exit(1)

    fetcher = Fetcher(auto_match=False) if SCRAPLING_OK else None

    paths = load_sitemap(args.base)[: args.max]
    results: list[dict[str, Any]] = []

    print(f"[11_content_quality] {len(paths)} sayfa denetleniyor…")

    for i, path in enumerate(paths, 1):
        result = audit_page(fetcher, args.base, path)
        results.append(result)
        score = result.get("content_score", 0)
        issues = result.get("issues", [])
        icon = "✅" if score >= 70 and not issues else ("⚠" if score >= 50 else "❌")
        print(f"  [{i:02}/{len(paths)}] {icon} {path} — skor:{score} sorun:{len(issues)}")
        time.sleep(0.3)

    # Özet
    valid = [r for r in results if "error" not in r]
    avg_score = sum(r.get("content_score", 0) for r in valid) / max(len(valid), 1)
    total_no_alt = sum(r.get("img_no_alt", 0) for r in valid)
    low_words = [r for r in valid if r.get("issues") and any("LOW_WORD_COUNT" in i for i in r["issues"])]

    print(f"\n{'='*50}")
    print(f"Ortalama İçerik Skoru : {avg_score:.1f}/100")
    print(f"Alt text eksik görsel : {total_no_alt}")
    print(f"Düşük kelime sayısı   : {len(low_words)} sayfa")
    print(f"Taranan sayfa         : {len(valid)}")

    if args.output == "json":
        REPORTS_DIR.mkdir(parents=True, exist_ok=True)
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        out_path = REPORTS_DIR / f"11_content_quality_{ts}.json"
        out_path.write_text(json.dumps(results, ensure_ascii=False, indent=2))
        print(f"\nRapor: {out_path}")


if __name__ == "__main__":
    main()
