import 'highlight.js/styles/github.css';
import 'katex/dist/katex.min.css';

import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';

import { CodeBlock } from './CodeBlock';

/**
 * The single Markdown renderer shared by the editor preview and the public/preview
 * pages. Raw HTML is intentionally NOT enabled (react-markdown escapes it), so
 * stored admin content cannot inject markup when rendered publicly. GFM adds
 * tables / task lists / strikethrough; rehype-highlight adds code syntax colors;
 * remark-math + rehype-katex render LaTeX ($inline$ and $$block$$); code blocks
 * get an accessible copy button (CodeBlock).
 */
export function MarkdownPreview({ content }: { content: string }) {
  return (
    <div className="prose-cms">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex, rehypeHighlight]}
        components={{ pre: CodeBlock }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
