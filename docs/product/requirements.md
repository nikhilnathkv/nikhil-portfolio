# Product Requirements

## Purpose

A portfolio that goes beyond a résumé: it tells the full technical story of each
flagship project — problem, solution, architecture, engineering decisions,
metrics, demo, lessons learned — and links projects to the skills, research,
experiments, and writing behind them.

## Audiences

- **Recruiters** — quick signal: who, headline projects, experience, contact.
- **Engineers** — depth: architecture, decisions, metrics, code, research.

## Public surface

Home is a high-level entry point, not a dump of everything:

```
Home → About · Featured Projects · Experience · Research · Latest Blog · GitHub · Contact
```

Pages: `/`, `/about`, `/experience`, `/projects` + `/projects/[slug]`,
`/research` + `/research/[slug]`, `/blog` + `/blog/[slug]`, `/experiments`,
`/resume`, `/contact`.

### Flagship project page

```
Hero → Problem → Solution → Architecture → Technology → Engineering Decisions →
Metrics → Demo → Lessons Learned → Related Research → Related Articles → GitHub
```

### Content relationships

A project links out to its skills, related blog posts, research, and experiments
so a visitor can follow the entire technical journey.

## Admin surface

A pleasant CMS (`/admin/*`) — no code changes to publish content. Sections:
profile, experience, projects, blog, research, experiments, skills,
certifications, repositories, resume, media, messages, settings.

Authoring flow: Basic info → Problem → Solution → Architecture → Metrics →
Technologies → Links → SEO → Save draft → Preview → Publish.

## Content lifecycle

`draft → (preview) → published`; **archive** is a separate state.

## Non-functional

- SEO-friendly SSR/SSG; fast first paint.
- Consistent API response envelope.
- Secure cookie/session auth for admin.
- Provider-neutral infrastructure (see [ADR-007](../adr/007-provider-neutral-infra.md)).
