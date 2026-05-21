#!/usr/bin/env python3
"""
scripts/e2e_health.py
istek5.txt 15-Pane E2E Sağlık İzleyicisi

- E2E spec kapsam analizi
- Phase/Pane test sayım raporu
- HTML dashboard üretimi
- JSON export (CI/CD entegrasyon)

Kullanım:
  python3 scripts/e2e_health.py
  python3 scripts/e2e_health.py --output public/tools/e2e-dashboard.html
  python3 scripts/e2e_health.py --json > e2e_health.json
  python3 scripts/e2e_health.py --watch (10sn'de bir yenile)

Gereksinim: Python 3.8+, standart kütüphane
"""

import os
import re
import sys
import json
import glob
import time
import argparse
from datetime import datetime
from pathlib import Path
from typing import TypedDict

# ─── Tip tanımları ────────────────────────────────────────────────────────────

class SpecInfo(TypedDict):
    name: str
    path: str
    test_count: int
    phase: str
    panes: list[str]
    last_modified: str

class PhaseReport(TypedDict):
    name: str
    spec_count: int
    test_count: int
    specs: list[str]
    status: str

class PaneReport(TypedDict):
    name: str
    test_count: int
    specs: list[str]
    status: str

class HealthReport(TypedDict):
    timestamp: str
    total_tests: int
    total_specs: int
    phases: dict[str, PhaseReport]
    panes: dict[str, PaneReport]
    coverage_score: float
    uncovered: list[str]
    warnings: list[str]

# ─── Phase / Pane eşleşme tablosu ────────────────────────────────────────────

PHASE_MAP: dict[str, list[str]] = {
    "1-Core (Critical)":     [
        "api_integration", "crawl_db_integration", "crawl_deployment_flow",
        "comprehensive_audit", "sanity_check", "critical_flows",
        "resilience", "diagnostic", "consulting_production", "consulting_realtime",
        "antigravity_terminal", "antigravity_terminal_stress", "terminal_ui",
        "crawl_error_pages",
    ],
    "2-UI/UX (High)":        [
        "crawl_ux_critical", "crawl_ux2_critical", "crawl_ux3_critical", "crawl_ux4_critical",
        "crawl_admin_crm", "crawl_admin_rbac", "crawl_ui_components",
        "crawl_forms_validation", "crawl_a11y_wcag",
        "a11y", "accessibility", "i18n", "navigation", "mobile_compatibility",
        "interactive_core", "zen_mode", "dashboard_adaptive", "dashboard_realtime",
        "services-filter", "crawl_i18n_deep",
    ],
    "3-Media (Medium)":      ["crawl_image_lcp", "crawl_media_optimization"],
    "4-SEO/Geo (High)":      [
        "crawl_seo_audit", "crawl_authority_seo", "crawl_schema_deep",
        "crawl_i18n_international", "crawl_geo_banner", "crawl_seo_deep",
        "seo", "seo-visual", "case_studies", "content", "content_expansion",
        "spider", "crawl_blog_content", "crawl_services_deep",
    ],
    "5-Test/Quality (Crit)": [
        "crawl_booking_flow", "crawl_conversion_funnel", "crawl_performance_vitals",
        "crawl_security_headers", "crawl_link_integrity", "crawl_content_quality",
        "crawl_api_security", "crawl_runtime_stress",
        "grand_slam_suite", "grand_slam_verify_all", "performance", "security",
        "invisible_shield", "conversion-elements", "runtime_perfection",
        "rbac", "expansion_pack", "crawl_conversion_advanced",
        "crawl_pricing_deep",
    ],
    "6-Observability (Med)": [
        "crawl_observability", "analytics", "crawl_status_page",
        "crawl_api_calibration", "crawl_analytics_dev",
        "ai_assessment", "roi_calculator", "director",
        "sovereign_matrix", "sovereign_vault", "sovereign_creator",
        "lead-gen", "newsletter", "crawl_admin_analytics",
        "crawl_newsletter_deep",
    ],
    "7-Ops/Deploy (Low)":    [
        "crawl_mobile_pwa", "crawl_url_integrity", "crawl_prompts_compliance",
        "crawl_pwa_deep", "crawl_python", "crawl_slash_commands",
        "crawl_mcp_live", "new_routes", "service_hub", "crawl_keystatic_cms",
    ],
}

PANE_MAP: dict[str, list[str]] = {
    "0-Frontend-Dev":  [
        "crawl_ux_critical", "crawl_ux2_critical", "crawl_ux3_critical",
        "crawl_ux4_critical", "crawl_ui_components",
        "navigation", "mobile_compatibility", "interactive_core",
        "zen_mode", "dashboard_adaptive", "dashboard_realtime",
    ],
    "1-Backend-API":   [
        "api_integration", "crawl_api_calibration", "crawl_api_security",
        "consulting_production", "consulting_realtime", "resilience",
    ],
    "2-DB-Postgres":   ["crawl_db_integration", "critical_flows"],
    "3-E2E-Cypress":   [
        "crawl_booking_flow", "crawl_conversion_funnel", "critical_flows",
        "crawl_runtime_stress", "grand_slam_suite", "grand_slam_verify_all",
        "sanity_check", "expansion_pack",
    ],
    "4-SEO-Geo-Admin": [
        "crawl_seo_audit", "crawl_authority_seo", "crawl_schema_deep",
        "crawl_geo_banner", "crawl_seo_deep", "seo", "seo-visual",
        "case_studies", "spider",
    ],
    "5-UI-Storybook":  [
        "crawl_a11y_wcag", "crawl_ui_components",
        "a11y", "accessibility", "i18n", "services-filter",
    ],
    "6-Media-Watcher": ["crawl_image_lcp", "crawl_media_optimization"],
    "7-CI-Lighthouse": ["crawl_performance_vitals", "performance"],
    "8-Log-Tail":      [
        "crawl_observability", "diagnostic", "terminal_ui",
        "antigravity_terminal", "antigravity_terminal_stress",
    ],
    "9-Analytics-Dev": [
        "analytics", "crawl_analytics_dev", "ai_assessment",
        "roi_calculator", "lead-gen", "newsletter",
    ],
    "10-Sec-Watch":    [
        "crawl_security_headers", "crawl_link_integrity", "crawl_api_security",
        "security", "invisible_shield", "rbac",
    ],
    "11-Deploy-Watch": [
        "crawl_deployment_flow", "crawl_url_integrity", "crawl_pwa_deep",
        "crawl_python", "crawl_slash_commands", "crawl_mcp_live", "new_routes",
    ],
    "12-UI-Designer":  [
        "crawl_ux3_critical", "crawl_forms_validation", "crawl_ui_components",
        "conversion-elements", "runtime_perfection",
    ],
    "13-Geo-Manager":  [
        "crawl_i18n_international", "crawl_geo_banner", "crawl_seo_deep",
        "content", "content_expansion",
    ],
    "14-Lead-CRM":     [
        "crawl_admin_crm", "crawl_admin_rbac",
        "director", "sovereign_matrix", "sovereign_vault",
        "sovereign_creator", "service_hub",
    ],
}

PHASE_ICONS = {
    "1": "🔵", "2": "🎨", "3": "📦", "4": "🔎",
    "5": "🧪", "6": "📈", "7": "🚀",
}

PANE_ICONS = {
    "0": "🖥️", "1": "🛠️", "2": "💾", "3": "🧪", "4": "🔎",
    "5": "🎨", "6": "📦", "7": "⚙️", "8": "🗒️", "9": "📈",
    "10": "🔐", "11": "🚀", "12": "🏗️", "13": "🧭", "14": "🧑‍💼",
}

# ─── Yardımcı fonksiyonlar ────────────────────────────────────────────────────

def find_specs(e2e_dir: str = "e2e") -> list[str]:
    """Tüm .spec.ts dosyalarını bul."""
    return sorted(glob.glob(os.path.join(e2e_dir, "*.spec.ts")))

def count_tests(path: str) -> int:
    """Bir spec dosyasındaki test() sayısını say."""
    try:
        content = open(path, encoding="utf-8").read()
        return len(re.findall(r"\btest\s*\(", content))
    except Exception:
        return 0

def get_spec_name(path: str) -> str:
    """Dosya yolundan spec adını çıkar."""
    return os.path.basename(path).replace(".spec.ts", "")

def find_spec_for_name(name: str, specs: list[str]) -> str | None:
    """Spec adına göre dosya yolunu bul."""
    for s in specs:
        if get_spec_name(s) == name:
            return s
    return None

def last_modified(path: str) -> str:
    """Dosyanın son değiştirilme zamanı."""
    try:
        ts = os.path.getmtime(path)
        return datetime.fromtimestamp(ts).strftime("%Y-%m-%d %H:%M")
    except Exception:
        return "—"

def calculate_coverage(spec_names: set[str]) -> float:
    """Toplam mapped spec'lerin kapsam yüzdesini hesapla."""
    all_mapped = set()
    for specs in PHASE_MAP.values():
        all_mapped.update(specs)
    covered = spec_names & all_mapped
    return len(covered) / len(all_mapped) if all_mapped else 0.0

# ─── Ana analiz ────────────────────────────────────────────────────────────────

def analyze(e2e_dir: str = "e2e") -> HealthReport:
    """Tam E2E sağlık analizi yap."""
    specs = find_specs(e2e_dir)
    spec_names = {get_spec_name(s) for s in specs}
    spec_test_counts: dict[str, int] = {}
    for s in specs:
        spec_test_counts[get_spec_name(s)] = count_tests(s)

    # Phase raporları
    phases: dict[str, PhaseReport] = {}
    for phase_name, mapped in PHASE_MAP.items():
        found_specs, total_tests = [], 0
        for sname in mapped:
            path = find_spec_for_name(sname, specs)
            if path:
                found_specs.append(sname)
                total_tests += spec_test_counts.get(sname, 0)
        status = "✅" if found_specs else "❌"
        phases[phase_name] = {
            "name": phase_name, "spec_count": len(found_specs),
            "test_count": total_tests, "specs": found_specs, "status": status,
        }

    # Pane raporları
    panes: dict[str, PaneReport] = {}
    for pane_name, mapped in PANE_MAP.items():
        found_specs, total_tests = [], 0
        for sname in mapped:
            path = find_spec_for_name(sname, specs)
            if path:
                found_specs.append(sname)
                total_tests += spec_test_counts.get(sname, 0)
        status = "✅" if total_tests > 0 else "⚠️ (storybook/manual)"
        panes[pane_name] = {
            "name": pane_name, "test_count": total_tests,
            "specs": found_specs, "status": status,
        }

    # Toplam
    total_tests = sum(spec_test_counts.values())
    all_mapped = {s for ss in PHASE_MAP.values() for s in ss}
    uncovered = [s for s in spec_names if s not in all_mapped]
    warnings = []

    if total_tests < 600:
        warnings.append(f"⚠️ Test sayısı düşük: {total_tests} < 600 hedef")
    if len(specs) < 50:
        warnings.append(f"⚠️ Spec sayısı düşük: {len(specs)} < 50 hedef")
    for phase_name, report in phases.items():
        if report["test_count"] == 0:
            warnings.append(f"❌ {phase_name}: Hiç test yok!")

    return {
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "total_tests": total_tests,
        "total_specs": len(specs),
        "phases": phases,
        "panes": panes,
        "coverage_score": calculate_coverage(spec_names),
        "uncovered": sorted(uncovered),
        "warnings": warnings,
    }

# ─── CLI Çıktısı ──────────────────────────────────────────────────────────────

def print_cli(report: HealthReport) -> None:
    """Terminale renkli rapor yaz."""
    GREEN, YELLOW, RED, CYAN, RESET, BOLD = (
        "\033[92m", "\033[93m", "\033[91m", "\033[96m", "\033[0m", "\033[1m"
    )
    W = 65

    print(f"\n{'='*W}")
    print(f"{BOLD}  🏥 E2E Sağlık Raporu — istek5.txt 15-Pane{RESET}")
    print(f"  {CYAN}{report['timestamp']}{RESET}")
    print(f"{'='*W}")
    print(f"\n  {BOLD}📊 ÖZET{RESET}")
    score = report["coverage_score"]
    score_color = GREEN if score >= 0.9 else YELLOW if score >= 0.7 else RED
    print(f"  Toplam test  : {BOLD}{report['total_tests']}{RESET}")
    print(f"  Spec dosyası : {report['total_specs']}")
    print(f"  Kapsam skoru : {score_color}{score*100:.1f}%{RESET}")

    print(f"\n  {BOLD}📦 PHASE BAZLI{RESET}")
    for phase, data in report["phases"].items():
        icon = PHASE_ICONS.get(phase[0], "•")
        color = GREEN if data["test_count"] > 0 else RED
        bar = "█" * min(int(data["test_count"] / 5), 20)
        print(f"  {icon} Phase {phase[:25]:<25} "
              f"{color}{data['test_count']:>4} test{RESET}  {bar}")

    print(f"\n  {BOLD}🖥️  PANE BAZLI{RESET}")
    for pane, data in report["panes"].items():
        num = pane.split("-")[0]
        icon = PANE_ICONS.get(num, "•")
        color = GREEN if data["test_count"] > 0 else YELLOW
        print(f"  {icon} Pane {pane[:30]:<30} "
              f"{color}{data['test_count']:>4} test{RESET}  {data['status']}")

    if report["warnings"]:
        print(f"\n  {BOLD}{YELLOW}⚠️  UYARILAR{RESET}")
        for w in report["warnings"]:
            print(f"  {YELLOW}{w}{RESET}")

    if report["uncovered"]:
        print(f"\n  {BOLD}📋 Phase map dışı spec'ler ({len(report['uncovered'])}):{RESET}")
        for u in report["uncovered"][:10]:
            print(f"  • {u}")
        if len(report["uncovered"]) > 10:
            print(f"  … ve {len(report['uncovered'])-10} tane daha")

    print(f"\n{'='*W}\n")

# ─── HTML Dashboard üretimi ────────────────────────────────────────────────────

def generate_html(report: HealthReport, output_path: str) -> None:
    """HTML5 interaktif dashboard üret."""
    score_pct = int(report["coverage_score"] * 100)
    score_color = "#22c55e" if score_pct >= 90 else "#f59e0b" if score_pct >= 70 else "#ef4444"

    def phase_rows() -> str:
        rows = []
        for phase, data in report["phases"].items():
            icon = PHASE_ICONS.get(phase[0], "•")
            bar_w = min(int(data["test_count"] / 5), 100)
            status_color = "#22c55e" if data["test_count"] > 0 else "#ef4444"
            rows.append(f"""
            <tr>
              <td>{icon} {phase}</td>
              <td>{data['spec_count']}</td>
              <td style="color:{status_color};font-weight:700">{data['test_count']}</td>
              <td>
                <div class="bar"><div class="bar-fill" style="width:{bar_w}%;background:{status_color}"></div></div>
              </td>
              <td>{data['status']}</td>
            </tr>""")
        return "".join(rows)

    def pane_cards() -> str:
        cards = []
        for pane, data in report["panes"].items():
            num = pane.split("-")[0]
            icon = PANE_ICONS.get(num, "•")
            color = "#22c55e" if data["test_count"] > 0 else "#f59e0b"
            specs_html = "".join(f"<span class='tag'>{s}</span>" for s in data["specs"][:4])
            extra = f"<span class='tag gray'>+{len(data['specs'])-4}</span>" if len(data["specs"]) > 4 else ""
            cards.append(f"""
            <div class="card">
              <div class="card-header">
                <span class="card-icon">{icon}</span>
                <span class="card-title">Pane {pane}</span>
                <span class="badge" style="background:{color}">{data['test_count']} test</span>
              </div>
              <div class="card-specs">{specs_html}{extra}</div>
              <div class="card-status">{data['status']}</div>
            </div>""")
        return "".join(cards)

    warnings_html = "".join(f"<div class='warning'>{w}</div>" for w in report["warnings"]) \
        or "<div class='ok'>✅ Uyarı yok — sistem sağlıklı</div>"

    html = f"""<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>eCyPro E2E Sağlık Dashboard</title>
  <style>
    *, *::before, *::after {{ box-sizing: border-box; margin: 0; padding: 0 }}
    body {{
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      background: #0f172a; color: #e2e8f0; min-height: 100vh;
    }}
    header {{
      background: #1e293b; border-bottom: 1px solid #334155;
      padding: 1.5rem 2rem; display: flex; align-items: center; gap: 1rem;
    }}
    header h1 {{ font-size: 1.5rem; font-weight: 700 }}
    header .ts {{ color: #64748b; font-size: 0.85rem; margin-left: auto }}
    main {{ max-width: 1400px; margin: 0 auto; padding: 2rem }}
    /* Hero metrics */
    .metrics {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem }}
    .metric {{
      background: #1e293b; border: 1px solid #334155; border-radius: 12px;
      padding: 1.5rem; text-align: center;
    }}
    .metric-value {{ font-size: 2.5rem; font-weight: 800; line-height: 1 }}
    .metric-label {{ color: #64748b; font-size: 0.85rem; margin-top: 0.5rem }}
    /* Phase table */
    section {{ margin-bottom: 2rem }}
    h2 {{ font-size: 1.2rem; font-weight: 600; margin-bottom: 1rem; color: #94a3b8 }}
    table {{ width: 100%; border-collapse: collapse; background: #1e293b; border-radius: 12px; overflow: hidden }}
    th {{ background: #334155; padding: 0.75rem 1rem; text-align: left; font-size: 0.85rem; color: #94a3b8 }}
    td {{ padding: 0.75rem 1rem; border-bottom: 1px solid #1e293b; font-size: 0.9rem }}
    tr:last-child td {{ border-bottom: none }}
    tr:hover td {{ background: #243045 }}
    .bar {{ background: #334155; border-radius: 4px; height: 8px; width: 150px }}
    .bar-fill {{ height: 100%; border-radius: 4px; transition: width 0.3s }}
    /* Pane cards */
    .cards {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem }}
    .card {{ background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 1.25rem }}
    .card-header {{ display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem }}
    .card-icon {{ font-size: 1.25rem }}
    .card-title {{ font-weight: 600; flex: 1; font-size: 0.9rem }}
    .badge {{ padding: 0.2rem 0.6rem; border-radius: 20px; font-size: 0.8rem; font-weight: 700; color: #fff }}
    .card-specs {{ display: flex; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 0.5rem }}
    .tag {{ background: #334155; padding: 0.15rem 0.5rem; border-radius: 4px; font-size: 0.75rem; color: #94a3b8 }}
    .tag.gray {{ background: #1e293b; border: 1px solid #334155 }}
    .card-status {{ font-size: 0.8rem; color: #64748b }}
    /* Warnings */
    .warnings-list {{ display: flex; flex-direction: column; gap: 0.5rem }}
    .warning {{ background: #451a03; border: 1px solid #78350f; border-radius: 8px; padding: 0.75rem 1rem; font-size: 0.9rem }}
    .ok {{ background: #052e16; border: 1px solid #14532d; border-radius: 8px; padding: 0.75rem 1rem; font-size: 0.9rem }}
    /* Score ring */
    .score-ring {{ position: relative; width: 120px; height: 120px; margin: 0 auto 0.5rem }}
    .score-ring svg {{ transform: rotate(-90deg) }}
    .score-text {{
      position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
      font-size: 1.8rem; font-weight: 800;
    }}
    /* Responsive */
    @media (max-width: 640px) {{ .metrics {{ grid-template-columns: 1fr 1fr }} }}
  </style>
</head>
<body>
  <header>
    <span style="font-size:1.5rem">🏥</span>
    <h1>eCyPro E2E Sağlık Dashboard</h1>
    <span class="ts">{report['timestamp']}</span>
  </header>
  <main>
    <!-- Hero Metrics -->
    <div class="metrics">
      <div class="metric">
        <div class="metric-value" style="color:#6366f1">{report['total_tests']}</div>
        <div class="metric-label">Toplam Test</div>
      </div>
      <div class="metric">
        <div class="metric-value" style="color:#06b6d4">{report['total_specs']}</div>
        <div class="metric-label">Spec Dosyası</div>
      </div>
      <div class="metric">
        <div class="metric-value" style="color:#8b5cf6">15</div>
        <div class="metric-label">Aktif Pane</div>
      </div>
      <div class="metric">
        <div class="score-ring">
          <svg viewBox="0 0 120 120" width="120" height="120">
            <circle cx="60" cy="60" r="50" fill="none" stroke="#334155" stroke-width="10"/>
            <circle cx="60" cy="60" r="50" fill="none" stroke="{score_color}"
              stroke-width="10" stroke-dasharray="{int(score_pct*3.14)},314"
              stroke-linecap="round"/>
          </svg>
          <div class="score-text" style="color:{score_color}">{score_pct}%</div>
        </div>
        <div class="metric-label">Kapsam Skoru</div>
      </div>
    </div>

    <!-- Phase Table -->
    <section>
      <h2>📦 Phase Bazlı Analiz</h2>
      <table>
        <thead>
          <tr>
            <th>Phase</th><th>Spec</th><th>Test</th><th>Yoğunluk</th><th>Durum</th>
          </tr>
        </thead>
        <tbody>{phase_rows()}</tbody>
      </table>
    </section>

    <!-- Pane Cards -->
    <section>
      <h2>🖥️ 15-Pane Kapsam</h2>
      <div class="cards">{pane_cards()}</div>
    </section>

    <!-- Warnings -->
    <section>
      <h2>⚠️ Uyarılar & Öneriler</h2>
      <div class="warnings-list">{warnings_html}</div>
    </section>
  </main>
  <script>
    // Auto-refresh every 30 seconds
    setTimeout(() => location.reload(), 30000);
    console.log('[E2E Dashboard] {report["total_tests"]} test, {report["total_specs"]} spec. Coverage: {score_pct}%');
  </script>
</body>
</html>"""

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"[e2e_health] HTML dashboard: {output_path}")

# ─── Entry point ──────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(
        description="eCyPro E2E Sağlık İzleyicisi",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("--output", "-o", help="HTML dashboard çıktı yolu",
                        default="public/tools/e2e-dashboard.html")
    parser.add_argument("--json", "-j", action="store_true", help="JSON çıktısı")
    parser.add_argument("--watch", "-w", action="store_true", help="10sn'de bir yenile")
    parser.add_argument("--no-html", action="store_true", help="HTML üretme")
    parser.add_argument("--e2e-dir", default="e2e", help="E2E spec dizini")
    # IDE terminal satır-içi yorumları literal geçebilir — filtrele
    sys.argv = [a for a in sys.argv if not a.startswith('#')]
    args, _ = parser.parse_known_args()

    def run_once() -> None:
        report = analyze(args.e2e_dir)
        if args.json:
            print(json.dumps(report, indent=2, ensure_ascii=False))
        else:
            print_cli(report)
            if not args.no_html:
                generate_html(report, args.output)

    if args.watch:
        print("[e2e_health] Watch mode aktif (Ctrl+C ile dur)")
        while True:
            try:
                run_once()
                time.sleep(10)
            except KeyboardInterrupt:
                print("\n[e2e_health] Durduruldu.")
                sys.exit(0)
    else:
        run_once()

if __name__ == "__main__":
    main()
