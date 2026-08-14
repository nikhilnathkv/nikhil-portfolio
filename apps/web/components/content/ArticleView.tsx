import { MarkdownPreview } from '@/components/cms/MarkdownPreview';
import type { BlogPost } from '@/lib/admin/blog-types';

/** Shared blog article renderer — used by the admin preview and the public page. */
export function ArticleView({ post }: { post: BlogPost }) {
  return (
    <article className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <header className="flex flex-col gap-3">
        {post.category ? (
          <p className="font-mono text-xs uppercase tracking-widest text-foreground/50">
            {post.category}
          </p>
        ) : null}
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{post.title}</h1>
        {post.published_at ? (
          <p className="text-sm text-foreground/50">
            {new Date(post.published_at).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        ) : null}
        {post.excerpt ? <p className="text-lg text-foreground/70">{post.excerpt}</p> : null}
      </header>

      <MarkdownPreview content={post.content} />

      {post.tags.length > 0 ? (
        <footer className="flex flex-wrap gap-2 border-t border-foreground/10 pt-4">
          {post.tags.map((t) => (
            <span
              key={t.id}
              className="rounded-full border border-foreground/15 px-3 py-1 text-sm text-foreground/70"
            >
              {t.name}
            </span>
          ))}
        </footer>
      ) : null}
    </article>
  );
}
