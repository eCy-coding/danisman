// PB-8: Lazy import stubs for heavy Perspektif deps.
// Wave-3A will provide the actual component modules (code-block, math-block, etc.)
// Wave-1/2 add the npm packages (shiki, katex, mermaid, yet-another-react-lightbox).
// These stubs document the async boundary contract; replace with real imports post-merge.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyModule = Record<string, any>;

export async function loadShiki(): Promise<AnyModule> {
  return import('shiki');
}

export async function loadKatex(): Promise<AnyModule> {
  return import('katex');
}

export async function loadMermaid(): Promise<AnyModule> {
  return import('mermaid');
}

export async function loadLightbox(): Promise<AnyModule> {
  return import('yet-another-react-lightbox');
}
