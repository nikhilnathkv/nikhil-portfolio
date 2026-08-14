import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

const EMAIL = process.env.E2E_ADMIN_EMAIL ?? 'admin@example.com';
const PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? 'AdminPass123!';
const API = process.env.E2E_API_URL ?? 'http://localhost:8000/api/v1';

const unique = Date.now();

async function login(page: Page): Promise<void> {
  await page.goto('/admin/login');
  await page.getByLabel('Email').fill(EMAIL);
  await page.locator('input[name="password"]').fill(PASSWORD);
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/admin\/dashboard/);
}

async function seedProject(request: APIRequestContext, title: string): Promise<string> {
  const login = await request.post(`${API}/auth/login`, {
    data: { email: EMAIL, password: PASSWORD },
  });
  expect(login.ok()).toBeTruthy();
  const res = await request.post(`${API}/admin/projects`, {
    data: { title, short_description: 'd', category: 'GenAI' },
  });
  return (await res.json()).data.title;
}

test('blog: create → draft → preview → publish → public', async ({ page }) => {
  await login(page);
  await page.goto('/admin/blog/new');

  const title = `RAG Eval ${unique}`;
  const slug = `rag-eval-${unique}`;
  await page.getByLabel(/^Title/).fill(title);
  await page.getByLabel(/Excerpt/).fill('How we evaluate retrieval.');
  await page.getByLabel(/Category/).selectOption('RAG');
  await page.getByLabel('Markdown content').fill('# Heading\n\nSome **bold** content.');

  await page.getByRole('button', { name: 'Save Draft' }).click();
  // The URL changing to the persisted id is the reliable success signal.
  await expect(page).toHaveURL(/\/admin\/blog\/[0-9a-f-]{36}/);

  // Preview opens a new tab using the same renderer.
  const [preview] = await Promise.all([
    page.context().waitForEvent('page'),
    // The first "Preview" is the action-bar button (the second is the editor's tab).
    page.getByRole('button', { name: 'Preview' }).first().click(),
  ]);
  await preview.waitForLoadState();
  await expect(preview.getByRole('heading', { name: title })).toBeVisible();
  await preview.close();

  // Publish.
  await page.getByRole('button', { name: 'Publish' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText(`/blog/${slug}`)).toBeVisible();
  await dialog.getByRole('button', { name: 'Publish' }).click();
  await expect(page.getByText('Post published.')).toBeVisible();

  // Public page renders via the shared ArticleView.
  await page.goto(`/blog/${slug}`);
  await expect(page.getByRole('heading', { name: title })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Heading' })).toBeVisible();
});

test('research: create → add project → publish → verify public', async ({ page, request }) => {
  const projectTitle = await seedProject(request, `Research Host ${unique}`);
  await login(page);
  await page.goto('/admin/research/new');

  const slug = `retrieval-study-${unique}`;
  await page.getByLabel(/^Title/).fill(`Retrieval Study ${unique}`);
  await page.getByLabel('Related project').selectOption({ label: projectTitle });
  await page.getByLabel('Abstract').fill('We study retrieval strategies.');

  await page.getByRole('button', { name: 'Save Draft' }).click();
  await expect(page).toHaveURL(/\/admin\/research\/[0-9a-f-]{36}/);
  await page.getByRole('button', { name: 'Publish' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Publish' }).click();
  await expect(page.getByText('Research published.')).toBeVisible();

  await page.goto(`/research/${slug}`);
  await expect(page.getByRole('heading', { name: `Retrieval Study ${unique}` })).toBeVisible();
  await expect(page.getByText(projectTitle)).toBeVisible();
});

test('experiment: create → add metrics → link project → publish', async ({ page, request }) => {
  const projectTitle = await seedProject(request, `Exp Host ${unique}`);
  await login(page);
  await page.goto('/admin/experiments/new');

  const slug = `bm25-vs-dense-${unique}`;
  await page.getByLabel(/^Title/).fill(`BM25 vs Dense ${unique}`);
  await page.getByLabel('Related project').selectOption({ label: projectTitle });
  await page.getByRole('button', { name: '+ Add Metric' }).click();
  await page.getByLabel('Metric 1 name').fill('Recall@5');
  await page.getByLabel('Metric 1 value').fill('0.87');

  await page.getByRole('button', { name: 'Save Draft' }).click();
  await expect(page).toHaveURL(/\/admin\/experiments\/[0-9a-f-]{36}/);
  await page.getByRole('button', { name: 'Publish' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Publish' }).click();
  await expect(page.getByText('Experiment published.')).toBeVisible();

  await page.goto(`/experiments/${slug}`);
  await expect(page.getByRole('heading', { name: `BM25 vs Dense ${unique}` })).toBeVisible();
  await expect(page.getByText('Recall@5')).toBeVisible();
});
