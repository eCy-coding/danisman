# EcyPro Crowler Suite

Python + **Scrapling** tabanlı 10 ileri düzey SEO & Web Analitik script koleksiyonu.  
`istek3.txt` SEO tavsiyelerini otomatize eder.

---

## Kurulum

```bash
# 1. venv ve bağımlılıklar (zaten kuruluysa atla)
python3 -m venv crowler/.venv
crowler/.venv/bin/pip install -r crowler/requirements.txt

# veya npm ile:
npm run crowler:setup
```

---

## 10 Script

| Script | npm Komutu | Açıklama |
|--------|------------|----------|
| `01_competitor_seo_audit.py` | `npm run crowler:competitor` | 10 rakibi crawl et: title/meta/H1/schema/hreflang |
| `02_broken_link_checker.py` | `npm run crowler:links` | Tüm sayfaların kırık linklerini bul |
| `03_canonical_hreflang_audit.py` | `npm run crowler:canonical` | Canonical + hreflang doğrulama |
| `04_keyword_density_audit.py` | `npm run crowler:keywords` | H1/meta/keyword yoğunluk SEO skoru |
| `05_backlink_opportunity_finder.py` | `npm run crowler:backlinks` | White-hat backlink fırsatları |
| `06_google_index_checker.py` | `npm run crowler:index` | Google index durumu kontrol |
| `07_lcp_image_audit.py` | `npm run crowler:lcp` | LCP görselleri + lazy/format/boyut |
| `08_internal_link_graph.py` | `npm run crowler:graph` | İç link haritası + orphan sayfalar |
| `09_serp_rank_tracker.py` | `npm run crowler:serp` | Anahtar kelime sıralama takibi |
| `10_mcp_server_setup.py` | `npm run crowler:mcp` | Scrapling → Windsurf/Claude Code MCP |

---

## Hızlı Başlangıç

```bash
# SEO tam audit (canonical + keyword + LCP)
npm run crowler:seo

# Tam suite (competitor + link + seo + graf)
npm run crowler:all

# Tek script örneği
crowler/.venv/bin/python3 crowler/scripts/01_competitor_seo_audit.py --verbose

# Farklı keyword ile
crowler/.venv/bin/python3 crowler/scripts/04_keyword_density_audit.py \
  --keyword "dijital dönüşüm danışmanlığı" \
  --base https://www.ecypro.com

# Localhost preview üzerinde
npm run preview &
npm run crowler:links  # --base http://localhost:4173 (varsayılan)
```

---

## Raporlar

Tüm raporlar `crowler/reports/` klasörüne kaydedilir:
- `01_competitor_seo_audit_YYYYMMDD_HHMM.md`
- `02_broken_links_YYYYMMDD_HHMM.json`
- `03_canonical_hreflang_YYYYMMDD_HHMM.md`
- ... vb.

---

## MCP Entegrasyonu (Script 10)

Scrapling'i Windsurf AI ajanlarına bağlar:

```bash
npm run crowler:mcp
```

Kurulduktan sonra Windsurf chat'te:
```
@scrapling fetch https://ecypro.com and extract all H1 tags
@scrapling check broken links on https://ecypro.com
```

---

## Yapı

```
crowler/
├── .venv/                    # Python virtual environment
├── Scrapling-main/           # Scrapling kaynak kodu (ZIP'ten)
├── Scrapling-main.zip        # Orijinal ZIP
├── requirements.txt          # scrapling, rich, typer
├── reports/                  # Üretilen raporlar (gitignored)
├── mcp_config.json           # MCP server config
└── scripts/
    ├── 01_competitor_seo_audit.py
    ├── 02_broken_link_checker.py
    ├── 03_canonical_hreflang_audit.py
    ├── 04_keyword_density_audit.py
    ├── 05_backlink_opportunity_finder.py
    ├── 06_google_index_checker.py
    ├── 07_lcp_image_audit.py
    ├── 08_internal_link_graph.py
    ├── 09_serp_rank_tracker.py
    └── 10_mcp_server_setup.py
```

---

## Scrapling Hakkında

[Scrapling](https://github.com/D4Vinci/Scrapling) — Python'un en güçlü stealth web scraper'ı:
- **StealthyFetcher**: Cloudflare Turnstile bypass
- **DynamicFetcher**: Headless browser tabanlı
- **Spider**: Concurrent multi-session crawl
- **Adaptive CSS**: Site layout değişse bile elementi bulur
- **MCP Server**: AI agent entegrasyonu

---

_istek3.txt SEO analiz tavsiyelerini temel alarak inşa edilmiştir._
