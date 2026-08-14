import 'highlight.js/styles/github.css';

import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';

/**
 * The single Markdown renderer shared by the editor preview and the public/preview
 * pages. Raw HTML is intentionally NOT enabled (react-markdown escapes it), so
 * stored admin content cannot inject markup when rendered publicly. GFM adds
 * tables / task lists / strikethrough; rehype-highlight adds code syntax colors.
 */
export function MarkdownPreview({ content }: { content: string }) {
  return (
    <div className="prose-cms">
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
