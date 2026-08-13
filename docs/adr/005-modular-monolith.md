# ADR-005 — Modular Monolith (not microservices)

- **Status:** Accepted
- **Context:** It is tempting to split into auth/blog/project/media services.
- **Decision:** For V1, build a **modular monolith** — one FastAPI app with
  internal modules (auth, projects, blog, research, media).
- **Rationale:** Separate services would add operational and networking overhead
  with no real benefit at this scale — artificial complexity.
- **Consequences:** Enforce clean module boundaries so a genuine future need can
  extract a service without a rewrite.
