---
description: Verify DNS A/AAAA/CNAME/NS/TXT/MX for ecypro.com + www; assess propagation across resolvers
argument-hint: "[--domain <name>] [--resolvers 8.8.8.8,1.1.1.1,9.9.9.9]"
model: claude-haiku-4-5
allowed-tools: Bash, Write
---

# /dns-verify

DNS sağlığını tek geçişle doğrular. `devops-publisher` zincirinin pre-flight ayağı.

## Workflow

```bash
DOMAIN="${1:-ecypro.com}"
RESOLVERS=("8.8.8.8" "1.1.1.1" "9.9.9.9")  # Google, Cloudflare, Quad9

OUT="outputs/dns-$(date +%F).log"
exec > >(tee "$OUT") 2>&1

echo "=== A records ==="
for r in "${RESOLVERS[@]}"; do
  echo "[$r] $DOMAIN     → $(dig @$r +short A $DOMAIN)"
  echo "[$r] www.$DOMAIN → $(dig @$r +short A www.$DOMAIN)"
done

echo ""
echo "=== AAAA (IPv6) ==="
dig +short AAAA "$DOMAIN"
dig +short AAAA "www.$DOMAIN"

echo ""
echo "=== CNAME ==="
dig +short CNAME "www.$DOMAIN"

echo ""
echo "=== NS ==="
dig +short NS "$DOMAIN"

echo ""
echo "=== TXT — verification + DMARC ==="
dig +short TXT "$DOMAIN"
dig +short TXT "_dmarc.$DOMAIN"
dig +short TXT "_google-site-verification.$DOMAIN"

echo ""
echo "=== MX ==="
dig +short MX "$DOMAIN"

echo ""
echo "=== SOA ==="
dig +noall +answer SOA "$DOMAIN"

echo ""
echo "=== Propagation hint ==="
echo "Resolver consensus: $(dig @8.8.8.8 +short A www.$DOMAIN | head -1) vs $(dig @1.1.1.1 +short A www.$DOMAIN | head -1)"
```

## Expected (Hostinger shared)
- `A ecypro.com` → Hostinger shared IP (e.g. `145.14.x.x`).
- `CNAME www.ecypro.com` → `ecypro.com.` or A directly.
- `NS` → Hostinger default `ns1.dns-parking.com.` `ns2.dns-parking.com.` or custom.

## Red flags
- Apex resolves to `127.0.0.1` — DNS misconfigured.
- www doesn't resolve — CNAME missing.
- NS differs from registrar — propagation pending (1-24h).
- Resolver consensus mismatch — partial propagation.

## Çıktı

```
outputs/dns-<date>.log
```

`devops-publisher` ajanı bu log'u okur ve publish-go zincirinde gate olarak kullanır.

## Sandbox

Sandbox'ta network çıkışı kapalı — bu komut **yalnızca host'ta** çalışır.
