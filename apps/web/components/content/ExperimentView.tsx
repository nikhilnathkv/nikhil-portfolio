import { Container, Eyebrow, MetricStat } from '@/components/public';
import type { Experiment } from '@/lib/admin/experiment-types';
import { readingTimeMinutes } from '@/lib/format';

import { ContentMeta, ContentSection, ExternalLinks, RelatedContent } from './reading';

/** Public experiment renderer — lower-friction, hypothesis-driven layout. */
export function ExperimentView({ experiment }: { experiment: Experiment }) {
  const minutes = readingTimeMinutes(
    experiment.hypothesis,
    experiment.setup,
    experiment.method,
    experiment.approach,
    experiment.results,
    experiment.learnings,
    experiment.conclusion,
  );

  return (
    <article className="pb-16 pt-12 sm:pt-16">
      <Container>
        <div className="mx-auto max-w-[70ch]">
          <header className="flex flex-col gap-4 pub-reveal">
            <Eyebrow>Experiment</Eyebrow>
            <h1 className="text-4xl font-semibold tracking-tight text-pub-fg text-balance sm:text-5xl">
              {experiment.title}
            </h1>
            <ContentMeta updatedAt={experiment.updated_at} readingMinutes={minutes} />
            <ExternalLinks links={[{ label: 'GitHub', href: experiment.github_url }]} />
          </header>

          {experiment.metrics.length > 0 ? (
            <div className="mt-8 grid grid-cols-2 gap-6 border-t border-pub-border pt-8 sm:grid-cols-3">
              {experiment.metrics.map((m) => (
                <MetricStat key={m.id ?? m.name} value={m.value} unit={m.unit} label={m.name} />
              ))}
            </div>
          ) : null}

          <div className="mt-8 flex flex-col gap-8">
            <ContentSection id="hypothesis" title="Hypothesis" body={experiment.hypothesis} />
            <ContentSection id="setup" title="Setup" body={experiment.setup ?? experiment.method} />
            <ContentSection id="approach" title="Approach" body={experiment.approach} />
            <ContentSection id="results" title="Results" body={experiment.results} />
            <ContentSection
              id="learnings"
              title="What I learned"
              body={experiment.learnings ?? experiment.conclusion}
            />
            <RelatedContent
              project={experiment.project}
              research={experiment.related_research}
            />
          </div>
        </div>
      </Container>
    </article>
  );
}
