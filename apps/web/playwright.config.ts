import { defineConfig, devices } from '@playwright/test';

/**
 * E2E runs against the full stack (web + API + Postgres) with a seeded admin
 * user. Locally, start the API and `pnpm start`, then `pnpm e2e`. The webServer
 * block reuses an already-running web server if present.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'line' : 'list',
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  // `channel: 'chromium'` uses the full Chromium build's new headless mode
  // (rather than the separate chrome-headless-shell download).
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], channel: 'chromium' } }],
  // Set PW_SKIP_WEBSERVER=1 to run against an already-running web server.
  webServer: process.env.PW_SKIP_WEBSERVER
    ? undefined
    : {
        command: 'pnpm start',
        url: 'http://localhost:3000',
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
