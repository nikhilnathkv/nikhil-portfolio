import { expect, test, type APIRequestContext } from '@playwright/test';

const EMAIL = process.env.E2E_ADMIN_EMAIL ?? 'admin@example.com';
const PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? 'AdminPass123!';
const API = process.env.E2E_API_URL ?? 'http://localhost:8000/api/v1';

const unique = Date.now();

async function seed(request: APIRequestContext) {
  expect(
    (await request.post(`${API}/auth/login`, { data: { email: EMAIL, password: PASSWORD } })).ok(),
  ).toBeTruthy();

  const project = (
    await (
      await request.post(`${API}/admin/projects`, {
        data: {
          title: `Exp Project ${unique}`,
          short_description: 'Built during a role.',
          description: 'full',
          category: 'GenAI',
        },
      })
    ).json()
  ).data;
  await request.post(`${API}/admin/projects/${project.id}/publish`);

  const company = `Acme ${unique}`;
  await request.post(`${API}/admin/experience`, {
    data: {
      company,
      role: 'AI/ML Engineer',
      start_date: '2020-01-01',
      is_current: true,
      summary: 'Enterprise AI/ML work.',
      description: '- Delivered production systems',
      project_ids: [project.id],
    },
  });
  return { project, company };
}

test('experience timeline links to case study and back', async ({ page, request }) => {
  const { project, company } = await seed(request);

  await page.goto('/experience');
  await expect(page.getByRole('heading', { level: 1, name: 'Experience' })).toBeVisible();
  await expect(page.getByText(company)).toBeVisible();

  // Experience → project case study.
  await page.getByRole('link', { name: new RegExp(project.title) }).click();
  await expect(page).toHaveURL(new RegExp(`/projects/${project.slug}$`));

  // Case study → back to the role (the "Built at …" backlink).
  await page.getByRole('link', { name: company }).click();
  await expect(page).toHaveURL(/\/experience#exp-/);
});

test('about page renders', async ({ page }) => {
  await page.goto('/about');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('link', { name: 'View resume' }).first()).toBeVisible();
});
