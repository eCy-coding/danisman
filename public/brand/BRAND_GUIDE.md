# eCyPro Brand Guide

**P48 — Corporate Identity System (Mayıs 2026)**

## Color Palette

| Token | Hex | Kullanım |
|---|---|---|
| Primary Indigo | `#2563EB` | CTA, anchor, primary brand color, marka gradient başlangıcı |
| Secondary Violet | `#7C3AED` | Mark gradient bitiş, premium tone signal |
| Premium Gold | `#F59E0B` | "Pro" emphasis, accent dot, premium star spark |
| Premium Gold Dark | `#D97706` | Gold gradient bitiş (depth) |
| Slate 950 | `#0F172A` | Mark background, text-on-light |
| Slate 900 | `#1E1B3A` | Mark background gradient bitiş (subtle violet shift) |
| Slate 100 | `#F8FAFC` | "eCy" text-on-dark |
| Slate 400 | `#94A3B8` | Tagline "PREMIUM CONSULTING" |

## Typography

- **Font:** Inter (Latin + Latin-ext) — site genelinde
- **Wordmark:**
  - `eCy` — Weight **500** (medium), letter-spacing -0.025em
  - `Pro` — Weight **700** (bold), gold gradient, letter-spacing -0.015em
  - Word-play emphasis: "Pro" = **PRO**fessional Consulting premium signal
- **Tagline:** Inter 600, letter-spacing 0.32em (uppercase, wide)

## Logo Variants

| Variant | Size | Kullanım |
|---|---|---|
| `full` (horizontal) | 28-56px height | Navbar (sm), Footer (md), 404 (md), email signature |
| `mark` (icon only) | 16-128px | Favicon, PWA icons, social avatar, mobile compact |
| `wordmark` (text only) | 18-36px | Inline mention, breadcrumb |
| `stacked` | 200×220 | OG share, business card, big screen hero |
| `mono-light` | any | Dark backgrounds, full white version |
| `mono-dark` | any | Light backgrounds, full slate version |

## Source Files

```
public/brand/
├── icon-mark.svg              ← Mark only (64×64 viewBox)
├── icon-mark-mono-light.svg   ← White (transparent bg)
├── icon-mark-mono-dark.svg    ← Slate (transparent bg)
├── logo-horizontal.svg        ← Mark + wordmark side-by-side (360×80)
├── logo-stacked.svg           ← Mark above wordmark + tagline (200×220)
├── favicon.svg                ← Browser tab icon (32×32)
├── og-share.svg               ← Social share image (1200×630)
└── BRAND_GUIDE.md             ← This file
```

## Anatomi

### Mark (Icon)
- Geometric "e" letterform: **300° clockwise arc** (center (32,35), radius 14) + horizontal crossbar
- Endpoint nodes:
  - Left arc start `(18,35)`: violet `#7C3AED`, r=2.5
  - Right crossbar end `(46,35)`: indigo `#2563EB`, r=2
  - Upper arc end `(39,22)`: gold `#F59E0B`, r=2
- Bg: rounded square (rx=15) `#0F172A → #1E1B3A` gradient
- Border: gradient indigo→violet, opacity 0.7
- Premium spark: 4-point gold star, upper-right corner (only in `icon-mark.svg` source, optional)

### Wordmark
- `eCy` — Inter 500 white/slate
- `Pro` — Inter 700 gold gradient (`#F59E0B → #D97706`)
- Letter-spacing: -0.025em (eCy), -0.015em (Pro)
- Gap between "eCy" and "Pro": 0.12em
- Optional tagline below: "PREMIUM CONSULTING" — Inter 600, 0.32em tracking

## Clearance & Minimum Sizes

- **Minimum mark size:** 16×16 px (favicon), 24×24 px (touch)
- **Clearance (free space):** ½ of mark width on all sides
- **Don't:**
  - Mark + wordmark renkleri ayrı arka planlara koyma (sabit pair gerekir)
  - Wordmark'ı re-typeset etme (yeni font/weight/letterform yasak)
  - Mark'ı serbest distort/skew/rotate
  - "Pro" gold gradient'ini düz renge çevirme (mono variant hariç)

## Implementation

- React: `<EcyLogo variant="full" size="md" />` (component path: `src/components/ui/EcyLogo.tsx`)
- Variant prop: `full | mark | wordmark | stacked`
- Mono prop: `none | light | dark`
- Size prop: `sm | md | lg | xl`

## Asset Generation Workflow

SVG'ler source-of-truth. PNG generation (favicon.ico, apple-touch-icon, PWA icons):

```bash
# requires: npm install -g sharp-cli OR ImageMagick
npx sharp -i public/brand/icon-mark.svg -o public/favicon-32.png --resize 32x32
npx sharp -i public/brand/icon-mark.svg -o public/apple-touch-icon.png --resize 180x180
npx sharp -i public/brand/icon-mark.svg -o public/pwa-192x192.png --resize 192x192
npx sharp -i public/brand/icon-mark.svg -o public/pwa-512x512.png --resize 512x512
```

Modern tarayıcılar SVG favicon'u native destekler; legacy `.ico` fallback olarak korunur.

## Version

P48 — 18 Mayıs 2026 — initial release.
