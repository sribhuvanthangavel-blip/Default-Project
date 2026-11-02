import { expect, test } from '@playwright/test';

/**
 * Public-site smoke tests.
 *
 * These run without a Supabase project: the pages degrade to "not configured"
 * states rather than crashing, which is exactly what we want to assert.
 */

test.describe('home page', () => {
  test('renders the hero, the primary action and the booking disclaimer', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);

    await expect(page).toHaveTitle(/Jishnu/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('A calmer kind of');
    await expect(page.getByRole('link', { name: /request an appointment/i }).first()).toBeVisible();

    // The single most important expectation on the site: a request is not a booking.
    await expect(
      page.getByText(/an appointment request is not a confirmed booking/i).first(),
    ).toBeVisible();
  });

  test('exposes exactly one <h1>', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toHaveCount(1);
  });

  test('provides a skip link for keyboard users', async ({ page }) => {
    await page.goto('/');
    const skipLink = page.getByRole('link', { name: /skip to (main )?content/i });
    await expect(skipLink).toHaveCount(1);
  });
});

test.describe('content pages', () => {
  test('the clinic page loads', async ({ page }) => {
    const response = await page.goto('/about');
    expect(response?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'Care begins with listening',
    );
  });

  test('the dentist page refuses to invent credentials', async ({ page }) => {
    const response = await page.goto('/dentist');
    expect(response?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'A profile, published only when verified',
    );
  });

  test('the services page explains the current state of the list', async ({ page }) => {
    const response = await page.goto('/services');
    expect(response?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Care, considered');
  });

  test('the privacy policy renders its sections', async ({ page }) => {
    const response = await page.goto('/privacy');
    expect(response?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Privacy policy');
    await expect(page.getByRole('heading', { name: /what the website collects/i })).toBeVisible();
    // Unreviewed legal placeholders must be visible, not silently dropped.
    await expect(page.getByText(/to be supplied/i).first()).toBeVisible();
  });

  test('the terms page states that a request is not a booking', async ({ page }) => {
    const response = await page.goto('/terms');
    expect(response?.status()).toBe(200);
    await expect(
      page.getByRole('heading', { name: /appointment requests are not bookings/i }),
    ).toBeVisible();
  });
});

test.describe('appointment page', () => {
  test('pauses online requests when no services are published', async ({ page }) => {
    const response = await page.goto('/appointment');
    expect(response?.status()).toBe(200);

    await expect(page.getByRole('heading', { level: 1 })).toContainText('Request an appointment');

    // Without a configured Supabase project there are no active services, so the
    // form must be replaced rather than rendered unusable.
    await expect(page.getByText(/online requests are paused/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /send an enquiry/i }).first()).toBeVisible();
  });
});

test.describe('contact page', () => {
  test('renders the enquiry form and privacy link', async ({ page }) => {
    const response = await page.goto('/contact');
    expect(response?.status()).toBe(200);

    await expect(page.getByRole('heading', { level: 1 })).toContainText('Ask, or arrange a visit');
    await expect(page.getByLabel(/^name/i)).toBeVisible();
    await expect(page.getByLabel(/^email/i)).toBeVisible();
    await expect(page.getByLabel(/^message/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /send message/i })).toBeVisible();
  });
});

test.describe('not found', () => {
  test('returns a helpful 404 page', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist');
    expect(response?.status()).toBe(404);
    await expect(page.getByText(/could not find that page|not here/i).first()).toBeVisible();
  });
});

test.describe('machine-readable endpoints', () => {
  test('robots.txt blocks the dashboard', async ({ request }) => {
    const response = await request.get('/robots.txt');
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toContain('Sitemap:');
    expect(body).toMatch(/Disallow: \/admin/);
  });

  test('sitemap.xml lists the public routes', async ({ request }) => {
    const response = await request.get('/sitemap.xml');
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toContain('/appointment');
    expect(body).toContain('/privacy');
    expect(body).not.toContain('/admin');
  });

  test('the health endpoint reports configuration without leaking secrets', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.status()).toBe(200);
    expect(response.headers()['cache-control']).toContain('no-store');

    const body = await response.json();
    expect(body.status).toBe('ok');
    expect(typeof body.configuration.serviceRole).toBe('boolean');

    const serialised = JSON.stringify(body);
    expect(serialised).not.toMatch(/eyJ/);
    expect(serialised).not.toMatch(/service_role_key/i);
  });
});
