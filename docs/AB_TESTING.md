# A/B Testing — Statistical Guide (P21/T1)

Bu doküman EcyPro'da A/B test planlama, çalıştırma ve yorumlama disiplinini
toplar. Magic number yok — her sayı formülden gelir.

## Mimari

```
GrowthBook SDK  →  src/lib/growthbook.ts        (singleton instance)
                ↘  src/lib/ab-testing.ts        (kullanıcı kimliği + override + config)
                ↘  src/hooks/useABVariant.ts    (variant okuma)
                ↘  src/lib/ab-test.ts           (sample size + telemetry wrapper) ← P21/T1
```

Akış:

1. `GrowthBook` browser'da yüklenir, kullanıcıya UUID atar.
2. Feature flag `getFeatureValue('hero-cta-variant', 'book')` ile variant çözer.
3. `useExperiment(key, { variants })` hook'u variant + telemetry'yi paketler.
4. CTA click gibi outcome event'i `trackOutcome('cta_click')` çağrısı ile düşer.
5. GrowthBook dashboard sonuçları toplar; bizim tarafta `experimentReadiness()`
   ile sample size'a ulaşılıp ulaşılmadığını UI'ye yansıtırız.

## Sample Size Formülü (Fleiss z-test, iki orantı)

İki bağımsız orantı için:

```
n_per_arm = (z_{α/(2|1)} + z_β)² · [p₁(1-p₁) + p₂(1-p₂)] / (p₂ - p₁)²
```

| Sembol | Anlam | Tipik değer |
|---|---|---|
| `p₁` | Baseline conversion | 0.05 (%5) |
| `mde` | Minimum detectable effect (relative) | 0.10 (%10 lift) |
| `p₂` | `p₁ · (1 + mde)` | 0.055 |
| `α` | Type-I error (false positive) | 0.05 |
| `β` | Type-II error; `1-β` = power | 0.20 (power 0.80) |
| `z_{α/2}` | Two-sided critical value | 1.9600 |
| `z_β` | Power critical value | 0.8416 |

**Hesap (örnek):**

```
z_{α/2} + z_β = 1.9600 + 0.8416 = 2.8016
(2.8016)²    = 7.8490
p₁(1-p₁)     = 0.05 × 0.95 = 0.0475
p₂(1-p₂)     = 0.055 × 0.945 = 0.051975
sum          = 0.099475
lift         = 0.055 − 0.05 = 0.005
lift²        = 0.000025
n            = 7.8490 × 0.099475 / 0.000025 ≈ 31 230 per variant
```

Toplam: **62 460 visitor** (iki variant).

### Hızlı referans tablo

| Baseline (p₁) | MDE (relative) | n per variant | Toplam |
|---|---|---|---|
| 0.05 | 0.20 | ≈ 7 870 | ≈ 15 740 |
| 0.05 | 0.10 | ≈ 31 230 | ≈ 62 460 |
| 0.05 | 0.05 | ≈ 122 100 | ≈ 244 200 |
| 0.10 | 0.20 | ≈ 3 840 | ≈ 7 680 |
| 0.10 | 0.10 | ≈ 14 750 | ≈ 29 500 |
| 0.20 | 0.10 | ≈ 6 540 | ≈ 13 080 |

Test edilen kodla **birebir aynı**: `sampleSizePerVariant({ baseline, mde })`.

## Peek Problem & Erken Durdurma

Klasik A/B testte test henüz tamamlanmadan p-değerine bakıp durdurmak Type-I
error oranını artırır (p-hacking). Bonferroni düzeltmesi ile peek başına α/k
kullan:

```
α_corrected = α / k       (k = peek sayısı)
```

5 peek için: `α_corrected = 0.05 / 5 = 0.01`. Ultra-strict konvensiyon:
`p < 0.001` (Sequential Probability Ratio Test'e yaklaşır).

`experimentReadiness(observed, planned, peeks=5, alpha=0.05)` bunu döner.

## Kod Kullanımı

### Variant okuma

```tsx
import { useExperiment } from '@/lib/ab-test';

function HeroCTA() {
  const { variant, trackOutcome } = useExperiment('hero-cta-variant', {
    variants: ['book', 'explore'],
  });

  return (
    <button
      onClick={() => trackOutcome('cta_click')}
    >
      {variant === 'explore' ? 'Explore Services' : 'Book Discovery Call'}
    </button>
  );
}
```

### Sample size hesaplama

```ts
import { sampleSizePerVariant } from '@/lib/ab-test';

const plan = sampleSizePerVariant({
  baseline: 0.05,
  mde: 0.10,
  alpha: 0.05,
  power: 0.8,
});

console.log(plan.perVariant); // ≈ 31 230
console.log(plan.total);      // ≈ 62 460
```

### Active experiment kotası kontrolü

```ts
import { recomputePlannedSampleSize } from '@/lib/ab-test';
import { ACTIVE_EXPERIMENTS } from '@/lib/ab-testing';

for (const cfg of ACTIVE_EXPERIMENTS) {
  const plan = recomputePlannedSampleSize(cfg, 0.05);
  console.log(`${cfg.key}: stored=${cfg.sampleSize}, computed=${plan.perVariant}`);
}
```

**Uyarı:** `ACTIVE_EXPERIMENTS[*].sampleSize` config'inde 385 / 500 gibi
düşük rakamlar var — bunlar tarihsel yaklaşımdı. Yukarıdaki formülle yeniden
hesaplandığında çoğu için **30 000+** çıkıyor. Önce traffic'i ölç, sonra hangi
MDE'nin gerçekçi olduğuna karar ver.

## Flag Naming Konvansiyonu

| Format | Örnek | Anlam |
|---|---|---|
| `<feature>-variant` | `hero-cta-variant` | Variant deneyi |
| `<feature>-enabled` | `chatbot-enabled` | Boolean rollout |
| `<feature>-percent` | `pricing-discount-percent` | Numeric override |

İsim KAB-CASE; namespace ayraç `-`. Underscore kullanma.

## Telemetry Disiplini

| Event | Ne zaman |
|---|---|
| `experiment_viewed` | İlk variant okumada (GrowthBook trackingCallback) |
| `experiment_assigned` | İlk hook render'ında (`useExperiment`) |
| `<key>_converted` | `trackOutcome('metric')` çağrısında |
| `<key>_value` | `trackOutcome('metric', 99.99)` (sayısal hedef) |

GA4 + Sentry'ye eş zamanlı düşer — çift sayıma karşı `seenRef` ile idempotent.

## Yorumlama Rehberi

| Sonuç | Aksiyon |
|---|---|
| `observed < planned` ve `p > 0.001` | Devam et, peek etme |
| `observed ≥ planned` ve `p < α` (0.05) | Variant winner — kayıt et |
| `observed ≥ planned` ve `p ≥ α` | Sonuç significant değil — variant'ı sonlandır |
| Conversion oranı `p₁`'den daha yüksek baseline'da seyrediyor | Test'i durdurma, baseline'ı güncelle ve sample size yeniden hesapla |

## Referanslar

- Fleiss, J.L., Tytun, A., Ury, H.K. (1980). A simple approximation for
  calculating sample sizes for comparing independent proportions. *Biometrics*
  36, 343–346.
- Bonferroni, C.E. (1936). *Pubblicazioni del R Istituto Superiore di Scienze
  Economiche e Commerciali di Firenze* 8, 3–62.
- Web Vitals thresholds: https://web.dev/vitals/

## İlgili Dosyalar

- `src/lib/ab-test.ts` — formül + hook + readiness
- `src/lib/ab-test.test.ts` — 15 unit test, formülü cross-check eder
- `src/lib/ab-testing.ts` — GrowthBook config + override
- `src/hooks/useABVariant.ts` — variant okuma
