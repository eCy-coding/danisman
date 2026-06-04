/**
 * P44-T07 Round-5 — Real Data Master Seed Orchestrator.
 *
 * Wraps the 6 domain-specific seed modules into a single, idempotent run:
 *   1. ESG ESRS catalogue (60+ datapoints)
 *   2. Fintech compliance items (1 client + 15 items, 5 regulators)
 *   3. Succession planning roadmap (1 client + 4 milestones + 3 KPIs)
 *   4. Outreach Wave-1 sales pipeline (1 wave + 5 prospects)
 *   5. Insights bootstrap (4 categories + 2 authors)
 *   6. Activity signal (12 contacts + 8 subscribers + 6 bookings + 3 NPS)
 *
 * Prerequisite: `scripts/seed.ts` must have been run first so the bootstrap
 * admin user (admin@ecypro.com) exists — Succession + Activity seeds need it.
 *
 * Run: via the `~/Documents/eCyPro-memory/run-seed-real-data.command` helper
 * (handles env loading + Mac open path) or `npx tsx scripts/seed-real-data.ts`.
 */
import 'dotenv/config';
import { seedEsgCatalog } from '../prisma/seed-esg-catalog';
import { seedFintechCompliance } from '../prisma/seed-fintech-compliance';
import { seedSuccession } from '../prisma/seed-succession';
import { seedOutreachWave1 } from '../prisma/seed-outreach-wave1';
import { seedInsightsBootstrap } from '../prisma/seed-insights-bootstrap';
import { seedActivity } from '../prisma/seed-activity';

async function main() {
  const t0 = Date.now();
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  eCyPro — P44-T07 Round-5 Real Data Seed Cascade');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  console.log('\n[1/6] ESRS catalogue (E/S/G pillars)…');
  const esg = await seedEsgCatalog();
  console.log(`      → ${esg.created} created, ${esg.updated} updated`);

  console.log('\n[2/6] Fintech compliance items (5 TR regulators)…');
  const fintech = await seedFintechCompliance();
  console.log(`      → ${fintech.created} items for client ${fintech.clientId}`);

  console.log('\n[3/6] Succession demo roadmap…');
  const succession = await seedSuccession();
  console.log(`      → roadmap ${succession.roadmapId}`);

  console.log('\n[4/6] Outreach Wave-1 prospect pipeline…');
  const wave = await seedOutreachWave1();
  console.log(
    `      → wave ${wave.waveId} · ${wave.prospects} prospects · ~$${wave.estimatedTotal.toLocaleString()}`,
  );

  console.log('\n[5/6] Insights bootstrap (categories + authors)…');
  const insights = await seedInsightsBootstrap();
  console.log(`      → ${insights.categories} categories, ${insights.authors} authors`);

  console.log('\n[6/6] Admin dashboard activity signal…');
  const activity = await seedActivity();
  console.log(
    `      → ${activity.contacts} contacts · ${activity.subscribers} subscribers · ${activity.bookings} bookings · ${activity.feedbacks} NPS`,
  );

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✔ All seed phases complete in ${elapsed}s.`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((err) => {
    console.error('\n✖ Seed cascade failed:', err);
    process.exit(1);
  })
  .finally(() => {
    // Each seed module owns its own PrismaClient — they each disconnect on
    // process exit via Node's default. Force-exit after a short grace so a
    // dangling Neon pool connection doesn't keep the script alive.
    setTimeout(() => process.exit(0), 500).unref();
  });
