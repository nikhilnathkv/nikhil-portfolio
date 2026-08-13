# ADR-003 — Database: PostgreSQL

- **Status:** Accepted
- **Context:** Portfolio data is highly relational — projects link to skills,
  blog, research, and experiments.
- **Decision:** Use **PostgreSQL** with SQLAlchemy 2 (async) and Alembic.
- **Rationale:** Strong relational modeling and constraints for many-to-many
  relationships; mature, portable, and provider-neutral.
- **Consequences:** Explicit join tables over array columns; migrations managed
  with Alembic.
