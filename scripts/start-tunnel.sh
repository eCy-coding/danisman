#!/usr/bin/env bash
# ─── EcyPro Cloudflare Tunnel Launcher ───────────────────────────────────────
# Cloudflare tunnel üzerinden lokal sunucuyu public HTTPS URL'e expose eder.
# Kullanım: bash scripts/start-tunnel.sh
# ─────────────────────────────────────────────────────────────────────────────
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# .env.local'dan TUNNEL_TOKEN oku
if [[ -f "$ROOT/.env.local" ]]; then
  while IFS= read -r line || [[ -n "$line" ]]; do
    [[ "$line" =~ ^#.*$ || -z "$line" ]] && continue
    key="${line%%=*}"
    val="${line#*=}"
    val="${val%\"}"
    val="${val#\"}"
    if [[ "$key" == "TUNNEL_TOKEN" ]]; then
      TUNNEL_TOKEN="$val"
    fi
  done < "$ROOT/.env.local"
fi

if [[ -z "${TUNNEL_TOKEN:-}" ]]; then
  echo "❌ TUNNEL_TOKEN bulunamadı. .env.local'a ekle."
  exit 1
fi

echo "🚇 Cloudflare Tunnel başlatılıyor…"
echo "   Çıkmak için: Ctrl+C"
exec cloudflared tunnel run --token "$TUNNEL_TOKEN"
