import { devices, expect, test } from '@playwright/test';

const ADMIN_URL = process.env.E2E_ADMIN_BASE_URL ?? 'http://localhost:5174';
const API_URL = process.env.E2E_API_URL ?? 'http://localhost:8000';
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD;

test.use({ ...devices['iPhone 14'], baseURL: ADMIN_URL });

test.describe('@mobile admin stripe payouts (iPhone 14)', () => {
    test.skip(!ADMIN_EMAIL, 'Set E2E_ADMIN_EMAIL to run mobile Stripe smoke');

    test.beforeEach(async ({ page }) => {
        const devLogin = await page.request.post(`${API_URL}/v1/auth/dev-login`, {
            data: { email: ADMIN_EMAIL, firstName: 'E2E', lastName: 'Admin' },
            headers: { 'X-Portal': 'admin' },
            failOnStatusCode: false,
        });
        if (!devLogin.ok() && ADMIN_PASSWORD) {
            const signin = await page.request.post(`${API_URL}/v1/admin/auth/signin`, {
                data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
                headers: { 'X-Portal': 'admin' },
            });
            if (!signin.ok()) {
                throw new Error(`admin signin failed: ${signin.status()} ${await signin.text()}`);
            }
        }
    });

    test('loads /settings without horizontal scroll', async ({ page }) => {
        await page.goto('/settings');
        await page.waitForLoadState('networkidle');

        const overflow = await page.evaluate(() => ({
            scrollWidth: document.documentElement.scrollWidth,
            innerWidth: window.innerWidth,
        }));
        expect(overflow.scrollWidth, 'document.scrollWidth <= window.innerWidth').toBeLessThanOrEqual(
            overflow.innerWidth,
        );
    });

    test('status chip is visible above the fold', async ({ page }) => {
        await page.goto('/settings');
        await page.waitForLoadState('networkidle');
        const heading = page.getByText(/payouts|payouts not yet enabled|payouts active|identity pending|bank account required|account rejected/i).first();
        await expect(heading).toBeVisible();
        const box = await heading.boundingBox();
        expect(box).toBeTruthy();
        expect(box!.y, 'chip y < viewport height').toBeLessThan(844);
    });

    test('primary action button meets 44px tap-target minimum', async ({ page }) => {
        await page.goto('/settings');
        await page.waitForLoadState('networkidle');
        const buttons = page.locator('button:visible').filter({
            hasText: /resume onboarding|add bank account|open stripe|contact support|try again|email the platform team/i,
        });
        const count = await buttons.count();
        if (count === 0) {
            test.info().annotations.push({
                type: 'state',
                description: 'No CTA visible — likely the no-org empty state with a mailto link',
            });
            return;
        }
        for (let i = 0; i < count; i += 1) {
            const box = await buttons.nth(i).boundingBox();
            expect(box, `button ${i} bounding box`).toBeTruthy();
            expect(box!.height, `button ${i} height >= 44`).toBeGreaterThanOrEqual(44);
        }
    });

    test('visual regression snapshot of the payouts section', async ({ page }) => {
        await page.goto('/settings');
        await page.waitForLoadState('networkidle');
        await expect(page).toHaveScreenshot('settings-payouts-mobile.png', {
            fullPage: false,
            maxDiffPixelRatio: 0.02,
            mask: [page.locator('time'), page.locator('[data-testid="member-avatar"]')],
        });
    });
});
