# API Architecture

REST, versioned under `/api/v1`. Interactive docs at `/docs` (Swagger) and
`/openapi.json`.

## Response contract

Every response uses one of two envelopes, so the frontend can handle success and
failure uniformly. Mirrored in TypeScript at `packages/types/src/api.ts`.

```jsonc
// Success
{ "data": { }, "meta": { } }

// Error
{ "error": { "code": "PROJECT_NOT_FOUND", "message": "Project not found" } }
```

Validation errors add `error.details` keyed by field. Standard error codes:
`BAD_REQUEST`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`,
`VALIDATION_ERROR`, `RATE_LIMITED`, `INTERNAL_ERROR`.

## Layering

```
Router  →  Schema (Pydantic)  →  Service  →  Repository  →  PostgreSQL
```

Routers are thin; services hold business logic; repositories own data access.

## Endpoints

### Health

- `GET /api/v1/health` — liveness + database readiness

### Public (implemented — M2)

- `GET /profile`
- `GET /experience` · `GET /experience/{id}`
- `GET /projects` · `GET /projects/{slug}` (filters: `?featured=`, `?category=`, `?skill=`)
- `GET /skills`
- `GET /blog` · `GET /blog/{slug}`
- `GET /research` · `GET /research/{slug}`
- `GET /experiments` · `GET /experiments/{slug}`
- `GET /repositories` (filter: `?featured=`)
- `GET /resume`

- `POST /contact` — the only public write (returns an acknowledgement).

### Auth (implemented — M2.7)

- `POST /auth/login` · `POST /auth/logout` · `GET /auth/me`
- **Session-based** (not JWT): Argon2id password hashing; a random session token
  is set as a **Secure, HTTP-only** cookie and stored **hashed** in `sessions`.
- Login is throttled per email; errors are generic (no account enumeration).
- The first admin is created out-of-band:
  `uv run python -m app.cli create-admin --email … --password …`.

### Admin (implemented — M2.7, under `/api/v1/admin`, `require_admin`)

- Full CRUD (+ publish/archive where applicable) for projects, experience,
  profile, skills, blog, research, experiments, repositories, resume, media,
  messages, settings.
- Admin sees all statuses (drafts included); the public API never does.
- `GET /admin/dashboard` returns content/message counts for the admin UI.
- Auth maps to HTTP centrally: `401` unauthenticated, `403` forbidden,
  `409` conflict, `422` business-rule/validation, `429` rate-limited.
