# EcyPro — Özellik Uygulama Şablonu
# ─────────────────────────────────────────────────────────

## Kullanım
Her yeni özellik veya sayfa için bu şablonu kullan.
Tüm adımları sırayla ve eksiksiz uygula.

## Şablon

```
ÖZELLIK ADI: [Açıklayıcı isim]
ÖNCELIK: [Kritik | Yüksek | Orta | Düşük]
FAZ: [Phase XX]
ETKİLENEN DOSYALAR: [Liste]
BAĞIMLILIKLAR: [Diğer özellikler]
```

## Uygulama Sırası

### 1. Analiz (5 dk)
```bash
# Mevcut durumu anla
grep_search "ilgili_terim" src/
read_file brain/memory.md
read_file brain/skills.md
```

### 2. Tasarım (10 dk)
- Bileşen hiyerarşisi çiz
- Props ve state'i tanımla
- API endpoint'leri listele
- E2E test senaryolarını yaz

### 3. TypeScript Arayüzleri (5 dk)
```typescript
// Her yeni veri yapısı için interface tanımla
interface FeatureName {
  id: string;
  // ...
}
```

### 4. Bileşen Oluşturma
```typescript
// src/components/feature/FeatureName.tsx
import React from 'react';
// motion/react (framer-motion DEĞİL)
import { motion } from 'motion/react';
// Lucide icons
import { IconName } from 'lucide-react';
// Tailwind v4 utilities (bg-linear-to-r yerine bg-gradient-to-r KULLANMA)
```

### 5. Test Yazımı
```typescript
// e2e/feature.spec.ts
test.describe('Özellik Adı', () => {
  test('ana senaryo', async ({ page }) => {
    await page.goto('/sayfa');
    // data-testid kullan, text seçici değil
    await expect(page.getByTestId('element-id')).toBeVisible();
  });
});
```

### 6. Doğrulama
```bash
npm run typecheck          # 0 hata
npm run lint               # 0 uyarı
npm run build              # başarılı
npx playwright test --project=chromium  # ilgili testler yeşil
```

## Tailwind v4 Dikkat Listesi

| Eski (v3) | Yeni (v4) |
|-----------|-----------|
| `bg-gradient-to-r` | `bg-linear-to-r` |
| `flex-shrink-0` | `shrink-0` |
| `flex-grow` | `grow` |
| `bg-[#hex]` | CSS token veya `bg-surface` |
| `aspect-[16/9]` | `aspect-video` |
| `rounded-[2rem]` | `rounded-4xl` |
| `w-[600px]` | `w-150` |
| `bg-white/[0.015]` | `bg-white/1.5` |

## Bileşen Standartları

```typescript
// ✅ DOĞRU — motion/react
import { motion, AnimatePresence } from 'motion/react';

// ✅ DOĞRU — Lucide icons (tree-shakeable)
import { Target, Eye } from 'lucide-react';

// ✅ DOĞRU — Named export
export const ComponentName: React.FC<Props> = ({ prop }) => {
  // ...
};

// ❌ YANLIŞ — Default export (ayrı tutulabilir)
// export default ComponentName;
```
