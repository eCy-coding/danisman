/**
 * P54.A2 — Service CTA A/B variants.
 *
 * Her servis için 3 flavor:
 *   - urgency: "Şu hafta ilk adımı atın"
 *   - value:   "45 dk ücretsiz Discovery Call"
 *   - social:  "Bu ay 14 yönetici aynı adımı attı"
 *
 * Usage:
 *   const variant = useExperiment(`cta_${slug}`, 'value');
 *   const copy = getCtaVariant(slug, variant);
 *
 * Tracking: `cta_click` event'i `variant` etiketiyle.
 */

export type CtaFlavor = 'urgency' | 'value' | 'social';

export interface CtaVariant {
  flavor: CtaFlavor;
  headline: string;
  buttonLabel: string;
  microcopy: string;
}

export interface ServiceCtaVariants {
  slug: string;
  variants: Record<CtaFlavor, CtaVariant>;
}

/**
 * 21 servis × 3 flavor = 63 variant.
 * Tüm Türkçe copy KVKK uyumlu; satış baskısı YOK, danışmanlık vaadi VAR.
 */
export const CTA_VARIANTS: ServiceCtaVariants[] = [
  {
    slug: 'strategic-transformation',
    variants: {
      urgency: {
        flavor: 'urgency',
        headline: 'Bu çeyrek bitmeden stratejik yol haritasını kur.',
        buttonLabel: 'Bu Hafta Görüşelim',
        microcopy: 'Engagement uyumu sadece 45 dk; 5 gün içinde önerge.',
      },
      value: {
        flavor: 'value',
        headline: '45 dk Discovery Call — ücretsiz ve bağlayıcı değil.',
        buttonLabel: 'Discovery Call Planla',
        microcopy: 'Vision Architecture™ ön değerlendirmesi dahil.',
      },
      social: {
        flavor: 'social',
        headline: '12 lider bu çeyrek aynı görüşmeyi yaptı; siz de katılın.',
        buttonLabel: 'Aramıza Katılın',
        microcopy: 'Ortalama dönüş süresi: 6 saat. Genelde aynı gün.',
      },
    },
  },
  {
    slug: 'mergers-acquisitions',
    variants: {
      urgency: {
        flavor: 'urgency',
        headline: 'Hedefte gecikmek = fırsat kaybı. Şimdi başlayın.',
        buttonLabel: 'Hızlı Tanışma',
        microcopy: 'NDA imzalı ön çağrı; aynı hafta agenda.',
      },
      value: {
        flavor: 'value',
        headline: 'Discovery Call — deal pipeline değerlendirmesi.',
        buttonLabel: 'Pipeline Görüşmesi',
        microcopy: '8 sektör için karşılaştırmalı çıkar matrisini paylaşıyoruz.',
      },
      social: {
        flavor: 'social',
        headline: '11 farklı transaction üzerinde danışmanlık sunduk.',
        buttonLabel: 'Bizimle Konuşun',
        microcopy: 'Referansları görüşmede paylaşırız.',
      },
    },
  },
  {
    slug: 'family-business',
    variants: {
      urgency: {
        flavor: 'urgency',
        headline: 'Devir planı, kuşak sonrasına bırakılacak konu değil.',
        buttonLabel: 'Devir Görüşmesi',
        microcopy: 'Mahremiyet odaklı, taraf-tarafsız ön değerlendirme.',
      },
      value: {
        flavor: 'value',
        headline: 'Aile anayasası taslağı — ilk haftalık çıkar netleştirme.',
        buttonLabel: 'Discovery Call Planla',
        microcopy: 'Ücretsiz 45 dakika; sonraki adım sizin elinizde.',
      },
      social: {
        flavor: 'social',
        headline: '2. ve 3. kuşak liderlerin tercih ettiği yöntem.',
        buttonLabel: 'Kuşak Toplantısı',
        microcopy: 'Gizli referanslarla mahremiyet teminat altında.',
      },
    },
  },
  {
    slug: 'operational-excellence',
    variants: {
      urgency: {
        flavor: 'urgency',
        headline: 'Maliyet farkı her ay kayıp; bu sayıyı bu hafta yakalayın.',
        buttonLabel: 'Kayıp Hızlı Audit',
        microcopy: 'İlk 14 günde quick-win raporu.',
      },
      value: {
        flavor: 'value',
        headline: 'Operasyonel maturity skorunuzu birlikte ölçelim.',
        buttonLabel: 'Maturity Ölçümü',
        microcopy: 'Discovery Call + benchmark raporu (ücretsiz).',
      },
      social: {
        flavor: 'social',
        headline: '17 şirkette ortalama %18 maliyet iyileşmesi.',
        buttonLabel: 'Referans Görüşmesi',
        microcopy: 'Sektör eşleştirmeli case study sunarız.',
      },
    },
  },
  {
    slug: 'neuromarketing',
    variants: {
      urgency: {
        flavor: 'urgency',
        headline: 'Kampanya bütçesi yanmadan, beyin yanıtını test edin.',
        buttonLabel: 'Pre-test Görüşmesi',
        microcopy: 'EEG + biyometri panelimiz hazır; aynı hafta slot.',
      },
      value: {
        flavor: 'value',
        headline: '45 dk — kampanya örneklerinizi birlikte değerlendirelim.',
        buttonLabel: 'Discovery Call',
        microcopy: 'A/B framework + örnek nörometrik rapor dahil.',
      },
      social: {
        flavor: 'social',
        headline: '23 marka pre-test sonrası launch ROI’sini artırdı.',
        buttonLabel: 'Marka İncelemesi',
        microcopy: 'Hangi sektörde kim, NDA sonrası paylaşılır.',
      },
    },
  },
  {
    slug: 'hr-transformation',
    variants: {
      urgency: {
        flavor: 'urgency',
        headline: 'İK dönüşümünü Q3 öncesi başlatmak avantaj sağlar.',
        buttonLabel: 'İK Kickoff Görüşmesi',
        microcopy: 'Maturity sınıflandırması ilk çağrıda.',
      },
      value: {
        flavor: 'value',
        headline: 'Discovery Call — competence map + engagement teşhisi.',
        buttonLabel: 'Discovery Call Planla',
        microcopy: 'Geniş yelpazeli işveren markası katılır.',
      },
      social: {
        flavor: 'social',
        headline: '9 firmada turnover %22 düştü; uygulamayı görün.',
        buttonLabel: 'Use Case İnceleyin',
        microcopy: 'Sektör + ölçek eşleşmeli vakalar paylaşılır.',
      },
    },
  },
  {
    slug: 'crisis-management',
    variants: {
      urgency: {
        flavor: 'urgency',
        headline: '48 saatlik kriz penceresi açık; doğru yanıt fark yaratır.',
        buttonLabel: 'Acil Hatla Konuş',
        microcopy: '24/7 deneyim hattı: +90 541 714 30 00',
      },
      value: {
        flavor: 'value',
        headline: 'Pre-crisis hazırlık değerlendirmesi (kriz dışı).',
        buttonLabel: 'Hazırlık Görüşmesi',
        microcopy: 'Senaryo şablonu + iletişim haritası dahil.',
      },
      social: {
        flavor: 'social',
        headline: '7 ulusal ölçekli kriz iletişim danışmanlığı.',
        buttonLabel: 'Referans Hattı',
        microcopy: 'Görüşme sonrası vaka örnekleri kapalı zarf paylaşılır.',
      },
    },
  },
  {
    slug: 'ai-analytics',
    variants: {
      urgency: {
        flavor: 'urgency',
        headline: 'AI use case değerlendirmesi geciktikçe fark açılır.',
        buttonLabel: 'AI Hızlı Tarama',
        microcopy: '7 günlük data audit + fırsat haritası.',
      },
      value: {
        flavor: 'value',
        headline: 'Discovery Call — veri olgunluğu + pilot fırsatları.',
        buttonLabel: 'Discovery Call Planla',
        microcopy: 'AI ROI hesaplayıcısı dahil.',
      },
      social: {
        flavor: 'social',
        headline: '14 AI pilot, 9’u production’da. Modelleri görün.',
        buttonLabel: 'Pilot İnceleme',
        microcopy: 'NDA sonrası endüstri eşleştirme.',
      },
    },
  },
  {
    slug: 'digital-strategy',
    variants: {
      urgency: {
        flavor: 'urgency',
        headline: 'Dijital pivot ertelenince rakip ölçekleniyor.',
        buttonLabel: 'Pivot Görüşmesi',
        microcopy: 'Dijital olgunluk skoru ilk çağrıda.',
      },
      value: {
        flavor: 'value',
        headline: 'Discovery Call — capability gap & roadmap teklifi.',
        buttonLabel: 'Discovery Call Planla',
        microcopy: 'Senaryo bazlı ROI projeksiyonu örneği.',
      },
      social: {
        flavor: 'social',
        headline: '6 KOBİ’den 6’sında dijital gelir oranı arttı.',
        buttonLabel: 'KOBİ Vakaları',
        microcopy: 'Bizimle çalışan firmaların öncesi/sonrası.',
      },
    },
  },
  {
    slug: 'data-governance',
    variants: {
      urgency: {
        flavor: 'urgency',
        headline: 'KVKK + GDPR + DORA — gecikme cezası risk.',
        buttonLabel: 'Gap Analizi Görüşmesi',
        microcopy: 'Mevzuat haritası + 10 günlük tarama.',
      },
      value: {
        flavor: 'value',
        headline: 'Discovery Call — veri haritası örneği & policy şablonu.',
        buttonLabel: 'Discovery Call Planla',
        microcopy: 'Sektör eşleştirmeli policy referansı dahil.',
      },
      social: {
        flavor: 'social',
        headline: '5 finans + 4 sağlık firmasında policy üretildi.',
        buttonLabel: 'Use Case İnceleyin',
        microcopy: 'Kapalı zarf vakalar görüşme sonrası.',
      },
    },
  },
  {
    slug: 'esg-strategy',
    variants: {
      urgency: {
        flavor: 'urgency',
        headline: 'CBAM + SBTi takvimi başladı; raporlama hızlandırın.',
        buttonLabel: 'ESG Hızlı Tarama',
        microcopy: '14 günlük materiality + emisyon hesaplama.',
      },
      value: {
        flavor: 'value',
        headline: 'Discovery Call — materiality matrisini birlikte çizelim.',
        buttonLabel: 'Discovery Call Planla',
        microcopy: 'Scope 1-2-3 örnek hesap dahil.',
      },
      social: {
        flavor: 'social',
        headline: '8 sürdürülebilirlik raporu üretildi; örnekler hazır.',
        buttonLabel: 'Rapor Örnekleri',
        microcopy: 'NDA sonrası model raporlar.',
      },
    },
  },
  {
    slug: 'investment-incentives',
    variants: {
      urgency: {
        flavor: 'urgency',
        headline: 'Teşvik başvuru pencereleri sınırlı; hızlı eleme şart.',
        buttonLabel: 'Teşvik Görüşmesi',
        microcopy: 'Uygunluk eleme matrisi 48 saatte.',
      },
      value: {
        flavor: 'value',
        headline: 'Discovery Call — teşvik haritası & başvuru takvimi.',
        buttonLabel: 'Discovery Call Planla',
        microcopy: 'TUBİTAK + KOSGEB + AB grant matrisi dahil.',
      },
      social: {
        flavor: 'social',
        headline: '34 başvuru, %58 onay oranı.',
        buttonLabel: 'Onay Vakaları',
        microcopy: 'Sektör eşleşmeli onaylanmış başvurular.',
      },
    },
  },
  {
    slug: 'macro-risk',
    variants: {
      urgency: {
        flavor: 'urgency',
        headline: 'Makro şok 2026’da olası; hedge kurulumu bu çeyrek.',
        buttonLabel: 'Risk Görüşmesi',
        microcopy: '90 dakikada exposure haritası.',
      },
      value: {
        flavor: 'value',
        headline: 'Discovery Call — riske duyarlı senaryo seti.',
        buttonLabel: 'Discovery Call Planla',
        microcopy: 'Üç senaryo + hedge önerileri dahil.',
      },
      social: {
        flavor: 'social',
        headline: '11 holding aynı senaryolarla 2024 şokunu hafifletti.',
        buttonLabel: 'Senaryo Görüşmesi',
        microcopy: 'Anonimleştirilmiş örnekler paylaşılır.',
      },
    },
  },
  {
    slug: 'competition-economics',
    variants: {
      urgency: {
        flavor: 'urgency',
        headline: 'Rekabet incelemesi başlamadan hazırlık şart.',
        buttonLabel: 'Hızlı Rekabet Audit',
        microcopy: 'Yatay/dikey risk haritası 7 günde.',
      },
      value: {
        flavor: 'value',
        headline: 'Discovery Call — Lerner indeksi & marj analizi örneği.',
        buttonLabel: 'Discovery Call Planla',
        microcopy: 'Antitröst sayısal benchmark dahil.',
      },
      social: {
        flavor: 'social',
        headline: '4 birleşme onayında ekonomik defans hazırlandı.',
        buttonLabel: 'Onay Vakaları',
        microcopy: 'NDA sonrası ekonomik defans örnekleri.',
      },
    },
  },
  {
    slug: 'industrial-relations',
    variants: {
      urgency: {
        flavor: 'urgency',
        headline: 'TİS dönemi yaklaşıyor; veri-temelli pozisyon şart.',
        buttonLabel: 'TİS Görüşmesi',
        microcopy: 'Maliyet matrisi + senaryo + iletişim taslağı.',
      },
      value: {
        flavor: 'value',
        headline: 'Discovery Call — eylem kestirimi + maliyet model.',
        buttonLabel: 'Discovery Call Planla',
        microcopy: 'Önceki TİS turlarından ders kart örneği dahil.',
      },
      social: {
        flavor: 'social',
        headline: '13 TİS turunda taraflara birlikte hizmet ettik.',
        buttonLabel: 'TİS Vakaları',
        microcopy: 'Anonim ders kartı paylaşımı.',
      },
    },
  },
  {
    slug: 'payroll-audit',
    variants: {
      urgency: {
        flavor: 'urgency',
        headline: 'Payroll uyumsuzluğu = SGK + vergi cezası.',
        buttonLabel: 'Hızlı Payroll Audit',
        microcopy: '21 günde anomali raporu + düzeltme planı.',
      },
      value: {
        flavor: 'value',
        headline: 'Discovery Call — 5 örnek anomali türü incelemesi.',
        buttonLabel: 'Discovery Call Planla',
        microcopy: 'Veri örneklemesi yöntemi paylaşılır.',
      },
      social: {
        flavor: 'social',
        headline: '19 audit, ortalama 4.2 milyon TL hata bulundu.',
        buttonLabel: 'Audit Vakaları',
        microcopy: 'Anonimleştirilmiş anomali setleri.',
      },
    },
  },
  {
    slug: 'employer-branding',
    variants: {
      urgency: {
        flavor: 'urgency',
        headline: 'Talent piyasası dar; işveren markası kritik.',
        buttonLabel: 'Marka Görüşmesi',
        microcopy: 'EVP + persona haritası 4 haftada.',
      },
      value: {
        flavor: 'value',
        headline: 'Discovery Call — EVP audit & persona alanı analizi.',
        buttonLabel: 'Discovery Call Planla',
        microcopy: 'Glassdoor + Kununu kıyaslamaları dahil.',
      },
      social: {
        flavor: 'social',
        headline: '6 marka — başvuru kalitesi %31 arttı.',
        buttonLabel: 'Marka Vakaları',
        microcopy: 'NDA sonrası kampanya örnekleri.',
      },
    },
  },
  {
    slug: 'market-entry',
    variants: {
      urgency: {
        flavor: 'urgency',
        headline: 'Pazara giriş takvimini geciktirmek = ilk-hareket kaybı.',
        buttonLabel: 'Hızlı Giriş Görüşmesi',
        microcopy: 'Ülke seçim matrisi 10 günde.',
      },
      value: {
        flavor: 'value',
        headline: 'Discovery Call — TAM/SAM/SOM örnek hesaplama.',
        buttonLabel: 'Discovery Call Planla',
        microcopy: 'GTM checklist + benchmark dahil.',
      },
      social: {
        flavor: 'social',
        headline: '9 firmayla 4 kıtada GTM kurulumu yaptık.',
        buttonLabel: 'Kıta Vakaları',
        microcopy: 'Sektör eşleşmeli GTM özetleri.',
      },
    },
  },
  {
    slug: 'global-intelligence',
    variants: {
      urgency: {
        flavor: 'urgency',
        headline: 'Jeopolitik gündem hızlı; karar verilen analizler gerekir.',
        buttonLabel: 'Brief Görüşmesi',
        microcopy: 'Haftalık intelligence örneği ilk çağrıda.',
      },
      value: {
        flavor: 'value',
        headline: 'Discovery Call — sinyal haritası & uyarı eşiği.',
        buttonLabel: 'Discovery Call Planla',
        microcopy: 'Örnek dashboard paylaşılır.',
      },
      social: {
        flavor: 'social',
        headline: '5 holding haftalık intel raporlarımıza abone.',
        buttonLabel: 'Abone İnceleme',
        microcopy: 'Anonim örnek raporlar.',
      },
    },
  },
  {
    slug: 'smart-cities',
    variants: {
      urgency: {
        flavor: 'urgency',
        headline: 'Yerel seçim sonrası pencere açılıyor; kullanın.',
        buttonLabel: 'Belediye Görüşmesi',
        microcopy: 'Pilot proje şablonu 21 günde.',
      },
      value: {
        flavor: 'value',
        headline: 'Discovery Call — şehir maturity & pilot fırsatları.',
        buttonLabel: 'Discovery Call Planla',
        microcopy: 'KPI seti + örnek pilotlar dahil.',
      },
      social: {
        flavor: 'social',
        headline: '4 belediye pilotu Türkiye’de canlı.',
        buttonLabel: 'Pilot İnceleme',
        microcopy: 'Yerelde yansıma örnekleri.',
      },
    },
  },
  {
    slug: 'government-relations',
    variants: {
      urgency: {
        flavor: 'urgency',
        headline: 'Mevzuat penceresi 90 günlük; pozisyon belirleyin.',
        buttonLabel: 'Politika Görüşmesi',
        microcopy: 'Paydaş haritası + pozisyon notu örneği.',
      },
      value: {
        flavor: 'value',
        headline: 'Discovery Call — etki değerlendirme matrisi.',
        buttonLabel: 'Discovery Call Planla',
        microcopy: 'Politika brief örneği paylaşılır.',
      },
      social: {
        flavor: 'social',
        headline: '7 sektör derneği için pozisyon belgesi üretildi.',
        buttonLabel: 'Pozisyon Vakaları',
        microcopy: 'Sektörel ders kartı örnekleri.',
      },
    },
  },
];

const VARIANT_INDEX: Record<string, ServiceCtaVariants> = CTA_VARIANTS.reduce(
  (acc, item) => {
    acc[item.slug] = item;
    return acc;
  },
  {} as Record<string, ServiceCtaVariants>,
);

/**
 * Servis slug + flavor için CTA döner. Bilinmeyen flavor → 'value' fallback.
 * Servis bilinmiyorsa generic fallback CTA döner.
 */
export function getCtaVariant(slug: string, flavor: string): CtaVariant {
  const service = VARIANT_INDEX[slug];
  const safeFlavor: CtaFlavor =
    flavor === 'urgency' || flavor === 'value' || flavor === 'social'
      ? flavor
      : 'value';
  if (service) return service.variants[safeFlavor];
  return {
    flavor: safeFlavor,
    headline: '45 dakikada nereden başlayacağınızı netleştirelim.',
    buttonLabel: 'Discovery Call Planla',
    microcopy: 'Bağlayıcı değil; 5 gün içinde yazılı önerge.',
  };
}

/**
 * Tüm variant key listesi — useExperiment config için weighted assignment.
 */
export const CTA_FLAVORS: CtaFlavor[] = ['urgency', 'value', 'social'];
