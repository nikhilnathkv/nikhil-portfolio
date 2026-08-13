# Database Architecture

PostgreSQL, accessed via SQLAlchemy 2 (async) with Alembic migrations. Data is
highly relational, so many-to-many relationships are modeled with explicit join
tables rather than array columns.

> Tables are created incrementally starting in **M2**. This document is the
> target schema the migrations build toward.

## Core entities

`User`, `Profile`, `Experience`, `Project`, `ProjectMetric`, `SkillCategory`,
`Skill`, `BlogPost`, `Research`, `Experiment`, `Certification`, `Repository`,
`Resume`, `Media`, `ContactMessage`, `SiteSettings`.

## Relationships (conceptual)

```
User ─manages─▶ Portfolio content

Experience ─┐
            ├─(m2m)─ Project ─(m2m)─ Skill ─▶ SkillCategory
            │            ├─▶ ProjectMetric
            │            └─▶ Media
Project ─▶ Experiment
BlogPost / Research ─▶ Experiment
```

## Tables

### users

`id`, `email`, `password_hash`, `role`, `is_active`, `created_at`,
`updated_at`, `last_login_at`

### profiles (single row expected)

`id`, `name`, `headline`, `short_bio`, `long_bio`, `profile_image_id`,
`location`, `email`, `linkedin_url`, `github_url`, `resume_id`, `created_at`,
`updated_at`

### experiences

`id`, `company`, `role`, `location`, `start_date`, `end_date`, `is_current`,
`summary`, `description`, `display_order`, `created_at`, `updated_at`

### projects

`id`, `title`, `slug`, `short_description`, `description`, `problem`,
`solution`, `architecture`, `engineering_decisions`, `lessons_learned`,
`category`, `status`, `featured`, `display_order`, `github_url`, `live_url`,
`seo_title`, `seo_description`, `created_at`, `updated_at`, `published_at`

### project_metrics

`id`, `project_id`, `name`, `value`, `unit`, `description`, `display_order`

### skill_categories

`id`, `name`, `display_order`

### skills

`id`, `category_id`, `name`, `description`, `display_order`, `featured`

### project_skills (m2m)

`project_id`, `skill_id`

### blog_posts

`id`, `title`, `slug`, `excerpt`, `content`, `cover_image_id`, `category`,
`status`, `featured`, `seo_title`, `seo_description`, `published_at`,
`created_at`, `updated_at`

### blog_tags / blog_post_tags (m2m)

`blog_tags`: `id`, `name` · `blog_post_tags`: `blog_post_id`, `tag_id`

### research

`id`, `title`, `slug`, `abstract`, `methodology`, `results`, `conclusion`,
`paper_url`, `publication_url`, `github_url`, `status`, `published_at`,
`created_at`, `updated_at`

### experiments

`id`, `title`, `slug`, `hypothesis`, `method`, `results`, `conclusion`,
`project_id`, `github_url`, `status`, `created_at`, `updated_at`

### repositories

`id`, `name`, `description`, `url`, `language`, `featured`, `display_order`,
`project_id`, `created_at`, `updated_at` — later synced from the GitHub API.

### resumes

`id`, `name`, `file_url`, `version`, `is_active`, `created_at` — only one row is
`is_active` at a time; history is retained.

### media

`id`, `filename`, `original_filename`, `mime_type`, `size`, `storage_key`,
`url`, `alt_text`, `created_at` — centralized media system.

### contact_messages

`id`, `name`, `email`, `message`, `status` (`UNREAD`/`READ`/`ARCHIVED`),
`created_at`, `read_at`

### site_settings

`id`, `key`, `value`, `updated_at` — site title, tagline, social links, footer,
analytics config.

## Content lifecycle

Content entities carry a `status`: **draft → (preview) → published**, with
**archive** as a separate terminal state.

## Implementation notes (M2)

- **Primary keys:** UUID v4, generated application-side.
- **Timestamps:** every table has `created_at` / `updated_at` (server clock).
- **Soft-delete:** content entities (`projects`, `blog_posts`, `research`,
  `experiments`, `experiences`) carry `deleted_at`; repositories exclude
  soft-deleted rows from reads by default. Reference/lookup tables hard-delete.
- **Enums** (`status`, roles, contact status) are stored as `VARCHAR`
  (`native_enum=False`) to keep migrations and rollbacks simple.
- **Uniqueness:** `slug` is unique per content type; `resumes` uses a partial
  unique index so at most one row is `is_active`.
- The schema is realized by the `0001 initial_schema` Alembic migration;
  `alembic upgrade head` builds it from a fresh database with no manual SQL.
