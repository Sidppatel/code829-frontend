import { expect, test } from '@playwright/test';

const ADMIN_URL = process.env.E2E_ADMIN_BASE_URL ?? 'http://localhost:5174';
const API_URL = process.env.E2E_API_URL ?? 'http://localhost:8000';
const A_EMAIL = process.env.E2E_ADMIN_A_EMAIL;
const B_EMAIL = process.env.E2E_ADMIN_B_EMAIL;
const A_PASSWORD = process.env.E2E_ADMIN_A_PASSWORD;
const B_PASSWORD = process.env.E2E_ADMIN_B_PASSWORD;

async function loginAdmin(
    page: import('@playwright/test').Page,
    email: string,
    password?: string,
) {
    const dev = await page.request.post(`${API_URL}/v1/auth/dev-login`, {
        data: { email, firstName: 'E2E', lastName: 'Admin' },
        headers: { 'X-Portal': 'admin' },
        failOnStatusCode: false,
    });
    if (!dev.ok() && password) {
        const signin = await page.request.post(`${API_URL}/v1/admin/auth/signin`, {
            data: { email, password },
            headers: { 'X-Portal': 'admin' },
        });
        if (!signin.ok()) {
            throw new Error(`signin ${email} failed: ${signin.status()} ${await signin.text()}`);
        }
    }
}

async function logout(page: import('@playwright/test').Page) {
    await page.request.post(`${API_URL}/v1/auth/logout`, {
        headers: { 'X-Portal': 'admin' },
        failOnStatusCode: false,
    });
    await page.context().clearCookies();
}

test.use({ baseURL: ADMIN_URL });

test.describe('@admin cross-admin shared payout status', () => {
    test.skip(!A_EMAIL || !B_EMAIL, 'Set E2E_ADMIN_A_EMAIL + E2E_ADMIN_B_EMAIL to run');

    test('admin B sees the same Stripe state as admin A', async ({ page }) => {
        await loginAdmin(page, A_EMAIL!, A_PASSWORD);
        await page.goto('/settings');
        await page.waitForLoadState('networkidle');

        const stateMarkerA = await page.locator('main, body').first().textContent();
        const stripeStateA = (stateMarkerA?.match(
            /payouts active|identity pending|bank account required|account rejected|payouts not yet enabled/i,
        ) ?? [])[0]?.toLowerCase().trim();
        expect(stripeStateA, 'admin A Stripe state visible').toBeTruthy();

        const resumeBtn = page.getByRole('button', { name: /resume onboarding|add bank account/i }).first();
        if (await resumeBtn.count()) {
            await page.route('https://connect.stripe.com/**', (route) => route.abort());
            const [resp] = await Promise.all([
                page.waitForResponse(
                    (r) => r.url().includes('/admin/organization/stripe-resume-link') && r.request().method() === 'POST',
                ),
                resumeBtn.click(),
            ]);
            expect(resp.status(), 'stripe-resume-link mint').toBeLessThan(400);
        }

        await logout(page);

        await loginAdmin(page, B_EMAIL!, B_PASSWORD);
        await page.goto('/settings');
        await page.waitForLoadState('networkidle');

        const stateMarkerB = await page.locator('main, body').first().textContent();
        const stripeStateB = (stateMarkerB?.match(
            /payouts active|identity pending|bank account required|account rejected|payouts not yet enabled/i,
        ) ?? [])[0]?.toLowerCase().trim();

        expect(stripeStateB, 'admin B sees the org Stripe state').toBeTruthy();
        expect(stripeStateB).toBe(stripeStateA);
    });
});
