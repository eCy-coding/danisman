/**
 * Strips the leading YAML frontmatter block from MDX source.
 *
 * Why this exists: `@mdx-js/rollup` is configured without a frontmatter remark
 * plugin, so MDX has no idea `---\ntitle: '…'\n---` is metadata. It parsed the
 * fences as thematic breaks and the keys as a paragraph, which meant every
 * article page rendered its own `title: '…' excerpt: '…' pair_id: '…'` block as
 * visible body copy — bad for readers and worse for search engines, which saw
 * that noise as the article's opening text.
 *
 * The frontmatter is still the source of truth for the build-time index
 * (`scripts/generate-blog-index.ts` reads the raw file), so removing it from the
 * *runtime* module loses nothing.
 */

/** Matches only a frontmatter block at the very start of the file. */
export function stripMdxFrontmatter(source: string): { code: string; stripped: boolean } {
  if (!source.startsWith('---')) return { code: source, stripped: false };

  // Closing fence must be a `---` on its own line.
  const closing = source.indexOf('\n---', 3);
  if (closing === -1) return { code: source, stripped: false };

  const afterFence = source.indexOf('\n', closing + 1);
  const bodyStart = afterFence === -1 ? source.length : afterFence + 1;

  // Preserve the line count so stack traces and sourcemaps still point at the
  // right line in the original .mdx file.
  const removedLines = source.slice(0, bodyStart).split('\n').length - 1;
  return { code: '\n'.repeat(removedLines) + source.slice(bodyStart), stripped: true };
}
