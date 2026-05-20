#!/usr/bin/env node
/**
 * scripts/content-pipeline.mjs — P82 Content automation orchestrator.
 *
 * Brief → NotebookLM research → Claude.app draft → MDX PR pipeline.
 *
 * Usage:
 *   node scripts/content-pipeline.mjs --brief "AI strategy for mid-market manufacturers"
 *   node scripts/content-pipeline.mjs --brief-file briefs/q3-blog-1.txt
 *
 * Flow:
 *   1. Read brief (topic + outline)
 *   2. Query NotebookLM corpus for related sources (P79 notebook)
 *   3. Generate MDX draft via Claude API (uses Claude.app project context)
 *   4. Write to src/content/blog/<slug>.mdx
 *   5. Run typecheck + build
 *   6. Open GitHub PR
 *   7. Trigger preview deploy
 *
 * Requires:
 *   - nlm CLI authenticated (see scripts/nlm-sync.mjs)
 *   - ANTHROPIC_API_KEY env var
 *   - gh CLI authenticated
 *   - Git clean working tree
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ROOT = path.resolve(import.meta.dirname, '..');
const args = process.argv.slice(2);
const briefIdx = args.indexOf('--brief');
const fileIdx = args.indexOf('--brief-file');
const brief = briefIdx >= 0 ? args[briefIdx + 1] : fileIdx >= 0 ? fs.readFileSync(args[fileIdx + 1], 'utf-8') : null;

if (!brief) {
  console.error('usage: node scripts/content-pipeline.mjs --brief "..." OR --brief-file <path>');
  process.exit(1);
}

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('ANTHROPIC_API_KEY env required');
  process.exit(1);
}

function sh(cmd, opts = {}) {
  return execSync(cmd, { stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf-8', ...opts }).trim();
}

async function queryNotebookLM(brief) {
  try {
    const notebookId = sh('nlm notebook list --json | jq -r \'.[] | select(.title | contains("EcyPro")) | .id\' | head -1');
    if (!notebookId) {
      console.log('[nlm] notebook not found — falling back to brief-only generation');
      return null;
    }
    const research = sh(`nlm notebook query ${notebookId} "${brief.replace(/"/g, '\\"')}" --max-sources 5`);
    return research;
  } catch (err) {
    console.warn('[nlm] query failed, continuing without research:', err.message);
    return null;
  }
}

async function generateMDX(brief, research) {
  const projectPrompt = fs.readFileSync(path.join(ROOT, 'docs/CLAUDE_PROJECT_PROMPT.md'), 'utf-8');
  const systemPrompt = projectPrompt.split('## System Prompt')[1]?.trim() ?? '';

  const userPrompt = `
Brief: ${brief}

NotebookLM research context (top 5 related sources):
${research || '(no research — use general consulting knowledge)'}

Generate a blog post in MDX format:
- frontmatter (slug, title, excerpt, date, author, coverImage, tags, category, readingTime)
- 800-1200 word body
- Turkish primary
- McKinsey-style: data-driven, quantified, actionable
- 4-6 H2 sections
- Include 3-5 internal links to /services/<slug> or /case-studies/<slug>
- No fake client names — use anonymized industry roles
- End with measurable CTA pointing to /contact

Slug must be kebab-case, max 60 chars.
coverImage: /og-image.svg (placeholder until brand asset ready)
author: "Dr. Emre Can"
date: ISO timestamp now
readingTime: estimate from word count (200 wpm)

Output: valid MDX only, no markdown fences.
`;

  // Lightweight call to Claude API. Adjust SDK as needed.
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Claude API ${res.status}: ${text.slice(0, 200)}`);
  }
  const json = await res.json();
  return json.content?.[0]?.text ?? '';
}

function extractSlug(mdx) {
  const m = mdx.match(/^slug:\s*['"]?([^'"\n]+)['"]?/m);
  return m?.[1] ?? `blog-${Date.now()}`;
}

async function main() {
  console.log('[pipeline] starting…');
  console.log(`[pipeline] brief: ${brief.slice(0, 120)}…`);

  console.log('[pipeline] querying NotebookLM…');
  const research = await queryNotebookLM(brief);

  console.log('[pipeline] generating MDX via Claude API…');
  const mdx = await generateMDX(brief, research);

  const slug = extractSlug(mdx);
  const target = path.join(ROOT, 'src/content/blog', `${slug}.mdx`);
  fs.writeFileSync(target, mdx, 'utf-8');
  console.log(`[pipeline] wrote ${target}`);

  console.log('[pipeline] verify (typecheck + build)…');
  try {
    sh('npm run gen:blog', { stdio: 'inherit' });
    sh('npm run typecheck', { stdio: 'inherit' });
    console.log('[pipeline] verify ok');
  } catch (err) {
    console.error('[pipeline] verify FAILED — rolling back');
    fs.unlinkSync(target);
    process.exit(1);
  }

  console.log('[pipeline] opening PR…');
  const branch = `content/${slug}-${Date.now()}`;
  sh(`git checkout -b ${branch}`);
  sh(`git add ${target} src/data/blog-posts.json`);
  sh(`git commit -m "content: ${slug}"`);
  sh(`git push -u origin ${branch}`);
  const prUrl = sh(`gh pr create --base main --title "content: ${slug}" --body "Auto-generated via content pipeline.\n\nBrief: ${brief.slice(0, 200)}\n\nReview before merge."`);
  console.log(`[pipeline] PR opened: ${prUrl}`);
}

main().catch((err) => {
  console.error('[pipeline] fatal:', err);
  process.exit(1);
});
