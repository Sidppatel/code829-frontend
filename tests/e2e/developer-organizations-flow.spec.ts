import { expect, test } from '@playwright/test';

const DEV_URL = process.env.E2E_DEVELOPER_BASE_URL ?? 'http://localhost:5176';
const API_URL = process.env.E2E_API_URL ?? 'http://localhost:8000';
const DEV_EMAIL = process.env.E2E_DEVELOPER_EMAIL;
const DEV_PASSWORD = process.env.E2E_DEVELOPER_PASSWORD;
const BU_EMAIL = process.env.E2E_BUSINESS_USER_EMAIL;

const ORG_NAME_PREFIX = 'E2E Org';

test.use({ baseURL: DEV_URL });

test.describe('@developer organizations CRUD + onboarding link', () => {
    test.skip(!DEV_EMAIL || !BU_EMAIL, 'Set E2E_DEVELOPER_EMAIL + E2E_BUSINESS_USER_EMAIL to run');

    test.beforeEach(async ({ context, page }) => {
        await context.grantPermissions(['clipboard-read', 'clipboard-write']);

        const devLogin = await page.request.post(`${API_URL}/v1/auth/dev-login`, {
            data: { email: DEV_EMAIL, firstName: 'E2E', lastName: 'Dev' },
            headers: { 'X-Portal': 'developer' },
            failOnStatusCode: false,
        });
        if (!devLogin.ok() && DEV_PASSWORD) {
            const signin = await page.request.post(`${API_URL}/v1/admin/auth/signin`, {
                data: { email: DEV_EMAIL, password: DEV_PASSWORD },
                headers: { 'X-Portal': 'developer' },
            });
            if (!signin.ok()) {
                throw new Error(`dev signin failed: ${signin.status()} ${await signin.text()}`);
            }
        }
    });

    test('create org → add member → mint Stripe link → copy', async ({ page }) => {
        const orgName = `${ORG_NAME_PREFIX} ${Date.now()}`;
        await page.goto('/organizations');
        await expect(page.getByRole('heading', { name: 'Organizations' })).toBeVisible();

        await page.getByRole('button', { name: /new organization/i }).click();
        const modal = page.getByRole('dialog');
        await expect(modal).toBeVisible();
        await modal.getByLabel(/name/i).fill(orgName);
        const countryControl = modal.getByLabel(/country/i);
        if (await countryControl.count()) {
            await countryControl.click();
            const usOpt = page.getByText(/united states|^US$/i).first();
            if (await usOpt.count()) await usOpt.click();
        }
        await modal.getByRole('button', { name: /create|save|submit/i }).click();

        const detailDrawer = page.locator('[role="dialog"]').filter({ hasText: orgName }).first();
        await expect(detailDrawer).toBeVisible({ timeout: 10_000 });

        await page.getByRole('button', { name: /members|manage members/i }).first().click();
        const membersDrawer = page.locator('[role="dialog"]').filter({ hasText: /members/i }).last();
        await expect(membersDrawer).toBeVisible();
        const addBtn = membersDrawer.getByRole('button', { name: /add member|add admin/i });
        if (await addBtn.count()) {
            await addBtn.click();
            const addModal = page.locator('[role="dialog"]').last();
            const searchInput = addModal.getByPlaceholder(/search|email/i).first();
            await searchInput.fill(BU_EMAIL!);
            await page.getByText(BU_EMAIL!).first().click();
            await addModal.getByRole('button', { name: /add|save|confirm/i }).click();
        }
        await page.keyboard.press('Escape');

        await page.getByRole('button', { name: /start stripe|stripe onboarding/i }).first().click();
        const stripeModal = page.locator('[role="dialog"]').filter({ hasText: /stripe/i }).last();
        await expect(stripeModal).toBeVisible();
        await stripeModal.getByRole('button', { name: /generate|create link/i }).click();

        const linkBox = stripeModal.locator('input[readonly], a[href*="connect.stripe.com"]').first();
        await expect(linkBox).toBeVisible({ timeout: 15_000 });

        await stripeModal.getByRole('button', { name: /copy/i }).first().click();
        const clipboard = await page.evaluate(() => navigator.clipboard.readText());
        expect(clipboard).toMatch(/^https?:\/\//);
    });
});
