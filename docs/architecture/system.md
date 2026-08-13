# System Architecture

## Overview

nikhil-portfolio is a **modular monolith**: a Next.js frontend (public site +
admin CMS) talking over HTTPS/REST to a single FastAPI service, which owns all
business logic and persistence.

```
Visitor ─▶ Next.js (public web) ─┐
                                 ├─▶ FastAPI (API layer) ─┬─▶ PostgreSQL
Admin  ─▶ Next.js (admin CMS)  ──┘                        └─▶ Object storage
```

The FastAPI boundary is deliberate and present from day one. Even though V1 has
modest needs, keeping a clean Python API surface means future AI capabilities —
RAG, agents, ML/CV inference, data processing — attach without re-architecting.

```
PostgreSQL
   │
   ├─▶ Public Web
   ├─▶ Admin CMS
   └─▶ AI Layer (future: RAG · Agents · ML/CV)
```

## Components

| Component      | Responsibility                                               |
| -------------- | ------------------------------------------------------------ |
| Public web     | SSR/SSG marketing + content pages, SEO, fast first paint     |
| Admin CMS      | Authenticated content management (draft → preview → publish) |
| API layer      | Auth, validation, business logic, content services           |
| PostgreSQL     | Relational content, users, projects, blog, research          |
| Object storage | Images, PDFs, screenshots, media                             |

## Request flow (API)

```
Route → Schema validation → Service → Repository → Database
```

Routers stay thin; business logic lives in services, and all database access
goes through repositories. See [api.md](api.md).

## Why a modular monolith (not microservices)

For V1 we do **not** split into auth-service / blog-service / project-service /
media-service — that would be artificial complexity. Instead the FastAPI app is
internally modular (auth, projects, blog, research, media modules). When there is
a genuine reason to extract a service later, the module boundaries make it
straightforward. See [ADR-005](../adr/005-modular-monolith.md).

## Deployment posture

Infrastructure is intentionally **provider-neutral** for V1 (Docker + Postgres +
S3-compatible storage), so a concrete host can be chosen later on cost and
reliability rather than up-front lock-in. See
[ADR-007](../adr/007-provider-neutral-infra.md).
