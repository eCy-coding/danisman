/**
 * P54.A1 — Pillar pages full content (5 cluster × 5-7 H2 section).
 *
 * Each pillar ~1500-2000 word hub for SEO depth + topical authority.
 * PillarPage.tsx P51.4'te oluşturuldu — bu dosya content layer'ı.
 */

export interface PillarSection {
  heading: string;
  body: string;
}

export interface PillarContent {
  slug: string;
  title: string;
  subtitle: string;
  executiveSummary: string;
  sections: PillarSection[];
  ctaCopy: string;
  pdfTeaserUrl?: string;
}

export const PILLARS_CONTENT: PillarContent[] = [
  // ──────────────────────────────────────────────────────────────
  // PILLAR 1 — Strategic Transformation
  // ──────────────────────────────────────────────────────────────
  {
    slug: 'stratejik-donusum',
    title: 'Stratejik Dönüşüm · Vizyon Mimarlığından Sahaya',
    subtitle:
      'Yönetim kurulu seviyesinde alınan kararların sahada gerçekleşmesini sağlayan 5-katmanlı mimari.',
    executiveSummary:
      'Türk iş dünyasında karşılaştığımız en sık örüntü: vizyon dokümanı her yıl tazelense de ekibin günlük operasyonu vizyonla uyumsuz çalışıyor. Yönetim toplantılarında kararlar 3-6 ay içinde tatil oluyor. Premium consulting değer önerimizin özü tam burada — vizyon-uygulama köprüsünü 5 katmanlı engagement mimarisiyle kuruyoruz: Vision Architecture (3-5 yıllık kuzey yıldızı), Strategy Bridge (OKR + quarterly cadence + RACI), Result Engineering (KPI baseline + ölçüm), Culture Sustainability (değişim yönetimi), Anonymous Result Loop (NDA-friendly retrospektif).',
    sections: [
      {
        heading: 'Vision Architecture — 3-5 Yıllık Kuzey Yıldızı',
        body:
          'Her engagement kuzey yıldızı dokümanıyla başlar. "Nerede oynuyoruz" sorusunu yanıtlarız: hangi pazarlarda, hangi müşteri segmentleriyle, hangi değer önerisiyle. Üst yönetimle birlikte rekabet sınırlarını tanımlar, mevcut konumdan hedef konuma geçişin temel varsayımlarını masaya yatırırız. Discovery Call notlarından beslenen yapılandırılmış vision workshop (yarım gün × 2 oturum) sonucunda yönetim kurulu onaylı bir kuzey yıldızı dokümanı çıkar. Çıktı: vizyon, misyon, 3-5 yıllık stratejik tema seti, kritik varsayımlar, başarı kriterleri. Bu doküman engagement boyunca referans noktası olarak kalır; tüm OKR ve karar şablonları bu vizyona bağlanır.',
      },
      {
        heading: 'Strategy Bridge — OKR + Quarterly Cadence',
        body:
          'Vizyon güzeldir, uygulama zordur. Strategy Bridge katmanı kuzey yıldızı ile çeyreklik hedefler arasındaki köprüyü kurar. Objectives & Key Results (OKR) setting, quarterly review cadence, karar mercii sorumluluk haritası (RACI matrisi) bu katmanda netleşir. Hangi kararın kim tarafından verileceğini, hangi metrik eşiğinde eskalasyon olacağını birlikte tasarlarız. 90 günlük yol haritası, milestone takvimi ve haftalık operasyonel ritim takvimi engagement\'in operasyonel iskeleti olur.',
      },
      {
        heading: 'Result Engineering — KPI Baseline + Ölçüm Sistemi',
        body:
          'Strateji ölçülemiyorsa stratejik değildir. Result Engineering katmanı KPI tasarımı, baseline ölçümü ve metric instrumentation\'a odaklanır. İlk haftada mevcut performansın baseline\'ını çıkarır, hangi metriklerin gerçekten engagement\'i temsil ettiğini birlikte seçeriz. Veri toplama mekanizması, dashboard kurulumu ve 90 günlük retrospektif raporun şablonu bu fazda hazırlanır. Hedef: engagement bittiğinde şirketin metriği kendi başına izleyebilmesi — bağımlılık değil, kapasite bırakırız.',
      },
      {
        heading: 'Culture Sustainability — Değişim Yönetimi',
        body:
          'En iyi stratejiler kültür uyumsuzluğunda erir. Culture Sustainability katmanı; değişim yönetimi, davranışsal nudges ve liderlik koçluğunu birleştirir. Yönetim toplantısı ritüellerini, performans konuşmalarının dili ve karar verme protokollerini engagement boyunca gözlemleyip rafine ederiz. Yöneticilere bire bir 30-60 dakikalık koçluk seansları, ekip moderasyonu için "decision sprint" formatı ve geri bildirim ritüellerinin kurulumunu sağlarız.',
      },
      {
        heading: 'Anonymous Result Loop — Sürekli Öğrenme',
        body:
          'Engagement\'in kapanışı, öğrenmenin başlangıcıdır. Anonim Sonuç Loop\'u katmanında; NDA çerçevesinde standartlaştırılmış bir retrospektif yapı kullanırız. Engagement bittikten 6 ay sonra müşteriyle anonim takip görüşmesi yapar, hangi varsayımların doğru çıktığını, hangilerinin gözden geçirilmesi gerektiğini sorarız. Bu öğrenmeler — müşteri kimliği olmadan — gelecekteki engagement\'lerin diagnostic anketlerine ve playbook revizyonlarına girer.',
      },
      {
        heading: 'Hangi Şirketler İçin Uygundur?',
        body:
          'Bu pillar 50-500 çalışanlı, karar mercii erişilebilir orta-büyük şirketler için ideal. Tipik müşteri profili: aile holdingi 2-3. nesil geçiş döneminde, tech scale-up Series B sonrası, üretim grubu strateji-uygulama uçurumu yaşıyor, banka/finans kurumu çeyreklik OKR cadence kuramamış. Engagement boyutu: Strateji Oturumu (1 hafta · ₺12k+), Çeyreklik Engagement (12 hafta · ₺75k+), Yıllık Partnerlik (12 ay · ₺350k+).',
      },
    ],
    ctaCopy: 'Stratejik Dönüşüm engagement\'ı için Discovery Call ile başlayalım — 45 dk ücretsiz keşif görüşmesi.',
    pdfTeaserUrl: '/reports/strategic-transformation-playbook-2026.pdf',
  },

  // ──────────────────────────────────────────────────────────────
  // PILLAR 2 — Family Business
  // ──────────────────────────────────────────────────────────────
  {
    slug: 'aile-sirketleri',
    title: 'Aile Şirketi Yönetişimi · Nesilden Nesle Kurumsallaşma',
    subtitle: 'Türkiye iş ekonomisinin bel kemiği aile şirketleri için Aile Anayasası + Family Council mimarisi.',
    executiveSummary:
      'Türk ekonomisinin %85+\'ı aile şirketleridir. Kurucu nesil emekliliğe yaklaştıkça, 2. ve 3. nesil arası yetki devri kritikleşir. Aile = şirket = kurucu denkleminden, profesyonel yönetim + aile konseyi + yazılı governance modeline geçiş, en zorlu transition deneyimi. Aile Anayasası engagement\'larımız tam bu süreci yapılandırılmış hale getirir. 14-20 haftalık standart engagement; çıktısı yazılı Aile Anayasası + Family Council tüzüğü + Succession yol haritası.',
    sections: [
      {
        heading: 'Aile Anayasası — 40 Maddelik Çerçeve',
        body:
          'Aile Anayasası yaklaşık 40 sayfa civarı bir dokümandır. Family mission, values, ownership policy, governance protokolleri, hisse devri kuralları, akraba istihdamı standartları, kar payı dağıtım çerçevesi yer alır. Aile üyeleri ile iteratif review + hukuki danışmanla validation ile finalize edilir. Hisse devri, kar payı, akrabaların istihdamı yazılı kurallarla netleşir — spor olmaktan çıkar, krize dönüşmesi engellenir.',
      },
      {
        heading: 'Family Council vs Yönetim Kurulu',
        body:
          'İki ayrı yapı. Family Council aile üyelerinin "owner" rolündeki forumu — strateji, vizyon, ailenin uzun vadeli refahı konuşulur. Yönetim Kurulu şirketin operasyonel karar mercii — ticari kararlar, yönetim atamaları, finansal performans burada görüşülür. Karışıklığa son: karar hakları matrisi (decision rights) bu iki organın sınırını netleştirir. Family Council ayda 1, Yönetim Kurulu ayda 1 + ad-hoc — ritim engagement\'ta kurulur.',
      },
      {
        heading: 'Succession Planlaması (3-7 Yıllık)',
        body:
          'Yetki devir takvimi, kuşak transfer mentor programı, profesyonel CEO/CFO interview desteği. Acele değil, planlı geçiş. Kurucu hala aktif iken next-gen rotasyonu başlar. Mentor programı: kurucu × next-gen pair, haftalık 2 saatlik yapılandırılmış paylaşım. Profesyonel CEO/CFO atanırsa: interview panel + onboarding 90-günlük plan + reporting line netleştirme.',
      },
      {
        heading: 'Akraba İstihdam Politikası',
        body:
          'Aile şirketlerinde en yaygın çatışma kaynağı — akrabalar şirkette nasıl istihdam edilir? Yazılı politika engagement\'ta tasarlanır: minimum dış deneyim (örn: 3 yıl), giriş düzeyi pozisyon yasağı, performans standartları aynı (favoritism yasak), yıllık değerlendirme aile dışı yönetici yapar. Bu kurallar Family Council\'da onaylanır, exception\'lar açık ve belgeli olur.',
      },
      {
        heading: 'Kar Payı Dağıtım Formülü',
        body:
          'Yıllık 1 kez kriz yaratan kar payı tartışması yapılandırılmış formüle bağlanır. Tipik framework: %X yeniden yatırım (zorunlu), %Y aile vakfı (sosyal sorumluluk), %Z dağıtım. Dağıtım hisse oranı bazlı; performans bonusu sadece şirkette aktif çalışan aile üyeleri için, ayrı bir bütçeden.',
      },
      {
        heading: 'Aile Vakfı + Family Office (4. Nesil+)',
        body:
          '20+ hissedarlık olunca artık holding governance yetmez — aile vakfı + private family office mimarisi gerekir. Engagement bu yapıyı kurar: vakıf hukuki çerçeve, family office yönetim organizasyonu, portfolio investment policy, next-gen eğitim fonu, philanthropy stratejisi.',
      },
    ],
    ctaCopy: 'Aile şirketinizin governance yolculuğu için Discovery Call planla — Aile Anayasası deneyimimizi konuşalım.',
    pdfTeaserUrl: '/reports/family-business-constitution-template.pdf',
  },

  // ──────────────────────────────────────────────────────────────
  // PILLAR 3 — Operational Excellence
  // ──────────────────────────────────────────────────────────────
  {
    slug: 'operasyonel-mukemmellik',
    title: 'Operasyonel Mükemmellik · Lean Six Sigma DMAIC',
    subtitle: 'OEE +%15, lead time -%50, FPY +%10 sektörel benchmark — sahaya inerek + sürdürülebilir disiplinle.',
    executiveSummary:
      'Maliyet yapısını sahaya inerek söker, operasyonel kayıpları sistematik tespit ederiz. Gemba walk, Value Stream Mapping, kaizen sprint\'leri, Six Sigma DMAIC projeler. Sürdürülebilirliği sağlamak için ekibe Green Belt eğitim + daily management board kurulumu. Tipik 16-24 haftalık engagement\'ta OEE 15-40% artış, lead time 25-50% kısalma, FPY 5-15% iyileşme görülür.',
    sections: [
      {
        heading: 'Gemba Walk + Value Stream Mapping',
        body:
          'Sahada bizzat akış izleme. Current state value stream haritası. 7 müda (israf) tanımlama: aşırı üretim, bekleme, transport, aşırı işleme, envanter, hareket, kusur. Future state target çiziminde sektörel benchmark kullanırız. Engagement\'in ilk 2 haftasında sahada günde 4-6 saat, ekip içerisinde yer alarak detaylı gözlem yaparız.',
      },
      {
        heading: 'DMAIC Six Sigma Projeleri',
        body:
          'Define-Measure-Analyze-Improve-Control. Her DMAIC proje 6-8 hafta. Define: problem statement, başarı kriteri. Measure: baseline ölçüm, MSA (measurement system analysis). Analyze: root cause analysis (5 Whys, fishbone, hypothesis testing). Improve: solution design, pilot. Control: SPC chart, lessons learned, handoff.',
      },
      {
        heading: 'Kaizen Sprint\'leri (6-8 hafta)',
        body:
          'Haftalık 2-3 günlük kaizen workshop\'ları. SMED ile setup time azaltma (target: %50+ reduction), 5S ile alan organizasyonu, kanban ile pull production, poka-yoke ile hata önleme. Her kaizen pilot bir hat veya hücrede yapılır, başarı kanıtlanınca scale olur.',
      },
      {
        heading: 'Daily Management Board',
        body:
          'Sürdürülebilirlik için kritik. Her saha vardiyasında günlük 10-15 dakikalık standup. Board\'da: dünün KPI sonucu (renk kodlu), bugünün hedefleri, eskalasyon edilen sorunlar, dünden gelen learn-out. Engagement sonrası ekip liderleri bunu kendi başına yönetir.',
      },
      {
        heading: 'Tedarik Zinciri Optimizasyonu',
        body:
          'Sadece üretim değil — uçtan uca lojistik. Stok devir hızı, safety stock seviyesi, supplier OTIF (on-time-in-full), lead time variability. ABC analizi → C-class SKU\'lar konsolidasyon, A-class\'da JIT discipline. Hedef: %20-40 stok devir hızı artışı.',
      },
      {
        heading: 'Six Sigma Green Belt Eğitim',
        body:
          'Engagement\'in parçası olarak ekibinize 3 modül Green Belt eğitim. Modül 1: DMAIC fundamentals + statistics basics. Modül 2: tools (Minitab/Excel statistical analysis). Modül 3: project execution. Sertifikalandırma: engagement içinde tamamladıkları kendi proje + tez ile.',
      },
    ],
    ctaCopy: 'Operasyonel verimlilik hedefini birlikte tanımlayalım — Discovery Call ile başla.',
    pdfTeaserUrl: '/reports/lean-six-sigma-roi-benchmark.pdf',
  },

  // ──────────────────────────────────────────────────────────────
  // PILLAR 4 — Digital & AI
  // ──────────────────────────────────────────────────────────────
  {
    slug: 'dijital-yapay-zeka',
    title: 'Dijital & AI Dönüşümü · Tool Değil Strateji',
    subtitle: 'AI/dijital tool seçimi değil, strateji-süreç-teknoloji-kültür tetragramının uyumlandırılması.',
    executiveSummary:
      'Dijital dönüşüm projelerinin %70\'i başarısız olur — vendor seçimi değil organizasyon hazır olmadığı için. ERP/CRM 18 ay sonra %40 adoption, RPA pilotları 6 ay sonra unutuluyor, AI hype içinde use-case seçimi yapılmıyor. Vendor-agnostic yaklaşımla strateji + change management + operating model + AI maturity sıralaması.',
    sections: [
      {
        heading: 'Dijital Olgunluk Audit (6 Boyut)',
        body:
          'Strateji, süreç, teknoloji, veri, kültür, organizasyon. Sektörel benchmark. 3-yıllık teknoloji vizyonu; build-buy-partner kararları. Olgunluk skoru 0-100; engagement öncesi baseline + 12 ay sonra re-audit ile delta ölçüm.',
      },
      {
        heading: 'AI Use-Case Portfolio',
        body:
          'Impact × feasibility matrisi. 5-10 use-case listesi. Top 2-3 pilot ML/GenAI projesi production-ready. Use case kategorileri: tahmin (demand forecasting, churn), classification (lead scoring, document tagging), GenAI (knowledge management, customer support), optimization (route, pricing).',
      },
      {
        heading: 'MLOps Pipeline + Model Governance',
        body:
          'Pilot başarısı production-ready demek değildir. MLOps pipeline kurulumu: model versioning (DVC, MLflow), CI/CD for models, monitoring (drift detection, latency), retraining schedule, A/B testing framework, rollback procedures. Model governance: KVKK uyum, bias audit, explainability requirements.',
      },
      {
        heading: 'ERP + CRM Seçim Süreci',
        body:
          'Vendor-agnostic. SAP, Oracle NetSuite, Microsoft Dynamics, lokal alternatives — fit-gap analizi engagement\'ta yapılır. RFP, demo, reference call, contract negotiation desteği. Implementation partner seçimi: scope-fit + Türkiye experience + post-go-live support critical.',
      },
      {
        heading: 'RPA + Süreç Otomasyon',
        body:
          'Pilotlar 6 ay sonra unutuluyor — sebep yapı eksikliği. CoE (Center of Excellence) modeli engagement\'ta kurulur. UiPath/Power Automate/Automation Anywhere vendor seçimi + 5-10 use case pilot (high-volume rule-based: invoice processing, data entry, report generation) + governance + ROI tracking.',
      },
      {
        heading: 'IT Operating Model',
        body:
          'Centralized vs federated vs hybrid. CTO/CDO C-level decision table\'da. Change management plan + capability building. Engagement sonu: yazılı IT operating model dokümanı + 3-yıllık talent roadmap + technology investment portfolio matrix.',
      },
    ],
    ctaCopy: 'AI/dijital dönüşüm yolculuğunuzda doğru sıralamayı birlikte belirleyelim — Discovery Call.',
    pdfTeaserUrl: '/reports/digital-ai-maturity-framework.pdf',
  },

  // ──────────────────────────────────────────────────────────────
  // PILLAR 5 — Sustainability & ESG
  // ──────────────────────────────────────────────────────────────
  {
    slug: 'surdurulebilirlik-esg',
    title: 'Sürdürülebilirlik & ESG · CBAM\'a Hazır Strateji',
    subtitle: 'AB Yeşil Mutabakatı 2026 takvimine sektörünüzü hazırlıyoruz — maliyet değil rekabet avantajı.',
    executiveSummary:
      'CBAM (Karbon Sınırı Düzenleme Mekanizması) 2026\'da tam aktif. AB pazarına ihracatçı Türk üreticilerin %42\'si karbon-yoğun sektörlerde — etki simülasyonu yapılmamış. Müşteriden Scope 3 emisyon talep ediliyor ama ölçüm metodolojisi belirsiz. ESG strategy engagement\'larımız ile materiality, karbon envanteri, decarbonization roadmap, CSRD raporlama, yeşil finansman erişimi.',
    sections: [
      {
        heading: 'Materiality Assessment',
        body:
          'Hangi ESG konuları sektör + paydaş için kritik. Stakeholder interview (10-20 anket + 5-8 derinleşmeli görüşme) → öncelik haritası. GRI / SASB / TCFD / CSRD framework seçimi sektörlere göre. Engagement çıktısı: materiality matrix + raporlama scope tanımı.',
      },
      {
        heading: 'Karbon Envanteri (Scope 1+2+3)',
        body:
          'ISO 14064 / GHG Protocol uyumlu. Scope 1: direkt emisyon (yakıt, üretim süreç). Scope 2: indirek (elektrik, ısı). Scope 3: tedarik zinciri + ürün kullanımı + atık (en zor). Scope 3 tedarikçi data toplama 6-12 ay süreç; engagement\'ta primary data collection survey + benchmark estimation hybrid.',
      },
      {
        heading: 'CBAM Etki Simülasyonu',
        body:
          'AB\'ye ihracatınız varsa karbon-yoğun ürünlerde (demir-çelik, çimento, alüminyum, gübre, hidrojen, elektrik) 2026 itibariyle ek vergi. Etki simülasyonu engagement ilk fazında yapılır: mevcut ihracat × CBAM tariff × karbon yoğunluğu = ek maliyet. Senaryo analizi: status quo vs decarbonization invest. Ortalama ROI: 2-4 yıl.',
      },
      {
        heading: 'Decarbonization Roadmap',
        body:
          '5-10 yıllık plan. Quick wins (yıl 1-2): enerji verimliliği, lighting LED, renewable PPA. Medium-term (yıl 3-5): proses elektrifikasyonu, hidrojen pilotu, supplier engagement. Long-term (yıl 6-10): değer zinciri transformasyonu, circular economy initiatives, net-zero hedefi.',
      },
      {
        heading: 'CSRD Reporting Compliance',
        body:
          'Corporate Sustainability Reporting Directive 2024\'ten itibaren EU-listed firmalar için zorunlu, 2026\'dan itibaren büyük private şirketler dahil. ESRS (European Sustainability Reporting Standards) 12 standart üzerinden raporlama. Engagement\'ta CSRD readiness assessment + gap analizi + reporting framework kurulumu.',
      },
      {
        heading: 'Yeşil Finansman Erişimi',
        body:
          'Sustainable bond, green loan, EU Horizon hibe, TÜBİTAK ESG fonları. Engagement\'ta finansman pitch hazırlığı + ESG due diligence preparation + reporting commitment templates. Tipik %1-2 düşük faizle borçlanma fırsatı; ROI engagement maliyetini 1-2 yılda karşılar.',
      },
    ],
    ctaCopy: 'CBAM ve CSRD hazırlığınızı birlikte planlayalım — Discovery Call ile ESG yolculuğunuza başlayın.',
    pdfTeaserUrl: '/reports/esg-cbam-csrd-readiness-2026.pdf',
  },
];

export function getPillarContent(slug: string): PillarContent | undefined {
  return PILLARS_CONTENT.find((p) => p.slug === slug);
}
