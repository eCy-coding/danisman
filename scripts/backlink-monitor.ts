#!/usr/bin/env npx tsx
/**
 * P38-T10: Backlink Monitor — Weekly Delta Report
 *
 * Reads Ahrefs Webmaster Tools (AWT) CSV export and produces:
 *   1. Summary: total referring domains, new, lost
 *   2. Quality metrics: DR distribution, dofollow %, anchor diversity
 *   3. Delta report: new vs last week (diff)
 *   4. Alert: if referring domains dropped >10% → warning
 *
 * Input: CSV file downloaded from AWT
 *   (Ahrefs → Backlinks → Export → "One backlink per domain")
 *   Format: Referring domain, DR, Type, Anchors, First seen, Last seen
 *
 * Output:
 *   - brain/seo/backlinks-{date}.json
 *   - brain/seo/backlinks-{date}.md
 *   - brain/seo/backlinks-latest.json (overwritten each run for diff)
 *
 * Usage:
 *   AWT_CSV=path/to/ahrefs-export.csv npm run backlinks:monitor
 *
 *   Without CSV (demo mode with mock data):
 *   npm run backlinks:monitor
 *
 * Schedule: Run weekly (Friday), commit report to brain/seo/
 */

import fs from 'fs';
import path from 'path';

const CSV_PATH = process.env.AWT_CSV;
const BRAIN_SEO = path.join(process.cwd(), 'brain', 'seo');
const LATEST_PATH = path.join(BRAIN_SEO, 'backlinks-latest.json');

// ─── Types ───────────────────────────────────────────────────

interface BacklinkRow {
  refDomain: string;
  dr: number; // Domain Rating 0-100
  type: 'dofollow' | 'nofollow' | 'ugc' | 'sponsored' | 'redirect';
  anchor: string;
  firstSeen: string; // ISO-8601
  lastSeen: string;
}

interface WeeklySnapshot {
  generatedAt: string;
  totalRefDomains: number;
  dofollowCount: number;
  dofollowPct: number;
  drDistribution: { bucket: string; count: number }[];
  topAnchors: { anchor: string; count: number }[];
  rows: BacklinkRow[];
}

interface DeltaReport {
  newDomains: BacklinkRow[];
  lostDomains: BacklinkRow[];
  netChange: number;
  alert: boolean;
  alertReason?: string;
}

// ─── CSV Parser ──────────────────────────────────────────────

function parseAwtCsv(csvContent: string): BacklinkRow[] {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) return [];

  // Skip header
  return lines
    .slice(1)
    .map((line) => {
      const cols = line.split(',').map((c) => c.replace(/^"|"$/g, '').trim());
      return {
        refDomain: cols[0] ?? '',
        dr: parseInt(cols[1] ?? '0', 10) || 0,
        type: (cols[2] as BacklinkRow['type']) ?? 'dofollow',
        anchor: cols[3] ?? '',
        firstSeen: cols[4] ?? '',
        lastSeen: cols[5] ?? '',
      };
    })
    .filter((r) => r.refDomain !== '');
}

// ─── Mock data (when no CSV provided) ────────────────────────

function generateMockRows(): BacklinkRow[] {
  return [
    {
      refDomain: 'linkedin.com',
      dr: 98,
      type: 'dofollow',
      anchor: 'eCyPro',
      firstSeen: '2026-04-01',
      lastSeen: '2026-05-01',
    },
    {
      refDomain: 'clutch.co',
      dr: 72,
      type: 'dofollow',
      anchor: 'eCyPro Consulting',
      firstSeen: '2026-04-10',
      lastSeen: '2026-05-01',
    },
    {
      refDomain: 'goodfirms.co',
      dr: 64,
      type: 'dofollow',
      anchor: 'ecypro.com',
      firstSeen: '2026-04-15',
      lastSeen: '2026-05-01',
    },
    {
      refDomain: 'webrazzi.com',
      dr: 48,
      type: 'dofollow',
      anchor: 'stratejik danışmanlık',
      firstSeen: '2026-04-20',
      lastSeen: '2026-05-01',
    },
    {
      refDomain: 'crunchbase.com',
      dr: 90,
      type: 'dofollow',
      anchor: 'eCyPro',
      firstSeen: '2026-04-22',
      lastSeen: '2026-05-01',
    },
    {
      refDomain: 'capital.com.tr',
      dr: 42,
      type: 'dofollow',
      anchor: 'danışmanlık',
      firstSeen: '2026-04-25',
      lastSeen: '2026-05-01',
    },
    {
      refDomain: 'twitter.com',
      dr: 96,
      type: 'nofollow',
      anchor: 'ecypro.com',
      firstSeen: '2026-04-01',
      lastSeen: '2026-05-01',
    },
    {
      refDomain: 'facebook.com',
      dr: 99,
      type: 'nofollow',
      anchor: 'eCyPro',
      firstSeen: '2026-04-05',
      lastSeen: '2026-05-01',
    },
    {
      refDomain: 'producthunt.com',
      dr: 88,
      type: 'dofollow',
      anchor: 'eCyPro Premium',
      firstSeen: '2026-05-01',
      lastSeen: '2026-05-01',
    },
    {
      refDomain: 'indiehackers.com',
      dr: 72,
      type: 'dofollow',
      anchor: 'eCyPro Consulting',
      firstSeen: '2026-05-01',
      lastSeen: '2026-05-01',
    },
  ];
}

// ─── Analytics ───────────────────────────────────────────────

function computeSnapshot(rows: BacklinkRow[]): WeeklySnapshot {
  const dofollow = rows.filter((r) => r.type === 'dofollow');

  // DR distribution buckets
  const drBuckets = [
    { bucket: 'DR 0-10', count: rows.filter((r) => r.dr <= 10).length },
    { bucket: 'DR 11-30', count: rows.filter((r) => r.dr > 10 && r.dr <= 30).length },
    { bucket: 'DR 31-50', count: rows.filter((r) => r.dr > 30 && r.dr <= 50).length },
    { bucket: 'DR 51-70', count: rows.filter((r) => r.dr > 50 && r.dr <= 70).length },
    { bucket: 'DR 71-90', count: rows.filter((r) => r.dr > 70 && r.dr <= 90).length },
    { bucket: 'DR 91+', count: rows.filter((r) => r.dr > 90).length },
  ].filter((b) => b.count > 0);

  // Anchor text frequency
  const anchorFreq: Record<string, number> = {};
  rows.forEach((r) => {
    const anchor = r.anchor.toLowerCase().trim() || '(no anchor)';
    anchorFreq[anchor] = (anchorFreq[anchor] ?? 0) + 1;
  });
  const topAnchors = Object.entries(anchorFreq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([anchor, count]) => ({ anchor, count }));

  return {
    generatedAt: new Date().toISOString(),
    totalRefDomains: rows.length,
    dofollowCount: dofollow.length,
    dofollowPct: rows.length > 0 ? Math.round((dofollow.length / rows.length) * 100) : 0,
    drDistribution: drBuckets,
    topAnchors,
    rows,
  };
}

function computeDelta(current: WeeklySnapshot, previous: WeeklySnapshot | null): DeltaReport {
  if (!previous) {
    return {
      newDomains: current.rows,
      lostDomains: [],
      netChange: current.totalRefDomains,
      alert: false,
    };
  }

  const prevDomainSet = new Set(previous.rows.map((r) => r.refDomain));
  const currDomainSet = new Set(current.rows.map((r) => r.refDomain));

  const newDomains = current.rows.filter((r) => !prevDomainSet.has(r.refDomain));
  const lostDomains = previous.rows.filter((r) => !currDomainSet.has(r.refDomain));
  const netChange = newDomains.length - lostDomains.length;

  // Alert: lost more than 10% of domains
  const lostPct =
    previous.totalRefDomains > 0 ? (lostDomains.length / previous.totalRefDomains) * 100 : 0;

  const alert = lostPct > 10;
  const alertReason = alert
    ? `Lost ${lostDomains.length} referring domains (${lostPct.toFixed(1)}% of previous total). Investigate and consider outreach.`
    : undefined;

  return { newDomains, lostDomains, netChange, alert, alertReason };
}

// ─── Report output ────────────────────────────────────────────

function writeReports(snapshot: WeeklySnapshot, delta: DeltaReport): void {
  const dateStr = new Date().toISOString().slice(0, 10);
  fs.mkdirSync(BRAIN_SEO, { recursive: true });

  // JSON
  const jsonReport = { snapshot, delta };
  fs.writeFileSync(
    path.join(BRAIN_SEO, `backlinks-${dateStr}.json`),
    JSON.stringify(jsonReport, null, 2),
  );
  fs.writeFileSync(LATEST_PATH, JSON.stringify(snapshot, null, 2));

  // Markdown
  const avgDr =
    snapshot.rows.length > 0
      ? Math.round(snapshot.rows.reduce((sum, r) => sum + r.dr, 0) / snapshot.rows.length)
      : 0;

  const md = `# Backlink Monitor Report — ${dateStr}

## Summary

| Metric | Value |
|--------|-------|
| Referring Domains | **${snapshot.totalRefDomains}** |
| Dofollow | ${snapshot.dofollowCount} (${snapshot.dofollowPct}%) |
| Average DR | ${avgDr} |
| New this week | +${delta.newDomains.length} |
| Lost this week | -${delta.lostDomains.length} |
| Net Change | ${delta.netChange >= 0 ? '+' : ''}${delta.netChange} |

${delta.alert ? `## ⚠️ ALERT\n\n${delta.alertReason}\n` : '## ✅ No alerts'}

## DR Distribution

${snapshot.drDistribution.map((b) => `- **${b.bucket}**: ${b.count} domains`).join('\n')}

## Top Anchor Texts

${snapshot.topAnchors
  .slice(0, 5)
  .map((a) => `- "${a.anchor}": ${a.count}×`)
  .join('\n')}

${
  delta.newDomains.length > 0
    ? `## 🆕 New Referring Domains (${delta.newDomains.length})

${delta.newDomains.map((r) => `- **${r.refDomain}** (DR ${r.dr}, ${r.type}) — "${r.anchor}"`).join('\n')}
`
    : ''
}
${
  delta.lostDomains.length > 0
    ? `## 📉 Lost Referring Domains (${delta.lostDomains.length})

${delta.lostDomains.map((r) => `- ~~${r.refDomain}~~ (DR ${r.dr}) — consider recovery outreach`).join('\n')}
`
    : ''
}
---
*Generated by eCyPro Backlink Monitor · ${new Date().toISOString()}*
`;

  fs.writeFileSync(path.join(BRAIN_SEO, `backlinks-${dateStr}.md`), md);
  console.log(
    `\n📊 Reports saved:\n  brain/seo/backlinks-${dateStr}.json\n  brain/seo/backlinks-${dateStr}.md\n  brain/seo/backlinks-latest.json (snapshot)`,
  );
}

// ─── Main ────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('📊 eCyPro Backlink Monitor');

  // Load rows from CSV or mock
  let rows: BacklinkRow[];
  if (CSV_PATH && fs.existsSync(CSV_PATH)) {
    console.log(`   Reading CSV: ${CSV_PATH}`);
    rows = parseAwtCsv(fs.readFileSync(CSV_PATH, 'utf-8'));
  } else {
    console.log('   ⚠️  AWT_CSV not set — using demo data');
    console.log('   Download from: Ahrefs → Backlinks → Export (one row per referring domain)');
    rows = generateMockRows();
  }

  console.log(`   Rows: ${rows.length} referring domains`);

  // Load previous snapshot for delta
  let previous: WeeklySnapshot | null = null;
  if (fs.existsSync(LATEST_PATH)) {
    try {
      previous = JSON.parse(fs.readFileSync(LATEST_PATH, 'utf-8')) as WeeklySnapshot;
      console.log(
        `   Previous snapshot: ${previous.totalRefDomains} domains (${previous.generatedAt.slice(0, 10)})`,
      );
    } catch {
      console.warn('   Could not parse previous snapshot');
    }
  }

  // Compute
  const snapshot = computeSnapshot(rows);
  const delta = computeDelta(snapshot, previous);

  // Console summary
  console.log(`\n📈 Results:`);
  console.log(`   Total: ${snapshot.totalRefDomains} referring domains`);
  console.log(`   Dofollow: ${snapshot.dofollowCount} (${snapshot.dofollowPct}%)`);
  if (delta.newDomains.length > 0) console.log(`   🆕 New: +${delta.newDomains.length}`);
  if (delta.lostDomains.length > 0) console.log(`   📉 Lost: -${delta.lostDomains.length}`);
  if (delta.alert) console.log(`\n⚠️  ALERT: ${delta.alertReason}`);

  // Write reports
  writeReports(snapshot, delta);

  if (delta.alert) process.exit(1);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
