import { expect, test } from '@playwright/test';

const unique = Date.now();

test('resume page renders the web resume', async ({ page }) => {
  await page.goto('/resume');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  // Cross-link to the full experience (screen-only).
  await expect(page.getByRole('link', { name: 'Full experience' })).toBeVisible();
});

test('contact form submits and confirms', async ({ page }) => {
  await page.goto('/contact');
  await expect(
    page.getByRole('heading', { level: 1, name: /build something useful/i }),
  ).toBeVisible();

  await page.getByLabel('Name').fill(`E2E Visitor ${unique}`);
  await page.getByLabel('Email').fill(`e2e-${unique}@example.com`);
  await page.getByLabel('Message').fill('Reaching out via the E2E contact test.');
  await page.getByRole('button', { name: 'Send message' }).click();

  await expect(page.getByText(/Message sent/i)).toBeVisible();
});
