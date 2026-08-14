import { expect, test } from '@playwright/test';

const EMAIL = process.env.E2E_ADMIN_EMAIL ?? 'admin@example.com';
const PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? 'AdminPass123!';

test('unauthenticated visitor is redirected to login', async ({ page }) => {
  await page.goto('/admin/dashboard');
  await expect(page).toHaveURL(/\/admin\/login/);
  await expect(page.getByRole('heading', { name: 'Sign in to the admin' })).toBeVisible();
});

test('admin can log in, see the dashboard, and log out', async ({ page }) => {
  await page.goto('/admin/login');
  await page.getByLabel('Email').fill(EMAIL);
  await page.locator('input[name="password"]').fill(PASSWORD);
  await page.getByRole('button', { name: /sign in/i }).click();

  await expect(page).toHaveURL(/\/admin\/dashboard/);
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

  await page.getByRole('button', { name: /log out/i }).click();
  await expect(page).toHaveURL(/\/admin\/login/);

  // Session is gone: going back to the dashboard bounces to login again.
  await page.goto('/admin/dashboard');
  await expect(page).toHaveURL(/\/admin\/login/);
});
