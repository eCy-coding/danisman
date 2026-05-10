# EcyPro Premium Consulting - Dashboard

High-performance, premium administrative dashboard for EcyPro consulting services. Built with modern web technologies focusing on performance, accessibility, and visual excellence.

## 🚀 Tech Stack

- **Framework:** React 19 + Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4 (PostCSS)
- **State Management:** Zustand
- **Routing:** React Router DOM v7
- **Charts:** Recharts
- **Forms:** React Hook Form + Zod
- **Testing:** Vitest (Unit) + Playwright (E2E)
- **Linting:** ESLint + Prettier + Husky
- **Email:** EmailJS
- **Monitoring:** Web Vitals

## 🎨 Design Philosophy: "AI Studio Tech"

This project has been rigorously engineered to align with the **Google AI Studio / Material 3** aesthetic, moving away from subjective "luxury" to objective "technical excellence".

### Core Principles

1.  **Solid Surfaces**: Removed all glassmorphism/blur effects in favor of opaque, high-contrast M3 surfaces (`#1E1F20`).
2.  **Information Density**: High-density layouts inspired by IDEs and data terminals.
3.  **Typography**: Strict adherence to `Inter` / `Roboto` sans-serif stack for maximum legibility.
4.  **Interaction**: Subtle, performance-optimized micro-interactions (`hover:scale`, `active:scale`).

## 📐 Mathematical Harmony: The Golden Ratio

Every spatial and typographic decision in this project is governed by the **Golden Ratio (φ ≈ 1.618)** and the **Fibonacci Sequence**.

- **Typography**: Font sizes scale by 1.618.
  - `text-golden-base` (16px) -> `text-golden-lg` (~26px) -> `text-golden-xl` (~42px) -> `text-golden-2xl` (~68px).
- **Spacing (Fibonacci)**: All margins, paddings, and gaps use the Fibonacci sequence (`2, 3, 5, 8, 13, 21, 34, 55, 89px`).
  - Classes: `.p-fib-6` (21px), `.gap-fib-7` (34px), `.mb-fib-9` (89px).
  - **Zero Magic Numbers**: We do not use arbitrary values like `20px` or `30px`.

This ensures a subconscious, natural rhythm and visual harmony throughout the application.

- Node.js >= 20.0.0
- npm >= 10.0.0
- Docker (optional, for containerized deployment)

## 🏃‍♂️ Getting Started

### 1. Clone & Install

```bash
git clone <repo-url>
cd copy-of-ecypro-premium-consulting
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env.local
# Edit .env.local and add your EmailJS credentials
```

### 3. Development Server

#### Hızlı (3 paralel servis)

```bash
npm run dev
```

Visit `http://localhost:5173`.

#### Tam Stack — 15-Pane Orchestrator (önerilen)

İstek5 disiplininde tüm dev stack'i tek komutla:

```bash
npm run dev:up      # Docker (Postgres+Redis+Mailpit) + tmux 15-pane
npm run dev:down    # her şeyi kapat
npm run dev:full    # tmux yoksa concurrently fallback (CI uyumlu)
```

15 pane: Frontend, Backend, DB, E2E, SEO-Watch, Media-Watcher, LHCI, Logs,
Analytics-Dev, Sec-Watch, Deploy-Watch, Geo-Watch, CRM-Watch, Status.

Detay: [`docs/ORCHESTRATOR.md`](docs/ORCHESTRATOR.md).

### 4. Production Build

```bash
npm run build
npm run preview
```

## 🧪 Testing

- **Unit Tests:** `npm run test`
- **E2E Tests (Quick):** `npm run e2e:local` — starts mock API + preview + Playwright
- **E2E Tests (Manual):** `npx playwright test`
- **Lint:** `npm run lint`
- **Format:** `npm run format`
- **E2E Guide:** See [docs/E2E_LOCAL.md](docs/E2E_LOCAL.md) for detailed troubleshooting

## 📧 EmailJS Configuration

1. Sign up at [https://www.emailjs.com/](https://www.emailjs.com/)
2. Create an email service (Gmail, Outlook, etc.)
3. Create a template with variables: `from_name`, `from_email`, `message`, `to_name`
4. Add credentials to `.env.local`:
   ```
   VITE_EMAILJS_SERVICE_ID=your_service_id
   VITE_EMAILJS_TEMPLATE_ID=your_template_id
   VITE_EMAILJS_PUBLIC_KEY=your_public_key
   ```

## 🐳 Docker Deployment

### Build Image

```bash
docker build -t ecypro-dashboard:v1.0.0 .
```

### Run Container

```bash
docker run -d \
  --name ecypro-dashboard \
  -p 80:80 \
  --restart unless-stopped \
  ecypro-dashboard:v1.0.0
```

### Docker Compose

```bash
docker-compose up -d
```

## 📁 Project Structure

```
├── components/       # React components
│   ├── features/     # Feature-specific components
│   ├── layout/       # Layout components
│   ├── ui/           # Reusable UI components
│   └── ...
├── pages/            # Page components
├── services/         # Business logic & API calls
├── store/            # Zustand store
├── utils/            # Utility functions
├── public/           # Static assets
└── docs/             # Documentation
```

## 🎨 Features

- ✅ Landing page with sections (Hero, Services, KPI, etc.)
- ✅ Dashboard with analytics and consulting module
- ✅ CRUD operations for consulting sessions
- ✅ Role-based access control (Admin/Client)
- ✅ Contact form with EmailJS integration
- ✅ Responsive design
- ✅ Dark mode support
- ✅ PWA support
- ✅ SEO optimized (robots.txt, sitemap.xml)
- ✅ 404 error page
- ✅ Web Vitals monitoring
- ✅ CI/CD ready (GitHub Actions)

## 📊 Performance

- Bundle size: ~1.1 MB (precached)
- Lighthouse score: 90+ (Performance, Accessibility, Best Practices, SEO)
- Core Web Vitals: All passing

## 🔒 Security

- Content Security Policy (CSP) headers
- Input validation with Zod
- No hardcoded secrets
- Dependency audit: 0 vulnerabilities

## 🤖 Claude Code (opsiyonel AI coding companion)

Bu projeye **Claude Code CLI** entegre edilmiştir. Kurmak isteyen geliştiriciler için tek komut:

```bash
npm run claude:setup    # idempotent install + sağlık kontrolü
```

Sonra slash komutlar hazır: `/lint-fix`, `/typecheck`, `/e2e`, `/publish-check`, `/phase-status`, `/secret-scan`.

Detaylı rehber (Türkçe): [docs/CLAUDE_CODE.md](docs/CLAUDE_CODE.md)

> Claude Code zorunlu bir bağımlılık değildir; proje onsuz da tüm npm/CI zinciriyle çalışır.

## 🤖 Content Generation

AI-powered blog post and case study generation via `gen:content` script.

### Setup

```bash
# Copy env template and fill in keys (optional — script skips gracefully without keys)
cp .env.example .env
# OPENAI_API_KEY=sk-...       # Required for text generation
# PEXELS_API_KEY=...          # Required for hero images
```

### Usage

```bash
npm run gen:content           # Generate 5 blog posts + 5 case studies (bilingual)
```

Generated content is written to `src/data/constants_generated.ts` and immediately visible in the Insights and SuccessStories sections of the homepage.

**Recommended frequency:** Run before each content sprint (weekly or monthly). Generated content is deterministic given the same seed prompts. Existing entries are overwritten on each run — commit the output file to version control.

### Without API Keys

The script exits gracefully with a `[gen:content] skipping — no OPENAI_API_KEY` message. Fallback content (5 bilingual entries) is already committed and works without any keys.

## 📚 Documentation

- [Deployment Guide](docs/DEPLOYMENT.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)
- [Claude Code Integration](docs/CLAUDE_CODE.md)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

Proprietary - © 2025 EcyPro Consulting

## 📞 Support

- Email: info@ecypro.com
- Website: https://www.ecypro.com
