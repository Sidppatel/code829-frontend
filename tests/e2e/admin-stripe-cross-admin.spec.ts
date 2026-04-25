import { expect, test } from '@playwright/test';

/**
 * Cross-admin payout-status visibility:
 *   1. Login as admin A in the same Organization.
 *   2. From settings, click Resume onboarding (mints a Stripe link).
 *   3. Logout.
 *   4. Login as admin B (different BusinessUser, same OrganizationId).
 *   5. Confirm settings shows the same payout state — Org-scoped Stripe data
 *      is shared, not per-admin.
 *
 * Prereqs (skipped if missing):
 *   - E2E_ADMIN_BASE_URL    — admin app origin (default http://localhost:5174)
 *   - E2E_API_URL           — backend origin (default http://localhost:8000)
 *   - E2E_ADMIN_A_EMAIL     — admin A in the shared org
 *   - E2E_ADMIN_B_EMAIL     — admin B in the shared org
 *   - (optional) E2E_ADMIN_A_PASSWORD / E2E_ADMIN_B_PASSWORD if dev-login is gated
 */

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
    // Cookie clearing happens via Set-Cookie; clear local cookies too for paranoia
    await page.context().clearCookies();
}

test.use({ baseURL: ADMIN_URL });

test.describe('@admin cross-admin shared payout status', () => {
    test.skip(!A_EMAIL || !B_EMAIL, 'Set E2E_ADMIN_A_EMAIL + E2E_ADMIN_B_EMAIL to run');

    test('admin B sees the same Stripe state as admin A', async ({ page }) => {
        // ---- Admin A ----
        await loginAdmin(page, A_EMAIL!, A_PASSWORD);
        await page.goto('/settings');
        await page.waitForLoadState('networkidle');

        // Capture the visible Stripe state. The chip text comes straight from the
        // BE OrganizationStripeStatus.state mapping in StatusChip.
        const stateMarkerA = await page.locator('main, body').first().textContent();
        const stripeStateA = (stateMarkerA?.match(
            /payouts active|identity pending|bank account required|account rejected|payouts not yet enabled/i,
        ) ?? [])[0]?.toLowerCase().trim();
        expect(stripeStateA, 'admin A Stripe state visible').toBeTruthy();

        // If admin A has an actionable button, click it to confirm the BE accepts
        // the resume-link mint (200 from /admin/organization/stripe-resume-link).
        const resumeBtn = page.getByRole('button', { name: /resume onboarding|add bank account/i }).first();
        if (await resumeBtn.count()) {
            // Intercept the redirect — we don't want to actually leave for stripe.com
            await page.route('https://connect.stripe.com/**', (route) => route.abort());
            const [resp] = await Promise.all([
                page.waitForResponse(
                    (r) => r.url().includes('/admin/organization/stripe-resume-link') && r.request().method() === 'POST',
                ),
                resumeBtn.click(),
            ]);
            expect(resp.status(), 'stripe-resume-link mint').toBeLessThan(400);
        }

        // ---- Logout ----
        await logout(page);

        // ---- Admin B ----
        await loginAdmin(page, B_EMAIL!, B_PASSWORD);
        await page.goto('/settings');
        await page.waitForLoadState('networkidle');

        const stateMarkerB = await page.locator('main, body').first().textContent();
        const stripeStateB = (stateMarkerB?.match(
            /payouts active|identity pending|bank account required|account rejected|payouts not yet enabled/i,
        ) ?? [])[0]?.toLowerCase().trim();

        expect(stripeStateB, 'admin B sees the org Stripe state').toBeTruthy();
        // The shared invariant — both admins resolve the same OrganizationId on the
        // BE so they MUST see the same coarse Stripe state.
        expect(stripeStateB).toBe(stripeStateA);
    });
});
