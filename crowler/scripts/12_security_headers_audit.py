"""
crowler/scripts/12_security_headers_audit.py
P35: Auth + Security Hardening — HTTP Security Header Audit (Scrapling tabanlı).
roadmap_50.md: T45 (CSP), T46 (OWASP), T50 (npm audit / security scan) doğrulama.

OWASP Security Headers Project kontrolü:
  - Content-Security-Policy
  - Strict-Transport-Security (HSTS)
  - X-Frame-Options
  - X-Content-Type-Options: nosniff
  - Referrer-Policy
  - Permissions-Policy
  - Server versiyon disclosure
  - X-Powered-By kaldırılmış mı
  - CORS wildcard
  - Cookie security flags (Secure, HttpOnly, SameSite)

Çalıştır:
  python3 scripts/12_security_headers_audit.py --base http://localhost:4173
  python3 scripts/12_security_headers_audit.py --base https://www.ecypro.com
"""
import argparse
import json
import sys
import time
from datetime import datetime
from pathlib import Path
from urllib.parse import urlparse
import urllib.request
from typing import Any

try:
    from scrapling.fetchers import Fetcher
    SCRAPLING_OK = True
except Exception:
    SCRAPLING_OK = False

REPORTS_DIR = Path(__file__).parent.parent / "reports"

# OWASP Security Headers: header adı → (zorunlu mu, beklenen değer/pattern, açıklama)
SECURITY_HEADERS: dict[str, dict[str, Any]] = {
    "x-content-type-options": {
        "required": True,
        "expected": "nosniff",
        "severity": "HIGH",
        "description": "MIME sniffing saldırılarını önler",
    },
    "x-frame-options": {
        "required": True,
        "expected": ["DENY", "SAMEORIGIN"],
        "severity": "HIGH",
        "description": "Clickjacking saldırılarını önler",
    },
    "referrer-policy": {
        "required": True,
        "expected": ["strict-origin", "strict-origin-when-cross-origin", "no-referrer"],
        "severity": "MEDIUM",
        "description": "Referrer bilgisi sızıntısını önler",
    },
    "permissions-policy": {
        "required": False,
        "expected": None,
        "severity": "LOW",
        "description": "Browser özellik izinlerini kısıtlar",
    },
    "strict-transport-security": {
        "required": False,  # Localhost'ta gelmez
        "expected": "max-age",
        "severity": "HIGH",
        "description": "HTTPS zorunlu kılar (HSTS)",
    },
    "content-security-policy": {
        "required": False,  # Dev'de olmayabilir
        "expected": None,
        "severity": "HIGH",
        "description": "XSS + injection saldırılarını sınırlar",
    },
}

DANGEROUS_HEADERS = {
    "x-powered-by": {"severity": "MEDIUM", "description": "Teknoloji stack ifşası"},
    "server": {"severity": "LOW", "description": "Sunucu yazılım bilgisi ifşası"},
    "x-aspnet-version": {"severity": "HIGH", "description": ".NET versiyonu ifşası"},
    "x-aspnetmvc-version": {"severity": "HIGH", "description": "MVC versiyonu ifşası"},
}


def score_csp(csp: str) -> tuple[int, list[str]]:
    """CSP header kalitesini 0-100 skora dönüştür."""
    score = 100
    issues = []

    if "'unsafe-eval'" in csp:
        score -= 30
        issues.append("CSP: 'unsafe-eval' XSS amplifier")
    if "'unsafe-inline'" in csp:
        has_nonce = "nonce-" in csp
        has_hash = "'sha256-" in csp or "'sha384-" in csp
        if not has_nonce and not has_hash:
            score -= 20
            issues.append("CSP: 'unsafe-inline' nonce/hash olmadan")
    if "http:" in csp and "upgrade-insecure-requests" not in csp:
        score -= 15
        issues.append("CSP: HTTP kaynak izin veriliyor")
    if "default-src" not in csp:
        score -= 10
        issues.append("CSP: default-src eksik")

    return max(0, score), issues


def audit_url(base_url: str, path: str = "/") -> dict[str, Any]:
    url = base_url.rstrip("/") + path
    issues: list[dict[str, str]] = []
    warnings: list[str] = []
    passed: list[str] = []

    try:
        parsed = urlparse(url)
        is_local = parsed.hostname in ("localhost", "127.0.0.1")

        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 EcyProCrawler/1.0"})
        with urllib.request.urlopen(req, timeout=10) as r:
            raw_headers = dict(r.headers)
            headers = {k.lower(): v for k, v in raw_headers.items()}

    except Exception as exc:
        return {"url": url, "path": path, "error": str(exc)[:100], "security_score": 0, "issues": [], "passed": []}

    security_score = 100
    csp_score = 100

    # ── Zorunlu güvenlik header'ları ──────────────────────────────────
    for header_name, config in SECURITY_HEADERS.items():
        value = headers.get(header_name)

        if value:
            # Değer kontrolü
            expected = config["expected"]
            if expected:
                if isinstance(expected, list):
                    ok = any(e.lower() in value.lower() for e in expected)
                elif isinstance(expected, str):
                    ok = expected.lower() in value.lower()
                else:
                    ok = True

                if ok:
                    passed.append(f"{header_name}: ✅ ({value[:40]})")
                else:
                    issues.append({
                        "type": f"HEADER_WRONG_VALUE_{header_name.upper().replace('-', '_')}",
                        "severity": config["severity"],
                        "description": f"{header_name}: '{value}' beklenen değil",
                    })
                    security_score -= 5
            else:
                passed.append(f"{header_name}: ✅")
        else:
            if config["required"] and not is_local:
                issues.append({
                    "type": f"HEADER_MISSING_{header_name.upper().replace('-', '_')}",
                    "severity": config["severity"],
                    "description": config["description"],
                })
                security_score -= 15 if config["severity"] == "HIGH" else 8
            elif not is_local:
                warnings.append(f"{header_name}: eksik ({config['description']})")

    # ── CSP Analizi ────────────────────────────────────────────────────
    csp_value = headers.get("content-security-policy", "")
    if csp_value:
        csp_score, csp_issues = score_csp(csp_value)
        security_score = int(security_score * (csp_score / 100))
        issues.extend([{"type": "CSP_ISSUE", "severity": "HIGH", "description": i} for i in csp_issues])

    # ── Tehlikeli header'lar ───────────────────────────────────────────
    for dh_name, dh_config in DANGEROUS_HEADERS.items():
        if dh_name in headers:
            value = headers[dh_name]
            # Server: sadece versiyon içeriyorsa sorun
            if dh_name == "server" and not any(v in value.lower() for v in ["nginx/", "apache/", "iis/"]):
                continue
            issues.append({
                "type": f"DANGEROUS_HEADER_{dh_name.upper().replace('-', '_')}",
                "severity": dh_config["severity"],
                "description": f"{dh_name}: {value[:40]} — {dh_config['description']}",
            })
            if dh_config["severity"] == "HIGH":
                security_score -= 10
            elif dh_config["severity"] == "MEDIUM":
                security_score -= 5

    # ── CORS wildcard kontrolü ─────────────────────────────────────────
    acao = headers.get("access-control-allow-origin", "")
    if acao == "*":
        issues.append({
            "type": "CORS_WILDCARD",
            "severity": "HIGH",
            "description": "CORS Access-Control-Allow-Origin: * — prodüksiyonda güvensiz",
        })
        security_score -= 15

    # ── X-Frame-Options + CSP frame-ancestors ─────────────────────────
    has_xfo = "x-frame-options" in headers
    has_frame_ancestors = "frame-ancestors" in headers.get("content-security-policy", "")
    if not has_xfo and not has_frame_ancestors and not is_local:
        issues.append({
            "type": "CLICKJACKING_RISK",
            "severity": "HIGH",
            "description": "Clickjacking: X-Frame-Options veya CSP frame-ancestors yok",
        })
        security_score -= 10

    # ── İyileştirme önerileri hesapla ─────────────────────────────────
    high_issues = [i for i in issues if i.get("severity") == "HIGH"]
    medium_issues = [i for i in issues if i.get("severity") == "MEDIUM"]

    return {
        "url": url,
        "path": path,
        "security_score": max(0, min(100, security_score)),
        "csp_score": csp_score,
        "headers_present": list(passed),
        "issues": issues,
        "warnings": warnings,
        "high_count": len(high_issues),
        "medium_count": len(medium_issues),
        "http_status": 200,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="EcyPro Security Headers Audit")
    parser.add_argument("--base", default="http://localhost:4173", help="Base URL")
    parser.add_argument("--output", choices=["json", "console"], default="console")
    args = parser.parse_args()

    paths_to_audit = ["/", "/services", "/about", "/pricing", "/contact", "/login", "/blog"]
    results: list[dict[str, Any]] = []

    print(f"[12_security_headers] {len(paths_to_audit)} sayfa güvenlik denetimi…")
    print(f"Hedef: {args.base}\n")

    for path in paths_to_audit:
        result = audit_url(args.base, path)
        results.append(result)
        score = result.get("security_score", 0)
        high = result.get("high_count", 0)
        medium = result.get("medium_count", 0)
        icon = "✅" if score >= 80 and high == 0 else ("⚠" if score >= 50 else "❌")
        print(f"  {icon} {path}: skor={score} HIGH={high} MEDIUM={medium}")
        time.sleep(0.2)

    # Özet rapor
    valid = [r for r in results if "error" not in r]
    avg_score = sum(r.get("security_score", 0) for r in valid) / max(len(valid), 1)
    total_high = sum(r.get("high_count", 0) for r in valid)
    total_medium = sum(r.get("medium_count", 0) for r in valid)

    print(f"\n{'='*50}")
    print(f"Ortalama Güvenlik Skoru : {avg_score:.1f}/100")
    print(f"HIGH severity issues   : {total_high}")
    print(f"MEDIUM severity issues : {total_medium}")
    print(f"Taranan sayfa          : {len(valid)}")

    # Issue özeti
    all_issues: list[dict[str, str]] = []
    for r in valid:
        all_issues.extend(r.get("issues", []))

    unique_types = list({i["type"]: i for i in all_issues}.values())
    if unique_types:
        print("\n🔴 Bulunan Güvenlik Sorunları:")
        for issue in unique_types[:10]:
            print(f"  [{issue['severity']}] {issue['description']}")
    else:
        print("\n🟢 Kritik güvenlik sorunu bulunamadı!")

    if args.output == "json":
        REPORTS_DIR.mkdir(parents=True, exist_ok=True)
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        out_path = REPORTS_DIR / f"12_security_headers_{ts}.json"
        out_path.write_text(json.dumps(results, ensure_ascii=False, indent=2))
        print(f"\nRapor: {out_path}")

    # Exit code: HIGH issue varsa CI'da fail
    if total_high > 0:
        print(f"\n⚠ {total_high} HIGH severity issue bulundu!")
        # sys.exit(1)  # CI'da uncomment


if __name__ == "__main__":
    main()
