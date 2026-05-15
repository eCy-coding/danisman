# Deployment — Hostinger VPS (api.ecypro.com)

**Hedef:** Render/Railway'a alternatif. EcyPro API'ı Hostinger VPS'inde Docker + nginx + PM2 ile çalıştır.
**Frontend:** Hostinger shared hosting (static).
**API:** Hostinger VPS (KVM 1+, en az 1 vCPU + 4GB RAM).

Avantaj: tek faturada hem frontend hem backend, EU GDPR-friendly. Dezavantaj: ops yükü kullanıcının üzerinde (auto-deploy yok, SSL renewal yok, monitoring kurulumu yok).

---

## 1. Ön gereksinimler

- Hostinger VPS (Ubuntu 22.04 önerili)
- SSH erişimi (`ssh root@VPS_IP`)
- Domain Hostinger'da (api.ecypro.com için A record)

## 2. Sunucu hazırlığı

```bash
ssh root@VPS_IP

# Sistem güncelle
apt update && apt upgrade -y

# Docker + Compose
curl -fsSL https://get.docker.com | sh
apt install -y docker-compose-plugin

# Node 22 (PM2 alternatifi için)
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs

# nginx (reverse proxy + SSL)
apt install -y nginx certbot python3-certbot-nginx

# Firewall
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

## 3. Repo clone

```bash
mkdir -p /opt/ecypro
cd /opt/ecypro
git clone https://github.com/<user>/ecypro.git .
git checkout main
```

## 4. .env oluştur

```bash
cp .env.production.example .env
nano .env
# Set: DATABASE_URL, JWT_SECRET (openssl rand -hex 64), CORS_ORIGIN,
# SENTRY_DSN, REDIS_URL, CALCOM_*, RESEND_*, TELEGRAM_*, etc.
chmod 600 .env
```

## 5. Postgres + Redis (docker-compose)

```bash
docker compose -f docker-compose.yml up -d postgres redis
# (production compose'unun postgres + redis service'leri olduğunu varsayar;
#  yoksa docker-compose.dev.yml'i prod için adapte et veya managed service kullan)
```

## 6. Backend image build + run

```bash
# Build (multi-stage Dockerfile, backend stage)
docker build --target backend -t ecypro-api:latest .

# Run (entrypoint.sh otomatik prisma migrate deploy çalıştırır)
docker run -d \
  --name ecypro-api \
  --restart unless-stopped \
  --env-file .env \
  -p 127.0.0.1:3001:3001 \
  ecypro-api:latest
```

veya docker-compose servis tanımı varsa:

```bash
docker compose up -d api
```

## 7. nginx reverse proxy

```nginx
# /etc/nginx/sites-available/api.ecypro.com
server {
  listen 80;
  server_name api.ecypro.com;

  # SSE timeouts
  proxy_read_timeout 1d;
  proxy_buffering off;

  location / {
    proxy_pass http://127.0.0.1:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
  }

  # Direct health check (skip body buffering)
  location /api/health {
    proxy_pass http://127.0.0.1:3001/api/health;
  }
}
```

```bash
ln -s /etc/nginx/sites-available/api.ecypro.com /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

## 8. SSL (Let's Encrypt)

DNS önce: A record `api.ecypro.com → VPS_IP`. Yayılması ~5-30 dk.

```bash
certbot --nginx -d api.ecypro.com --redirect --agree-tos -m emrecnyn@gmail.com
# Otomatik renewal cron zaten certbot ile gelir.
```

## 9. PM2 alternatifi (Docker yerine native node)

```bash
cd /opt/ecypro
npm ci
npx prisma generate
npx prisma migrate deploy
npx tsc -p tsconfig.server.json
pm2 start ecosystem.config.cjs --env production
pm2 save
pm2 startup systemd -u root --hp /root
```

`ecosystem.config.cjs` zaten projede mevcut (P3 öncesi commit).

## 10. Auto-deploy (basit script)

```bash
# /opt/ecypro/deploy.sh
#!/usr/bin/env bash
set -e
cd /opt/ecypro
git fetch origin main
git reset --hard origin/main
npm ci
npx prisma generate
npx prisma migrate deploy
npx tsc -p tsconfig.server.json
pm2 reload ecosystem.config.cjs --env production
```

```bash
chmod +x deploy.sh
# Cron veya GitHub webhook → /opt/ecypro/deploy.sh
```

## 11. Smoke tests

```bash
curl https://api.ecypro.com/api/health
curl https://api.ecypro.com/api/ready
```

## 12. Monitoring

- **Sentry:** `SENTRY_DSN` ile aktif → hatalar dashboard'da
- **Better Stack:** `LOGTAIL_SOURCE_TOKEN` opsiyonel
- **PM2 monit:** `pm2 monit` (terminal dashboard)
- **Hostinger built-in:** VPS dashboard → CPU/RAM/disk grafik

## 13. Backup

```bash
# Postgres dump (cron, günde 1)
0 3 * * * docker exec ecypro-postgres pg_dump -U ecypro_user ecypro | gzip > /backup/ecypro-$(date +\%Y\%m\%d).sql.gz

# Eski backup'ları sil (>14 gün)
0 4 * * * find /backup -name "ecypro-*.sql.gz" -mtime +14 -delete
```

## 14. Maliyet (Mayıs 2026)

Hostinger VPS KVM 2 (2 vCPU, 8GB RAM, 100GB SSD): ~€8/ay.
Render/Railway'a göre %50 ucuz, ops yükü +%200.

---

**Tavsiye:** İlk launch için Render kullan (kolay, otomatik). Trafik / yük arttıkça veya cost-optimization gerekince Hostinger VPS'e geçiş bu doc'ta hazır.
