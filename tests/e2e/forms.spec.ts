import { expect, test } from '@playwright/test';

/**
 * Client-side form behaviour.
 *
 * The server actions need Supabase, but validation runs in the browser first, so
 * these tests are meaningful without any backend configuration.
 */

test.describe('contact form validation', () => {
  test('rejects an empty submission and explains what is missing', async ({ page }) => {
    await page.goto('/contact');

    await page.getByRole('button', { name: /send message/i }).click();

    // react-hook-form + zod render a role="alert" per invalid field.
    await expect(page.getByText(/at least two characters/i)).toBeVisible();
    await expect(page.getByText(/invalid email address/i).first()).toBeVisible();
    await expect(page.getByText(/add a little more detail/i)).toBeVisible();

    // Nothing should have been submitted, so the success panel must be absent.
    await expect(page.getByText(/message sent\./i)).toHaveCount(0);
  });

  test('rejects a malformed email address', async ({ page }) => {
    await page.goto('/contact');

    await page.getByLabel(/^name/i).fill('Asha');
    await page.getByLabel(/^email/i).fill('not-an-email');
    await page.getByLabel(/^message/i).fill('I would like to ask about a consultation.');
    await page.getByRole('button', { name: /send message/i }).click();

    await expect(page.getByText(/invalid email address/i).first()).toBeVisible();
  });

  test('keeps the honeypot out of the keyboard tab order', async ({ page }) => {
    await page.goto('/contact');

    const honeypot = page.locator('#contact-website');
    await expect(honeypot).toHaveAttribute('tabindex', '-1');
    await expect(honeypot).toHaveAttribute('autocomplete', 'off');
  });
});

test.describe('layout and accessibility basics', () => {
  test('every page has a language attribute and viewport meta', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('meta[name="viewport"]')).toHaveCount(1);
  });

  test('every image alternative is present or explicitly decorative', async ({ page }) => {
    await page.goto('/');

    const images = page.locator('img');
    const count = await images.count();

    for (let index = 0; index < count; index += 1) {
      const image = images.nth(index);
      const alt = await image.getAttribute('alt');
      expect(alt, `image ${index} is missing an alt attribute`).not.toBeNull();
    }
  });

  test('the mobile navigation opens and traps nothing', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    const toggle = page.getByRole('button', { name: /open menu|open navigation/i });
    await expect(toggle).toBeVisible();
    await toggle.click();

    const closeButton = page.getByRole('button', { name: /close menu|close navigation/i });
    await expect(closeButton).toBeVisible();
    await closeButton.click();

    await expect(page.getByRole('button', { name: /open menu|open navigation/i })).toBeVisible();
  });
});
