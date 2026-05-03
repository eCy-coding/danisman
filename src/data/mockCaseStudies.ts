import { CaseStudy } from '../components/features/case-studies/CaseStudyCard';

export const CASE_STUDIES: CaseStudy[] = [
  {
    slug: 'global-retail-transformation',
    title: 'Global Retail Digital Transformation',
    client: 'Fortune 500 Retailer',
    industry: 'Retail',
    result: '240% ROI',
    duration: '14 months',
    goLive: 'Q2 2025',
    challenge: 'Fragmented supply chain across 38 countries with no unified demand signal.',
    image: 'https://images.unsplash.com/photo-1556740758-90de374c12ad?auto=format&fit=crop&q=80',
    content: `
      <h2>The Challenge</h2>
      <p>A Fortune 500 retailer operated 1,200+ stores across 38 countries with siloed regional ERPs.
      Inventory turnover was 23% below industry median; stockouts during promotional windows eroded
      <strong>$180M annually</strong>. Leadership needed a single demand-signal platform without rip-and-replace.</p>

      <h2>Our Approach</h2>
      <ul>
        <li><strong>Phase 1 — Diagnostic (6 weeks):</strong> Shadowed 14 distribution centers, mapped 92 data integrations, benchmarked vs. McKinsey Retail Operations Index.</li>
        <li><strong>Phase 2 — Platform (5 months):</strong> Delivered a unified demand-signal lakehouse on Snowflake + dbt with 42 forecasting models (LightGBM + Prophet ensemble).</li>
        <li><strong>Phase 3 — Rollout (7 months):</strong> Wave-based deployment across 4 regions; change-management playbook for 8,400 category managers.</li>
      </ul>

      <h2>Results</h2>
      <ul>
        <li>Stockouts reduced by <strong>61%</strong> in the first 9 months post go-live.</li>
        <li>Inventory turnover improved from 6.1 → 8.9 (+46%).</li>
        <li>Forecast accuracy (SKU-store-week) rose from 58% → 84% MAPE-weighted.</li>
        <li>Net ROI of <strong>240%</strong> within 18 months, validated by internal audit.</li>
      </ul>

      <p>The platform now processes 2.3B rows/day and is the single source of truth for merchandising, finance, and operations.</p>
    `,
  },
  {
    slug: 'fintech-market-entry',
    title: 'Fintech Market Entry Strategy',
    client: 'NeoBank Corp',
    industry: 'Finance',
    result: '1M Users in 6 Months',
    duration: '9 months',
    goLive: 'Q4 2024',
    challenge: 'Launch a regulated neobank in 3 EU markets under PSD2 + MiCA with a lean team.',
    image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80',
    content: `
      <h2>The Challenge</h2>
      <p>A Series B neobank needed simultaneous launch in Germany, France, and the Netherlands with
      regulatory clearance under PSD2 and forthcoming MiCA, a 12-person compliance team, and a 9-month window
      before capital runway pressure.</p>

      <h2>Our Approach</h2>
      <ul>
        <li><strong>Regulatory Program Office:</strong> End-to-end orchestration across BaFin, ACPR, and DNB. 340 artefacts delivered, zero re-submissions.</li>
        <li><strong>Product-Market Fit Squad:</strong> 14 qualitative interview cohorts → 3 segment-specific onboarding funnels with A/B-validated copy.</li>
        <li><strong>Growth Engine:</strong> Referral mechanic with embedded virality coefficient K = 1.42, supported by a programmatic creative factory (MMM-steered budget).</li>
      </ul>

      <h2>Results</h2>
      <ul>
        <li><strong>1,000,000 verified users</strong> in the first 6 months (vs. plan of 400k).</li>
        <li>CAC €14.80 vs. segment benchmark €38.20 (-61%).</li>
        <li>Regulatory pass rate 100% across 3 jurisdictions.</li>
        <li>Series C closed at 3.2× valuation uplift driven by traction.</li>
      </ul>
    `,
  },
  {
    slug: 'manufacturing-optimization',
    title: 'Industry 4.0 Optimization',
    client: 'AutoParts Ltd',
    industry: 'Manufacturing',
    result: '30% Cost Reduction',
    duration: '11 months',
    goLive: 'Q1 2025',
    challenge: 'Unplanned downtime costing €42M/yr across 4 precision-machining plants.',
    image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80',
    content: `
      <h2>The Challenge</h2>
      <p>A Tier-1 automotive supplier faced €42M annual unplanned-downtime losses across 4 plants.
      OEE averaged 58% vs. world-class 85%; existing SCADA stack lacked cross-plant observability.</p>

      <h2>Our Approach</h2>
      <ul>
        <li><strong>Edge Instrumentation:</strong> 1,840 IO-Link sensors deployed across 212 machines; OPC-UA unified namespace.</li>
        <li><strong>Predictive Maintenance Models:</strong> Vibration + thermal + acoustic features → XGBoost classifier (AUROC 0.94) for 48-hour failure window.</li>
        <li><strong>Operator Copilot:</strong> Tablet UI with reason-code capture, root-cause prompts, and MES integration.</li>
      </ul>

      <h2>Results</h2>
      <ul>
        <li>Unplanned downtime down <strong>54%</strong> (€23M recaptured in year 1).</li>
        <li>OEE: 58% → 79% across the 4-plant network.</li>
        <li>Maintenance cost per unit output down <strong>30%</strong>.</li>
        <li>ISO 50001 energy-management certification achieved as a byproduct.</li>
      </ul>
    `,
  },
];

/** Exported for sitemap + other SSR tooling to avoid re-declaring slugs. */
export const CASE_STUDY_SLUGS = CASE_STUDIES.map((c) => c.slug);
