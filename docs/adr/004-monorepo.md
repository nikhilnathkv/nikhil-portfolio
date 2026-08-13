# ADR-004 — Monorepo

- **Status:** Accepted
- **Context:** One product spans a web app, an API, shared types,
  infrastructure, and documentation.
- **Decision:** Keep everything in a single **monorepo** (pnpm workspaces for
  JS/TS; `apps/api` managed by uv).
- **Rationale:** Shared types stay in sync, changes are atomic across frontend
  and backend, and CI/CD is simpler with one source of truth.
- **Consequences:** Workspace tooling (pnpm) and a mixed Node/Python toolchain
  to configure; offset by cohesion and simpler delivery.
