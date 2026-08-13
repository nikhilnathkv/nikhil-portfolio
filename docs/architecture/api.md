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

### Project writes (implemented — M2; auth added in M4)

- `POST /projects` · `PUT /projects/{id}` · `DELETE /projects/{id}` (soft-delete)
- `POST /projects/{id}/publish` · `POST /projects/{id}/archive`

### Planned

- `POST /contact`

### Auth (planned)

- `POST /auth/login` · `POST /auth/logout` · `GET /auth/me`
- Secure, HTTP-only session cookie.

### Admin (planned)

- `POST|PUT|DELETE /admin/projects[/{id}]`
- `POST|PUT|DELETE /admin/experience[/{id}]`
- `POST|PUT|DELETE /admin/blog[/{id}]`
- …one CRUD group per content entity, all behind auth.
