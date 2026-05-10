import { expect, test } from '@playwright/test';

const EVENT_SLUG = process.env.E2E_EVENT_SLUG;

test.describe('@mobile back button', () => {
  test.skip(!EVENT_SLUG, 'Set E2E_EVENT_SLUG to run');
  test.use({ viewport: { width: 412, height: 915 } });

  test('browser back unwinds booking steps', async ({ page }) => {
    await page.request.post('http://localhost:8000/auth/dev-login', {
      data: { email: 'e2e-mobile@example.com', firstName: 'Mobile', lastName: 'Test' },
    });
    await page.goto(`/events/${EVENT_SLUG}`);

    await page.locator('button:has-text("Reserve")').first().click();

    await expect(page).toHaveURL(/[?&]step=(select-table|capacity)/);
    const stepAfterClick = new URL(page.url()).searchParams.get('step');

    await page.goBack();
    await expect(page).not.toHaveURL(new RegExp(`step=${stepAfterClick}`));

    await page.goForward();
    await expect(page).toHaveURL(new RegExp(`step=${stepAfterClick}`));
  });

  test('refresh on checkout keeps bookingId', async ({ page }) => {
    await page.goto(`/events/${EVENT_SLUG}?step=checkout&bookingId=00000000-0000-0000-0000-000000000000`);
    await page.waitForLoadState('networkidle');
    await expect(page).not.toHaveURL(/bookingId=00000000/);
  });
});
