# Operations runbook

Answers the "how do I…" questions for the deployed portfolio. Assumes the
managed-split architecture in [`deployment.md`](./deployment.md). Replace the
placeholder host commands with your provider's equivalent (Fly.io shown as the
default for the api; Vercel for web).

## How do I deploy?

- **Web**: push to the default branch → Vercel auto-builds `apps/web`. Or
  `vercel --prod` from `apps/web`.
- **API**: build + release the container. Fly.io: `fly deploy` from `apps/api`.
  Railway/Render: push to the connected branch.
- Web and api deploy independently. Deploy the **api first** when a release
  contains a migration the web depends on.

## How do I roll back?

- **Web (Vercel)**: Deployments → pick the last-good build → _Promote to
  Production_ (instant, atomic).
- **API**: redeploy the previous image/release (`fly releases` → `fly deploy
--image <prev>`, or the host's rollback button).
- **If a migration must be undone**: `alembic downgrade -1` (every migration in
  `apps/api/migrations/versions/` has a real `downgrade()`; verified up→down→up).
  Roll code back to match the schema.

## How do I run database migrations?

Run against the production `DATABASE_URL` from a one-off task on the api host:

```bash
# Fly.io
fly ssh console -C "alembic upgrade head"
# Railway/Render: run in a one-off shell / release command
alembic upgrade head
```

The database starts empty; migrations own the entire schema (no manual DDL).
Check state with `alembic current` (should print the head revision).

## How do I create an admin?

```bash
fly ssh console -C "python -m app.cli create-admin --email you@yourdomain.com --password '<strong>'"
```

Do this once after the first migration. Never commit or log the password.

## How do I restore a backup?

**Postgres** (source of truth for all content + users):

1. Take backups: managed Postgres provides automated daily backups + PITR
   (Neon/Supabase). Additionally, periodic logical dumps:
   ```bash
   pg_dump "$DATABASE_URL_SYNC" -Fc -f portfolio-$(date +%F).dump   # sync (psycopg) URL
   ```
2. Restore into a fresh database:
   ```bash
   pg_restore --clean --no-owner -d "$TARGET_DATABASE_URL_SYNC" portfolio-YYYY-MM-DD.dump
   ```
3. Point the api's `DATABASE_URL` at the restored DB and redeploy.

**Object storage** (images + resume PDF): enable **bucket versioning** on R2/S3
so overwrites/deletes are recoverable; optionally replicate to a second bucket.
Storage holds only public assets — Postgres holds the metadata that references
them, so restore Postgres and storage from the same time window.

**Full disaster recovery** (production DB gone): provision a new managed
Postgres → restore the latest dump → set `DATABASE_URL` → `alembic upgrade head`
(no-op if the dump is current) → redeploy api. Re-attach the storage bucket (or
restore it). Content returns because the CMS data lives in Postgres.

## Where are production logs?

- **API**: structured one-line-per-request logs (request_id, method, path,
  status, latency_ms; never bodies/cookies/secrets) → the api host's log stream
  (`fly logs`, Railway/Render dashboards). Unhandled errors log a full traceback
  server-side and return a clean `INTERNAL_ERROR` to the client.
- **Web**: Vercel deployment + function logs.
- **DB**: managed Postgres dashboard (slow queries, connections).

## How do I rotate secrets?

1. Generate a new value (e.g. `python -c "import secrets; print(secrets.token_urlsafe(48))"`).
2. Update it in the platform's secret store (Vercel env / Fly secrets / etc.).
3. Redeploy the affected service.

- Rotating `SESSION_SECRET` invalidates existing admin sessions (you re-login) —
  expected.
- Rotating **storage keys**: create the new key, update `MINIO_ACCESS_KEY/SECRET`,
  redeploy, then revoke the old key.
- Rotating **DB credentials**: update `DATABASE_URL`, redeploy; revoke the old.

## Health checks / monitoring

- Liveness: `GET /api/v1/health` → `{"status":"ok"}`.
- Readiness (DB reachable): `GET /api/v1/health/ready` → `{"ready":true,"db":"up"}`.
- Point the host's health check + an uptime monitor at `/api/v1/health/ready`.
