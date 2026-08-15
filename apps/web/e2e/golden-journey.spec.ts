import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

const EMAIL = process.env.E2E_ADMIN_EMAIL ?? 'admin@example.com';
const PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? 'AdminPass123!';
const API = process.env.E2E_API_URL ?? 'http://localhost:8000/api/v1';

const unique = Date.now();
const PNG = Buffer.from('89504e470d0a1a0a', 'hex'); // PNG magic + enough for the sniff
const PDF = Buffer.from('%PDF-1.4\n%%EOF', 'utf8');

async function apiLogin(request: APIRequestContext) {
  expect(
    (await request.post(`${API}/auth/login`, { data: { email: EMAIL, password: PASSWORD } })).ok(),
  ).toBeTruthy();
}

async function uiLogin(page: Page) {
  await page.goto('/admin/login');
  await page.getByLabel('Email').fill(EMAIL);
  await page.locator('input[name="password"]').fill(PASSWORD);
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/admin\/dashboard/);
}

test('golden journey: author a full portfolio, publish, verify public', async ({
  page,
  request,
}) => {
  test.slow();
  // Seed a skill (no admin Skills-creation is exercised here; that flow is tested elsewhere).
  await apiLogin(request);
  const cat = (
    await (
      await request.post(`${API}/admin/skill-categories`, { data: { name: `GJ ${unique}` } })
    ).json()
  ).data;
  const skillName = `GJSkill${unique}`;
  await request.post(`${API}/admin/skills`, { data: { category_id: cat.id, name: skillName } });

  await uiLogin(page);

  // --- Media: upload an asset to the library ---
  await page.goto('/admin/media');
  await page.setInputFiles('input[type="file"]', {
    name: `gj-media-${unique}.png`,
    mimeType: 'image/png',
    buffer: PNG,
  });
  await expect(page.getByText(`gj-media-${unique}.png`)).toBeVisible();

  // --- Project: create → skill + metric → preview → publish ---
  const projectTitle = `GJ Project ${unique}`;
  const projectSlug = `gj-project-${unique}`;
  await page.goto('/admin/projects/new');
  await page.getByLabel(/Title/).first().fill(projectTitle);
  await page.getByLabel(/Short description/).fill('End-to-end journey project.');
  await page.getByLabel('Overview', { exact: false }).fill('A full overview for publishing.');
  await page.getByLabel(/Category/).selectOption('GenAI');
  await page.getByLabel('Search technologies').fill(skillName);
  await page.getByRole('option', { name: skillName }).click();
  await page.getByRole('button', { name: '+ Add Metric' }).click();
  await page.getByLabel('Metric 1 name').fill('Accuracy');
  await page.getByLabel('Metric 1 value').fill('94.2');

  await page.getByRole('button', { name: 'Save Draft' }).click();
  await expect(page).toHaveURL(/\/admin\/projects\/[0-9a-f-]{36}/);
  await page.getByRole('button', { name: 'Publish' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Publish' }).click();
  await expect(page.getByText('Project published.')).toBeVisible();

  // --- Blog: create → publish ---
  const blogSlug = `gj-blog-${unique}`;
  await page.goto('/admin/blog/new');
  await page.getByLabel(/^Title/).fill(`GJ Blog ${unique}`);
  await page.getByLabel(/Excerpt/).fill('Journey post excerpt.');
  await page.getByLabel(/Category/).selectOption('RAG');
  await page.getByLabel('Markdown content').fill('# GJ\n\nBody.');
  await page.getByRole('button', { name: 'Save Draft' }).click();
  await expect(page).toHaveURL(/\/admin\/blog\/[0-9a-f-]{36}/);
  await page.getByRole('button', { name: 'Publish' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Publish' }).click();
  await expect(page.getByText('Post published.')).toBeVisible();

  // --- Research: create → publish ---
  const researchSlug = `gj-research-${unique}`;
  await page.goto('/admin/research/new');
  await page.getByLabel(/^Title/).fill(`GJ Research ${unique}`);
  await page.getByLabel('Abstract').fill('Journey research abstract.');
  await page.getByRole('button', { name: 'Save Draft' }).click();
  await expect(page).toHaveURL(/\/admin\/research\/[0-9a-f-]{36}/);
  await page.getByRole('button', { name: 'Publish' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Publish' }).click();
  await expect(page.getByText('Research published.')).toBeVisible();

  // --- Resume: upload → active ---
  await page.goto('/admin/resume');
  await page.setInputFiles('input[type="file"]', {
    name: `gj-${unique}.pdf`,
    mimeType: 'application/pdf',
    buffer: PDF,
  });
  await expect(page.getByText('● ACTIVE')).toBeVisible();

  // --- Logout ---
  await page.getByRole('button', { name: /log out/i }).click();
  await expect(page).toHaveURL(/\/admin\/login/);

  // --- Verify the PUBLIC API exposes exactly the published content ---
  const projectRes = await request.get(`${API}/projects/${projectSlug}`);
  expect(projectRes.ok()).toBeTruthy();
  expect((await projectRes.json()).data.title).toBe(projectTitle);

  expect((await request.get(`${API}/blog/${blogSlug}`)).ok()).toBeTruthy();
  expect((await request.get(`${API}/research/${researchSlug}`)).ok()).toBeTruthy();

  // Active resume is served publicly.
  const resume = await request.get(`${API}/resume`);
  expect(resume.ok()).toBeTruthy();
});
