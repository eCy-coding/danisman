# 📚 NotebookLM Upload Package — eCyPro Master Corpus

> Tarih: 2026-05-19
> Hedef: eCyPro Premium Consulting için 3-notebook source corpus
> Effort: ~45 dk user upload, sonsuz fayda (audio overview, mind map, Q&A, content generation)

## 🎯 Purpose

NotebookLM (`notebooklm.google.com`) Google'ın AI-powered notebook tool'u. Source dosyaları upload edersin, AI bu corpus'tan grounded answer, podcast-style audio overview, mind map, Q&A oluşturur. eCyPro için 3 ayrık notebook:

- **Notebook A — Brand & Content** (founder voice, 21 servis, 41 blog)
- **Notebook B — Sales & Client** (personas, pricing, competitor)
- **Notebook C — Legal & Ops** (KVKK, privacy, operational checklist)

## 📦 Upload Order

### Step 1: NotebookLM açın
- URL: https://notebooklm.google.com
- Sign in: emrecnyn@gmail.com (Google account)
- "+ Create new notebook" × 3

### Step 2: 3 Notebook isimlendirme + upload

#### Notebook A — "eCyPro Brand & Content"

**Upload edilecek source'lar (GitHub raw URLs veya local clone):**

1. `outputs/notebooklm-package/notebook-a-brand-content.md` (bu package'ta — digest + brand voice)
2. `src/data/service-content.ts` (21 servis full TypeScript definitions — NotebookLM TS-aware)
3. **41 blog post:** `src/content/blog/*.mdx` (tümünü upload — NotebookLM source limiti 50 per notebook free tier, 41 yeterli)
4. `index.html` (SEO + structured data)
5. `outputs/P54_PILLAR_CONTENT.md` (eğer mevcut)

**Tahmini source sayısı:** ~45/50 free tier limit

#### Notebook B — "eCyPro Sales & Client"

**Upload edilecek source'lar:**

1. `outputs/notebooklm-package/notebook-b-sales-client.md` (bu package — personas + discovery playbook)
2. `src/data/copy/pages.ts` (pricing tiers, hero copy, FAQ)
3. `src/pages/PricingPage.tsx` (pricing logic + tier definitions)
4. `outputs/P50_GAP_ANALYSIS.md` (competitor snapshot + market gaps)
5. `outputs/P51_PLAN.md` (sales roadmap)
6. `src/content/case-studies/*.mdx` (varsa)
7. `outputs/P74_SWOT_POST_P72.md` (current SWOT + threats from competitors)

#### Notebook C — "eCyPro Legal & Ops"

**Upload edilecek source'lar:**

1. `outputs/notebooklm-package/notebook-c-legal-ops.md` (bu package — KVKK + ops checklist)
2. `src/pages/PrivacyPolicyPage.tsx` veya `src/pages/PrivacyPage.tsx` (privacy text)
3. `src/pages/DataRightsPage.tsx` (KVKK Madde 11 hakları)
4. `src/pages/TermsPage.tsx` (KVKK Madde 11 hakları)
5. `src/pages/CookiePage.tsx`
6. `outputs/USER_ACTION_INVENTORY.md` (operational checklist)

### Step 3: Settings (her notebook için)

- **Output Language:** Turkish
- **Tone:** Professional, conservative
- **Length:** Detailed (audio overview için)

## 🎙 İlk 10 Query (her notebook'ta dene)

### Notebook A — Brand & Content
1. *"eCyPro'nun marka sesi nedir? 3 cümlede özetle."*
2. *"21 hizmetimi bir tablo halinde sun: ad, slug, ana value prop, tipik müşteri."*
3. *"Premium consulting brand'imizi Big4 ile karşılaştır — neyi farklı yapıyoruz?"*
4. *"Audio Overview oluştur (10 dk, Türkçe) — bizim hikayemiz + 21 hizmet + 41 blog özeti."*
5. *"Bir LinkedIn carousel post hazırla: 'Türk şirketleri için 21 stratejik dönüşüm aracı' — 8 slide."*

### Notebook B — Sales & Client
6. *"Bir aile şirketi CFO'su Discovery Call'da ne sorardı? Top 10 soru + ideal cevap."*
7. *"Mid-market PE fund partner için tailored proposal template hazırla."*
8. *"3 tier pricing (Starter/Growth/Enterprise) için ROI hesaplaması: 6 ay sonra her tier müşteri kazancı."*

### Notebook C — Legal & Ops
9. *"KVKK Madde 11 hakları nelerdir? Müşteri 'verilerimi silin' derse adım adım ne yaparım?"*
10. *"İlk 6 ay business operations checklist: trademark, LLC, banking, sigorta sırası."*

## 🔄 Sustainability (her sprint sonu)

Her P78+ sprint sonu, ilgili notebook'a yeni source ekle:
- **Yeni blog post** → Notebook A
- **Yeni case study** → Notebook B
- **Yeni legal doc** → Notebook C

NotebookLM source-grounded; eski cache yenilenmez. Yeni source ekleyince re-index ~30sn.

## 🎯 Beklenen ROI

| Aksiyon | Süre | Output |
|---|---|---|
| 1× notebook setup | 45 dk | Source corpus indexed |
| Per query | 5-30sn | Grounded answer + source citations |
| Audio Overview | 1-3 dk gen | 5-15 dk podcast (TR + EN) |
| Mind map | 10sn gen | Topic tree visualization |
| Briefing doc | 30sn | Executive summary |

**Kullanım örnekleri:**
- LinkedIn post drafting (haftada 2-3 post → NotebookLM'den)
- Müşteri pitch hazırlığı (sektör + servis cross-reference)
- Yeni blog ideation (eksik konu tespiti)
- Sales objection handling (Big4 vs eCyPro)
- KVKK audit prep (compliance Q&A)

## ⚠️ Notlar

- **Free tier:** 100 notebooks/account, 50 sources/notebook, 200 chats/notebook
- **Paid (NotebookLM Plus):** $19.99/ay, sınırsız
- **Privacy:** NotebookLM Google account'la izole, Google AI training'e gitmez (Workspace anlaşması)
- **KVKK:** Türk müşteri verisi upload etme — corpus public/sample data only

## 📁 Bu package içeriği

```
outputs/notebooklm-package/
├── NOTEBOOKLM_INDEX.md                    ← bu dosya (upload guide)
├── notebook-a-brand-content.md            ← Notebook A digest + brand voice
├── notebook-b-sales-client.md             ← Notebook B personas + discovery playbook
└── notebook-c-legal-ops.md                ← Notebook C KVKK + ops checklist
```

Yukarıdaki 4 dosya + repo'daki source dosyaları → NotebookLM'e upload → 3 notebook ready.
