import { expect, test, type APIRequestContext } from '@playwright/test';

const EMAIL = process.env.E2E_ADMIN_EMAIL ?? 'admin@example.com';
const PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? 'AdminPass123!';
const API = process.env.E2E_API_URL ?? 'http://localhost:8000/api/v1';

const unique = Date.now();
const TITLE = `E2E Project ${unique}`;
const SLUG = `e2e-project-${unique}`;

/** Log in against the API and ensure at least one skill exists for the selector. */
async function seedSkill(request: APIRequestContext): Promise<void> {
  const login = await request.post(`${API}/auth/login`, {
    data: { email: EMAIL, password: PASSWORD },
  });
  expect(login.ok()).toBeTruthy();

  const catRes = await request.post(`${API}/admin/skill-categories`, {
    data: { name: `E2E Skills ${unique}` },
  });
  const category = (await catRes.json()).data;
  await request.post(`${API}/admin/skills`, {
    data: { category_id: category.id, name: `PlaywrightSkill${unique}` },
  });
}

test('golden path: create → draft → preview → publish → public', async ({ page, request }) => {
  await seedSkill(request);

  // Login
  await page.goto('/admin/login');
  await page.getByLabel('Email').fill(EMAIL);
  await page.locator('input[name="password"]').fill(PASSWORD);
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/admin\/dashboard/);

  // Projects → New
  await page.goto('/admin/projects');
  await page.getByRole('link', { name: '+ New Project' }).click();
  await expect(page).toHaveURL(/\/admin\/projects\/new/);

  // Fill the required fields
  await page.getByLabel(/Title/).fill(TITLE);
  await page.getByLabel(/Short description/).fill('A concise summary for the card.');
  await page.getByLabel('Overview', { exact: false }).fill('A longer overview of the project.');
  await page.getByLabel(/Category/).selectOption('GenAI');

  // Add a skill (search the full unique name so it's not hidden by the 8-result cap
  // when the shared dev DB has accumulated many similar skills across runs).
  await page.getByLabel('Search technologies').fill(`PlaywrightSkill${unique}`);
  await page.getByRole('option', { name: `PlaywrightSkill${unique}` }).click();
  await expect(page.getByText(`PlaywrightSkill${unique}`)).toBeVisible();

  // Add a metric
  await page.getByRole('button', { name: '+ Add Metric' }).click();
  await page.getByLabel('Metric 1 name').fill('Accuracy');
  await page.getByLabel('Metric 1 value').fill('94.2');

  // Save Draft
  await page.getByRole('button', { name: 'Save Draft' }).click();
  await expect(page.getByText('Draft saved.')).toBeVisible();
  await expect(page).toHaveURL(/\/admin\/projects\/[0-9a-f-]{36}/);

  // Preview opens in a new tab and shows the draft
  const [preview] = await Promise.all([
    page.context().waitForEvent('page'),
    page.getByRole('button', { name: 'Preview' }).click(),
  ]);
  await preview.waitForLoadState();
  await expect(preview.getByRole('heading', { name: TITLE })).toBeVisible();
  await expect(preview.getByText('Preview')).toBeVisible();
  await preview.close();

  // Publish
  await page.getByRole('button', { name: 'Publish' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText(`/projects/${SLUG}`)).toBeVisible();
  await dialog.getByRole('button', { name: 'Publish' }).click();
  await expect(page.getByText('Project published.')).toBeVisible();

  // Public page renders the published project via the shared renderer
  await page.goto(`/projects/${SLUG}`);
  await expect(page.getByRole('heading', { name: TITLE })).toBeVisible();
  await expect(page.getByText('A longer overview of the project.')).toBeVisible();
  await expect(page.getByText('Accuracy')).toBeVisible();
  await expect(page.getByText(`PlaywrightSkill${unique}`)).toBeVisible();
});
