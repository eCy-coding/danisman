# brain/seo/ — SEO Baseline & Weekly Diff

GSC CSV exportları ve haftalık karşılaştırma raporları bu dizinde tutulur.

## Dosya Adlandırma

```
baseline_YYYY-MM-DD.csv   # ilk baseline (T01/T03 tamamlanınca GSC'den export)
week_YYYY-MM-DD.csv       # haftalık snapshot
diff_YYYY-MM-DD.json      # seo:weekly-diff çıktısı
```

## Nasıl Kullanılır

### 1. GSC'den CSV export et
GSC → Performance → Date range: Last 7 days → Export → CSV
Dosyayı `brain/seo/baseline_2026-05-05.csv` olarak kaydet.

### 2. Haftalık diff
```bash
npm run seo:weekly-diff
# ya da belirli dosyalarla:
npx tsx scripts/seo-weekly-diff.ts --base brain/seo/baseline_2026-05-05.csv --curr brain/seo/week_2026-05-12.csv --save brain/seo/diff_2026-05-12.json
```

## GSC CSV Formatı (beklenen sütunlar)
```
Query (ya da Page), Clicks, Impressions, CTR, Position
```
