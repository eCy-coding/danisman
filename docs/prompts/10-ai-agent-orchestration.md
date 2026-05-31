# EcyPro — AI Ajan Orkestrasyonu
# Cascade + Claude Code + Ollama entegre iş akışı
# ─────────────────────────────────────────────────────────

## Ajan Hiyerarşisi

```
┌──────────────────────────────────┐
│   KULLANICI (Komutan)            │
│   Emre Can                       │
└─────────────┬────────────────────┘
              │ Stratejik emir
              ▼
┌──────────────────────────────────┐
│   CLAUDE CODE (Stratejik Ajan)   │
│   - Yüksek seviye planlama       │
│   - Mimari kararlar              │
│   - Code review                  │
│   Provider: Ollama (local) veya  │
│             Anthropic API        │
└─────────────┬────────────────────┘
              │ Taktik emir
              ▼
┌──────────────────────────────────┐
│   CASCADE (Taktik Uygulama)      │
│   - Doğrudan kod yazımı          │
│   - Dosya düzenleme              │
│   - Test çalıştırma              │
│   Provider: Anthropic Claude     │
└──────────────────────────────────┘
```

## Ollama Entegrasyonu Akışı

```bash
# 1. Smart launch
npm run ollama              # qwen2.5-coder:32b otomatik
# veya
npm run ollama:fast         # qwen2.5-coder:14b
# veya
npm run ollama:max          # ecycode-orchestrator:latest

# 2. Claude Code açılır, Ollama modeli kullanır
# 3. Kullanıcı prompt gönderir
# 4. Claude Code, Ollama'dan yanıt alır
# 5. Cascade'e task delegate edilir (opsiyonel)
```

## Model Seçim Kuralları

| Görev | Önerilen Model | Sıcaklık |
|-------|---------------|----------|
| Mimari karar | ecycode-orchestrator | 0.4 |
| Kod yazımı (yeni) | qwen2.5-coder:32b | 0.2 |
| Kod düzenleme | qwen2.5-coder:14b | 0.2 |
| Matematiksel analiz | ecycode-math | 0.1 |
| Test yazımı | qwen2.5-coder:14b | 0.2 |
| Dokümantasyon | phi4:latest | 0.3 |
| Hızlı tamamlama | qwen2.5-coder:3b | 0.2 |
| Meta-analiz | ecycode-self-improvement | 0.3 |

## Prompt Yapısı (Nested Context)

```
┌─ SİSTEM PROMPT (statik)
│  └─ Rol + Kurallar + Yasaklar
│
├─ PROJE BAĞLAMI (dinamik)
│  ├─ brain/memory.md
│  ├─ prompts1/talep{N}.txt
│  └─ Aktif dosya içeriği
│
├─ KULLANICI TALEBI (oturum)
│  └─ "Şunu yap..."
│
└─ MEVCUT DURUM (runtime)
   ├─ Son tool çıktısı
   ├─ TypeScript durumu
   └─ E2E test sonucu
```

## Ajan Komünikasyon Standartları

### Cascade → Kullanıcı
- **Format**: Markdown + code blocks (backtick cite)
- **Dil**: Türkçe
- **Uzunluk**: Kısa (≤ 5 cümle özet)
- **Emoji**: Minimal, sadece ✅/❌/⚡/🔧

### Cascade → Claude Code (Ollama)
- **Format**: Structured JSON veya numbered list
- **Context**: Tool outputs + file snippets
- **Decision**: Stratejik kararı Claude Code verir

### Claude Code → Cascade
- **Format**: Task specification
- **İçerik**: Amaç, dosyalar, doğrulama kriterleri
- **Stil**: Deterministik, ölçülebilir

## Görev Delegasyon Şablonu

```markdown
## Görev: [Başlık]
**Ajan**: Cascade
**Öncelik**: Yüksek
**Tahmini süre**: 15dk

### Amaç
[Tek cümle ile ne yapılacak]

### Etkilenen Dosyalar
- `src/components/...`
- `src/pages/...`

### Yapılacaklar
1. [Adım 1]
2. [Adım 2]
3. [Adım 3]

### Doğrulama
- [ ] typecheck temiz
- [ ] lint 0 uyarı
- [ ] E2E [spec-adı] yeşil

### Teslim
- Commit mesajı formatı: "Phase XX: [...]"
```

## Başarı Ölçütleri

### Ollama Modeli Performansı
```
Context pencere   : 32K token (qwen2.5-coder:32b)
İlk token gecikmesi: < 500ms (M-series)
Tokens/saniye      : 25-40 (32b), 50-80 (14b), 100+ (7b)
RAM kullanımı      : 19GB (32b), 9GB (14b), 4.7GB (7b)
```

### İş Akışı KPI'ları
- Tek görev için çözüm süresi: 5-30 dakika
- Bug fix rate (ilk denemede): %80+
- Code review geri dönüş (ortalama): ≤ 2
- E2E regression: 0 (zero tolerance)

## Fallback Protokolü

```
Ollama DOWN → Anthropic API
Anthropic API rate limit → Ollama qwen2.5-coder:32b
Her iki provider DOWN → Manuel mod (Cascade tools only)
```

## Güvenlik Notları

- Ollama lokal çalışır, veri dışarı gitmez (`localhost:11434`)
- Production secrets prompt'a yazılmaz
- `.env` içeriği hiçbir LLM'e gönderilmez (Cascade dahil)
- Source code hassasiyet seviyesi: Proprietary (kapalı)
