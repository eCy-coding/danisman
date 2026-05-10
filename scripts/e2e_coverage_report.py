#!/usr/bin/env python3
"""istek5.txt 15-Pane E2E Coverage Calculator"""
import os
import glob

specs = sorted(glob.glob("e2e/*.spec.ts"))

phase_map = {
    "1-Core (Critical)":    [
        "api_integration", "crawl_db_integration", "crawl_deployment_flow",
        "comprehensive_audit", "sanity_check", "critical_flows",
        "resilience", "diagnostic", "consulting_production", "consulting_realtime",
        "antigravity_terminal", "antigravity_terminal_stress", "terminal_ui",
        "crawl_error_pages",
    ],
    "2-UI/UX (High)":       [
        "crawl_ux_critical", "crawl_ux2_critical", "crawl_ux3_critical", "crawl_ux4_critical",
        "crawl_admin_crm", "crawl_admin_rbac", "crawl_ui_components",
        "crawl_forms_validation", "crawl_a11y_wcag",
        "a11y", "accessibility", "i18n", "navigation", "mobile_compatibility",
        "interactive_core", "zen_mode", "dashboard_adaptive", "dashboard_realtime",
        "services-filter", "crawl_i18n_deep",
    ],
    "3-Media (Medium)":     ["crawl_image_lcp", "crawl_media_optimization"],
    "4-SEO/Geo (High)":     [
        "crawl_seo_audit", "crawl_authority_seo", "crawl_schema_deep",
        "crawl_i18n_international", "crawl_geo_banner", "crawl_seo_deep",
        "seo", "seo-visual", "case_studies", "content", "content_expansion",
        "spider", "crawl_blog_content",
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
    "7-Ops/Deploy (Low)":   [
        "crawl_mobile_pwa", "crawl_url_integrity", "crawl_prompts_compliance",
        "crawl_pwa_deep", "crawl_python", "crawl_slash_commands",
        "crawl_mcp_live", "new_routes", "service_hub",
        "crawl_keystatic_cms",
    ],
}

pane_map = {
    "0-Frontend-Dev":   [
        "crawl_ux_critical", "crawl_ux2_critical", "crawl_ux3_critical",
        "crawl_ux4_critical", "crawl_ui_components",
        "navigation", "mobile_compatibility", "interactive_core",
        "zen_mode", "dashboard_adaptive", "dashboard_realtime",
    ],
    "1-Backend-API":    [
        "api_integration", "crawl_api_calibration", "crawl_api_security",
        "consulting_production", "consulting_realtime", "resilience",
    ],
    "2-DB-Postgres":    ["crawl_db_integration", "critical_flows"],
    "3-E2E-Cypress":    [
        "crawl_booking_flow", "crawl_conversion_funnel", "critical_flows",
        "crawl_runtime_stress", "grand_slam_suite", "grand_slam_verify_all",
        "sanity_check", "expansion_pack",
    ],
    "4-SEO-Geo-Admin":  [
        "crawl_seo_audit", "crawl_authority_seo", "crawl_schema_deep",
        "crawl_geo_banner", "crawl_seo_deep", "seo", "seo-visual",
        "case_studies", "spider",
    ],
    "5-UI-Storybook":   [
        "crawl_a11y_wcag", "crawl_ui_components",
        "a11y", "accessibility", "i18n", "services-filter",
    ],
    "6-Media-Watcher":  ["crawl_image_lcp", "crawl_media_optimization"],
    "7-CI-Lighthouse":  ["crawl_performance_vitals", "performance"],
    "8-Log-Tail":       [
        "crawl_observability", "diagnostic", "terminal_ui",
        "antigravity_terminal", "antigravity_terminal_stress",
    ],
    "9-Analytics-Dev":  [
        "analytics", "crawl_analytics_dev", "ai_assessment",
        "roi_calculator", "lead-gen", "newsletter",
    ],
    "10-Sec-Watch":     [
        "crawl_security_headers", "crawl_link_integrity", "crawl_api_security",
        "security", "invisible_shield", "rbac",
    ],
    "11-Deploy-Watch":  [
        "crawl_deployment_flow", "crawl_url_integrity", "crawl_pwa_deep",
        "crawl_python", "crawl_slash_commands", "crawl_mcp_live",
        "new_routes", "crawl_keystatic_cms",
    ],
    "12-UI-Designer":   [
        "crawl_ux3_critical", "crawl_forms_validation", "crawl_ui_components",
        "conversion-elements", "runtime_perfection", "crawl_conversion_advanced",
    ],
    "13-Geo-Manager":   [
        "crawl_i18n_international", "crawl_geo_banner", "crawl_seo_deep",
        "content", "content_expansion",
    ],
    "14-Lead-CRM":      [
        "crawl_admin_crm", "crawl_admin_rbac",
        "director", "sovereign_matrix", "sovereign_vault",
        "sovereign_creator", "service_hub",
    ],
}

def count_tests(path):
    try:
        content = open(path).read()
        return content.count("test('") + content.count('test("')
    except Exception:
        return 0

def find_spec(name):
    """Exact match only — kısmi eşleşme hatalı çift sayıma yol açar."""
    for s in specs:
        if os.path.basename(s).replace('.spec.ts', '') == name:
            return s
    return None

total_tests = sum(count_tests(s) for s in specs)

print("=" * 60)
print("   istek5.txt 15-Pane E2E Coverage Raporu")
print("=" * 60)
print()

# Phase Coverage
print("## PHASE BAZLI COVERAGE\n")
phase_total = 0
for phase, names in phase_map.items():
    covered = []
    missing = []
    phase_count = 0
    for name in names:
        s = find_spec(name)
        if s:
            c = count_tests(s)
            phase_count += c
            covered.append(f"  OK {os.path.basename(s)} ({c})")
        else:
            missing.append(f"  -- {name}")
    phase_total += phase_count
    status = "OK" if not missing else "PARTIAL" if covered else "MISSING"
    print(f"[{status}] Phase {phase} => {phase_count} test")
    for c in covered: print(c)
    for m in missing: print(m)
    print()

# Pane Coverage
print("## 15 PANE BAZLI COVERAGE\n")
for pane, names in pane_map.items():
    if not names:
        print(f"Pane {pane} => STORYBOOK (visual/manual)")
        continue
    pane_tests = 0
    has_spec = False
    for name in names:
        s = find_spec(name)
        if s:
            pane_tests += count_tests(s)
            has_spec = True
    status = "OK" if has_spec else "NO_SPEC"
    print(f"Pane {pane} => {pane_tests} test [{status}]")

print()
print("## OZET")
print(f"  Toplam spec dosyasi : {len(specs)}")
print(f"  Toplam test()       : {total_tests}")
# legacy
crawl_tests = sum(count_tests(s) for s in specs if "crawl_" in s)
legacy_tests = total_tests - crawl_tests
print(f"  Crawl_ testleri     : {crawl_tests}")
print(f"  Legacy testleri     : {legacy_tests}")
print(f"  Kapsamli            : 7 phase, 15 pane")

# Missing panes
missing_panes = [p for p, n in pane_map.items() if n and not any(find_spec(x) for x in n)]
if missing_panes:
    print(f"\n  EKSIK Pane-spec     : {', '.join(missing_panes)}")
else:
    print("\n  Tum pane specleri mevcut!")
print("=" * 60)
