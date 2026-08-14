import { expect, test, type APIRequestContext } from '@playwright/test';

const EMAIL = process.env.E2E_ADMIN_EMAIL ?? 'admin@example.com';
const PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? 'AdminPass123!';
const API = process.env.E2E_API_URL ?? 'http://localhost:8000/api/v1';

const unique = Date.now();

async function apiLogin(request: APIRequestContext): Promise<void> {
  const res = await request.post(`${API}/auth/login`, {
    data: { email: EMAIL, password: PASSWORD },
  });
  expect(res.ok()).toBeTruthy();
}

async function login(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/admin/login');
  await page.getByLabel('Email').fill(EMAIL);
  await page.locator('input[name="password"]').fill(PASSWORD);
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/admin\/dashboard/);
}

test('profile: edit and save the singleton profile', async ({ page }) => {
  await login(page);
  await page.goto('/admin/profile');

  await page.getByLabel('Name').fill(`Nikhil ${unique}`);
  await page.getByLabel('Headline').fill('AI/ML Engineer | GenAI • Agentic AI');
  await page.getByLabel('Short bio').fill('Short professional summary.');
  await page.getByLabel('Long bio').fill('A longer bio for the about page.');
  await page.getByRole('button', { name: 'Save' }).click();

  await expect(page.getByText('Profile saved.')).toBeVisible();
});

test('experience: create an entry linked to a project', async ({ page, request }) => {
  // Seed a project so the selector has something to attach.
  await apiLogin(request);
  const projectTitle = `Exp Project ${unique}`;
  await request.post(`${API}/admin/projects`, {
    data: { title: projectTitle, short_description: 'd', category: 'GenAI' },
  });

  await login(page);
  await page.goto('/admin/experience/new');
  await page.getByLabel('Company').fill(`Novigo ${unique}`);
  await page.getByLabel(/^Role/).fill('AI/ML Engineer');
  await page.getByLabel('Start date').fill('2026-01-01');
  await page.getByLabel('This is my current role').check();

  await page.getByLabel('Search projects').fill('Exp Project');
  await page.getByRole('option', { name: projectTitle }).click();
  await expect(page.getByText(projectTitle)).toBeVisible();

  await page.getByRole('button', { name: 'Save' }).click();
  // On success the editor routes to the persisted entry's URL.
  await expect(page).toHaveURL(/\/admin\/experience\/[0-9a-f-]{36}/);

  // It shows up in the list.
  await page.goto('/admin/experience');
  await expect(page.getByText(`Novigo ${unique}`)).toBeVisible();
});

test('skills: create a category and a skill in it', async ({ page }) => {
  await login(page);
  await page.goto('/admin/skills');

  const category = `E2E Cat ${unique}`;
  await page.getByRole('button', { name: '+ Category' }).first().click();
  let dialog = page.getByRole('dialog');
  await dialog.getByLabel(/Name/).fill(category);
  await dialog.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText(category)).toBeVisible();

  // Add a skill to that category.
  const categoryRow = page
    .locator('div')
    .filter({ hasText: category })
    .locator('button', { hasText: '+ Skill' })
    .first();
  await categoryRow.click();
  dialog = page.getByRole('dialog');
  await dialog.getByLabel('Name', { exact: false }).first().fill(`Skill ${unique}`);
  await dialog.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText(`Skill ${unique}`)).toBeVisible();
});
