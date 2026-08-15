import { expect, test } from '@playwright/test';

/**
 * Public homepage + shell navigation (M4.2). Runs against the full stack; the
 * page renders regardless of whether content exists (graceful empty states).
 */
test('homepage renders the shell and navigates to sections', async ({ page }) => {
  await page.goto('/');

  // Hero: exactly one h1, and the primary CTAs.
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Explore my work' })).toBeVisible();

  // Key sections are present.
  await expect(page.getByText('Selected Work')).toBeVisible();
  await expect(page.getByText("Let's build something useful.")).toBeVisible();

  // Nav to the projects page via the hero CTA.
  await page.getByRole('link', { name: 'Explore my work' }).click();
  await expect(page).toHaveURL(/\/projects$/);

  // Primary nav is present on the destination and links back home.
  await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Writing' }).click();
  await expect(page).toHaveURL(/\/writing$/);
});
