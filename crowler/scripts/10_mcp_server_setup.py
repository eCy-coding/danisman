#!/usr/bin/env python3
"""
10_mcp_server_setup.py — Scrapling MCP Server Windsurf Entegrasyonu
Scrapling'in dahili MCP server'ını Windsurf/Claude Code'a bağlar.
Agent'ların web'i doğrudan okuyabilmesini sağlar.

MCP (Model Context Protocol):
  - Windsurf AI → Scrapling MCP → Web fetch
  - Claude Code → Scrapling MCP → Stealth crawl
  - Ollama → Scrapling MCP → Competitor analysis

Yapılacaklar:
  1. Scrapling MCP server'ı başlat (HTTP veya stdio)
  2. ~/.codeium/mcp_config.json'a kaydet (Windsurf)
  3. .claude/settings.json'a kaydet (Claude Code)
  4. Bağlantı testi yap
  5. Örnek kullanım göster

Kullanım:
  python3 scripts/10_mcp_server_setup.py           # Kur ve test et
  python3 scripts/10_mcp_server_setup.py --show    # Sadece config göster
  python3 scripts/10_mcp_server_setup.py --test    # Sadece bağlantı test et
"""
from __future__ import annotations

import json
import os
import subprocess
import sys
import time
from pathlib import Path
from typing import Optional

import typer
from rich.console import Console
from rich.panel import Panel
from rich.syntax import Syntax
from rich.table import Table

app = typer.Typer(help="Scrapling MCP Server Kurulum")
console = Console()

# Yollar
PROJECT_ROOT = Path(__file__).parent.parent.parent
CROWLER_DIR  = Path(__file__).parent.parent
VENV_PYTHON  = CROWLER_DIR / ".venv" / "bin" / "python3"

# Windsurf MCP config
WINDSURF_MCP_CONFIG = Path.home() / ".codeium" / "mcp_config.json"
# Claude Code settings
CLAUDE_SETTINGS     = PROJECT_ROOT / ".claude" / "settings.json"
# MCP config local copy
LOCAL_MCP_CONFIG    = CROWLER_DIR / "mcp_config.json"


def get_scrapling_mcp_cmd() -> list[str]:
    """Scrapling MCP server başlatma komutu."""
    return [str(VENV_PYTHON), "-m", "scrapling", "mcp"]


def check_scrapling_mcp_available() -> bool:
    """Scrapling MCP modülü mevcut mu?"""
    try:
        result = subprocess.run(
            [str(VENV_PYTHON), "-c", "import scrapling.mcp; print('ok')"],
            capture_output=True, text=True, timeout=5
        )
        return "ok" in result.stdout
    except Exception:
        return False


def check_scrapling_cli_mcp() -> bool:
    """scrapling mcp komutu çalışıyor mu?"""
    try:
        result = subprocess.run(
            [str(VENV_PYTHON), "-m", "scrapling", "--help"],
            capture_output=True, text=True, timeout=5
        )
        return result.returncode == 0
    except Exception:
        return False


def build_mcp_server_entry() -> dict:
    """MCP server config girdisi oluştur."""
    return {
        "name": "scrapling",
        "description": "EcyPro Scrapling — Stealth web crawl, SEO audit, competitor analysis",
        "command": str(VENV_PYTHON),
        "args": ["-m", "scrapling", "mcp"],
        "env": {
            "PYTHONPATH": str(CROWLER_DIR / "Scrapling-main"),
            "SCRAPLING_HEADLESS": "false",
            "SCRAPLING_TIMEOUT": "20",
        },
        "capabilities": [
            "fetch_page",
            "crawl_site",
            "search_google",
            "extract_seo",
            "check_links",
        ],
    }


def update_windsurf_mcp(server_entry: dict, dry_run: bool = False) -> bool:
    """Windsurf MCP config'e Scrapling ekle."""
    config_path = WINDSURF_MCP_CONFIG

    if not config_path.parent.exists():
        console.print(f"[yellow]Windsurf config dizini bulunamadı: {config_path.parent}[/]")
        return False

    existing: dict = {}
    if config_path.exists():
        try:
            existing = json.loads(config_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            existing = {}

    servers: list = existing.get("mcpServers", existing.get("servers", []))
    if isinstance(servers, dict):
        servers = [{"name": k, **v} for k, v in servers.items()]

    # Scrapling zaten varsa güncelle
    scrapling_idx = next((i for i, s in enumerate(servers) if s.get("name") == "scrapling"), None)
    if scrapling_idx is not None:
        servers[scrapling_idx] = server_entry
        action = "güncellendi"
    else:
        servers.append(server_entry)
        action = "eklendi"

    existing["mcpServers"] = servers

    if not dry_run:
        config_path.write_text(json.dumps(existing, indent=2, ensure_ascii=False), encoding="utf-8")

    console.print(f"  ✓ Windsurf MCP config {action}: [cyan]{config_path}[/]")
    return True


def update_claude_settings(server_entry: dict, dry_run: bool = False) -> bool:
    """Claude Code .claude/settings.json'a Scrapling MCP ekle."""
    settings_path = CLAUDE_SETTINGS

    if not settings_path.parent.exists():
        settings_path.parent.mkdir(parents=True, exist_ok=True)

    existing: dict = {}
    if settings_path.exists():
        try:
            existing = json.loads(settings_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            existing = {}

    # Claude Code MCP format
    mcp_servers: dict = existing.get("mcpServers", {})
    mcp_servers["scrapling"] = {
        "command": server_entry["command"],
        "args": server_entry["args"],
        "env": server_entry.get("env", {}),
    }
    existing["mcpServers"] = mcp_servers

    if not dry_run:
        settings_path.write_text(json.dumps(existing, indent=2, ensure_ascii=False), encoding="utf-8")

    console.print(f"  ✓ Claude Code settings güncellendi: [cyan]{settings_path}[/]")
    return True


def save_local_config(server_entry: dict) -> None:
    """Yerel kopya kaydet."""
    config = {
        "_comment": "Scrapling MCP Server — Windsurf + Claude Code entegrasyonu",
        "scrapling_mcp": server_entry,
        "usage": {
            "windsurf":     f"~/.codeium/mcp_config.json içine mcpServers listesine ekle",
            "claude_code":  f"{CLAUDE_SETTINGS} içine mcpServers dict'ine ekle",
            "manual_start": " ".join(get_scrapling_mcp_cmd()),
        },
        "example_prompts": [
            "Use Scrapling to fetch https://ecypro.com and extract all H1 tags",
            "Crawl https://bcg.com and find all resource links",
            "Check if https://ecypro.com/blog has any broken links",
            "Extract meta description from https://mckinsey.com homepage",
        ],
    }
    LOCAL_MCP_CONFIG.write_text(json.dumps(config, indent=2, ensure_ascii=False), encoding="utf-8")
    console.print(f"  ✓ Yerel config kaydedildi: [cyan]{LOCAL_MCP_CONFIG}[/]")


def test_scrapling_basic() -> bool:
    """Temel Scrapling çalışma testi."""
    test_code = """
from scrapling.fetchers import Fetcher
f = Fetcher(auto_match=False)
p = f.get('http://httpbin.org/get', timeout=10)
assert p is not None, "Fetch başarısız"
print("scrapling_ok")
"""
    try:
        result = subprocess.run(
            [str(VENV_PYTHON), "-c", test_code],
            capture_output=True, text=True, timeout=20
        )
        return "scrapling_ok" in result.stdout
    except Exception:
        return False


def show_usage_examples() -> None:
    console.print("\n[bold cyan]Kullanım Örnekleri:[/]\n")

    examples = {
        "01 Rakip Audit": "python3 crowler/scripts/01_competitor_seo_audit.py",
        "02 Kırık Link": "python3 crowler/scripts/02_broken_link_checker.py",
        "03 Canonical": "python3 crowler/scripts/03_canonical_hreflang_audit.py",
        "04 Keyword": "python3 crowler/scripts/04_keyword_density_audit.py --keyword 'stratejik danışmanlık'",
        "05 Backlink": "python3 crowler/scripts/05_backlink_opportunity_finder.py",
        "06 Google Index": "python3 crowler/scripts/06_google_index_checker.py",
        "07 LCP Görsel": "python3 crowler/scripts/07_lcp_image_audit.py",
        "08 İç Link Graf": "python3 crowler/scripts/08_internal_link_graph.py",
        "09 SERP Takip": "python3 crowler/scripts/09_serp_rank_tracker.py",
        "10 MCP Kurulum": "python3 crowler/scripts/10_mcp_server_setup.py",
    }

    for name, cmd in examples.items():
        console.print(f"  [green]{name}:[/] [dim]{cmd}[/]")

    console.print("\n[bold cyan]npm Kısayolları:[/]")
    npm_cmds = [
        "npm run crowler:competitor",
        "npm run crowler:links",
        "npm run crowler:seo",
        "npm run crowler:keywords",
        "npm run crowler:lcp",
        "npm run crowler:graph",
        "npm run crowler:serp",
        "npm run crowler:all",
    ]
    for c in npm_cmds:
        console.print(f"  [green]{c}[/]")


@app.command()
def run(
    show: bool = typer.Option(False, "--show", help="Config'i göster, kaydetme"),
    test: bool = typer.Option(False, "--test", help="Sadece bağlantı testi"),
    dry_run: bool = typer.Option(False, "--dry-run", help="Dosyalara yazma"),
    skip_windsurf: bool = typer.Option(False, "--skip-windsurf"),
    skip_claude: bool = typer.Option(False, "--skip-claude"),
) -> None:
    """Scrapling MCP Server'ı Windsurf ve Claude Code'a bağla."""
    console.rule("[bold cyan]Scrapling MCP Server Kurulumu[/]")

    # Durum kontrolü
    console.print("\n[bold]Durum Kontrolü:[/]")
    scrapling_ok = check_scrapling_cli_mcp()
    venv_exists  = VENV_PYTHON.exists()
    windsurf_cfg = WINDSURF_MCP_CONFIG.exists()
    claude_cfg   = CLAUDE_SETTINGS.parent.exists()

    table = Table(show_header=True)
    table.add_column("Bileşen")
    table.add_column("Durum", style="bold")
    table.add_row("Scrapling venv",     "✅ Kurulu" if venv_exists else "❌ Yok")
    table.add_row("Scrapling CLI",      "✅ Hazır" if scrapling_ok else "⚠ Sınırlı (0.4.7)")
    table.add_row("Windsurf MCP dir",   "✅ Mevcut" if windsurf_cfg else "⚠ Bulunamadı")
    table.add_row("Claude Code dir",    "✅ Mevcut" if claude_cfg else "⚠ Oluşturulacak")
    console.print(table)

    if test:
        console.print("\n[bold]Temel Scrapling Testi:[/]")
        if test_scrapling_basic():
            console.print("[green]✅ Scrapling Fetcher çalışıyor[/]")
        else:
            console.print("[red]❌ Scrapling Fetcher hatası — internet bağlantısı var mı?[/]")
        return

    server_entry = build_mcp_server_entry()

    if show:
        console.print("\n[bold]MCP Server Config:[/]")
        console.print(Syntax(json.dumps(server_entry, indent=2), "json", theme="monokai"))
        return

    # Windsurf MCP güncelle
    if not skip_windsurf:
        console.print("\n[bold]1. Windsurf MCP Config:[/]")
        update_windsurf_mcp(server_entry, dry_run=dry_run)

    # Claude Code güncelle
    if not skip_claude:
        console.print("\n[bold]2. Claude Code Settings:[/]")
        update_claude_settings(server_entry, dry_run=dry_run)

    # Yerel config
    console.print("\n[bold]3. Yerel Config:[/]")
    if not dry_run:
        save_local_config(server_entry)

    # Test
    console.print("\n[bold]4. Scrapling Testi:[/]")
    if test_scrapling_basic():
        console.print("[green]✅ Scrapling Fetcher başarıyla test edildi[/]")
    else:
        console.print("[yellow]⚠ Test kısmen başarısız — internet bağlantısı kontrol edin[/]")

    # MCP Server başlatma kılavuzu
    mcp_cmd = " ".join(get_scrapling_mcp_cmd())
    console.print(Panel(
        f"[bold]MCP Server'ı Manuel Başlatmak İçin:[/]\n\n"
        f"  [green]{mcp_cmd}[/]\n\n"
        f"[dim]Windsurf'ta 'scrapling' MCP provider seçerek ajanların web'i okumasını sağlayabilirsiniz.[/]",
        title="MCP Server",
        border_style="cyan",
    ))

    show_usage_examples()

    console.print("\n[bold green]✅ Scrapling MCP kurulumu tamamlandı![/]")
    if dry_run:
        console.print("[yellow]DRY RUN moduydu — gerçek dosya değişikliği yapılmadı[/]")


if __name__ == "__main__":
    app()
