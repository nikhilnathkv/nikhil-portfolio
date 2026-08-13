# ADR-007 — Provider-neutral infrastructure

- **Status:** Accepted
- **Context:** Choosing AWS vs Azure vs another provider up front is premature —
  hosting is not the point of V1.
- **Decision:** Stay **provider-neutral**: Docker + PostgreSQL + S3-compatible
  object storage (MinIO locally) behind clean interfaces.
- **Rationale:** Defer the hosting decision until production is actually needed
  (V3), then choose on cost and reliability without lock-in.
- **Consequences:** Use portable abstractions (e.g. an S3-compatible storage
  client) rather than provider-specific SDKs.
