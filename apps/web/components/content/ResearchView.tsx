import { Container, Eyebrow } from '@/components/public';
import type { Research } from '@/lib/admin/research-types';
import { readingTimeMinutes } from '@/lib/format';

import { ContentMeta, ContentSection, ExternalLinks, RelatedContent } from './reading';

/** Public research renderer — structured, investigation-style presentation. */
export function ResearchView({ research }: { research: Research }) {
  const minutes = readingTimeMinutes(
    research.abstract,
    research.research_question,
    research.methodology,
    research.dataset,
    research.experimental_setup,
    research.results,
    research.analysis,
    research.limitations,
    research.conclusion,
  );

  return (
    <article className="pb-16 pt-12 sm:pt-16">
      <Container>
        <div className="mx-auto max-w-[70ch]">
          <header className="flex flex-col gap-4 pub-reveal">
            <Eyebrow>Research</Eyebrow>
            <h1 className="text-4xl font-semibold tracking-tight text-pub-fg text-balance sm:text-5xl">
              {research.title}
            </h1>
            {research.abstract ? (
              <p className="text-pretty text-xl leading-relaxed text-pub-muted">
                {research.abstract}
              </p>
            ) : null}
            <ContentMeta
              publishedAt={research.published_at}
              updatedAt={research.updated_at}
              readingMinutes={minutes}
            />
            <ExternalLinks
              links={[
                { label: 'Paper', href: research.paper_url },
                { label: 'Publication', href: research.publication_url },
                { label: 'GitHub', href: research.github_url },
              ]}
            />
          </header>

          <div className="mt-10 flex flex-col gap-8">
            <ContentSection id="question" title="Research question" body={research.research_question} />
            <ContentSection id="methodology" title="Methodology" body={research.methodology} />
            <ContentSection id="dataset" title="Dataset" body={research.dataset} />
            <ContentSection id="setup" title="Experimental setup" body={research.experimental_setup} />
            <ContentSection id="results" title="Results" body={research.results} />
            <ContentSection id="analysis" title="Analysis" body={research.analysis} />
            <ContentSection id="limitations" title="Limitations" body={research.limitations} />
            <ContentSection id="conclusion" title="Conclusion" body={research.conclusion} />
            <ContentSection id="references" title="References" body={research.references} />
            <RelatedContent
              project={research.project}
              experiments={research.related_experiments}
            />
          </div>
        </div>
      </Container>
    </article>
  );
}
