import { ButtonLink, Container, Eyebrow } from '@/components/public';

/**
 * Homepage hero — the single most important component. Confident, specific
 * positioning (no "passionate enthusiast" filler), two CTAs, and a compact
 * technical signal row. Copy is temporary and will get a dedicated pass.
 */
export function Hero({
  name,
  role,
  positioning,
  techSignal,
}: {
  name: string;
  role: string;
  positioning: string;
  techSignal: string[];
}) {
  return (
    <section className="pt-20 sm:pt-28">
      <Container>
        <div className="pub-reveal flex max-w-3xl flex-col gap-6">
          <Eyebrow>{role}</Eyebrow>
          <h1 className="text-5xl font-semibold tracking-tight text-pub-fg text-balance sm:text-6xl">
            {name}
          </h1>
          <p className="max-w-2xl text-pretty text-xl leading-relaxed text-pub-muted">
            {positioning}
          </p>
          <div className="mt-2 flex flex-wrap gap-3">
            <ButtonLink href="/projects">Explore my work</ButtonLink>
            <ButtonLink href="/resume" variant="secondary">
              View resume
            </ButtonLink>
          </div>
        </div>

        {techSignal.length > 0 ? (
          <ul
            className="pub-reveal mt-12 flex flex-wrap gap-x-3 gap-y-2 font-mono text-xs uppercase tracking-[0.18em] text-pub-subtle"
            style={{ animationDelay: '120ms' }}
            aria-label="Focus technologies"
          >
            {techSignal.map((t, i) => (
              <li key={t} className="flex items-center gap-3">
                {i > 0 ? <span aria-hidden>·</span> : null}
                {t}
              </li>
            ))}
          </ul>
        ) : null}
      </Container>
    </section>
  );
}
