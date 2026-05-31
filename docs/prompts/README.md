# prompts2/ — İleri Düzey Prompt Engineering Sistemi

Bu klasör, EcyPro projesi için ileri düzey AI ajan prompt mühendisliği dokümanlarını içerir.

## 📚 Doküman Listesi

| # | Dosya | Konu |
|---|-------|------|
| 01 | `01-system-master.md` | Usta sistem promptu (AI ajan kimliği) |
| 02 | `02-feature-implementation.md` | Özellik uygulama şablonu |
| 03 | `03-ollama-model-guide.md` | Ollama model rehberi & görev matrisi |
| 04 | `04-code-review-checklist.md` | Kod inceleme kontrol listesi |
| 05 | `05-performance-audit.md` | Performans denetim promptu |
| 06 | `06-security-hardening.md` | Güvenlik sertleştirme denetimi |
| 07 | `07-testing-strategy.md` | Test stratejisi (piramit) |
| 08 | `08-deployment-flow.md` | Deployment akışı (Vercel+Render) |
| 09 | `09-architecture-decisions.md` | Mimari kararlar (ADR log) |
| 10 | `10-ai-agent-orchestration.md` | AI ajan orkestrasyonu |

## 🎯 Kullanım Senaryoları

### Senaryo 1: Yeni bileşen geliştirme
1. `01-system-master.md` → Kimliğini ve kuralları hatırla
2. `02-feature-implementation.md` → Şablonu takip et
3. `04-code-review-checklist.md` → PR öncesi doğrula

### Senaryo 2: Lighthouse optimizasyonu
1. `05-performance-audit.md` → Baseline ölç
2. Darboğaz tespit + çözüm uygula
3. Post-opt metrik karşılaştır

### Senaryo 3: Ollama local inference
1. `03-ollama-model-guide.md` → Model seç
2. `scripts/ollama-launch.sh` → Başlat
3. `10-ai-agent-orchestration.md` → Ajan hiyerarşisini takip et

### Senaryo 4: Production deployment
1. `08-deployment-flow.md` → Ön kontrol listesi
2. `06-security-hardening.md` → Güvenlik denetim
3. `07-testing-strategy.md` → Full E2E regression

### Senaryo 5: Mimari karar
1. `09-architecture-decisions.md` → ADR formatı
2. Yeni ADR ekle (ADR-XXX)
3. `brain/memory.md` ile sync

## 🔄 Güncelleme Prensipleri

- **Versiyonlama**: Her doküman başında `Sürüm: X.Y` + `Tarih`
- **Onay**: Önemli değişiklikler ADR'ye dönüşmeli
- **Hafıza**: `brain/memory.md` ile senkron kal
- **Dil**: Türkçe ana dil, kod örnekleri İngilizce

## 📐 Doküman Standartları

Her `prompts2/` dokümanı şu bölümleri içerir:
1. **Başlık + Sürüm** (YAML frontmatter veya başlık bloğu)
2. **Hedef / Amaç** (1-2 paragraf)
3. **Uygulama Akışı** (numaralı adımlar)
4. **Kod Örnekleri** (TypeScript/Bash fenced block)
5. **Kontrol Listesi** (checkbox)
6. **Referanslar** (ilişkili dosyalar)

## 🧠 AI Ajan İşletim Sistemi

`prompts2/` ileri düzey bir "AI Operating System" görevi görür:
- Cascade (Windsurf) için taktik kılavuz
- Claude Code için stratejik bağlam
- Ollama local model için system prompt
- Kod inceleme botları için standart

## 🚀 Başlatma

Yeni bir AI ajan oturumu açarken:
```
read prompts2/01-system-master.md     # Kimliği yükle
read prompts2/10-ai-agent-orchestration.md  # Hiyerarşiyi hatırla
read brain/memory.md                   # Proje durumunu al
```

## 🔗 İlişkili Dosyalar

- `prompts/` — Orijinal kullanıcı talepleri (değiştirilmez)
- `prompts1/` — 10 ana geliştirme aşaması talepleri
- `brain/memory.md` — Proje kalıcı hafızası
- `scripts/ollama-launch.sh` — Ollama + Claude Code başlatıcı
- `CLAUDE.md` — Claude Code özel talimatları
- `AGENTS.md` — Ajan doktrini
