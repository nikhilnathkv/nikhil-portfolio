/**
 * Shared TypeScript types for the nikhil-portfolio monorepo.
 *
 * These mirror the API response contract (see docs/architecture/api.md) and the
 * core domain entities. Both the public web app and the admin CMS consume them
 * so that the frontend and the FastAPI backend stay in agreement.
 */

export * from './api';
export * from './domain';
