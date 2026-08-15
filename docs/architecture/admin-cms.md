# Admin CMS

The authenticated content-management app at `/admin`. Built across M3.1–M3.6;
after M3.6 the whole portfolio is manageable without touching code.

## Running it

```bash
docker compose up -d postgres storage        # Postgres + MinIO
cd apps/api && alembic upgrade head           # apply migrations
uv run python -m app.cli create-admin --email you@example.com --password 'a-strong-password'
uv run uvicorn app.main:app --reload          # API on :8000
cd ../web && pnpm dev                          # web on :3000
```

Then sign in at `http://localhost:3000/admin/login`. See
[development/setup.md](../development/setup.md) for full environment details and
[architecture/security.md](./security.md) for the auth/session model.

> Local dev seeds a default admin (`admin@example.com` / `AdminPass123!`) in some
> flows — never use those credentials in a deployed environment.

## Modules

| Route                                                    | What it manages                                                  |
| -------------------------------------------------------- | ---------------------------------------------------------------- |
| `/admin/dashboard`                                       | Content counts + unread messages (deep-links to the inbox)       |
| `/admin/projects`                                        | Projects: sectioned editor, metrics, skills, media, SEO, publish |
| `/admin/profile` · `/admin/experience` · `/admin/skills` | Identity layer                                                   |
| `/admin/blog` · `/admin/research` · `/admin/experiments` | Publishing (shared framework)                                    |
| `/admin/media`                                           | Media library (upload, metadata, usage, delete)                  |
| `/admin/resume`                                          | Resume versions (upload PDF, activate, archive)                  |
| `/admin/messages`                                        | Contact inbox (read / archive / delete)                          |
| `/admin/settings`                                        | Site name, contact, social, SEO defaults, footer                 |

## Content lifecycle

Projects, Blog, Research, and Experiments share one lifecycle:
`DRAFT → (Preview) → PUBLISHED → ARCHIVED`, with republish supported. The frontend
never decides transition validity — it calls `POST …/publish|unpublish|archive` and
surfaces the API's response. Draft/archived content is never exposed by the public API.

The shared publishing framework lives in `apps/web/components/cms/` (`ContentListShell`,
`PublishingActions`, `MarkdownEditor`/`MarkdownPreview`, `SeoEditor`, dialogs); each
domain composes it with its own fields.

## Media & storage

Uploads go through the admin proxy to the API, which validates them
(see security.md → File uploads) and stores the bytes in **MinIO**; Postgres holds
only metadata (`storage_key`, `url`, `size`, `alt_text`, `title`, `description`).
`media.url` is a direct public URL built from `MINIO_PUBLIC_URL` (a CDN in prod).
The `MediaPicker` (used by Profile and Blog covers) lists existing media and can
upload inline. Deleting media used by content requires confirmation.

## Resume

`/admin/resume` uploads a PDF (validated) to storage and records a version.
Exactly one resume is active at a time (DB partial-unique index); activating a new
version demotes the previous one. The public API serves the active resume at
`GET /api/v1/resume`.

## Auth model (summary)

HTTP-only session cookie, admin-only API boundary, logout revokes the session. Full
details in [security.md](./security.md).
