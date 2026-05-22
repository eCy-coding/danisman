# Deployment Guide

## Prerequisites

- Node.js 20+
- npm 10+
- Docker (optional)

## Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
# Server: http://localhost:5173

# Run tests
npx playwright test

# Build for production
npm run build
npm run preview
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Required variables:

- `VITE_API_URL` - Backend API endpoint
- `VITE_EMAILJS_*` - EmailJS credentials for contact form

## Production Build

```bash
# Build optimized bundle
npm run build

# Output: dist/
# Bundle size: ~1.3MB (gzip: ~400KB)
```

## Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variables in Vercel dashboard
```

## Deploy to Netlify

```bash
# Build command
npm run build

# Publish directory
dist

# Environment variables
Set in Netlify dashboard: Settings → Build & Deploy → Environment
```

## Deploy with Docker

```bash
# Build image
docker build -t ecypro-consulting .

# Run container
docker run -p 8080:80 ecypro-consulting

# Access: http://localhost:8080
```

### Docker Compose

```bash
docker-compose up -d
```

## Deploy to AWS S3 + CloudFront

```bash
# Build
npm run build

# Sync to S3
aws s3 sync dist/ s3://your-bucket-name

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_ID --paths "/*"
```

## Performance Checklist

- ✅ Lighthouse score 95+
- ✅ Bundle size < 1.5MB
- ✅ Images optimized (WebP)
- ✅ Code splitting enabled
- ✅ PWA ready (service worker)
- ✅ SEO meta tags complete

## Monitoring

- Google Analytics: Set `VITE_GA_ID`
- Error tracking: Consider Sentry integration
- Uptime monitoring: UptimeRobot, Pingdom

## Support

For deployment issues, contact: support@ecypro.com
