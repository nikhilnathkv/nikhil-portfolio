import type { Metadata } from 'next';
import Link from 'next/link';

import { ArticleCard, Container, Section, SectionHeading } from '@/components/public';
import { cn } from '@/components/public/cn';
import { BLOG_CATEGORIES } from '@/lib/admin/blog';
import { listPosts } from '@/services/blog';

export const metadata: Metadata = {
  title: 'Writing',
  description:
    'Technical articles and engineering deep-dives on GenAI, agentic AI, ML and AI engineering — written from experience, not tutorials.',
  alternates: { canonical: '/writing' },
  openGraph: {
    title: 'Writing · Nikhil Nath',
    description: 'Technical articles on GenAI, agentic AI, ML and AI engineering.',
    url: '/writing',
  },
};

export default async function WritingIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const posts = await listPosts();

  const present = new Set(posts.map((p) => p.category).filter(Boolean) as string[]);
  const categories = BLOG_CATEGORIES.filter((c) => present.has(c));
  const active = category && present.has(category) ? category : null;
  const shown = active ? posts.filter((p) => p.category === active) : posts;

  return (
    <>
      <Section className="pt-16 sm:pt-20">
        <Container>
          <SectionHeading
            as="h1"
            eyebrow="Writing"
            title="Articles & deep-dives"
            intro="Engineering notes on GenAI, agentic AI, ML and AI engineering — grounded in what I've actually built and measured."
          />
          {categories.length > 0 ? (
            <nav aria-label="Filter writing by category" className="mt-10 flex flex-wrap gap-2">
              <Chip href="/writing" label="All" active={!active} />
              {categories.map((c) => (
                <Chip
                  key={c}
                  href={`/writing?category=${encodeURIComponent(c)}`}
                  label={c}
                  active={active === c}
                />
              ))}
            </nav>
          ) : null}
        </Container>
      </Section>

      <Container className="pb-24">
        {shown.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {shown.map((p) => (
              <ArticleCard
                key={p.id}
                slug={p.slug}
                title={p.title}
                excerpt={p.excerpt}
                category={p.category}
                publishedAt={p.published_at}
                tags={p.tags.map((t) => t.name)}
              />
            ))}
          </div>
        ) : (
          <p className="max-w-xl text-lg leading-relaxed text-pub-muted">
            I&apos;m currently exploring this area. New writing will appear here soon.
          </p>
        )}
      </Container>
    </>
  );
}

function Chip({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors [transition-duration:var(--pub-duration)]',
        active
          ? 'border-pub-accent bg-pub-accent-soft text-pub-fg'
          : 'border-pub-border text-pub-muted hover:border-pub-border-strong hover:text-pub-fg',
      )}
    >
      {label}
    </Link>
  );
}
