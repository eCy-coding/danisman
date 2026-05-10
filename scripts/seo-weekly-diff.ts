#!/usr/bin/env tsx
/**
 * P31-T06: SEO Weekly Performance Diff
 *
 * Compares two Google Search Console CSV exports (baseline vs current week)
 * and prints a delta report: clicks, impressions, CTR, position.
 *
 * GSC CSV format (default export):
 *   Top Queries:  Query, Clicks, Impressions, CTR, Position
 *   Top Pages:    Page, Clicks, Impressions, CTR, Position
 *
 * Usage:
 *   npx tsx scripts/seo-weekly-diff.ts                          # auto-detect latest 2 files
 *   npx tsx scripts/seo-weekly-diff.ts --base brain/seo/baseline_2026-05-05.csv --curr brain/seo/week_2026-05-12.csv
 *   npx tsx scripts/seo-weekly-diff.ts --save brain/seo/diff_2026-05-12.json
 *
 * Exit: 0 = success | 1 = file not found or parse error
 */

import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'fs';
import { join, basename, dirname } from 'path';

const ROOT = join(dirname(new URL(import.meta.url).pathname), '..');
const SEO_DIR = join(ROOT, 'brain', 'seo');

interface RowMetrics {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

type MetricsMap = Map<string, RowMetrics>;

function parseCSV(path: string): MetricsMap {
  const raw = readFileSync(path, 'utf-8');
  const lines = raw.trim().split('\n');

  if (lines.length < 2) {
    throw new Error(`CSV too short (${lines.length} lines): ${path}`);
  }

  const headerRaw = lines[0]?.replace(/^\uFEFF/, '');
  const headers =
    headerRaw?.split(',').map((h) =>
      h
        .trim()
        .toLowerCase()
        .replace(/[^a-z]/g, ''),
    ) ?? [];
  const keyIdx = 0;
  const clicksIdx = headers.indexOf('clicks');
  const impressionsIdx = headers.indexOf('impressions');
  const ctrIdx = headers.indexOf('ctr');
  const positionIdx = headers.indexOf('position');

  if (clicksIdx === -1 || impressionsIdx === -1) {
    throw new Error(
      `Missing required columns (clicks/impressions) in: ${path}\nHeaders: ${headers.join(', ')}`,
    );
  }

  const map: MetricsMap = new Map();

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i]?.split(',') ?? [];
    const key = cols[keyIdx]?.trim().replace(/^"|"$/g, '');
    if (!key) continue;

    const parseNum = (idx: number): number => {
      if (idx === -1) return 0;
      const raw = cols[idx]?.trim().replace(/%/g, '') ?? '0';
      return parseFloat(raw) || 0;
    };

    map.set(key, {
      clicks: parseNum(clicksIdx),
      impressions: parseNum(impressionsIdx),
      ctr: parseNum(ctrIdx),
      position: parseNum(positionIdx),
    });
  }

  return map;
}

function delta(base: number, curr: number): string {
  if (base === 0) return curr > 0 ? '+∞%' : '0%';
  const pct = ((curr - base) / base) * 100;
  const sign = pct >= 0 ? '+' : '';
  return `${sign}${pct.toFixed(1)}%`;
}

function aggregateMetrics(map: MetricsMap): RowMetrics {
  let clicks = 0,
    impressions = 0,
    ctrSum = 0,
    posSum = 0;
  let count = 0;
  for (const v of map.values()) {
    clicks += v.clicks;
    impressions += v.impressions;
    ctrSum += v.ctr;
    posSum += v.position;
    count++;
  }
  return {
    clicks,
    impressions,
    ctr: count > 0 ? ctrSum / count : 0,
    position: count > 0 ? posSum / count : 0,
  };
}

function findLatestTwoCSVs(): [string, string] {
  try {
    const files = readdirSync(SEO_DIR)
      .filter((f) => f.endsWith('.csv'))
      .map((f) => ({ name: f, path: join(SEO_DIR, f) }))
      .sort((a, b) => a.name.localeCompare(b.name));

    if (files.length < 2) {
      throw new Error(`Need ≥2 CSV files in ${SEO_DIR}, found ${files.length}`);
    }

    const slice = files.slice(-2) as unknown as [{ path: string }, { path: string }];
    const [prev, curr] = slice;
    return [prev.path, curr.path];
  } catch (err) {
    throw new Error(`Could not auto-detect CSV files: ${(err as Error).message}`);
  }
}

function run(): void {
  const args = process.argv.slice(2);
  const getArg = (flag: string): string | undefined => {
    const idx = args.indexOf(flag);
    return idx !== -1 ? args[idx + 1] : undefined;
  };

  let basePath = getArg('--base');
  let currPath = getArg('--curr');
  const savePath = getArg('--save');

  if (!basePath || !currPath) {
    [basePath, currPath] = findLatestTwoCSVs();
    console.log(`Auto-detected: ${basename(basePath)} → ${basename(currPath)}\n`);
  }

  let base: MetricsMap, curr: MetricsMap;
  try {
    base = parseCSV(basePath);
    curr = parseCSV(currPath);
  } catch (err) {
    console.error(`Parse error: ${(err as Error).message}`);
    process.exit(1);
  }

  const baseAgg = aggregateMetrics(base);
  const currAgg = aggregateMetrics(curr);

  const report = {
    basePeriod: basename(basePath),
    currPeriod: basename(currPath),
    generated: new Date().toISOString(),
    summary: {
      clicks: {
        base: baseAgg.clicks,
        curr: currAgg.clicks,
        delta: delta(baseAgg.clicks, currAgg.clicks),
      },
      impressions: {
        base: baseAgg.impressions,
        curr: currAgg.impressions,
        delta: delta(baseAgg.impressions, currAgg.impressions),
      },
      avgCTR: {
        base: `${baseAgg.ctr.toFixed(2)}%`,
        curr: `${currAgg.ctr.toFixed(2)}%`,
        delta: delta(baseAgg.ctr, currAgg.ctr),
      },
      avgPosition: {
        base: baseAgg.position.toFixed(1),
        curr: currAgg.position.toFixed(1),
        delta: delta(baseAgg.position, currAgg.position),
      },
    },
    topMovers: {
      gainers: [] as Array<{ key: string; metric: string; delta: string }>,
      losers: [] as Array<{ key: string; metric: string; delta: string }>,
    },
    newEntries: [] as string[],
    disappeared: [] as string[],
  };

  const allKeys = new Set([...base.keys(), ...curr.keys()]);
  const movers: Array<{ key: string; pct: number }> = [];

  for (const key of allKeys) {
    const b = base.get(key);
    const c = curr.get(key);
    if (!b) {
      report.newEntries.push(key);
      continue;
    }
    if (!c) {
      report.disappeared.push(key);
      continue;
    }
    if (b.impressions > 0) {
      movers.push({ key, pct: ((c.impressions - b.impressions) / b.impressions) * 100 });
    }
  }

  movers.sort((a, b) => b.pct - a.pct);
  report.topMovers.gainers = movers.slice(0, 5).map((m) => ({
    key: m.key,
    metric: 'impressions',
    delta: delta(base.get(m.key)!.impressions, curr.get(m.key)!.impressions),
  }));
  report.topMovers.losers = movers
    .slice(-5)
    .reverse()
    .map((m) => ({
      key: m.key,
      metric: 'impressions',
      delta: delta(base.get(m.key)!.impressions, curr.get(m.key)!.impressions),
    }));

  console.log(`\n${'─'.repeat(50)}`);
  console.log(`  SEO Weekly Diff: ${basename(basePath)} → ${basename(currPath)}`);
  console.log(`${'─'.repeat(50)}`);
  console.log(
    `  Clicks:       ${baseAgg.clicks} → ${currAgg.clicks}   (${report.summary.clicks.delta})`,
  );
  console.log(
    `  Impressions:  ${baseAgg.impressions} → ${currAgg.impressions}   (${report.summary.impressions.delta})`,
  );
  console.log(
    `  Avg CTR:      ${report.summary.avgCTR.base} → ${report.summary.avgCTR.curr}   (${report.summary.avgCTR.delta})`,
  );
  console.log(
    `  Avg Position: ${report.summary.avgPosition.base} → ${report.summary.avgPosition.curr}   (${report.summary.avgPosition.delta})`,
  );
  console.log(
    `  New queries:  ${report.newEntries.length}   Disappeared: ${report.disappeared.length}`,
  );
  console.log(`${'─'.repeat(50)}\n`);

  if (report.topMovers.gainers.length > 0) {
    console.log('  Top Gainers (impressions):');
    for (const g of report.topMovers.gainers) {
      console.log(`    ${g.delta.padEnd(10)} ${g.key}`);
    }
    console.log();
  }

  if (savePath) {
    mkdirSync(dirname(savePath), { recursive: true });
    writeFileSync(savePath, JSON.stringify(report, null, 2));
    console.log(`  Report saved: ${savePath}\n`);
  }
}

run();
