import { expect, test } from '@playwright/test';

/**
 * Admin surface: nothing is reachable without a session.
 *
 * The Supabase project is not configured in CI, so we cannot sign in. What we
 * can prove is that every dashboard route redirects to the sign-in screen and
 * that the screen itself never offers public registration.
 */

const PROTECTED_ROUTES = [
  '/admin',
  '/admin/appointments',
  '/admin/messages',
  '/admin/services',
  '/admin/services/new',
  '/admin/settings',
  '/admin/audit',
];

test.describe('admin access control', () => {
  for (const route of PROTECTED_ROUTES) {
    test(`${route} redirects an anonymous visitor to sign in`, async ({ page }) => {
      const response = await page.goto(route);
      // A redirect chain ends with the login page.
      expect(response?.status()).toBe(200);
      await expect(page).toHaveURL(/\/admin\/login/);
      await expect(page).toHaveURL(/reason=auth/);
    });
  }

  test('the dashboard is excluded from indexing', async ({ page }) => {
    await page.goto('/admin/login');
    const robots = page.locator('meta[name="robots"]');
    await expect(robots).toHaveAttribute('content', /noindex/);
  });

  test('there is no public registration route', async ({ page }) => {
    const response = await page.goto('/register');
    expect(response?.status()).toBe(404);
  });
});

test.describe('sign in screen', () => {
  test('explains missing configuration instead of failing silently', async ({ page }) => {
    await page.goto('/admin/login');

    await expect(page.getByRole('heading', { level: 1 })).toContainText('Staff sign in');

    // With no Supabase environment the page must say so plainly.
    await expect(page.getByText(/supabase is not configured/i)).toBeVisible();
    await expect(page.getByText(/no public registration/i)).toBeVisible();
  });

  test('never renders a password field when the backend is not configured', async ({ page }) => {
    await page.goto('/admin/login');
    await expect(page.getByLabel(/password/i)).toHaveCount(0);
  });

  test('links back to the public website', async ({ page }) => {
    await page.goto('/admin/login');
    const link = page.getByRole('link', { name: /return to the public website/i });
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL(/\/$/);
  });
});

test.describe('security headers', () => {
  test('a Content-Security-Policy is sent with a per-request nonce', async ({ page }) => {
    const response = await page.goto('/');
    const csp = response?.headers()['content-security-policy'];

    expect(csp, 'CSP header is missing').toBeTruthy();
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toMatch(/script-src [^;]*'nonce-[a-f0-9]+'/);

    // Strict-dynamic is what keeps the nonce meaningful for Next.js chunks.
    expect(csp).toContain("'strict-dynamic'");
  });

  test('nonces differ between requests', async ({ request }) => {
    const first = await request.get('/');
    const second = await request.get('/');

    const nonceOf = (value: string | undefined) => value?.match(/'nonce-([a-f0-9]+)'/)?.[1] ?? null;

    const a = nonceOf(first.headers()['content-security-policy']);
    const b = nonceOf(second.headers()['content-security-policy']);

    expect(a).toBeTruthy();
    expect(b).toBeTruthy();
    expect(a).not.toBe(b);
  });

  test('the admin area sets a no-store friendly cache policy', async ({ page }) => {
    const response = await page.goto('/admin/login');
    const cacheControl = response?.headers()['cache-control'] ?? '';
    expect(cacheControl).not.toContain('public');
  });
});
