// Wave-3A/3B stub declarations for optional heavy deps.
// Install the packages (npm install shiki katex mermaid yet-another-react-lightbox)
// and these stubs will be superseded by the actual package types.
declare module 'shiki' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const createHighlighter: (...args: any[]) => Promise<any>;
}
declare module 'katex' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const katex: Record<string, any>;
  export default katex;
}
declare module 'mermaid' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mermaid: Record<string, any>;
  export default mermaid;
}
declare module 'yet-another-react-lightbox' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Lightbox: React.ComponentType<any>;
  export default Lightbox;
}
