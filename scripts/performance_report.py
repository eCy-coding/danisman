#!/usr/bin/env python3
"""
scripts/performance_report.py
Lighthouse CI JSON → HTML + Markdown + CLI rapor dönüştürücü
istek5.txt Pane 7 — ⚙️ CI-Lighthouse

Kullanım:
  python3 scripts/performance_report.py
  python3 scripts/performance_report.py --dir lighthouse-reports/
  python3 scripts/performance_report.py --dir lighthouse-reports/ --output public/tools/lhci-report.html
  python3 scripts/performance_report.py --markdown > LIGHTHOUSE.md

Gereksinim: Python 3.8+, standart kütüphane
"""

import os
import re
import sys
import json
import glob
import argparse
from datetime import datetime
from pathlib import Path
from typing import TypedDict, Optional

# ─── Tip tanımları ────────────────────────────────────────────────────────────

class LHMetric(TypedDict):
    score: float
    numericValue: Optional[float]
    displayValue: str

class LHReport(TypedDict):
    url: str
    timestamp: str
    performance: float
    accessibility: float
    bestPractices: float
    seo: float
    lcp: Optional[float]
    cls: Optional[float]
    tbt: Optional[float]
    fcp: Optional[float]
    ttfb: Optional[float]
    inp: Optional[float]
    file: str

# ─── Eşikler ──────────────────────────────────────────────────────────────────

THRESHOLDS = {
    "performance":    {"warn": 0.70, "error": 0.50, "target": 0.85},
    "accessibility":  {"warn": 0.98, "error": 0.90, "target": 1.00},
    "bestPractices":  {"warn": 0.95, "error": 0.80, "target": 1.00},
    "seo":            {"warn": 1.00, "error": 0.90, "target": 1.00},
    "lcp":            {"warn": 4000, "error": 6000, "target": 2500},  # ms
    "cls":            {"warn": 0.10, "error": 0.25, "target": 0.05},
    "tbt":            {"warn": 600,  "error": 1000, "target": 200},   # ms
    "fcp":            {"warn": 3000, "error": 5000, "target": 1800},  # ms
}

# ─── JSON parse ───────────────────────────────────────────────────────────────

def parse_lh_json(path: str) -> Optional[LHReport]:
    """Lighthouse JSON dosyasını ayrıştır. chrome-error raporları atla."""
    try:
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
    except Exception as e:
        print(f"⚠ Parse hata {path}: {e}", file=sys.stderr)
        return None

    # chrome-error://chromewebdata/ = sayfa yüklenemedi, rapor geçersiz
    final_url = data.get("finalUrl", data.get("requestedUrl", ""))
    if "chrome-error" in final_url or "chromewebdata" in final_url:
        print(f"⚠ Bozuk LH raporu atlandı (chrome-error): {os.path.basename(path)}", file=sys.stderr)
        return None

    cats = data.get("categories", {})
    audits = data.get("audits", {})

    def score(key: str) -> float:
        cat = cats.get(key, {})
        return round((cat.get("score") or 0) * 100) / 100

    def ms(key: str) -> Optional[float]:
        a = audits.get(key, {})
        v = a.get("numericValue")
        return round(v, 1) if v is not None else None

    return {
        "url": data.get("finalUrl", data.get("requestedUrl", "—")),
        "timestamp": data.get("fetchTime", datetime.now().isoformat()),
        "performance": score("performance"),
        "accessibility": score("accessibility"),
        "bestPractices": score("best-practices"),
        "seo": score("seo"),
        "lcp": ms("largest-contentful-paint"),
        "cls": round(audits.get("cumulative-layout-shift", {}).get("numericValue", 0), 4),
        "tbt": ms("total-blocking-time"),
        "fcp": ms("first-contentful-paint"),
        "ttfb": ms("time-to-first-byte"),
        "inp": ms("interaction-to-next-paint"),
        "file": os.path.basename(path),
    }

def find_reports(directory: str) -> list[str]:
    """Lighthouse JSON raporlarını bul."""
    patterns = [
        os.path.join(directory, "**", "*.json"),
        os.path.join(directory, "*.json"),
        "lighthouse-reports/*.json",
    ]
    files = []
    for pat in patterns:
        files.extend(glob.glob(pat, recursive=True))
    # Sadece LH raporları (manifest.json, package.json vb. hariç)
    return sorted(set(f for f in files if not any(x in f for x in ["manifest", "package", "tsconfig"])))

# ─── CLI çıktısı ──────────────────────────────────────────────────────────────

SCORE_COLOR = {
    "ok":   "\033[92m",
    "warn": "\033[93m",
    "error":"\033[91m",
    "reset":"\033[0m",
    "bold": "\033[1m",
    "cyan": "\033[96m",
}

def status_for(metric: str, value: float) -> str:
    th = THRESHOLDS.get(metric, {})
    warn_t = th.get("warn", 0)
    err_t = th.get("error", 0)

    if metric in ("lcp", "cls", "tbt", "fcp", "ttfb", "inp"):
        if value <= th.get("target", 0): return "ok"
        if value <= warn_t: return "ok"
        if value <= err_t: return "warn"
        return "error"
    else:
        if value >= warn_t: return "ok" if value >= th.get("target", 0) else "warn"
        if value >= err_t: return "warn"
        return "error"

def format_score(metric: str, value: Optional[float]) -> str:
    if value is None: return "—"
    s = status_for(metric, value)
    c = SCORE_COLOR.get(s, "")
    r = SCORE_COLOR["reset"]
    if metric in ("lcp", "tbt", "fcp", "ttfb", "inp"):
        return f"{c}{value:.0f}ms{r}"
    if metric == "cls":
        return f"{c}{value:.3f}{r}"
    return f"{c}{int(value * 100)}%{r}"

def print_cli(reports: list[LHReport]) -> None:
    if not reports:
        print("⚠ Lighthouse raporu bulunamadı")
        return

    W = 70
    C = SCORE_COLOR
    print(f"\n{'='*W}")
    print(f"{C['bold']}  ⚙️  Lighthouse CI Raporu — istek5.txt Pane 7{C['reset']}")
    print(f"  {C['cyan']}{datetime.now().strftime('%Y-%m-%d %H:%M')}{C['reset']} | {len(reports)} rapor")
    print(f"{'='*W}")

    for r in reports:
        print(f"\n  {C['bold']}🌐 {r['url']}{C['reset']}")
        print(f"  📅 {r['timestamp'][:19]}  |  📄 {r['file']}")
        print(f"  {'─'*50}")
        print(f"  Perf         : {format_score('performance', r['performance'])}")
        print(f"  A11y         : {format_score('accessibility', r['accessibility'])}")
        print(f"  Best Pract.  : {format_score('bestPractices', r['bestPractices'])}")
        print(f"  SEO          : {format_score('seo', r['seo'])}")
        print(f"  ── Core Web Vitals ──────────────────────")
        print(f"  LCP          : {format_score('lcp', r.get('lcp'))}")
        print(f"  CLS          : {format_score('cls', r.get('cls'))}")
        print(f"  TBT          : {format_score('tbt', r.get('tbt'))}")
        print(f"  FCP          : {format_score('fcp', r.get('fcp'))}")
        if r.get("inp") is not None:
            print(f"  INP          : {format_score('inp', r['inp'])}")

    # Özet
    if len(reports) > 1:
        avg_perf = sum(r["performance"] for r in reports) / len(reports)
        avg_a11y = sum(r["accessibility"] for r in reports) / len(reports)
        avg_seo  = sum(r["seo"] for r in reports) / len(reports)
        print(f"\n{'─'*W}")
        print(f"  {C['bold']}Ortalama  —  Perf: {int(avg_perf*100)}%  A11y: {int(avg_a11y*100)}%  SEO: {int(avg_seo*100)}%{C['reset']}")

    print(f"\n{'='*W}\n")

# ─── Markdown çıktısı ─────────────────────────────────────────────────────────

def to_markdown(reports: list[LHReport]) -> str:
    lines = [
        "# ⚙️ Lighthouse CI Raporu",
        f"**Tarih:** {datetime.now().strftime('%Y-%m-%d %H:%M')}  ",
        f"**Rapor sayısı:** {len(reports)}",
        "",
        "| URL | Perf | A11y | BP | SEO | LCP | CLS | TBT |",
        "|-----|------|------|-----|-----|-----|-----|-----|",
    ]
    for r in reports:
        url = r["url"].replace("http://localhost:4173", "")
        perf = f"{int(r['performance']*100)}%"
        a11y = f"{int(r['accessibility']*100)}%"
        bp   = f"{int(r['bestPractices']*100)}%"
        seo  = f"{int(r['seo']*100)}%"
        lcp  = f"{r['lcp']:.0f}ms" if r.get("lcp") else "—"
        cls  = f"{r['cls']:.3f}" if r.get("cls") is not None else "—"
        tbt  = f"{r['tbt']:.0f}ms" if r.get("tbt") else "—"
        lines.append(f"| `{url}` | {perf} | {a11y} | {bp} | {seo} | {lcp} | {cls} | {tbt} |")

    lines += ["", "## 🎯 Eşik Referansı", ""]
    for metric, th in THRESHOLDS.items():
        if metric in ("lcp", "cls", "tbt", "fcp"):
            lines.append(f"- **{metric.upper()}**: hedef `{th['target']}`, uyarı `{th['warn']}`, hata `{th['error']}`")
        else:
            lines.append(f"- **{metric.capitalize()}**: hedef `{int(th['target']*100)}%`, uyarı `{int(th['warn']*100)}%`")

    return "\n".join(lines)

# ─── HTML rapor ───────────────────────────────────────────────────────────────

def score_color_css(metric: str, value: Optional[float]) -> str:
    if value is None: return "#64748b"
    s = status_for(metric, value)
    return {"ok": "#22c55e", "warn": "#f59e0b", "error": "#ef4444"}.get(s, "#94a3b8")

def generate_html(reports: list[LHReport], output_path: str) -> None:
    rows = []
    for r in reports:
        url = r["url"].replace("http://localhost:4173", "") or "/"
        def cell(metric: str, value: Optional[float], suffix: str = "") -> str:
            color = score_color_css(metric, value)
            display = f"{int(value*100)}%" if isinstance(value, float) and value <= 1.0 else \
                      (f"{value:.0f}{suffix}" if value is not None else "—")
            if metric == "cls" and value is not None:
                display = f"{value:.3f}"
            return f'<td style="color:{color};font-weight:700">{display}</td>'

        rows.append(f"""
          <tr>
            <td><code>{url}</code></td>
            {cell("performance", r["performance"])}
            {cell("accessibility", r["accessibility"])}
            {cell("bestPractices", r["bestPractices"])}
            {cell("seo", r["seo"])}
            {cell("lcp", r.get("lcp"), "ms")}
            {cell("cls", r.get("cls"))}
            {cell("tbt", r.get("tbt"), "ms")}
          </tr>""")

    html = f"""<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Lighthouse CI Raporu — EcyPro</title>
  <style>
    *, *::before, *::after {{ box-sizing: border-box; margin: 0; padding: 0 }}
    body {{ font-family: system-ui, sans-serif; background: #0f172a; color: #e2e8f0; padding: 2rem }}
    h1 {{ font-size: 1.5rem; margin-bottom: 0.5rem }}
    .meta {{ color: #64748b; font-size: 0.85rem; margin-bottom: 2rem }}
    table {{ width: 100%; border-collapse: collapse; background: #1e293b; border-radius: 12px; overflow: hidden }}
    th {{ background: #334155; padding: 0.75rem 1rem; text-align: left; font-size: 0.8rem; color: #94a3b8 }}
    td {{ padding: 0.75rem 1rem; border-bottom: 1px solid #0f172a; font-size: 0.9rem }}
    tr:last-child td {{ border-bottom: none }}
    tr:hover td {{ background: #243045 }}
    code {{ background: #334155; padding: 2px 6px; border-radius: 4px; font-size: 0.8rem }}
    .legend {{ margin-top: 1.5rem; display: flex; gap: 1.5rem; font-size: 0.85rem }}
    .legend span {{ display: flex; align-items: center; gap: 0.4rem }}
    .dot {{ width: 10px; height: 10px; border-radius: 50% }}
    .thresholds {{ margin-top: 1.5rem; background: #1e293b; border-radius: 12px; padding: 1.25rem }}
    .thresholds h2 {{ font-size: 1rem; margin-bottom: 0.75rem; color: #94a3b8 }}
    .th-grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 0.75rem }}
    .th-item {{ background: #334155; border-radius: 8px; padding: 0.5rem 0.75rem; font-size: 0.8rem }}
    .th-label {{ font-weight: 700; margin-bottom: 0.25rem }}
    .th-sub {{ color: #94a3b8 }}
  </style>
</head>
<body>
  <h1>⚙️ Lighthouse CI Raporu — EcyPro</h1>
  <div class="meta">Oluşturulma: {datetime.now().strftime("%Y-%m-%d %H:%M")} | {len(reports)} rapor | istek5.txt Pane 7</div>
  <table>
    <thead>
      <tr>
        <th>URL</th><th>Perf</th><th>A11y</th><th>BP</th>
        <th>SEO</th><th>LCP</th><th>CLS</th><th>TBT</th>
      </tr>
    </thead>
    <tbody>{"".join(rows) if rows else "<tr><td colspan='8' style='text-align:center;padding:2rem;color:#64748b'>Henüz Lighthouse raporu yok. <br><code>npx lhci autorun</code> ile üret.</td></tr>"}</tbody>
  </table>
  <div class="legend">
    <span><div class="dot" style="background:#22c55e"></div> Hedef karşılandı</span>
    <span><div class="dot" style="background:#f59e0b"></div> Uyarı</span>
    <span><div class="dot" style="background:#ef4444"></div> Hata (CI blocker)</span>
  </div>
  <div class="thresholds">
    <h2>🎯 Eşik Değerleri</h2>
    <div class="th-grid">
      <div class="th-item"><div class="th-label">Performance</div><div class="th-sub">≥70% warn | ≥85% target</div></div>
      <div class="th-item"><div class="th-label">Accessibility</div><div class="th-sub">≥98% warn | 100% target</div></div>
      <div class="th-item"><div class="th-label">SEO</div><div class="th-sub">100% (strict)</div></div>
      <div class="th-item"><div class="th-label">LCP</div><div class="th-sub">≤4s warn | ≤2.5s target</div></div>
      <div class="th-item"><div class="th-label">CLS</div><div class="th-sub">≤0.10 warn | ≤0.05 target</div></div>
      <div class="th-item"><div class="th-label">TBT</div><div class="th-sub">≤600ms warn | ≤200ms target</div></div>
    </div>
  </div>
  <script>setTimeout(() => location.reload(), 60000);</script>
</body>
</html>"""

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"[perf_report] HTML: {output_path}")

# ─── Entry point ──────────────────────────────────────────────────────────────

def main() -> None:
    # IDE terminal'de satır-içi yorumlar (# metin) literal geçebilir — filtrele
    sys.argv = [a for a in sys.argv if not a.startswith('#')]
    parser = argparse.ArgumentParser(description="Lighthouse CI Rapor Dönüştürücü")
    parser.add_argument("--dir", "-d", default="lighthouse-reports", help="Lighthouse JSON dizini")
    parser.add_argument("--output", "-o", default="public/tools/lhci-report.html")
    parser.add_argument("--markdown", "-m", action="store_true", help="Markdown çıktısı")
    parser.add_argument("--no-html", action="store_true")
    args, _ = parser.parse_known_args()

    files = find_reports(args.dir)
    if not files:
        print(f"[perf_report] Lighthouse JSON bulunamadı: {args.dir}/")

    reports = [r for f in files if (r := parse_lh_json(f)) is not None]

    if args.markdown:
        print(to_markdown(reports))
    else:
        print_cli(reports)
        if not args.no_html:
            generate_html(reports, args.output)

if __name__ == "__main__":
    main()
