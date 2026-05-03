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
  {
    slug: 'healthcare-ai-platform',
    title: 'AI-Driven Patient Journey Optimization',
    client: 'Regional Health Network',
    industry: 'Healthcare',
    result: '€28M Annual Savings',
    duration: '12 months',
    goLive: 'Q3 2025',
    challenge: 'Fragmented patient data across 7 hospitals with 18% readmission rate above the national average.',
    image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80',
    content: `
      <h2>The Challenge</h2>
      <p>A regional health network of 7 hospitals faced a readmission rate 18% above the national benchmark,
      costing the system an estimated <strong>€34M annually</strong> in penalties and excess care costs.
      Patient data lived in 12 disconnected systems; clinicians had no unified view of care history.</p>

      <h2>Our Approach</h2>
      <ul>
        <li><strong>Data Consolidation (3 months):</strong> HL7 FHIR-compliant unified patient data platform aggregating 12 source systems with bi-directional sync.</li>
        <li><strong>Predictive Risk Models (4 months):</strong> 30-day readmission risk model (XGBoost, AUROC 0.88) integrated into nurse workflows via Epic EMR embed.</li>
        <li><strong>Care Pathway Automation (5 months):</strong> Rule-based + ML discharge planning assistant; automated follow-up scheduling; remote monitoring for high-risk patients.</li>
      </ul>

      <h2>Results</h2>
      <ul>
        <li>Readmission rate reduced from 18% above to <strong>6% below</strong> national benchmark (−24pp).</li>
        <li><strong>€28M annual savings</strong> in year 1; full ROI achieved in 14 months.</li>
        <li>Average time-to-discharge reduced by 1.8 days across the network.</li>
        <li>Clinician adoption rate: 91% of eligible nursing staff using the risk dashboard daily.</li>
      </ul>
    `,
  },
  {
    slug: 'energy-transition-strategy',
    title: 'Net Zero Transition Roadmap',
    client: 'European Energy Utility',
    industry: 'Energy',
    result: '40% Carbon Reduction',
    duration: '8 months',
    goLive: 'Q1 2026',
    challenge: 'Committed to net zero by 2035 but lacked a credible investment and operational roadmap.',
    image: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&q=80',
    content: `
      <h2>The Challenge</h2>
      <p>A €4.2B European utility had made a public net-zero-by-2035 commitment under heavy regulatory and
      investor pressure, but possessed no coherent decarbonization strategy, asset retirement schedule, or
      capital allocation framework to back the pledge.</p>

      <h2>Our Approach</h2>
      <ul>
        <li><strong>Emissions Baseline (6 weeks):</strong> Scope 1, 2 &amp; 3 inventory across 340 assets; technology-readiness assessment for each transition lever.</li>
        <li><strong>Scenario Modelling (10 weeks):</strong> 4 net-zero pathways modelled under IEA, EU Taxonomy, and proprietary assumptions; NPV and stranded-asset risk quantified per scenario.</li>
        <li><strong>Capital Reallocation (12 weeks):</strong> €2.1B portfolio reallocation blueprint — coal retirement timeline, offshore wind JV structures, green hydrogen pilot sizing.</li>
      </ul>

      <h2>Results</h2>
      <ul>
        <li>Board-adopted roadmap with <strong>40% carbon reduction</strong> by 2028 (interim milestone).</li>
        <li>€680M divested from stranded assets ahead of regulatory pressure curve.</li>
        <li>Green bond issuance of €1.2B oversubscribed 2.4× on the basis of the published roadmap.</li>
        <li>ESG rating upgraded from BBB → A− within 12 months of publication.</li>
      </ul>
    `,
  },
  {
    slug: 'saas-product-led-growth',
    title: 'Product-Led Growth Transformation',
    client: 'Enterprise SaaS Platform',
    industry: 'Technology',
    result: '3× ARR Growth',
    duration: '10 months',
    goLive: 'Q4 2025',
    challenge: 'Sales-led motion plateauing at $18M ARR with CAC spiraling 40% above LTV/3 threshold.',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80',
    content: `
      <h2>The Challenge</h2>
      <p>A B2B SaaS platform had stalled at <strong>$18M ARR</strong> with a pure sales-led model.
      CAC had escalated to 40% above the LTV/3 sustainability threshold; free-trial-to-paid conversion
      was 3.2% vs. a 12% peer benchmark; churn was 18% net ARR, masking gross adds.</p>

      <h2>Our Approach</h2>
      <ul>
        <li><strong>PLG Diagnostic (6 weeks):</strong> Product analytics audit (Amplitude), activation funnel mapping, jobs-to-be-done interviews with 80 churned and retained accounts.</li>
        <li><strong>Time-to-Value Redesign (4 months):</strong> Onboarding redesign cutting first-value moment from day 7 to day 1; in-app guided flows; contextual feature discovery.</li>
        <li><strong>Expansion Revenue Engine (4 months):</strong> Usage-based pricing layer; in-product upgrade triggers tied to limit proximity; team-viral loops for seat expansion.</li>
      </ul>

      <h2>Results</h2>
      <ul>
        <li>Free-trial conversion: 3.2% → <strong>14.8%</strong> (+364%).</li>
        <li>Net ARR churn: 18% → <strong>−4%</strong> (net expansion territory).</li>
        <li>ARR grew from $18M to <strong>$54M</strong> within 10 months of rollout (3× growth).</li>
        <li>CAC payback period reduced from 28 months → 11 months.</li>
      </ul>
    `,
  },
];

/** Exported for sitemap + other SSR tooling to avoid re-declaring slugs. */
export const CASE_STUDY_SLUGS = CASE_STUDIES.map((c) => c.slug);
