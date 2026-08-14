import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

const EMAIL = process.env.E2E_ADMIN_EMAIL ?? 'admin@example.com';
const PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? 'AdminPass123!';
const API = process.env.E2E_API_URL ?? 'http://localhost:8000/api/v1';

const unique = Date.now();

// Minimal valid-ish file buffers.
const PNG_BYTES = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
);
const PDF_BYTES = Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF', 'utf8');

async function login(page: Page): Promise<void> {
  await page.goto('/admin/login');
  await page.getByLabel('Email').fill(EMAIL);
  await page.locator('input[name="password"]').fill(PASSWORD);
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/admin\/dashboard/);
}

test('media: upload an image, edit alt text', async ({ page }) => {
  await login(page);
  await page.goto('/admin/media');

  const filename = `diagram-${unique}.png`;
  await page.setInputFiles('input[type="file"]', {
    name: filename,
    mimeType: 'image/png',
    buffer: PNG_BYTES,
  });
  await expect(page.getByText(filename)).toBeVisible();

  await page.getByText(filename).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Alt text').fill('Architecture diagram');
  await dialog.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Media updated.')).toBeVisible();
});

test('resume: upload a PDF and see it active', async ({ page }) => {
  await login(page);
  await page.goto('/admin/resume');

  await page.setInputFiles('input[type="file"]', {
    name: `resume-${unique}.pdf`,
    mimeType: 'application/pdf',
    buffer: PDF_BYTES,
  });
  await expect(page.getByText('Current resume')).toBeVisible();
  await expect(page.getByText('● ACTIVE')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Preview' })).toBeVisible();
});

test('messages: open, read, archive', async ({ page, request }: { page: Page; request: APIRequestContext }) => {
  const name = `Sender ${unique}`;
  await request.post(`${API}/contact`, {
    data: { name, email: 'sender@example.com', message: 'Hiring opportunity — lets talk.' },
  });

  await login(page);
  await page.goto('/admin/messages');
  await page.getByText(name).click();
  await expect(page.getByText('sender@example.com')).toBeVisible();
  await page.getByRole('button', { name: 'Archive', exact: true }).click();
  await expect(page.getByText('Message archived.')).toBeVisible();
});

test('settings: edit and persist', async ({ page }) => {
  await login(page);
  await page.goto('/admin/settings');

  const value = `Nikhil Nath ${unique}`;
  const siteName = page.getByLabel('Site name');
  await siteName.fill(value);
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Settings saved.')).toBeVisible();

  await page.reload();
  await expect(page.getByLabel('Site name')).toHaveValue(value);
});
