import { getApiHealth } from '@/services/health';

export default async function HomePage() {
  const health = await getApiHealth();
  const online = health?.status === 'ok';

  return (
    <main className="mx-auto flex min-h-full w-full max-w-3xl flex-1 flex-col justify-center gap-10 px-6 py-16">
      <header className="flex flex-col gap-3">
        <p className="font-mono text-sm uppercase tracking-widest text-foreground/50">
          Portfolio · v1
        </p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Nikhil Nath</h1>
        <p className="max-w-xl text-lg text-foreground/70">
          AI / ML engineer. This is the foundation build (M1) of a Next.js + FastAPI portfolio —
          projects, research, experiments, and writing coming next.
        </p>
      </header>

      <section
        aria-label="System status"
        className="flex items-center gap-3 rounded-lg border border-foreground/10 px-4 py-3 font-mono text-sm"
      >
        <span
          className={`inline-block h-2.5 w-2.5 rounded-full ${
            online ? 'bg-emerald-500' : 'bg-amber-500'
          }`}
          aria-hidden
        />
        <span>
          API:{' '}
          {online ? (
            <>
              online — {health?.service} v{health?.version}
            </>
          ) : (
            <>unreachable (start the API with `docker compose up`)</>
          )}
        </span>
      </section>
    </main>
  );
}
