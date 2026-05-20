# claude.ai/design Templates — EcyPro Premium Consulting

> Pre-built design templates for marketing/UI iteration via claude.ai/design.
> Paste each block into claude.ai/design as a starting prompt. Adjust copy/colors.
> Save final variants as project assets.

---

## Brand Tokens

```
Primary background:     #050810 (deep navy near-black)
Surface bg:             #0A101F  (cards/modals)
Accent gold:            #D4AF37
Accent gold light:      #F6C453
Body text:              #94a3b8 (slate-400)
Heading text:           #FFFFFF
Border subtle:          rgba(255,255,255,0.08)
Font display:           Georgia / Times serif
Font body:              system-ui / Inter
Spacing:                Fibonacci (8,13,21,34,55,89,144)
Typography:             Golden ratio (16,21,26,42,68,110)
```

---

## Template 1 — Hero variant (A/B test)

**Prompt:**
```
Design a premium consulting landing hero section.
Background: solid #050810. NO glassmorphism, NO blur, NO gradient mesh.
Composition: centered vertical stack, max-width 1280px, 144px top padding.
Hero badge (small chip): "● Premium Consulting · eCyverse" in slate-400 mono uppercase tracking-widest.
H1 (Georgia 110px line-height 1.05): "Vizyon. Strateji.\nSürdürülebilir\nSonuç."
The word "Sürdürülebilir" in gold gradient (linear-gradient 135deg #D4AF37 → #F6C453).
Sub (system-ui 22px slate-400 line-height 1.55): 2-sentence paragraph about
consulting + sustainability.
CTAs: 2 buttons centered. Primary gold filled "Ücretsiz Diagnostic". Secondary
outline white "Hizmetler →".
No avatars/photos. Premium minimalism.
```

## Template 2 — Pricing tier card (₺ format)

**Prompt:**
```
Design 3-tier pricing card grid, side-by-side.
Each card: bg #0A101F, border 1px #ffffff14, rounded-2xl, padding 34px.
Middle card highlighted: border gold #D4AF37, badge "En Popüler" top-right.

Card structure:
1. Tier name (16px slate-400 mono uppercase tracking-widest)
2. Price (Georgia 68px bold white) — "₺12.000" / "₺75.000" / "₺350.000+"
3. Period label (14px slate-400) — "/ay"
4. Description line (14px slate-300, 1 sentence)
5. CTA button full-width (gold filled middle, outline others)
6. Features list — 6 items each, checkmark icon + text 13px slate-300

Tiers: "Diagnostic" ₺12K · "Growth" ₺75K · "Enterprise" ₺350K+.
Honest features, no fluff.
```

## Template 3 — Case study card

**Prompt:**
```
Design a case study card for an anonymized client engagement.
Bg #0A101F. Border #ffffff14. Rounded 24px. Width 380px.

Top: industry chip (small, slate-400 mono uppercase tracking widest):
"Manufacturing" / "Financial Services" / "Family Business"

Title (Georgia 26px bold white, 2-line clamp):
"Operasyonel Mükemmellik Çerçevesi"

Metric callouts (3 in a row):
- "ROI" + "240%" (gold 32px)
- "Süre" + "14 ay" (white 32px)
- "Endüstri" + industry name (slate-300 18px)

Description (system-ui 14px slate-400 line-height 1.6):
2-line summary, methodology-focused (not client-specific).

Footer chip: "NDA Disclaimer · Anonim Müşteri Hikayesi" (small slate-500).

CTA link: "Detayları gör →" (gold underline-on-hover).
```

## Template 4 — Blog post grid card

**Prompt:**
```
Design a blog post grid card.
Bg #0A101F. Hover lift +4px shadow.

Cover image: 16:9 aspect, top of card. Real photo or branded SVG.
Category chip: top-left overlay, gold bg #D4AF3722 / gold text.

Below image (padding 21px):
- Date + reading time (small slate-500): "21 May · 8 dk okuma"
- Title (Georgia 22px bold white, 3-line clamp)
- Excerpt (system-ui 14px slate-400, 2-line clamp)
- Author chip: avatar circle (32px) + name (slate-300 13px)
- Tag chips (max 3): rounded-full bg #ffffff08 border #ffffff14 text slate-300 11px

Grid: 3 columns desktop, 2 tablet, 1 mobile. Gap 21px.
```

## Template 5 — Testimonial card (when real client consents)

**Prompt:**
```
Design a testimonial card — only use AFTER written client consent.
Bg #0A101F. Border #ffffff14. Rounded 24px. Padding 34px.

Quote mark icon top-left (gold #D4AF37 48px serif).
Quote text (Georgia italic 22px white line-height 1.5):
"Methodology gerçek dünyada kanıtlanmış sonuçlar üretiyor."

Below quote:
- Author name (system-ui 16px bold white)
- Author title + company (slate-400 13px)
- Optional LinkedIn link icon

NO fake names. Only published with written approval + NDA release verified.
```

## Template 6 — Newsletter signup banner

**Prompt:**
```
Design a full-width newsletter signup banner (within container max-w-1280).
Bg #0A101F with subtle gold accent border-top.
Padding 55px vertical 34px horizontal.

Left side:
- Eyebrow (gold mono uppercase tracking widest 12px): "Perspektifler Bülteni"
- H2 (Georgia 42px white): "Stratejik içgörüler. Ayda 2 mail."
- Sub (slate-400 16px): One-sentence value prop, no spam claim.

Right side (form):
- Email input (bg #ffffff08 border #ffffff14 rounded-2xl padding 21px text white)
- Submit button gold filled "Abone Ol →"
- KVKK consent checkbox (slate-400 12px) with link to /privacy

Below form: small chip line "GDPR + KVKK uyumlu · Her zaman çıkış" slate-500 11px.
```

---

## Workflow

1. Open claude.ai/design
2. Paste template prompt
3. Iterate via natural language ("change gold to deeper amber", "add motion-reduce variant")
4. Export as Figma → import to Vite project
5. OR copy generated React+Tailwind JSX, drop into `src/components/sections/`

## Save as Project Assets

In claude.ai/design dashboard:
- Create asset library "EcyPro Premium Consulting"
- Save each template variant
- Tag: hero / pricing / case / blog / testimonial / newsletter
- Share with team via project link
