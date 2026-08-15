import { MarkdownPreview } from '@/components/cms/MarkdownPreview';
import { Container, Eyebrow, TagList } from '@/components/public';
import { PublicImage } from '@/components/public/PublicImage';
import type { BlogPost } from '@/lib/admin/blog-types';
import { readingTimeMinutes } from '@/lib/format';

import { ContentMeta } from './reading';

/** Public article renderer (writing) — shared by the admin preview and page. */
export function ArticleView({ post }: { post: BlogPost }) {
  return (
    <article className="pb-16 pt-12 sm:pt-16">
      <Container>
        <header className="mx-auto flex max-w-[70ch] flex-col gap-4 pub-reveal">
          {post.category ? <Eyebrow>{post.category}</Eyebrow> : null}
          <h1 className="text-4xl font-semibold tracking-tight text-pub-fg text-balance sm:text-5xl">
            {post.title}
          </h1>
          {post.excerpt ? (
            <p className="text-pretty text-xl leading-relaxed text-pub-muted">{post.excerpt}</p>
          ) : null}
          <ContentMeta
            publishedAt={post.published_at}
            updatedAt={post.updated_at}
            readingMinutes={readingTimeMinutes(post.content)}
          />
        </header>

        {post.cover_image?.url ? (
          <div className="mx-auto mt-10 max-w-4xl">
            <PublicImage
              src={post.cover_image.url}
              alt={post.cover_image.alt_text ?? post.title}
              aspect="wide"
              priority
              sizes="(max-width: 1024px) 100vw, 896px"
            />
          </div>
        ) : null}

        <div className="mx-auto mt-10 max-w-[70ch]">
          <MarkdownPreview content={post.content} />
          {post.tags.length > 0 ? (
            <div className="mt-10 border-t border-pub-border pt-6">
              <TagList tags={post.tags.map((t) => t.name)} />
            </div>
          ) : null}
        </div>
      </Container>
    </article>
  );
}
