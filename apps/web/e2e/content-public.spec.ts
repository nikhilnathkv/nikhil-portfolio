import { expect, test, type APIRequestContext } from '@playwright/test';

const EMAIL = process.env.E2E_ADMIN_EMAIL ?? 'admin@example.com';
const PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? 'AdminPass123!';
const API = process.env.E2E_API_URL ?? 'http://localhost:8000/api/v1';

const unique = Date.now();

async function seed(request: APIRequestContext) {
  expect(
    (await request.post(`${API}/auth/login`, { data: { email: EMAIL, password: PASSWORD } })).ok(),
  ).toBeTruthy();

  const post = (
    await (
      await request.post(`${API}/admin/blog`, {
        data: {
          title: `Eval Harness ${unique}`,
          excerpt: 'Measuring RAG quality.',
          category: 'GenAI',
          content: 'Inline math $E=mc^2$ and a code block:\n\n```python\nprint("hi")\n```',
          status: 'published',
        },
      })
    ).json()
  ).data;

  const research = (
    await (
      await request.post(`${API}/admin/research`, {
        data: {
          title: `Retrieval Benchmark ${unique}`,
          abstract: 'Comparing retrieval strategies.',
          research_question: 'Does hybrid beat dense?',
          results: 'Hybrid won.',
          status: 'published',
        },
      })
    ).json()
  ).data;

  return { post, research };
}

test('writing index → article with code + math', async ({ page, request }) => {
  const { post } = await seed(request);
  await page.goto('/writing');
  await expect(page.getByRole('heading', { level: 1, name: 'Articles & deep-dives' })).toBeVisible();
  await page.getByRole('link', { name: new RegExp(post.title) }).click();
  await expect(page).toHaveURL(new RegExp(`/writing/${post.slug}$`));
  await expect(page.getByRole('heading', { level: 1, name: new RegExp(post.title) })).toBeVisible();
  // KaTeX renders the math into the DOM.
  await expect(page.locator('.katex').first()).toBeVisible();
  // Code copy button is present.
  await expect(page.getByRole('button', { name: /copy code/i }).first()).toBeVisible();
});

test('research index → structured detail', async ({ page, request }) => {
  const { research } = await seed(request);
  await page.goto('/research');
  await expect(page.getByRole('heading', { level: 1, name: 'Investigations & findings' })).toBeVisible();
  await page.getByRole('link', { name: new RegExp(research.title) }).click();
  await expect(page).toHaveURL(new RegExp(`/research/${research.slug}$`));
  await expect(page.getByRole('heading', { name: 'Research question' })).toBeVisible();
});
