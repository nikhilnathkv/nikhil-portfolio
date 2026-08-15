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
          title: `Case Study ${unique}`,
          short_description: 'Production RAG over enterprise documents.',
          description: 'Overview narrative.',
          problem: 'Documents were hard to search.',
          solution: 'A hybrid retrieval pipeline.',
          evaluation: 'Measured Recall@5 on a held-out set.',
          results: 'Latency dropped from 1.2s to 420ms.',
          category: 'GenAI',
          featured: true,
          is_confidential: true,
          metrics: [{ name: 'Retrieval accuracy', value: '94', unit: '%' }],
        },
      })
    ).json()
  ).data;

  // Published research linked to the project -> shows under "Related work".
  await request.post(`${API}/admin/research`, {
    data: {
      title: `Retrieval Study ${unique}`,
      abstract: 'a',
      project_id: project.id,
      status: 'published',
    },
  });

  await request.post(`${API}/admin/projects/${project.id}/publish`);
  return project;
}

test('projects index → case study → related research', async ({ page, request }) => {
  const project = await seed(request);

  // Index: the published project appears (and filter chips render).
  await page.goto('/projects');
  await expect(page.getByRole('heading', { level: 1, name: 'Projects' })).toBeVisible();
  const card = page.getByRole('link', { name: project.title });
  await expect(card).toBeVisible();
  await card.click();

  // Case study: hero, a section, the metric, and the confidentiality note.
  await expect(page).toHaveURL(new RegExp(`/projects/${project.slug}$`));
  await expect(page.getByRole('heading', { level: 1, name: project.title })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Problem' })).toBeVisible();
  await expect(page.getByText('94')).toBeVisible();
  await expect(page.getByText(/omitted for confidentiality/i)).toBeVisible();

  // Related work → research detail.
  await page.getByRole('link', { name: new RegExp(`Retrieval Study ${unique}`) }).click();
  await expect(page).toHaveURL(/\/research\//);
});
