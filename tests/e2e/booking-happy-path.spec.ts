import { expect, test } from '@playwright/test';

/**
 * End-to-end grid-table booking with Stripe test card.
 *
 * Requires:
 *   - E2E_EVENT_SLUG: slug of a published Grid event with at least one Available table
 *   - E2E_LOGIN_EMAIL: email to issue a magic link for (auto-login in dev)
 *   - STRIPE_SECRET_KEY test key configured on the backend
 */
const EVENT_SLUG = process.env.E2E_EVENT_SLUG;
const LOGIN_EMAIL = process.env.E2E_LOGIN_EMAIL ?? 'e2e@example.com';

test.describe('@happy-path grid booking', () => {
  test.skip(!EVENT_SLUG, 'Set E2E_EVENT_SLUG to run');
  test.use({ viewport: { width: 1280, height: 800 } });

  test('book a table end-to-end', async ({ page }) => {
    // Dev login (backend exposes /auth/dev-login in Development)
    await page.request.post('http://localhost:8000/auth/dev-login', {
      data: { email: LOGIN_EMAIL, firstName: 'E2E', lastName: 'Test' },
    });

    await page.goto(`/events/${EVENT_SLUG}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    await page.getByRole('button', { name: /reserve/i }).first().click();
    await expect(page).toHaveURL(/[?&]step=select-table/);

    // Click first Available table
    await page.locator('.ts-table:not(.ts-table-disabled)').first().click();
    await expect(page.locator('.ts-table-selected')).toBeVisible();

    await page.getByRole('button', { name: /proceed to checkout/i }).click();
    await expect(page).toHaveURL(/[?&]step=checkout/);
    await expect(page).toHaveURL(/bookingId=/);

    // Stripe Elements loads in an iframe; fill the test card
    const stripeFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]').first();
    await stripeFrame.locator('[name="number"]').fill('4242424242424242');
    await stripeFrame.locator('[name="expiry"]').fill('12 / 34');
    await stripeFrame.locator('[name="cvc"]').fill('123');

    await page.getByRole('button', { name: /pay now|confirm/i }).click();
    await expect(page).toHaveURL(/\/bookings/);
  });
});
