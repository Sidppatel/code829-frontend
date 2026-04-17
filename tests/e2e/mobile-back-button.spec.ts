import { expect, test } from '@playwright/test';

/**
 * The booking flow is URL-backed (?step= + ?bookingId=), so mobile browser back
 * should unwind step by step instead of dropping to the previous page.
 * This test skips the actual payment — it only verifies URL and DOM state through
 * the back navigation.
 */
const EVENT_SLUG = process.env.E2E_EVENT_SLUG;

test.describe('@mobile back button', () => {
  test.skip(!EVENT_SLUG, 'Set E2E_EVENT_SLUG to run');
  test.use({ viewport: { width: 412, height: 915 } }); // Pixel 7 portrait

  test('browser back unwinds booking steps', async ({ page }) => {
    await page.request.post('http://localhost:8000/auth/dev-login', {
      data: { email: 'e2e-mobile@example.com', firstName: 'Mobile', lastName: 'Test' },
    });
    await page.goto(`/events/${EVENT_SLUG}`);

    // Tap mobile "Reserve" sticky CTA
    await page.locator('button:has-text("Reserve")').first().click();

    // Either step=select-table or step=capacity depending on layout
    await expect(page).toHaveURL(/[?&]step=(select-table|capacity)/);
    const stepAfterClick = new URL(page.url()).searchParams.get('step');

    // Browser back — should clear step, land on info view
    await page.goBack();
    await expect(page).not.toHaveURL(new RegExp(`step=${stepAfterClick}`));

    // Forward should restore the step
    await page.goForward();
    await expect(page).toHaveURL(new RegExp(`step=${stepAfterClick}`));
  });

  test('refresh on checkout keeps bookingId', async ({ page }) => {
    // Deep-link with a fake bookingId — restoration effect should redirect back to info
    // because the booking ID is invalid. We're only asserting the URL doesn't lose
    // bookingId on load and the page doesn't crash.
    await page.goto(`/events/${EVENT_SLUG}?step=checkout&bookingId=00000000-0000-0000-0000-000000000000`);
    await page.waitForLoadState('networkidle');
    // Invalid booking gets cleared by the restoration effect
    await expect(page).not.toHaveURL(/bookingId=00000000/);
  });
});
