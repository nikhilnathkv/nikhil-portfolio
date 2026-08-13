# ADR-001 — Frontend: Next.js

- **Status:** Accepted
- **Context:** The public site must rank well (SEO), render fast, and grow into
  interactive, possibly AI-driven, features.
- **Decision:** Use **Next.js** (App Router, TypeScript).
- **Rationale:** SSR/SSG for SEO and performance, dynamic routing for
  `/[slug]` content, the React ecosystem, and a clear path to future interactive
  AI features.
- **Consequences:** Node/React toolchain in the monorepo; server/client
  component discipline required.
