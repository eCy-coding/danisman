import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Runtime markdown renderer for DB-backed published posts (the static MDX
// pipeline compiles at build time and cannot render database content).
// react-markdown emits a React tree — no HTML string, no XSS surface.
// h1 → h2 demote mirrors the MDX pipeline (single H1 per page, P46 C5).
// eslint-disable-next-line jsx-a11y/heading-has-content -- markdown runtime supplies children
const H2 = (props: React.ComponentPropsWithoutRef<'h2'>) => <h2 {...props} />;

interface Props {
  markdown: string;
}

const MarkdownArticle: React.FC<Props> = ({ markdown }) => (
  <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ h1: H2 }}>
    {markdown}
  </ReactMarkdown>
);

export default MarkdownArticle;
