/**
 * Sektör FAQ içeriği — GEO (Generative Engine Optimization) katmanı.
 *
 * Her sektör sayfasına 6 bilingual Q&A. `src/components/blog/FAQSection.tsx`
 * (prop-driven, FAQPage JSON-LD emit eden kanıtlı component) ile render edilir
 * → AI cevap motorlarında (ChatGPT/Perplexity/AIO) doğrudan citation adayı
 * (FAQPage schema +%61 citation; ECYPRO_CONTENT_MASTERPLAN.md roadmap P0).
 *
 * İçerik humanizer metodolojisi: answer-first, founder-voice, somut sayı/örnek,
 * doğal TR / native EN, KVKK-farkında. Çeviri değil — transcreation.
 */
import type { FAQItem } from '../components/blog/FAQSection';

type Lang = 'tr' | 'en';

export interface BilingualFaq {
  q: { tr: string; en: string };
  a: { tr: string; en: string };
}

export const SECTOR_FAQS: Record<string, BilingualFaq[]> = {
  'imalat-sanayi': [
    {
      q: {
        tr: 'İmalat şirketimde verimlilik projesi ne kadar sürede sonuç verir?',
        en: 'How quickly does an efficiency project deliver results in my manufacturing company?',
      },
      a: {
        tr: 'İlk ölçülebilir kazanım genelde 60-90 günde gelir. OEE (Genel Ekipman Etkinliği) taban ölçümünü ilk iki haftada çıkarır, ardından darboğaz hattına odaklanırız. Tipik bir hatta ilk çeyrekte %10-18 OEE artışı gerçekçi bir hedeftir; tam Lean dönüşümü 6-12 ay sürer.',
        en: 'The first measurable gain typically lands in 60-90 days. We baseline OEE (Overall Equipment Effectiveness) in the first two weeks, then focus on the bottleneck line. A 10-18% OEE lift in the first quarter is a realistic target for a single line; a full Lean transformation runs 6-12 months.',
      },
    },
    {
      q: {
        tr: 'Endüstri 4.0 yatırımına hazır mıyım, nereden başlamalıyım?',
        en: 'Am I ready for an Industry 4.0 investment, and where should I start?',
      },
      a: {
        tr: 'Teknolojiden değil, veriden başlayın. Çoğu fabrika MES/SCADA yatırımı yapar ama OT/IT entegrasyonu olmadığı için veri silolarda kalır. Önce 1 hattın gerçek-zamanlı görünürlüğünü kurar, ROI kanıtlanınca ölçeklendiririz. Yatırım öncesi olgunluk değerlendirmemiz ücretsizdir.',
        en: 'Start with data, not technology. Most plants buy MES/SCADA but data stays siloed because OT/IT integration is missing. We establish real-time visibility on one line first, prove the ROI, then scale. Our pre-investment maturity assessment is free.',
      },
    },
    {
      q: {
        tr: 'Tek tedarikçiye bağımlıyım, riski nasıl azaltırım?',
        en: 'I depend on a single supplier — how do I reduce that risk?',
      },
      a: {
        tr: 'Kritik kalemler için ikinci kaynak kalifikasyonu + güvenlik stoğu eşiği belirleyerek başlarız. Tedarik zinciri risk haritası çıkarır, tek-nokta-arıza kalemlerini önceliklendiririz. Çeşitlendirme maliyetini, bir kesintinin üretim durması maliyetiyle karşılaştırarak iş gerekçesini netleştiririz.',
        en: 'We start by qualifying a second source for critical items and setting safety-stock thresholds. We map supply-chain risk and prioritize single-point-of-failure items, then quantify diversification cost against the cost of a production stoppage to make the business case clear.',
      },
    },
    {
      q: {
        tr: 'Big4 danışmanlık yerine sizi neden seçeyim?',
        en: 'Why choose you over a Big4 consultancy?',
      },
      a: {
        tr: 'Big4 size kıdemli ortağı satar, işi junior ekip yapar. Bizde projeyi konuşan kişi sahada da çalışır. Küçük ekip, üst yönetim katılımı, sabit fiyat — saat faturası yok. Bağımsızız: yazılım/ekipman satıcısı değiliz, önerimiz tarafsızdır.',
        en: "Big4 sells you a senior partner but a junior team does the work. With us, the person who scopes the project is the person on your shop floor. Small team, executive sponsorship, fixed price — no hourly billing. We're independent: we don't resell software or equipment, so our recommendation is unbiased.",
      },
    },
    {
      q: {
        tr: 'Üretim verilerimiz KVKK açısından güvende mi?',
        en: 'Is our production data safe under data-protection law?',
      },
      a: {
        tr: 'Tüm veri KVKK ve GDPR kapsamında işlenir; proje başında NDA imzalanır. Operasyonel verileriniz şifreli ortamda tutulur, üçüncü taraflarla paylaşılmaz. Kişisel veri içeren İK/vardiya verilerinde anonimleştirme uygularız.',
        en: 'All data is processed under KVKK and GDPR; an NDA is signed at project start. Your operational data is kept encrypted and never shared with third parties. For HR/shift data containing personal information, we apply anonymization.',
      },
    },
    {
      q: {
        tr: 'Maliyet düşürme kaliteyi bozar mı?',
        en: 'Will cost reduction hurt our quality?',
      },
      a: {
        tr: 'Hayır — doğru yaklaşımda kalite artar. Six Sigma ile değişkenliği azaltırız; israf (fire, yeniden işleme, bekleme) hem maliyet hem kalite sorunudur. Hedefimiz birim maliyeti düşürürken ilk-seferde-doğru oranını yükseltmektir; ikisini birlikte ölçeriz.',
        en: 'No — done right, quality improves. Six Sigma reduces variation, and waste (scrap, rework, waiting) is both a cost and a quality problem. Our goal is to lower unit cost while raising first-time-right rate; we measure both together.',
      },
    },
  ],
  'finansal-hizmetler': [
    {
      q: {
        tr: 'MASAK / AML-KYC uyumunu nasıl hızlandırırsınız?',
        en: 'How do you accelerate MASAK / AML-KYC compliance?',
      },
      a: {
        tr: 'Mevcut müşteri kabul ve izleme sürecinizi MASAK yükümlülükleriyle eşleştirip boşluk haritası çıkararak başlarız. Risk-bazlı müşteri segmentasyonu, şüpheli işlem senaryoları ve raporlama akışını kurarız. Tipik bir fintech 8-12 haftada denetime hazır hale gelir.',
        en: 'We start by mapping your current onboarding and monitoring against MASAK obligations and producing a gap map. We set up risk-based customer segmentation, suspicious-transaction scenarios, and the reporting workflow. A typical fintech becomes audit-ready in 8-12 weeks.',
      },
    },
    {
      q: {
        tr: 'Operasyonel ve regülasyon riskini birlikte nasıl yönetirsiniz?',
        en: 'How do you manage operational and regulatory risk together?',
      },
      a: {
        tr: 'Tek bir risk envanteri kurarız: her riske sahip, kontrol, eşik ve raporlama frekansı atanır. Basel/yerel mevzuat gereklilikleri ile operasyonel kontroller aynı çerçevede izlenir — böylece denetimde tek kaynak konuşur. Üç aylık risk komitesi ritmi öneririz.',
        en: 'We build a single risk inventory: every risk gets an owner, control, threshold, and reporting cadence. Basel/local regulatory requirements and operational controls live in one framework, so audits speak from a single source of truth. We recommend a quarterly risk-committee rhythm.',
      },
    },
    {
      q: {
        tr: 'Açık bankacılık / ödeme entegrasyonunda stratejik öncelik ne olmalı?',
        en: 'What should be the strategic priority in open banking / payments integration?',
      },
      a: {
        tr: 'Önce iş modeli, sonra API. Çoğu kurum teknik entegrasyona koşar ama hangi gelir akışını açtığını netleştirmez. Kullanım senaryosunu (gelir paylaşımı, müşteri sadakati, veri zenginleştirme) seçer, ona göre ortak ve mimari kararını veririz.',
        en: 'Business model first, API second. Most institutions rush to technical integration without clarifying which revenue stream it unlocks. We pick the use case (revenue share, customer retention, data enrichment) and let that drive the partner and architecture decision.',
      },
    },
    {
      q: {
        tr: 'Finans sektöründe bağımsız danışmanlık neden önemli?',
        en: 'Why does independent consulting matter in financial services?',
      },
      a: {
        tr: 'Çünkü yazılım/çözüm satan danışman, size ihtiyacınızı değil ürününü önerir. Biz hiçbir core-banking ya da regtech satıcısının ortağı değiliz; önerimiz tarafsızdır. Küçük ekip, üst yönetim katılımı, sabit fiyat çalışırız.',
        en: 'Because a consultant who sells software recommends their product, not your need. We are not a partner of any core-banking or regtech vendor, so our recommendation is unbiased. We work as a small team, executive-sponsored, fixed price.',
      },
    },
    {
      q: {
        tr: 'Müşteri verimiz KVKK ve GDPR açısından güvende mi?',
        en: 'Is our customer data safe under KVKK and GDPR?',
      },
      a: {
        tr: 'Finansal veri en hassas kategoridedir. Tüm engagement KVKK + GDPR + BDDK veri ilkeleriyle yürür; NDA proje başında imzalanır. Veri minimizasyonu uygular, kişisel veriyi pseudonimleştirir, üçüncü tarafla paylaşmayız.',
        en: 'Financial data is the most sensitive category. Every engagement runs under KVKK + GDPR + local banking data principles; an NDA is signed at start. We apply data minimization, pseudonymize personal data, and never share with third parties.',
      },
    },
    {
      q: {
        tr: 'Uyum yatırımının getirisi nasıl ölçülür?',
        en: 'How is the ROI of a compliance investment measured?',
      },
      a: {
        tr: 'İki eksende: kaçınılan ceza/itibar riski ve hızlanan operasyon. Otomatikleşen KYC, manuel inceleme süresini tipik olarak %40-60 kısaltır; bunu doğrudan maliyet tasarrufu olarak modelleriz. Başlangıçta size özel ROI projeksiyonu hazırlarız.',
        en: 'On two axes: avoided penalty/reputational risk and accelerated operations. Automated KYC typically cuts manual review time by 40-60%, which we model as direct cost savings. We prepare a custom ROI projection at the start.',
      },
    },
  ],
  'ilac-saglik': [
    {
      q: {
        tr: 'GMP ve ruhsatlandırma süreçlerinde nasıl destek veriyorsunuz?',
        en: 'How do you support GMP and regulatory/licensing processes?',
      },
      a: {
        tr: 'Mevcut kalite sisteminizi GMP gereklilikleriyle karşılaştırıp denetim-hazırlık boşluk analizi yaparız. Dokümantasyon, CAPA ve değişiklik kontrol süreçlerini güçlendiririz. Ruhsat dosyası hazırlığında zaman çizelgesi riskini erken işaretleriz.',
        en: 'We benchmark your quality system against GMP requirements and run an inspection-readiness gap analysis. We strengthen documentation, CAPA, and change-control processes, and flag timeline risk early in dossier preparation.',
      },
    },
    {
      q: {
        tr: 'Sağlık verisi ve hasta mahremiyetini nasıl koruyorsunuz?',
        en: 'How do you protect health data and patient privacy?',
      },
      a: {
        tr: "Sağlık verisi KVKK'da özel nitelikli veridir — ekstra koruma gerekir. Açık rıza akışı, erişim logu ve veri saklama politikasını kurarız. Analiz için veriyi anonimleştirir ya da pseudonimleştiririz; ham hasta verisi proje ekibine açılmaz.",
        en: 'Health data is a special category under KVKK requiring extra protection. We establish explicit-consent flows, access logging, and a retention policy. For analysis we anonymize or pseudonymize; raw patient data is never exposed to the project team.',
      },
    },
    {
      q: {
        tr: 'Pazara erişim ve geri ödeme stratejisinde ne yaparsınız?',
        en: 'What do you do for market access and reimbursement strategy?',
      },
      a: {
        tr: 'Geri ödeme kararını etkileyen kanıt gereksinimini erken haritalarız: klinik fayda, maliyet-etkinlik, bütçe etkisi. Ödeyici beklentisine göre değer dosyasını şekillendirir, lansman zaman çizelgesini geri ödeme takvimiyle hizalarız. Tipik bir değer dosyası 3-6 ayda hazırlanır.',
        en: 'We map the evidence requirements that drive the reimbursement decision early: clinical benefit, cost-effectiveness, budget impact. We shape the value dossier to payer expectations and align the launch timeline with the reimbursement calendar. A typical value dossier takes 3-6 months to build.',
      },
    },
    {
      q: {
        tr: 'İlaç/sağlık sektöründe sizi neden tercih etmeliyim?',
        en: 'Why should I choose you in the pharma/health sector?',
      },
      a: {
        tr: 'Regülasyon ve ticari stratejiyi birlikte konuşan bağımsız bir ekibiz. Belirli bir CRO ya da yazılımın satıcısı değiliz; tarafsız yol haritası veririz. Üst yönetim katılımlı, sabit fiyatlı, ölçülebilir hedefli çalışırız.',
        en: 'We are an independent team that discusses regulatory and commercial strategy together. We are not a reseller of any CRO or software, so the roadmap is unbiased. We work executive-sponsored, fixed price, with measurable goals.',
      },
    },
    {
      q: {
        tr: 'Denetim hazırlığı tipik olarak ne kadar sürer?',
        en: 'How long does inspection readiness typically take?',
      },
      a: {
        tr: "Boşluk analizi 2-3 hafta; bulguların kapatılması mevcut olgunluğa göre 2-4 ay. Kritik CAPA'ları önceliklendirir, denetim öncesi tatbikat (mock inspection) yaparız. Süreyi ilk değerlendirmeden sonra netleştiririz.",
        en: 'The gap analysis takes 2-3 weeks; closing findings takes 2-4 months depending on current maturity. We prioritize critical CAPAs and run a mock inspection beforehand. We firm up the timeline after the initial assessment.',
      },
    },
    {
      q: {
        tr: 'Verilerimiz proje sonrası ne oluyor?',
        en: 'What happens to our data after the project?',
      },
      a: {
        tr: "Saklama politikası NDA'da tanımlıdır. Proje bitiminde, yasal saklama süresi dışındaki kopyalar imha edilir; talep ederseniz imha tutanağı sunarız. Veri her zaman sizin kalır.",
        en: 'The retention policy is defined in the NDA. At project close, copies outside the legal retention period are destroyed; we provide a destruction record on request. The data always remains yours.',
      },
    },
  ],
  'perakende-e-ticaret': [
    {
      q: {
        tr: 'Omnichannel stratejisine nereden başlamalıyım?',
        en: 'Where should I start with an omnichannel strategy?',
      },
      a: {
        tr: 'Tek müşteri görünümünden. Mağaza, online ve çağrı merkezi verisi ayrı durdukça omnichannel sadece slogan kalır. Önce kimlik birleştirme ve stok görünürlüğünü kurar (ilk 8-12 hafta), sonra kanal-arası deneyimi (online al-mağazadan teslim vb.) açarız.',
        en: 'From a single customer view. As long as store, online, and call-center data sit apart, omnichannel stays a slogan. We first unify identity and inventory visibility (the first 8-12 weeks), then unlock cross-channel experiences (buy-online-pickup-in-store, etc.).',
      },
    },
    {
      q: {
        tr: 'Müşteri analitiği ve CLV ile somut olarak ne kazanırım?',
        en: 'What do I concretely gain from customer analytics and CLV?',
      },
      a: {
        tr: 'Pazarlama bütçesini değer ürettiği yere kaydırırsınız. CLV ve kohort analiziyle yüksek-değerli segmenti bulur, elde tutma ve kişiselleştirme aksiyonlarını oraya odaklarız. Tipik kazanım: edinme maliyetini düşürmeden tekrar-satın-alma oranını artırmak.',
        en: 'You shift marketing budget to where it creates value. With CLV and cohort analysis we find the high-value segment and focus retention and personalization there. Typical gain: raising repeat-purchase rate without inflating acquisition cost.',
      },
    },
    {
      q: {
        tr: 'Envanter ve son-mil lojistik maliyetini nasıl düşürürsünüz?',
        en: 'How do you reduce inventory and last-mile logistics cost?',
      },
      a: {
        tr: 'Talep tahminini düzeltip güvenlik stoğunu segment bazlı yeniden hesaplayarak başlarız — fazla stok da, stoksuzluk da maliyettir. Son-mil tarafında bölge-bazlı teslimat ve karşılama (fulfillment) ağını optimize ederiz. Önce ölçer, sonra değiştiririz.',
        en: 'We start by fixing demand forecasting and recomputing safety stock per segment — both overstock and stockouts are costs. On last-mile, we optimize zone-based delivery and the fulfillment network. We measure first, then change.',
      },
    },
    {
      q: {
        tr: 'Perakende/e-ticarette sizi neden seçeyim?',
        en: 'Why choose you in retail/e-commerce?',
      },
      a: {
        tr: 'Strateji ile uygulamayı ayırmayız. Pano yapıp gitmeyiz; aksiyonu ekibinizle birlikte hayata geçirip ölçeriz. Bağımsızız, platform satıcısı değiliz. Küçük ekip, üst yönetim katılımı, sabit fiyat.',
        en: "We don't separate strategy from execution. We don't build a deck and leave; we implement the action with your team and measure it. We are independent, not a platform reseller. Small team, executive sponsorship, fixed price.",
      },
    },
    {
      q: {
        tr: "Müşteri verisini KVKK'ya uygun nasıl kullanırım?",
        en: 'How do I use customer data in a KVKK-compliant way?',
      },
      a: {
        tr: 'Açık rıza ve aydınlatma metni doğru kurulduğunda kişiselleştirme tamamen yasaldır. Pazarlama izni, çerez yönetimi ve veri saklama politikanızı KVKK + GDPR ile hizalarız. Analizde mümkün olan her yerde pseudonimleştirme uygularız.',
        en: 'With proper consent and privacy notices, personalization is fully lawful. We align your marketing permissions, cookie management, and retention policy with KVKK + GDPR, and apply pseudonymization wherever possible in analysis.',
      },
    },
    {
      q: {
        tr: 'Dönüşüm oranı projesinin getirisi ne zaman görülür?',
        en: 'When does a conversion-rate project show returns?',
      },
      a: {
        tr: 'Hızlı kazanımlar (sepet terk, ödeme akışı, sayfa hızı) ilk 30-60 günde ölçülebilir. Yapısal iyileştirmeler (kişiselleştirme, segment kampanyaları) bir-iki çeyrek sürer. Her aksiyonu A/B testiyle doğrular, sadece kanıtlananı ölçekleriz.',
        en: 'Quick wins (cart abandonment, checkout flow, page speed) are measurable in the first 30-60 days. Structural improvements (personalization, segment campaigns) take a quarter or two. We validate each action with A/B tests and scale only what is proven.',
      },
    },
  ],
  'teknoloji-saas': [
    {
      q: {
        tr: 'SaaS metriklerimi (MRR/NRR/churn) nasıl sağlıklı kurarım?',
        en: 'How do I set up healthy SaaS metrics (MRR/NRR/churn)?',
      },
      a: {
        tr: "Önce tanım netliği: çoğu ekip MRR ve churn'ü tutarsız hesaplar, board yanlış sinyal alır. Tek bir metrik sözlüğü kurar, NRR'yi (net gelir tutma) büyümenin asıl pusulası yaparız. Sağlıklı bir SaaS'ta NRR %110 üzeridir — hedef: yeni satıştan önce mevcut tabanı genişletmek.",
        en: 'Definition clarity first: most teams compute MRR and churn inconsistently and the board gets the wrong signal. We build a single metric dictionary and make NRR (net revenue retention) the real compass for growth. A healthy SaaS shows NRR above 110% — the goal is to expand the existing base before chasing new sales.',
      },
    },
    {
      q: {
        tr: "AI ürün yatırımının ROI'sini nasıl değerlendirirsiniz?",
        en: 'How do you evaluate the ROI of an AI product investment?',
      },
      a: {
        tr: 'Hype değil, kullanım senaryosu. Hangi metriği (aktivasyon, destek maliyeti, elde tutma) ne kadar hareket ettireceğini önceden modelleriz. Küçük bir pilotla varsayımı test eder, ROI kanıtlanınca ölçekleriz. Çoğu zaman en iyi AI yatırımı en gösterişli olan değildir.',
        en: 'Use case, not hype. We model upfront which metric (activation, support cost, retention) it will move and by how much. We test the assumption with a small pilot and scale once ROI is proven. Often the best AI investment is not the flashiest one.',
      },
    },
    {
      q: {
        tr: 'Ölçeklenirken organizasyonu nasıl kurmalıyım?',
        en: 'How should I structure the organization as we scale?',
      },
      a: {
        tr: "Yapı stratejiyi takip etmeli, tersi değil. Hızlı büyüyen SaaS'larda en sık hata, ürün-led büyümeyi satış-led organizasyona zorlamaktır. Karar haklarını, ekip sınırlarını ve OKR hizasını netleştirir, koordinasyon maliyetini düşürürüz.",
        en: 'Structure should follow strategy, not the reverse. The most common mistake in fast-growing SaaS is forcing product-led growth into a sales-led org. We clarify decision rights, team boundaries, and OKR alignment to cut coordination cost.',
      },
    },
    {
      q: {
        tr: 'Teknoloji/SaaS sektöründe sizi neden seçeyim?',
        en: 'Why choose you in the tech/SaaS sector?',
      },
      a: {
        tr: 'Operatör bakışı olan bağımsız bir ekibiz — slayt değil, çalışan sistem kurarız. Belirli bir araç/platform satıcısı değiliz. Küçük ekip, kurucu/üst yönetim katılımı, sabit fiyat; saat faturası yok.',
        en: "We are an independent team with an operator's lens — we build working systems, not slides. We are not a reseller of any tool or platform. Small team, founder/executive sponsorship, fixed price; no hourly billing.",
      },
    },
    {
      q: {
        tr: 'Go-to-market stratejisinde ilk adım ne olmalı?',
        en: 'What should be the first step in a go-to-market strategy?',
      },
      a: {
        tr: 'Hedef segment ve mesaj netliği. Çoğu SaaS herkese satmaya çalışır ve hiçbir kanal verimli olmaz. Bir iğne-ucu segment (ICP) seçer, kanal-mesaj uyumunu test eder, kazanan kanalı ölçekleriz. CAC-LTV oranını baştan izler, CAC geri ödeme süresini 12 ayın altında hedefleriz.',
        en: 'Target segment and message clarity. Most SaaS tries to sell to everyone and no channel becomes efficient. We pick a sharp ICP, test channel-message fit, and scale the winning channel. We track the CAC-LTV ratio from day one and target CAC payback under 12 months.',
      },
    },
    {
      q: {
        tr: 'Verilerimiz ve fikri mülkiyetimiz korunuyor mu?',
        en: 'Are our data and intellectual property protected?',
      },
      a: {
        tr: 'Evet — NDA proje başında imzalanır, kod/veri/ürün sırları gizli tutulur. KVKK + GDPR kapsamında çalışır, kullanıcı verisini pseudonimleştiririz. Ürettiğimiz tüm çıktının fikri mülkiyeti size aittir.',
        en: 'Yes — an NDA is signed at project start, and code/data/product secrets are kept confidential. We operate under KVKK + GDPR and pseudonymize user data. All deliverables we produce are your intellectual property.',
      },
    },
  ],
};

export function getSectorFaqItems(slug: string, lang: Lang): FAQItem[] {
  return (SECTOR_FAQS[slug] ?? []).map((f) => ({ question: f.q[lang], answer: f.a[lang] }));
}
