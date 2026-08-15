import { expect, test } from '@playwright/test';

test('robots.txt disallows internal surfaces and points to the sitemap', async ({ request }) => {
  const res = await request.get('/robots.txt');
  expect(res.ok()).toBeTruthy();
  const body = await res.text();
  expect(body).toContain('Disallow: /admin');
  expect(body).toContain('Disallow: /api');
  expect(body).toContain('Sitemap:');
});

test('sitemap.xml lists public routes', async ({ request }) => {
  const res = await request.get('/sitemap.xml');
  expect(res.ok()).toBeTruthy();
  const body = await res.text();
  expect(body).toContain('<urlset');
  expect(body).toContain('/projects');
  expect(body).not.toContain('/admin');
});

test('unknown route shows the in-shell 404', async ({ page }) => {
  await page.goto('/this-page-does-not-exist');
  await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Back to home' })).toBeVisible();
  // The public shell (primary nav) still renders around the 404.
  await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible();
});
