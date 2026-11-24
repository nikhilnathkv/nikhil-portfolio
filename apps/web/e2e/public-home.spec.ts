import { expect, test } from '@playwright/test';

/**
 * Public homepage + shell navigation (M4.2). Runs against the full stack; the
 * page renders regardless of whether content exists (graceful empty states).
 */
test('homepage renders the shell and navigates to sections', async ({ page }) => {
  await page.goto('/');

  // Hero: exactly one h1, and the resume CTA. "Explore my work" is hidden
  // while the Projects section is (see HIDDEN_NAV_HREFS in nav-links.ts).
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('link', { name: 'View resume' }).first()).toBeVisible();

  // Key sections are present.
  await expect(page.getByText('Selected Work')).toBeVisible();
  await expect(page.getByText("Let's build something useful.")).toBeVisible();

  // Primary nav is present and navigates to a section.
  await page
    .getByRole('navigation', { name: 'Primary' })
    .getByRole('link', { name: 'Resume' })
    .click();
  await expect(page).toHaveURL(/\/resume$/);
});
